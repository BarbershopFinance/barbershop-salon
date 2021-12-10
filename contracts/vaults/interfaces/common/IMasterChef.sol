// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

interface IMasterChef {
    function deposit(uint256 pid, uint256 amount) external;
    function withdraw(uint256 pid, uint256 amount) external;
    function userInfo(uint256 pid, address user) external view returns (uint256, uint256);
    function pending(uint256 pid, address user) external view returns (uint256);
    function emergencyWithdraw(uint256 pid) external;
}