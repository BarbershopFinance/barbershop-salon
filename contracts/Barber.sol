// SPDX-License-Identifier: MIT

/*                         dP                                  dP                         
88                         88                                  88                         
88d888b. .d8888b. 88d888b. 88d888b. .d8888b. 88d888b. .d8888b. 88d888b. .d8888b. 88d888b. 
88'  `88 88'  `88 88'  `88 88'  `88 88ooood8 88'  `88 Y8ooooo. 88'  `88 88'  `88 88'  `88 
88.  .88 88.  .88 88       88.  .88 88.  ... 88             88 88    88 88.  .88 88.  .88 
88Y8888' `88888P8 dP       88Y8888' `88888P' dP       `88888P' dP    dP `88888P' 88Y888P' 
                                                                                 88       
                                                                                 dP       
                                                                                 */
pragma solidity 0.8.6;

import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import './HairToken.sol';

// Barber is the master of Hair. He can make Hair and he is a fair guy.
//
// Note that it's ownable and the owner wields tremendous power. The ownership
// will be transferred to a governance smart contract once HAIR is sufficiently
// distributed and the community can show to govern itself.
//
// Have fun reading it. Hopefully it's dandruff free. God bless.
contract Barber is Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // Info of each user.
    struct UserInfo {
        uint256 amount;     // How many LP tokens the user has provided.
        uint256 rewardDebt; // Reward debt. See explanation below.
        //
        // We do some fancy math here. Basically, any point in time, the amount of HAIRs
        // entitled to a user but is pending to be distributed is:
        //
        //   pending reward = (user.amount * pool.accHairPerShare) - user.rewardDebt
        //
        // Whenever a user deposits or withdraws LP tokens to a pool. Here's what happens:
        //   1. The pool's `accHairPerShare` (and `lastRewardBlock`) gets updated.
        //   2. User receives the pending reward sent to his/her address.
        //   3. User's `amount` gets updated.
        //   4. User's `rewardDebt` gets updated.
    }

    // Info of each pool.
    struct PoolInfo {
        IERC20 lpToken;           // Address of LP token contract.
        uint256 allocPoint;       // How many allocation points assigned to this pool. HAIRs to distribute per block.
        uint256 lastRewardBlock;  // Last block number that HAIRs distribution occurs.
        uint256 accHairPerShare;  // Accumulated HAIRs per share, times 1e18. See below.
        uint16 depositFeeBP;      // Deposit fee in basis points
    }

    // The HAIR token.
    HairToken public hair;
    // Dev address.
    address public devAddress;
    // HAIR tokens created per block.
    uint256 public hairPerBlock;
    // Maximum hair per block.
    uint256 public constant MAX_HAIR_PER_BLOCK = 50e18; // 50 hair
    
    // Deposit Fee address
    address public feeAddress;

    // Info of each pool.
    PoolInfo[] public poolInfo;
    // Info of each user that stakes LP tokens.
    mapping (uint256 => mapping (address => UserInfo)) public userInfo;
    // Total allocation points. Must be the sum of all allocation points in all pools.
    uint256 public totalAllocPoint = 0;
    // The block number when HAIR mining starts.
    uint256 public startBlock;

    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event SetFeeAddress(address indexed user, address indexed newAddress);
    event SetDevAddress(address indexed user, address indexed newAddress);
    event UpdateEmissionRate(address indexed user, uint256 hairPerBlock);

    constructor(
        HairToken _hair,
        address _devAddress,
        address _feeAddress,
        uint256 _hairPerBlock,
        uint256 _startBlock
    ) {
        hair = _hair;
        devAddress = _devAddress;
        feeAddress = _feeAddress;
        hairPerBlock = _hairPerBlock;
        startBlock = _startBlock;
    }

    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    mapping(IERC20 => bool) public poolExistence;
    modifier nonDuplicated(IERC20 _lpToken) {
        require(!poolExistence[_lpToken], "nonDuplicated: duplicated");
        _;
    }

    // Add a new lp to the pool. Can only be called by the owner.
    function add(uint256 _allocPoint, IERC20 _lpToken, uint16 _depositFeeBP, bool _withUpdate) external onlyOwner nonDuplicated(_lpToken) {
        require(_depositFeeBP <= 1000, "add: invalid deposit fee basis points");
        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 lastRewardBlock = block.number > startBlock ? block.number : startBlock;
        totalAllocPoint = totalAllocPoint.add(_allocPoint);
        poolExistence[_lpToken] = true;
        poolInfo.push(PoolInfo({
            lpToken: _lpToken,
            allocPoint: _allocPoint,
            lastRewardBlock: lastRewardBlock,
            accHairPerShare: 0,
            depositFeeBP: _depositFeeBP
        }));
    }

    // Update the given pool's HAIR allocation point and deposit fee. Can only be called by the owner.
    function set(uint256 _pid, uint256 _allocPoint, uint16 _depositFeeBP, bool _withUpdate) external onlyOwner {
        require(_depositFeeBP <= 1000, "set: invalid deposit fee basis points");
        if (_withUpdate) {
            massUpdatePools();
        }

        totalAllocPoint = totalAllocPoint.sub(poolInfo[_pid].allocPoint).add(_allocPoint);
        poolInfo[_pid].allocPoint = _allocPoint;
        poolInfo[_pid].depositFeeBP = _depositFeeBP;
    }

    // Return reward multiplier over the given _from to _to block.
    function getMultiplier(uint256 _from, uint256 _to) public pure returns (uint256) {
        return _to.sub(_from);
    }

    // View function to see pending HAIRs on frontend.
    function pendingHair(uint256 _pid, address _user) external view returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accHairPerShare = pool.accHairPerShare;
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
            uint256 hairReward = multiplier.mul(hairPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
            accHairPerShare = accHairPerShare.add(hairReward.mul(1e18).div(lpSupply));
        }
        return user.amount.mul(accHairPerShare).div(1e18).sub(user.rewardDebt);
    }

    // Update reward variables for all pools. Be careful of gas spending!
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    // Update reward variables of the given pool to be up-to-date.
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (lpSupply == 0 || pool.allocPoint == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
        uint256 hairReward = multiplier.mul(hairPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
        hair.mint(devAddress, hairReward.div(10));
        hair.mint(address(this), hairReward);
        pool.accHairPerShare = pool.accHairPerShare.add(hairReward.mul(1e18).div(lpSupply));
        pool.lastRewardBlock = block.number;
    }

    // Deposit LP tokens to Barber for HAIR allocation.
    function deposit(uint256 _pid, uint256 _amount) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        updatePool(_pid);
        uint256 finalDepositAmount = 0;
        if (user.amount > 0) {
            uint256 pending = user.amount.mul(pool.accHairPerShare).div(1e18).sub(user.rewardDebt);
            if (pending > 0) {
                safeHairTransfer(msg.sender, pending);
            }
        }
        if (_amount > 0) {
            // Do before and after balance check to account for reflect fees
            uint256 preStakeBalance = pool.lpToken.balanceOf(address(this));
            pool.lpToken.safeTransferFrom(address(msg.sender), address(this), _amount);
            finalDepositAmount = pool.lpToken.balanceOf(address(this)) - preStakeBalance;
            if (pool.depositFeeBP > 0) {
                uint256 depositFee = finalDepositAmount.mul(pool.depositFeeBP).div(10000);
                pool.lpToken.safeTransfer(feeAddress, depositFee);
                user.amount = user.amount.add(finalDepositAmount).sub(depositFee);
            } else {
                user.amount = user.amount.add(finalDepositAmount);
            }
        }
        user.rewardDebt = user.amount.mul(pool.accHairPerShare).div(1e18);
        emit Deposit(msg.sender, _pid, finalDepositAmount);
    }

    // Withdraw LP tokens from Barber.
    function withdraw(uint256 _pid, uint256 _amount) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount >= _amount, "withdraw: not good");
        updatePool(_pid);
        uint256 pending = user.amount.mul(pool.accHairPerShare).div(1e18).sub(user.rewardDebt);
        if (pending > 0) {
            safeHairTransfer(msg.sender, pending);
        }
        if (_amount > 0) {
            user.amount = user.amount.sub(_amount);
            pool.lpToken.safeTransfer(address(msg.sender), _amount);
        }
        user.rewardDebt = user.amount.mul(pool.accHairPerShare).div(1e18);
        emit Withdraw(msg.sender, _pid, _amount);
    }

    // Withdraw without caring about rewards. EMERGENCY ONLY.
    function emergencyWithdraw(uint256 _pid) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        uint256 amount = user.amount;
        user.amount = 0;
        user.rewardDebt = 0;
        pool.lpToken.safeTransfer(address(msg.sender), amount);
        emit EmergencyWithdraw(msg.sender, _pid, amount); 
    }

    // Safe hair transfer function, just in case if rounding error causes pool to not have enough HAIRs.
    function safeHairTransfer(address _to, uint256 _amount) internal {
        uint256 hairBal = hair.balanceOf(address(this));
        bool transferSuccess = false;
        if (_amount > hairBal) {
            transferSuccess = hair.transfer(_to, hairBal);
        } else {
            transferSuccess = hair.transfer(_to, _amount);
        }
        require(transferSuccess, "safeHairTransfer: transfer failed");
    }

    // Update dev address by the previous dev.
    function setDevAddress(address _devAddress) external {
        require(msg.sender == devAddress, "dev: wut?");
        require(_devAddress != address(0), "Cannot be zero address");
        devAddress = _devAddress;
        emit SetDevAddress(msg.sender, _devAddress);
    }

    function setFeeAddress(address _feeAddress) external {
        require(msg.sender == feeAddress, "setFeeAddress: FORBIDDEN"); 
        require(_feeAddress != address(0), "Cannot be zero address");
        feeAddress = _feeAddress;
        emit SetFeeAddress(msg.sender, _feeAddress);
    }

    function updateEmissionRate(uint256 _hairPerBlock) external onlyOwner {
        require(_hairPerBlock <= MAX_HAIR_PER_BLOCK, "updateEmissionRate: too high");
        massUpdatePools();
        hairPerBlock = _hairPerBlock;
        emit UpdateEmissionRate(msg.sender, _hairPerBlock);
    }
}
