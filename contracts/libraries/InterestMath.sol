// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library InterestMath {
    uint256 internal constant BASIS_POINTS = 10_000;
    uint256 internal constant SECONDS_PER_YEAR = 365 days;

    function simpleInterest(
        uint256 principal,
        uint256 aprBps,
        uint256 duration
    ) internal pure returns (uint256) {
        return (principal * aprBps * duration) / (BASIS_POINTS * SECONDS_PER_YEAR);
    }
}
