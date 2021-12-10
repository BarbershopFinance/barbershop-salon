// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

interface IRewarder {
    function onBananaReward(uint256 pid, address user, address recipient, uint256 bananaAmount, uint256 newLpAmount) external;
    // via MiniComplexRewarderTime.sol
    function pendingToken(uint256 _pid, address _user) external view returns (uint256 pending);
}