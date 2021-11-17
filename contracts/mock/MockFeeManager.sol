pragma solidity ^0.8.0;

contract MockFeeManager {
    function getBridgeFee(address _token, address _sender, uint256 _amount, bytes32 _destChain, address _destAddress) external view returns (uint256) {
        return 50;
    }

    function getFeeBase() external view returns (uint256) {
        return 1000;
    }
}