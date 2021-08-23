// SPDX-License-Identifier: MIT

/* Grow hair on the blockchain at Barbershop.Finance!

dP                         dP                                  dP
88                         88                                  88
88d888b. .d8888b. 88d888b. 88d888b. .d8888b. 88d888b. .d8888b. 88d888b. .d8888b. 88d888b.
88'  `88 88'  `88 88'  `88 88'  `88 88ooood8 88'  `88 Y8ooooo. 88'  `88 88'  `88 88'  `88
88.  .88 88.  .88 88       88.  .88 88.  ... 88             88 88    88 88.  .88 88.  .88
88Y8888' `88888P8 dP       88Y8888' `88888P' dP       `88888P' dP    dP `88888P' 88Y888P'
                                                                                 88
                                                                                 dP
                                                                                 */
pragma solidity 0.8.6;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract HairPool is Ownable {
    using SafeERC20 for IERC20;

    // Info of each user.
    struct UserInfo {
        uint256 amount; // How many HAIR tokens the user has staked.
        uint256 rewardDebt; // Reward debt.
    }

    // Info of the pool.
    struct PoolInfo {
        IERC20 hairToken; // Address of staking token contract.
        uint256 lastRewardBlock; // Last block number that Rewards distribution occurs.
        uint256 accRewardTokenPerShare; // Accumulated Rewards per share, times 1e18. See below.
    }

    // HAIR token
    IERC20 public hairToken;
    // The reward token
    IERC20 public earningToken;
    // Reward tokens created per block.
    uint256 public rewardPerBlock;
    // Keep track of number of HAIR tokens staked
    uint256 public totalStaked = 0;
    // Info of the pool.
    PoolInfo public poolInfo;
    // Info of each user that stakes HAIR tokens.
    mapping (address => UserInfo) public userInfo;
    // The block number when Reward mining starts.
    uint256 public startBlock;
	// The block number when mining ends.
    uint256 public endBlock;

    event Deposit(address indexed user, uint256 amount);
    event DepositRewards(uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 amount);
    event LogUpdatePool(uint256 endBlock, uint256 rewardPerBlock);
    event EmergencyRewardWithdraw(address indexed user, uint256 amount);
    event EmergencySweepWithdraw(address indexed user, IERC20 indexed token, uint256 amount);

    constructor(
        IERC20 _hairToken,
        IERC20 _rewardToken,
        uint256 _rewardPerBlock,
        uint256 _startBlock,
        uint256 _endBlock 
    ) {
        require(address(_hairToken) != address(0), "HAIR token cannot be zero address");
        require(address(_rewardToken) != address(0), "Reward token cannot be zero address");
        require(_rewardPerBlock != 0, "_rewardPerBlock is not set");
        require(_startBlock < _endBlock, "_startBlock is too high");

        hairToken = _hairToken;
        earningToken = _rewardToken;
        rewardPerBlock = _rewardPerBlock;
        startBlock = _startBlock;
        endBlock = _endBlock;

        poolInfo = PoolInfo({
            hairToken: _hairToken,
            lastRewardBlock: startBlock,
            accRewardTokenPerShare: 0
        });
    }

    /**
     * @dev Return reward multiplier over the given _from to _to block.
     * @param _from Start block
     * @param _to End block
     * @return reward multiplier
     */
    function getMultiplier(uint256 _from, uint256 _to) public view returns (uint256) {
        if (_to <= endBlock) {
            return _to - _from;
        } else if (_from >= endBlock) {
            return 0;
        } else {
            return endBlock - _from;
        }
    }

    /**
     * @dev Define last block on which reward distribution occurs.
     * @param _endBlock The block when rewards will end
     */
    function setEndBlock(uint256 _endBlock) external onlyOwner {
        require(_endBlock > endBlock, 'new bonus end block must be greater than current');
        endBlock = _endBlock;
        emit LogUpdatePool(endBlock, rewardPerBlock);
    }

    /**
     * @dev View function to see pending Reward on frontend.
     */
    function pendingReward(address _user) external view returns (uint256) {
        UserInfo storage user = userInfo[_user];
        uint256 accRewardTokenPerShare = poolInfo.accRewardTokenPerShare;
        if (block.number > poolInfo.lastRewardBlock && totalStaked != 0) {
            uint256 multiplier = getMultiplier(poolInfo.lastRewardBlock, block.number);
            uint256 tokenReward = multiplier * rewardPerBlock;
            accRewardTokenPerShare = accRewardTokenPerShare + (tokenReward * 1e18 / totalStaked);
        }
        return user.amount * accRewardTokenPerShare / 1e18 - user.rewardDebt;
    }

    /**
     * @dev Update reward variables of the given pool to be up-to-date.
     */
    function updatePool() public {
        if (block.number <= poolInfo.lastRewardBlock) {
            return;
        }
        if (totalStaked == 0) {
            poolInfo.lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = getMultiplier(poolInfo.lastRewardBlock, block.number);
        uint256 tokenReward = multiplier * rewardPerBlock;
        poolInfo.accRewardTokenPerShare = poolInfo.accRewardTokenPerShare + (tokenReward * 1e18 / totalStaked);
        poolInfo.lastRewardBlock = block.number;
    }

    /**
     * @dev Deposit HAIR token into the contract to earn rewards.
     * @param _amount The amount of HAIR to deposit.
     */
    function deposit(uint256 _amount) public {
        UserInfo storage user = userInfo[msg.sender];
        uint256 finalDepositAmount = 0;
        updatePool();
        if (user.amount > 0) {
            uint256 pending = user.amount * poolInfo.accRewardTokenPerShare / 1e18 - user.rewardDebt;
            if(pending > 0) {
                uint256 currentRewardBalance = rewardBalance();
                if(currentRewardBalance > 0) {
                    if(pending > currentRewardBalance) {
                        safeTransferReward(address(msg.sender), currentRewardBalance);
                    } else {
                        safeTransferReward(address(msg.sender), pending);
                    }
                }
            }
        }
        if (_amount > 0) {
            uint256 preStakeBalance = hairToken.balanceOf(address(this));
            hairToken.safeTransferFrom(address(msg.sender), address(this), _amount);
            finalDepositAmount = hairToken.balanceOf(address(this)) - preStakeBalance;
            user.amount = user.amount + finalDepositAmount;
            totalStaked = totalStaked + finalDepositAmount;
        }
        user.rewardDebt = user.amount * poolInfo.accRewardTokenPerShare / 1e18;

        emit Deposit(msg.sender, finalDepositAmount);
    }

    /**
     * @dev Withdraw rewards and/or HAIR. Pass a 0 amount to withdraw only rewards
     * @param _amount The amount of HAIR to withdraw
     */
    function withdraw(uint256 _amount) public {
        UserInfo storage user = userInfo[msg.sender];
        require(user.amount >= _amount, "Withdraw amount exceeds balance");
        updatePool();
        uint256 pending = user.amount * poolInfo.accRewardTokenPerShare / 1e18 - user.rewardDebt;
        if(pending > 0) {
            uint256 currentRewardBalance = rewardBalance();
            if(currentRewardBalance > 0) {
                if(pending > currentRewardBalance) {
                    safeTransferReward(address(msg.sender), currentRewardBalance);
                } else {
                    safeTransferReward(address(msg.sender), pending);
                }
            }
        }
        if(_amount > 0) {
            user.amount = user.amount - _amount;
            hairToken.safeTransfer(address(msg.sender), _amount);
            totalStaked = totalStaked - _amount;
        }

        user.rewardDebt = user.amount * poolInfo.accRewardTokenPerShare / 1e18;

        emit Withdraw(msg.sender, _amount);
    }

    /**
     * @dev Obtain the rewrad balance of this contract
     * @return wei balance of contract
     */
    function rewardBalance() public view returns (uint256) {
        uint256 balance = earningToken.balanceOf(address(this));
        if (hairToken == earningToken)
            return balance - totalStaked;
        return balance;
    }

    /**
     * @dev Deposit rewards into contract
     * @param _amount amount of tokens to deposit
     */
    function depositRewards(uint256 _amount) external {
        require(_amount > 0, 'Deposit value must be greater than 0.');
        earningToken.safeTransferFrom(address(msg.sender), address(this), _amount);
        emit DepositRewards(_amount);
    }

    /**
     * @param _to address to send reward token to
     * @param _amount value of reward token to transfer
     */
    function safeTransferReward(address _to, uint256 _amount) internal {
        earningToken.safeTransfer(_to, _amount);
    }

    /**
     * @dev Obtain the hair balance of this contract
     * @return wei balance of hair token
     */
    function totalHairTokenBalance() public view returns (uint256) {
        if (hairToken == earningToken) {
            return totalStaked;
        }
        return hairToken.balanceOf(address(this));
    }

    /* Admin Functions */

    /**
     * @param _rewardPerBlock The amount of reward tokens to be given per block
     */
    function setRewardPerBlock(uint256 _rewardPerBlock) external onlyOwner {
        rewardPerBlock = _rewardPerBlock;
        emit LogUpdatePool(endBlock, rewardPerBlock);
    }

    /* Emergency Functions */

    // Withdraw without caring about rewards. EMERGENCY ONLY.
    function emergencyWithdraw() external {
        UserInfo storage user = userInfo[msg.sender];
        hairToken.safeTransfer(address(msg.sender), user.amount);
        totalStaked = totalStaked - user.amount;
        user.amount = 0;
        user.rewardDebt = 0;
        emit EmergencyWithdraw(msg.sender, user.amount);
    }

    // Withdraw reward. EMERGENCY ONLY.
    function emergencyRewardWithdraw(uint256 _amount) external onlyOwner {
        require(_amount <= rewardBalance(), 'not enough rewards');
        // Withdraw rewards
        safeTransferReward(address(msg.sender), _amount);
        emit EmergencyRewardWithdraw(msg.sender, _amount);
    }

    /// @notice A public function to sweep accidental ERC20 transfers to this contract.
    ///   Tokens are sent to owner
    /// @param token The address of the ERC20 token to sweep
    function sweepToken(IERC20 token) external onlyOwner {
        require(address(token) != address(hairToken), "can not sweep HAIR token");
        uint256 balance = token.balanceOf(address(this));
        token.transfer(msg.sender, balance);
        emit EmergencySweepWithdraw(msg.sender, token, balance);
    }

}