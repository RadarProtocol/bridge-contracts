// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IBridgedToken.sol";

contract BridgedTokenMigrator {
    using SafeERC20 for IERC20;

    address private immutable oldToken;
    address private immutable newToken;

    uint256 private leftToMigrate;

    event TokensMigrated(
        address user,
        uint256 amount
    );

    constructor(
        address _oldToken,
        address _newToken
    ) {
        oldToken = _oldToken;
        newToken = _newToken;

        leftToMigrate = IERC20(_oldToken).totalSupply();
    }

    function migrateTokens() external {
        uint256 _bal = IERC20(oldToken).balanceOf(msg.sender);
        IERC20(oldToken).safeTransferFrom(msg.sender, address(this), _bal);

        leftToMigrate = leftToMigrate - _bal;

        IBridgedToken(newToken).mint(msg.sender, _bal);

        emit TokensMigrated(msg.sender, _bal);
    }

    function acceptMigratorAuthority() external {
        IBridgedToken(newToken).acceptMigratorAuthority();
    }

    function getOldToken() external view returns (address) {
        return oldToken;
    }

    function getNewToken() external view returns (address) {
        return newToken;
    }

    function tokensNotMigrated() external view returns (uint256) {
        return leftToMigrate;
    }

    function migrationFinished() external view returns (bool) {
        return (leftToMigrate == 0);
    }
}