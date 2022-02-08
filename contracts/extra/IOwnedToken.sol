pragma solidity ^0.8.0;

interface IOwnedToken {
    function claimOwnership() external;

    function transferOwnership(address) external;
}