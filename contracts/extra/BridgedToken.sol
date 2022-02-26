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

import "./utils/ERC20.sol";

contract BridgedToken is ERC20 {

    address private migrationAuthority;
    address private pendingMigratorAuthority;
    address private immutable bridge;

    modifier onlyMinter() {
        require(msg.sender == bridge || msg.sender == migrationAuthority, "Unauthorized");
        _;
    }

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals,
        address _bridge,
        bool hasMigration
    ) ERC20(name, symbol, decimals) {
        require(_bridge != address(0), "Bridge cannot be addresss 0");
        bridge = _bridge;
        if (hasMigration) {
            migrationAuthority = msg.sender;
        }
    }

    // Token Migrations

    function passMigratorAuthority(address _newAuthority) external {
        require(msg.sender == migrationAuthority, "Unauthorized");
        pendingMigratorAuthority = _newAuthority;
    }

    function acceptMigratorAuthority() external {
        require(msg.sender == pendingMigratorAuthority, "Unauthorized");
        migrationAuthority = pendingMigratorAuthority;
        pendingMigratorAuthority = address(0);
    }

    // mint/burn functions

    function mint(address _user, uint256 _amount) external onlyMinter {
        _mint(_user, _amount);
    }

    function burn(address _user, uint256 _amount) external onlyMinter {
        _burn(_user, _amount);
    }
    
    // State getters

    function getBridge() external view returns (address) {
        return bridge;
    }

    function getMigrator() external view returns (address) {
        return migrationAuthority;
    }
}