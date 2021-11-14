// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IBridgedToken {

    function getBridge() external view returns (address);

    function mint(address, uint256) external;

    function burn(address, uint256) external;
}