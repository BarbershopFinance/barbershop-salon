// SPDX-License-Identifier: MIT

pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "../interfaces/common/IUniswapRouterETH.sol";
import "../interfaces/aave/ILendingPool.sol";
import "../interfaces/aave/IDataProvider.sol";
import "../interfaces/aave/IIncentivesController.sol";
import "./common/StratManager.sol";
import "./common/FeeManager.sol";

contract StrategyAave is StratManager, FeeManager {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    // Tokens used
    address public native; // = address(0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270); // wmatic
    address public want;
    address public aToken;
    address public varDebtToken;

    // Third party contracts
    address public dataProvider;
    address public lendingPool;
    address public incentivesController;

    // Routes
    address[] public nativeToWantRoute;
    
    bool public harvestOnDeposit;
    uint256 public lastHarvest;

    /**
     * @dev Variables that can be changed to config profitability and risk:
     * {borrowRate}          - What % of our collateral do we borrow per leverage level.
     * {borrowRateMax}       - A limit on how much we can push borrow risk.
     * {borrowDepth}         - How many levels of leverage do we take.
     * {minLeverage}         - The minimum amount of collateral required to leverage.
     * {BORROW_DEPTH_MAX}    - A limit on how many steps we can leverage.
     * {INTEREST_RATE_MODE}  - The type of borrow debt. Stable: 1, Variable: 2.
     */
    uint256 public borrowRate = 1;
    uint256 public borrowRateMax = 75;
    uint256 public borrowDepth = 1;
    uint256 public minLeverage = 1;
    uint256 constant public BORROW_DEPTH_MAX = 10;
    uint256 constant public INTEREST_RATE_MODE = 2;

    /**
     * @dev Helps to differentiate borrowed funds that shouldn't be used in functions like 'deposit()'
     * as they're required to deleverage correctly.  
     */
    uint256 public reserves = 0;

    /**
     * @dev Events that the contract emits
     */
    event StratHarvest(address indexed harvester);
    event StratRebalance(uint256 _borrowRate, uint256 _borrowDepth);

    constructor(
        address _vault,
        address _want,
        address _native,
        address _dataProvider,
        address _lendingPool,
        address _incentivesController,
        address _unirouter,
        address _keeper,
        address _strategist,
        address _barbershopFeeRecipient
    ) StratManager(_keeper, _strategist, _unirouter, _vault, _barbershopFeeRecipient) {
        want = _want;
        native = _native;

        dataProvider = _dataProvider;
        lendingPool = _lendingPool;
        incentivesController = _incentivesController;
        
        (aToken,,varDebtToken) = IDataProvider(dataProvider).getReserveTokensAddresses(want);

        nativeToWantRoute = [native, want];

        _giveAllowances();
    }

    // puts the funds to work
    function deposit() public whenNotPaused {
        uint256 wantBal = availableWant();

        if (wantBal > 0) {
            _leverage(wantBal);
        }
    }

    /**
     * @dev Repeatedly supplies and borrows {want} following the configured {borrowRate} and {borrowDepth}
     * @param _amount amount of {want} to leverage
     */
    function _leverage(uint256 _amount) internal {
        if (_amount < minLeverage) { return; }

        for (uint i = 0; i < borrowDepth; i++) {
            ILendingPool(lendingPool).deposit(want, _amount, address(this), 0);
            _amount = _amount.mul(borrowRate).div(100);
            if (_amount > 0) {
                ILendingPool(lendingPool).borrow(want, _amount, INTEREST_RATE_MODE, 0, address(this));
            }
        }

        reserves = reserves.add(_amount);
    }


    /**
     * @dev Incrementally alternates between paying part of the debt and withdrawing part of the supplied
     * collateral. Continues to do this until it repays the entire debt and withdraws all the supplied {want}
     * from the system
     */
    function _deleverage() internal {
        uint256 wantBal = IERC20(want).balanceOf(address(this));
        (uint256 supplyBal, uint256 borrowBal) = userReserves();

        while (wantBal < borrowBal) {
            ILendingPool(lendingPool).repay(want, wantBal, INTEREST_RATE_MODE, address(this));

            (supplyBal, borrowBal) = userReserves();
            uint256 targetSupply = borrowBal.mul(100).div(borrowRate);

            ILendingPool(lendingPool).withdraw(want, supplyBal.sub(targetSupply), address(this));
            wantBal = IERC20(want).balanceOf(address(this));
        }

        if (borrowBal > 0) {
            ILendingPool(lendingPool).repay(want, type(uint256).max, INTEREST_RATE_MODE, address(this));
        }
        ILendingPool(lendingPool).withdraw(want, type(uint256).max, address(this));

        reserves = 0;
    }

    /**
     * @dev Extra safety measure that allows us to manually unwind one level. In case we somehow get into
     * as state where the cost of unwinding freezes the system. We can manually unwind a few levels
     * with this function and then 'rebalance()' with new {borrowRate} and {borrowConfig} values.
     * @param _borrowRate configurable borrow rate in case it's required to unwind successfully
     */
    function deleverageOnce(uint _borrowRate) external onlyManager {
        require(_borrowRate <= borrowRateMax, "!safe");

        uint256 wantBal = IERC20(want).balanceOf(address(this));
        ILendingPool(lendingPool).repay(want, wantBal, INTEREST_RATE_MODE, address(this));

        (uint256 supplyBal, uint256 borrowBal) = userReserves();
        uint256 targetSupply = borrowBal.mul(100).div(_borrowRate);

        ILendingPool(lendingPool).withdraw(want, supplyBal.sub(targetSupply), address(this));

        wantBal = IERC20(want).balanceOf(address(this));
        reserves = wantBal;
    }

    /**
     * @dev Updates the risk profile and rebalances the vault funds accordingly.
     * @param _borrowRate percent to borrow on each leverage level.
     * @param _borrowDepth how many levels to leverage the funds.
     */
    function rebalance(uint256 _borrowRate, uint256 _borrowDepth) external onlyManager {
        require(_borrowRate <= borrowRateMax, "!rate");
        require(_borrowDepth <= BORROW_DEPTH_MAX, "!depth");

        _deleverage();
        borrowRate = _borrowRate;
        borrowDepth = _borrowDepth;

        uint256 wantBal = IERC20(want).balanceOf(address(this));
        _leverage(wantBal);

        emit StratRebalance(_borrowRate, _borrowDepth);
    }
    
    function beforeDeposit() external override {
        if (harvestOnDeposit) {
            require(msg.sender == vault, "!vault");
            _harvest(tx.origin);
        }
    }
    
    function harvest() external virtual {
        _harvest(tx.origin);
    }

    function harvestWithCallFeeRecipient(address callFeeRecipient) external virtual {
        _harvest(callFeeRecipient);
    }

    function managerHarvest() external onlyManager {
        _harvest(tx.origin);
    }

    // compounds earnings and charges performance fee
    function _harvest(address callFeeRecipient) internal whenNotPaused {
        address[] memory assets = new address[](2);
        assets[0] = aToken;
        assets[1] = varDebtToken;
        IIncentivesController(incentivesController).claimRewards(assets, type(uint).max, address(this));
        
        uint256 nativeBal = IERC20(native).balanceOf(address(this));
        if (nativeBal > 0) {
            chargeFees(callFeeRecipient);
            swapRewards();
            deposit();
            
            lastHarvest = block.timestamp;
            emit StratHarvest(msg.sender);
        }
    }

    // performance fees
    function chargeFees(address callFeeRecipient) internal {
        uint256 nativeFeeBal = IERC20(native).balanceOf(address(this)).mul(45).div(1000);

        uint256 callFeeAmount = nativeFeeBal.mul(callFee).div(MAX_FEE);
        IERC20(native).safeTransfer(callFeeRecipient, callFeeAmount);

        uint256 feeAmount = nativeFeeBal.mul(barbershopFee).div(MAX_FEE);
        IERC20(native).safeTransfer(barbershopFeeRecipient, feeAmount);

        uint256 strategistFee = nativeFeeBal.mul(STRATEGIST_FEE).div(MAX_FEE);
        IERC20(native).safeTransfer(strategist, strategistFee);
    }

    // swap rewards to {want}
    function swapRewards() internal {
        uint256 nativeBal = IERC20(native).balanceOf(address(this));
        IUniswapRouterETH(unirouter).swapExactTokensForTokens(nativeBal, 0, nativeToWantRoute, address(this), block.timestamp);
    }

    /**
     * @dev Withdraws funds and sends them back to the vault. It deleverages from venus first,
     * and then deposits again after the withdraw to make sure it mantains the desired ratio.
     * @param _amount How much {want} to withdraw.
     */
    function withdraw(uint256 _amount) external {
        require(msg.sender == vault, "!vault");

        uint256 wantBal = availableWant();

        if (wantBal < _amount) {
            _deleverage();
            wantBal = IERC20(want).balanceOf(address(this));
        }

        if (wantBal > _amount) {
            wantBal = _amount;
        }

        if (tx.origin == owner() || paused()) {
            IERC20(want).safeTransfer(vault, wantBal);
        } else {
            uint256 withdrawalFeeAmount = wantBal.mul(withdrawalFee).div(WITHDRAWAL_MAX);
            IERC20(want).safeTransfer(vault, wantBal.sub(withdrawalFeeAmount));
        }

        if (!paused()) {
            _leverage(availableWant());
        }
    }

    /**
     * @dev Required for various functions that need to deduct {reserves} from total {want}.
     * @return how much {want} the contract holds without reserves
     */
    function availableWant() public view returns (uint256) {
        uint256 wantBal = IERC20(want).balanceOf(address(this));
        return wantBal.sub(reserves);
    }

    // return supply and borrow balance
    function userReserves() public view returns (uint256, uint256) {
        (uint256 supplyBal,,uint256 borrowBal,,,,,,) = IDataProvider(dataProvider).getUserReserveData(want, address(this));
        return (supplyBal, borrowBal);
    }

    // returns the user account data across all the reserves
    function userAccountData() public view returns (
        uint256 totalCollateralETH,
        uint256 totalDebtETH,
        uint256 availableBorrowsETH,
        uint256 currentLiquidationThreshold,
        uint256 ltv,
        uint256 healthFactor
    ) {
        return ILendingPool(lendingPool).getUserAccountData(address(this));
    }

    // calculate the total underlaying 'want' held by the strat.
    function balanceOf() public view returns (uint256) {
        return balanceOfWant().add(balanceOfPool());
    }

    // it calculates how much 'want' this contract holds.
    function balanceOfWant() public view returns (uint256) {
        return IERC20(want).balanceOf(address(this));
    }

    // it calculates how much 'want' the strategy has working in the farm.
    function balanceOfPool() public view returns (uint256) {
        (uint256 supplyBal, uint256 borrowBal) = userReserves();
        return supplyBal.sub(borrowBal);
    }
    
    function nativeToWant() public view returns (address[] memory) {
        return nativeToWantRoute;
    }
    
    // returns rewards unharvested
    function rewardsAvailable() public view returns (uint256) {
        address[] memory assets = new address[](2);
        assets[0] = aToken;
        assets[1] = varDebtToken;
        return IIncentivesController(incentivesController).getRewardsBalance(assets, address(this));
    }

    // native reward amount for calling harvest
    function callReward() public view returns (uint256) {
        return rewardsAvailable().mul(45).div(1000).mul(callFee).div(MAX_FEE);
    }
    
    function setHarvestOnDeposit(bool _harvestOnDeposit) external onlyManager {
        harvestOnDeposit = _harvestOnDeposit;
        if (harvestOnDeposit) {
            setWithdrawalFee(0);
        } else {
            setWithdrawalFee(10);
        }
    }

    // called as part of strat migration. Sends all the available funds back to the vault.
    function retireStrat() external {
        require(msg.sender == vault, "!vault");

        _deleverage();

        uint256 wantBal = IERC20(want).balanceOf(address(this));
        IERC20(want).transfer(vault, wantBal);
    }

    // pauses deposits and withdraws all funds from third party systems.
    function panic() public onlyManager {
        _deleverage();
        pause();
    }

    function pause() public onlyManager {
        _pause();

        _removeAllowances();
    }

    function unpause() external onlyManager {
        _unpause();

        _giveAllowances();

        deposit();
    }

    function _giveAllowances() internal {
        IERC20(want).safeApprove(lendingPool, type(uint256).max);
        IERC20(native).safeApprove(unirouter, type(uint256).max);
    }

    function _removeAllowances() internal {
        IERC20(want).safeApprove(lendingPool, 0);
        IERC20(native).safeApprove(unirouter, 0);
    }
}