/*
 Copyright (c) 2022 Radar Global

 Permission is hereby granted, free of charge, to any person obtaining a copy of
 this software and associated documentation files (the "Software"), to deal in
 the Software without restriction, including without limitation the rights to
 use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 the Software, and to permit persons to whom the Software is furnished to do so,
 subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

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