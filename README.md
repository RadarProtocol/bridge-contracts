[![codecov](https://codecov.io/gh/RadarProtocol/bridge-contracts/branch/main/graph/badge.svg?token=0KH0M0B4XY)](https://codecov.io/gh/RadarProtocol/bridge-contracts)
[![CircleCI](https://circleci.com/gh/RadarProtocol/bridge-contracts/tree/main.svg?style=svg)](https://circleci.com/gh/RadarProtocol/bridge-contracts/tree/main)

# DEPLOYMENTS
## ETHEREUM DEPLOYMENTS
* BRIDGE LIB: `0x82963cEA61fa4EEc54C923056Cd1654c2980aF38`
* BRIDGE: `0xA735c1Ab7B20F71CB16E09014c88C51d0086732A`
    - Fee Engine: `FeeManagerV1`
* FEE MANAGER V1: `0x8DFd575F9110C21E6EE7A9f7E583d38E10a62F8D`

## BSC DEPLOYMENTS
* OLD BRIDGE LIB: `0xC33A9B8C0386E0De00Fe513652F13b0C3bF5dF44`
* OLD BRIDGE LIB 2: `0x2674B5e9CC68C58A8012834CaAE399B957100445`
* BRIDGE LIB: `0xD3B8573A5185b476fE040cCAA37367728A62126D`
* BRIDGE: `0xBe0a25915acDD6eA0FE7F6EFC1C68a6a79fF9110`
    - Fee Engine: `FeeManagerV1`
* RADAR TOKEN: `0xf03a2dc374d494fbe894563fe22ee544d826aa50`
* RADAR TOKEN MIGRATOR: `0xfd2b93ea4f7547eff73d08d889bedcc5164c1175`
* FEE MANAGER V1: `0x2884e4A5d7cBC22386cBE9A75B5f489061a06CD1`

## POLYGON DEPLOYMENTS
* OLD BRIDGE LIB: `0xf9FBE825BFB2bF3E387af0Dc18caC8d87F29DEa8`
* BRIDGE LIB: `0x376B5b1d0B76207eB8026c64Ccc4b36bf802571b`
* BRIDGE: `0x595762ed748884fb4578A3E45A95fA2471F04aE4`
    - Fee Engine: `FeeManagerV1`
* RADAR TOKEN: `0x44d2B67187d539E83328aDe72A1b5f9512a74444`
* FEE MANAGER V1: `0x65E6590eb3488a2830031e14bf8C36ABf5E455C8`

## FANTOM DEPLOYMENTS
* OLD BRIDGE LIB: `0xf9FBE825BFB2bF3E387af0Dc18caC8d87F29DEa8`
* BRIDGE LIB: `0xe736779558cCB1e3d53e475a18E0CbA9D0C62b0B`
* BRIDGE: `0x595762ed748884fb4578A3E45A95fA2471F04aE4`
    - Fee Engine: `FeeManagerV1`
* RADAR TOKEN: `0x44d2B67187d539E83328aDe72A1b5f9512a74444`
* FEE MANAGER V1: `0xC1948e756b5617A56821Ec312de80cbfa98063B7`

## AVALANCHE C-CHAIN DEPLOYMENTS
* BRIDGE LIB: `0xf9FBE825BFB2bF3E387af0Dc18caC8d87F29DEa8`
* BRIDGE: `0x595762ed748884fb4578A3E45A95fA2471F04aE4`
    - Fee Engine: `FeeManagerV1`
* RADAR TOKEN: `0x44d2B67187d539E83328aDe72A1b5f9512a74444`
* FEE MANAGER V1: `0x65E6590eb3488a2830031e14bf8C36ABf5E455C8`

## MOONBEAM DEPLOYMENTS
* BRIDGE LIB: `0xf9FBE825BFB2bF3E387af0Dc18caC8d87F29DEa8`
* BRIDGE: `0x595762ed748884fb4578A3E45A95fA2471F04aE4`
    - Fee Engine: `FeeManagerV1`
* RADAR TOKEN: `0x44d2B67187d539E83328aDe72A1b5f9512a74444`
* FEE MANAGER V1: `0x65E6590eb3488a2830031e14bf8C36ABf5E455C8`

## MOONRIVER DEPLOYMENTS
* BRIDGE LIB: `0xf9FBE825BFB2bF3E387af0Dc18caC8d87F29DEa8`
* BRIDGE: `0x595762ed748884fb4578A3E45A95fA2471F04aE4`
    - Fee Engine: `FeeManagerV1`
* RADAR TOKEN: `0x44d2B67187d539E83328aDe72A1b5f9512a74444`
* FEE MANAGER V1: `0xfD2b93eA4f7547eFf73D08d889beDCc5164c1175`

# FEES (FeeManagerV1)

## ETHEREUM
* RADAR: Whichever is lower than
    - `100` RADAR
    - `1%` of amount bridged
* HYVE: Whichever is lower than
    - `100` HYVE
    - `1%` of amount bridged

## BSC
* RADAR: Whichever is lower than
    - `100` RADAR
    - `1%` of amount bridged
* HYVE: Whichever is lower than
    - `100` HYVE
    - `1%` of amount bridged

## POLYGON
* RADAR: Whichever is lower than
    - `100` RADAR
    - `1%` of amount bridged
* HYVE: Whichever is lower than
    - `100` HYVE
    - `1%` of amount bridged

## FANTOM
* RADAR: Whichever is lower than
    - `100` RADAR
    - `1%` of amount bridged
* HYVE: Whichever is lower than
    - `100` HYVE
    - `1%` of amount bridged

## AVALANCE C-CHAIN
* RADAR: Whichever is lower than
    - `100` RADAR
    - `1%` of amount bridged

## MOONBEAM
* RADAR: Whichever is lower than
    - `100` RADAR
    - `1%` of amount bridged

## MOONRIVER
* RADAR: Whichever is lower than
    - `100` RADAR
    - `1%` of amount bridged