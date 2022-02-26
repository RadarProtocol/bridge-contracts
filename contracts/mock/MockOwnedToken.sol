pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockOwnedToken is ERC20 {
    address public owner;
    address public pendingOwner;

    constructor() ERC20("TEST", "TEST") {
        owner = msg.sender;
    }

    function transferOwnership(address _newOwner) external {
        require(msg.sender == owner, "MockToken: Unauthorized");
        pendingOwner = _newOwner;
    }

    function claimOwnership() external {
        require(msg.sender == pendingOwner, "MockToken: Unauthorized");
        owner = pendingOwner;
        pendingOwner = address(0);
    }
}