import { expect } from "chai";
import { ethers } from "hardhat";

const generateBridgeSignature = async (
    signer: any,
    signData: string
): Promise<string> => {
    const messageBytes = ethers.utils.arrayify(signData);
    const signature = await signer.signMessage(messageBytes);
    return signature;
}

const getNewRouterSignature = async (
    signer: any,
    _tokenId: string,
    _newRouter: string,
    _chain: string
): Promise<string> => {
    const signData = ethers.utils.solidityKeccak256(["bytes32", "bytes32", "address", "bytes32"], [
        ethers.utils.formatBytes32String("PASS OWNERSHIP"),
        ethers.utils.formatBytes32String(_tokenId),
        _newRouter,
        ethers.utils.formatBytes32String(_chain)
    ]);
    const sig = await generateBridgeSignature(signer, signData);

    return sig;
}

const getBridgeSignature = async (
    signer: any,
    _tokenId: string,
    _amount: any,
    _srcChain: string,
    _destChain: string,
    _nonce: string,
    _destAddress: string,
    _srcTimestamp: any
): Promise<string> => {
    const signData = ethers.utils.solidityKeccak256(["bytes32", "uint256", "bytes32", "bytes32", "uint256", "bytes32", "address"], [
        ethers.utils.formatBytes32String(_tokenId),
        _amount,
        ethers.utils.formatBytes32String(_srcChain),
        ethers.utils.formatBytes32String(_destChain),
        _srcTimestamp,
        ethers.utils.formatBytes32String(_nonce),
        _destAddress
    ]);
    const sig = await generateBridgeSignature(signer, signData);

    return sig;
}

const snapshot = async () => {
    const [deployer, ethTokenHolder, bscTokenHolder, router, randomAddress] = await ethers.getSigners();

    const bridgeFactory = await ethers.getContractFactory("RadarBridge");
    const bridgeProxyFactory = await ethers.getContractFactory("RadarBridgeProxy");

    const ethBridgeLib = await bridgeFactory.deploy();
    const bscBridgeLib = await bridgeFactory.deploy();

    const initInterface = new ethers.utils.Interface(["function initialize(bytes32 _chain)"]);
    const ethBridgeProxy = await bridgeProxyFactory.deploy(
        initInterface.encodeFunctionData("initialize", [ethers.utils.formatBytes32String("ETH")]),
        ethBridgeLib.address
    );
    const bscBridgeProxy = await bridgeProxyFactory.deploy(
        initInterface.encodeFunctionData("initialize", [ethers.utils.formatBytes32String("BSC")]),
        bscBridgeLib.address
    );

    const ethBridge = bridgeFactory.attach(ethBridgeProxy.address);
    const bscBridge = bridgeFactory.attach(bscBridgeProxy.address);

    const tokenFactory = await ethers.getContractFactory("BridgedToken");
    const ethToken = await tokenFactory.deploy("Radar ETH", "RADARETH", 18, randomAddress.address, true);
    const bscToken = await tokenFactory.deploy("Radar BSC", "RADARBSC", 18, bscBridge.address, true);

    await ethToken.connect(deployer).mint(ethTokenHolder.address, ethers.utils.parseEther('100'));
    await bscToken.connect(deployer).mint(bscTokenHolder.address, ethers.utils.parseEther('100'));

    await ethBridge.connect(deployer).addSupportedToken(
        ethToken.address,
        false,
        ethers.utils.formatBytes32String("RADAR"),
        router.address
    );
    await bscBridge.attach(bscBridge.address).connect(deployer).addSupportedToken(
        bscToken.address,
        true,
        ethers.utils.formatBytes32String("RADAR"),
        router.address
    );

    return {
        deployer,
        ethToken,
        ethTokenHolder,
        bscToken,
        bscTokenHolder,
        ethBridge,
        bscBridge,
        ethBridgeLib,
        bscBridgeLib,
        bridgeFactory,
        router
    }
}

describe("Radar Bridge", () => {
    it("State Getters", async () => {
        const {
            deployer,
            ethToken,
            bscToken,
            ethBridge,
            bscBridge,
            ethBridgeLib,
            bscBridgeLib
        } = await snapshot();

        const getOwnerCallETH = await ethBridge.getOwner();
        const getOwnerCallBSC = await bscBridge.getOwner();
        expect(getOwnerCallETH).to.equal(deployer.address);
        expect(getOwnerCallBSC).to.equal(deployer.address);

        const getChainCallETH = await ethBridge.getChain();
        const getChainCallBSC = await bscBridge.getChain();
        expect(getChainCallETH).to.equal(ethers.utils.formatBytes32String("ETH"));
        expect(getChainCallBSC).to.equal(ethers.utils.formatBytes32String("BSC"));

        const getFeeManagerETH = await ethBridge.getFeeManager();
        const getFeeManagerBSC = await bscBridge.getFeeManager();
        expect(getFeeManagerETH).to.equal(ethers.constants.AddressZero);
        expect(getFeeManagerBSC).to.equal(ethers.constants.AddressZero);

        const getImplementationETH = await ethBridge.implementation();
        const getImplementationBSC = await bscBridge.implementation();
        expect(getImplementationETH).to.equal(ethBridgeLib.address);
        expect(getImplementationBSC).to.equal(bscBridgeLib.address);

        const getIsSupportedTokenETHTrue = await ethBridge.getIsSupportedToken(ethToken.address);
        const getIsSupportedTokenETHFalse = await ethBridge.getIsSupportedToken(ethers.constants.AddressZero);
        const getIsSupportedTokenBSCTrue = await bscBridge.getIsSupportedToken(bscToken.address);
        const getIsSupportedTokenBSCFalse = await bscBridge.getIsSupportedToken(ethers.constants.AddressZero);
        expect(getIsSupportedTokenETHTrue).to.equal(true);
        expect(getIsSupportedTokenETHFalse).to.equal(false);
        expect(getIsSupportedTokenBSCTrue).to.equal(true);
        expect(getIsSupportedTokenBSCFalse).to.equal(false);

        const getTokenHandlerTypeCallETH = await ethBridge.getTokenHandlerType(ethToken.address);
        const getTokenHandlerTypeCallBSC = await bscBridge.getTokenHandlerType(bscToken.address);
        expect(getTokenHandlerTypeCallETH).to.equal(false);
        expect(getTokenHandlerTypeCallBSC).to.equal(true);

        const getTokenIDCallETH = await ethBridge.getTokenId(ethToken.address);
        const getTokenIDCallBSC = await bscBridge.getTokenId(bscToken.address);
        expect(getTokenIDCallETH).to.equal(ethers.utils.formatBytes32String("RADAR"));
        expect(getTokenIDCallBSC).to.equal(ethers.utils.formatBytes32String("RADAR"));

        const getTokenByIDCallETH = await ethBridge.getTokenById(ethers.utils.formatBytes32String("RADAR"));
        const getTokenByIDCallBSC = await bscBridge.getTokenById(ethers.utils.formatBytes32String("RADAR"));
        expect(getTokenByIDCallETH).to.equal(ethToken.address);
        expect(getTokenByIDCallBSC).to.equal(bscToken.address);

        const getSupportedTokensLengthETH = await ethBridge.getSupportedTokensLength();
        const getSupportedTokensLengthBSC = await bscBridge.getSupportedTokensLength();
        expect(getSupportedTokensLengthETH).to.equal(1);
        expect(getSupportedTokensLengthBSC).to.equal(1);

        const getSupportedTokenByIndexETH = await ethBridge.getSupportedTokenByIndex(0);
        const getSupportedTokenByIndexBSC = await bscBridge.getSupportedTokenByIndex(0);
        expect(getSupportedTokenByIndexETH).to.equal(ethToken.address);
        expect(getSupportedTokenByIndexBSC).to.equal(bscToken.address);
    });
    it("Access Control", async () => {
        const {
            deployer,
            ethBridge,
            bscBridge,
            ethTokenHolder, // Use as random user
            ethBridgeLib,
            bscBridgeLib
        } = await snapshot();

        // Re-initialize
        await expect(ethBridge.connect(deployer).initialize(ethers.utils.formatBytes32String("OTHER"))).to.be.revertedWith(
            "Contract already initialized"
        );
        await expect(bscBridge.connect(deployer).initialize(ethers.utils.formatBytes32String("OTHER"))).to.be.revertedWith(
            "Contract already initialized"
        );

        // Initialize factory
        await expect(ethBridgeLib.connect(deployer).initialize(ethers.utils.formatBytes32String("OTHER"))).to.be.revertedWith(
            "Only delegates can call this"
        );
        await expect(bscBridgeLib.connect(deployer).initialize(ethers.utils.formatBytes32String("OTHER"))).to.be.revertedWith(
            "Only delegates can call this"
        );

        // Upgrade
        await expect(ethBridge.connect(ethTokenHolder).upgrade(ethers.constants.AddressZero)).to.be.revertedWith(
            "Unauthorized"
        );
        await expect(bscBridge.connect(ethTokenHolder).upgrade(ethers.constants.AddressZero)).to.be.revertedWith(
            "Unauthorized"
        );

        // sendOwnership
        await expect(ethBridge.connect(ethTokenHolder).sendOwnership(ethers.constants.AddressZero)).to.be.revertedWith(
            "Unauthorized"
        );
        await expect(bscBridge.connect(ethTokenHolder).sendOwnership(ethers.constants.AddressZero)).to.be.revertedWith(
            "Unauthorized"
        );

        // acceptOwnership
        await expect(ethBridge.connect(ethTokenHolder).acceptOwnership()).to.be.revertedWith(
            "Unauthorized"
        );
        await expect(bscBridge.connect(ethTokenHolder).acceptOwnership()).to.be.revertedWith(
            "Unauthorized"
        );

        // addSupportedToken
        await expect(ethBridge.connect(ethTokenHolder).addSupportedToken(ethers.constants.AddressZero, false, ethers.utils.formatBytes32String("Y"), ethers.constants.AddressZero)).to.be.revertedWith(
            "Unauthorized"
        );
        await expect(bscBridge.connect(ethTokenHolder).addSupportedToken(ethers.constants.AddressZero, false, ethers.utils.formatBytes32String("Y"), ethers.constants.AddressZero)).to.be.revertedWith(
            "Unauthorized"
        );

        // removeSupportedToken
        await expect(ethBridge.connect(ethTokenHolder).removeSupportedToken(ethers.constants.AddressZero)).to.be.revertedWith(
            "Unauthorized"
        );
        await expect(bscBridge.connect(ethTokenHolder).removeSupportedToken(ethers.constants.AddressZero)).to.be.revertedWith(
            "Unauthorized"
        );

        // Change Token Router
        const tokenRouterSignature = await getNewRouterSignature(ethTokenHolder, "RADAR", ethers.constants.AddressZero, "ETH");
        await expect(ethBridge.connect(ethTokenHolder).changeTokenRouter(ethers.utils.formatBytes32String("RADAR"), ethers.constants.AddressZero, tokenRouterSignature)).to.be.revertedWith(
            "Invalid Signature"
        );
        await expect(bscBridge.connect(ethTokenHolder).changeTokenRouter(ethers.utils.formatBytes32String("RADAR"), ethers.constants.AddressZero, tokenRouterSignature)).to.be.revertedWith(
            "Invalid Signature"
        );

        // Change Fee Manager
        await expect(ethBridge.connect(ethTokenHolder).changeFeeManager(ethers.constants.AddressZero)).to.be.revertedWith(
            "Unauthorized"
        );
        await expect(bscBridge.connect(ethTokenHolder).changeFeeManager(ethers.constants.AddressZero)).to.be.revertedWith(
            "Unauthorized"
        );

        await expect(ethBridge.connect(ethTokenHolder).claimTokenOwnership(ethers.constants.AddressZero)).to.be.revertedWith(
            "Unauthorized"
        );
        await expect(ethBridge.connect(ethTokenHolder).passTokenOwnership(ethers.constants.AddressZero, ethers.constants.AddressZero)).to.be.revertedWith(
            "Unauthorized"
        );

    });
    it("Pass Ownership", async () => {
        const {
            deployer,
            ethBridge,
            bscBridge,
            ethTokenHolder // Use as random user
        } = await snapshot();

        // Check Owner
        const getOwnerCallBeforeETH = await ethBridge.getOwner();
        const getOwnerCallBeforeBSC = await bscBridge.getOwner();
        expect(getOwnerCallBeforeETH).to.equal(deployer.address);
        expect(getOwnerCallBeforeBSC).to.equal(deployer.address);

        // Pass Owner
        await ethBridge.connect(deployer).sendOwnership(ethTokenHolder.address);
        await bscBridge.connect(deployer).sendOwnership(ethTokenHolder.address);
        await ethBridge.connect(ethTokenHolder).acceptOwnership();
        await bscBridge.connect(ethTokenHolder).acceptOwnership();

        // Check Owner
        const getOwnerCallAfterETH = await ethBridge.getOwner();
        const getOwnerCallAfterBSC = await bscBridge.getOwner();
        expect(getOwnerCallAfterETH).to.equal(ethTokenHolder.address);
        expect(getOwnerCallAfterBSC).to.equal(ethTokenHolder.address);

        // AC on Pass Owner
        await expect(ethBridge.connect(deployer).sendOwnership(ethers.constants.AddressZero)).to.be.revertedWith(
            "Unauthorized"
        );
        await expect(bscBridge.connect(deployer).sendOwnership(ethers.constants.AddressZero)).to.be.revertedWith(
            "Unauthorized"
        );

        await ethBridge.connect(ethTokenHolder).sendOwnership(deployer.address);
        await bscBridge.connect(ethTokenHolder).sendOwnership(deployer.address);
    });
    it("Upgrade Bridge Proxy", async () => {
        const { deployer, ethBridge, bscBridge, ethBridgeLib, bscBridgeLib, bridgeFactory } = await snapshot();

        const newBridgeLibETH = await bridgeFactory.deploy();
        const newBridgeLibBSC = await bridgeFactory.deploy();

        const getImplementationBeforeETH = await ethBridge.implementation();
        const getImplementationBeforeBSC = await bscBridge.implementation();
        expect(getImplementationBeforeETH).to.equal(ethBridgeLib.address);
        expect(getImplementationBeforeBSC).to.equal(bscBridgeLib.address);
        
        await ethBridge.connect(deployer).upgrade(newBridgeLibETH.address);
        await bscBridge.connect(deployer).upgrade(newBridgeLibBSC.address);

        const getImplementationAfterETH = await ethBridge.implementation();
        const getImplementationAfterBSC = await bscBridge.implementation();
        expect(getImplementationAfterETH).to.equal(newBridgeLibETH.address);
        expect(getImplementationAfterBSC).to.equal(newBridgeLibBSC.address);
    });
    it("Change Router for token", async () => {
        const {
            deployer,
            ethBridge,
            bscBridge,
            router
        } = await snapshot();

        const tokenRouterSignatureETH = await getNewRouterSignature(router, "RADAR", ethers.constants.AddressZero, "ETH");
        const tokenRouterSignatureBSC = await getNewRouterSignature(router, "RADAR", ethers.constants.AddressZero, "BSC");

        await expect(ethBridge.connect(deployer).changeTokenRouter(ethers.utils.formatBytes32String("RADAR"), ethers.constants.AddressZero, tokenRouterSignatureBSC)).to.be.revertedWith(
            "Invalid Signature"
        );
        await expect(bscBridge.connect(deployer).changeTokenRouter(ethers.utils.formatBytes32String("RADAR"), ethers.constants.AddressZero, tokenRouterSignatureETH)).to.be.revertedWith(
            "Invalid Signature"
        );

        await ethBridge.connect(deployer).changeTokenRouter(ethers.utils.formatBytes32String("RADAR"), ethers.constants.AddressZero, tokenRouterSignatureETH);
        await bscBridge.connect(deployer).changeTokenRouter(ethers.utils.formatBytes32String("RADAR"), ethers.constants.AddressZero, tokenRouterSignatureBSC);

        await expect(ethBridge.connect(deployer).changeTokenRouter(ethers.utils.formatBytes32String("RADAR"), ethers.constants.AddressZero, tokenRouterSignatureETH)).to.be.revertedWith(
            "Invalid Signature"
        );
        await expect(bscBridge.connect(deployer).changeTokenRouter(ethers.utils.formatBytes32String("RADAR"), ethers.constants.AddressZero, tokenRouterSignatureBSC)).to.be.revertedWith(
            "Invalid Signature"
        );
    });

    it("Bridge Tokens (BSC -> ETH)", async () => {
        const {
            router,
            ethBridge,
            bscBridge,
            bscTokenHolder,
            ethTokenHolder,
            ethToken,
            bscToken
        } = await snapshot();

        // Bridge 100 tokens

        // mock 100 tokens bridged
        await ethToken.connect(ethTokenHolder).transfer(ethBridge.address, ethers.utils.parseEther('100'));
        // API TESTS or LOCAL SIG TEST

        // API TESTS

        // LOCAL SIG TEST
        const bridgeTx = await bscBridge.connect(bscTokenHolder).bridgeTokens(
            bscToken.address,
            ethers.utils.parseEther('100'),
            ethers.utils.formatBytes32String("ETH"),
            bscTokenHolder.address
        );
        const bridgeReceipt = await bridgeTx.wait();
        console.log(`With fee 0% (BSC -> ETH): contract ${bscBridge.address} and tx: ${bridgeReceipt.transactionHash}`);

        const lockedEvent = bridgeReceipt.events![bridgeReceipt.events!.length-1];
        const signature = await getBridgeSignature(
            router,
            "RADAR",
            lockedEvent.args![6],
            "BSC",
            "ETH",
            "dsacacscascad",
            lockedEvent.args![3],
            lockedEvent.args![4]
        );
        const signatureInvalid = await getBridgeSignature(
            bscTokenHolder,
            "RADAR",
            lockedEvent.args![6],
            "BSC",
            "ETH",
            "dsacacscascad",
            lockedEvent.args![3],
            lockedEvent.args![4]
        );

        const getEthBalanceAfterBridge = await bscToken.balanceOf(bscTokenHolder.address);
        expect(getEthBalanceAfterBridge).to.equal(0);
        const getEthBalanceOfBridgeAfterBridge = await bscToken.totalSupply();
        expect(getEthBalanceOfBridgeAfterBridge).to.equal(0);

        // Claim tokens ETH
        await expect(ethBridge.connect(bscTokenHolder).claimTokens(
            ethers.utils.formatBytes32String("RADAR"),
            ethers.utils.parseEther('100'),
            ethers.utils.formatBytes32String("BSC"),
            ethers.utils.formatBytes32String("ETH"),
            lockedEvent.args![4],
            ethers.utils.formatBytes32String("dsacacscascad"),
            bscTokenHolder.address,
            signatureInvalid)).to.be.revertedWith(
            "Router Signature Invalid"
        );
        await ethBridge.connect(bscTokenHolder).claimTokens(
            ethers.utils.formatBytes32String("RADAR"),
            ethers.utils.parseEther('100'),
            ethers.utils.formatBytes32String("BSC"),
            ethers.utils.formatBytes32String("ETH"),
            lockedEvent.args![4],
            ethers.utils.formatBytes32String("dsacacscascad"),
            bscTokenHolder.address,
            signature
        );
        const bscTokenBalanceAfterClaim = await ethToken.balanceOf(bscTokenHolder.address);
        expect(bscTokenBalanceAfterClaim).to.equal(ethers.utils.parseEther('100'));
        // Signature re-uses
        await expect(ethBridge.connect(bscTokenHolder).claimTokens(
            ethers.utils.formatBytes32String("RADAR"),
            ethers.utils.parseEther('100'),
            ethers.utils.formatBytes32String("BSC"),
            ethers.utils.formatBytes32String("ETH"),
            lockedEvent.args![4],
            ethers.utils.formatBytes32String("dsacacscascad"),
            bscTokenHolder.address,
            signatureInvalid)).to.be.revertedWith(
            "Double Spending"
        );

        // Wrong chain claim
        await expect(bscBridge.connect(bscTokenHolder).claimTokens(
            ethers.utils.formatBytes32String("RADAR"),
            ethers.utils.parseEther('100'),
            ethers.utils.formatBytes32String("BSC"),
            ethers.utils.formatBytes32String("ETH"),
            lockedEvent.args![4],
            ethers.utils.formatBytes32String("dsacacscascad"),
            bscTokenHolder.address,
            signatureInvalid)).to.be.revertedWith(
            "Claiming tokens on wrong chain"
        );
    });
    it("Bridge Tokens (ETH -> BSC)", async () => {
        const {
            router,
            ethBridge,
            bscBridge,
            ethTokenHolder,
            ethToken,
            bscToken
        } = await snapshot();

        // Bridge 100 tokens

        await ethToken.connect(ethTokenHolder).approve(ethBridge.address, ethers.utils.parseEther('100'));

        // API TESTS or LOCAL SIG TEST

        // API TESTS

        // LOCAL SIG TEST
        const bridgeTx = await ethBridge.connect(ethTokenHolder).bridgeTokens(
            ethToken.address,
            ethers.utils.parseEther('100'),
            ethers.utils.formatBytes32String("BSC"),
            ethTokenHolder.address
        );
        const bridgeReceipt = await bridgeTx.wait();
        console.log(`With fee 0% (ETH -> BSC): contract ${ethBridge.address} and tx: ${bridgeReceipt.transactionHash}`);

        const lockedEvent = bridgeReceipt.events![bridgeReceipt.events!.length-1];
        const signature = await getBridgeSignature(
            router,
            "RADAR",
            lockedEvent.args![6],
            "ETH",
            "BSC",
            "dsacacscascad",
            lockedEvent.args![3],
            lockedEvent.args![4]
        );
        const signatureInvalid = await getBridgeSignature(
            ethTokenHolder,
            "RADAR",
            lockedEvent.args![6],
            "ETH",
            "BSC",
            "dsacacscascad",
            lockedEvent.args![3],
            lockedEvent.args![4]
        );

        const getEthBalanceAfterBridge = await ethToken.balanceOf(ethTokenHolder.address);
        expect(getEthBalanceAfterBridge).to.equal(0);
        const getEthBalanceOfBridgeAfterBridge = await ethToken.balanceOf(ethBridge.address);
        expect(getEthBalanceOfBridgeAfterBridge).to.equal(ethers.utils.parseEther('100'));

        // Claim tokens BSC
        await expect(bscBridge.connect(ethTokenHolder).claimTokens(
            ethers.utils.formatBytes32String("RADAR"),
            ethers.utils.parseEther('100'),
            ethers.utils.formatBytes32String("ETH"),
            ethers.utils.formatBytes32String("BSC"),
            lockedEvent.args![4],
            ethers.utils.formatBytes32String("dsacacscascad"),
            ethTokenHolder.address,
            signatureInvalid)).to.be.revertedWith(
            "Router Signature Invalid"
        );
        await bscBridge.connect(ethTokenHolder).claimTokens(
            ethers.utils.formatBytes32String("RADAR"),
            ethers.utils.parseEther('100'),
            ethers.utils.formatBytes32String("ETH"),
            ethers.utils.formatBytes32String("BSC"),
            lockedEvent.args![4],
            ethers.utils.formatBytes32String("dsacacscascad"),
            ethTokenHolder.address,
            signature
        );
        const bscTokenBalanceAfterClaim = await bscToken.balanceOf(ethTokenHolder.address);
        expect(bscTokenBalanceAfterClaim).to.equal(ethers.utils.parseEther('100'));
        // Signature re-uses
        await expect(bscBridge.connect(ethTokenHolder).claimTokens(
            ethers.utils.formatBytes32String("RADAR"),
            ethers.utils.parseEther('100'),
            ethers.utils.formatBytes32String("ETH"),
            ethers.utils.formatBytes32String("BSC"),
            lockedEvent.args![4],
            ethers.utils.formatBytes32String("dsacacscascad"),
            ethTokenHolder.address,
            signatureInvalid)).to.be.revertedWith(
            "Double Spending"
        );

        // Wrong chain claim
        await expect(ethBridge.connect(ethTokenHolder).claimTokens(
            ethers.utils.formatBytes32String("RADAR"),
            ethers.utils.parseEther('100'),
            ethers.utils.formatBytes32String("ETH"),
            ethers.utils.formatBytes32String("BSC"),
            lockedEvent.args![4],
            ethers.utils.formatBytes32String("dsacacscascad"),
            ethTokenHolder.address,
            signatureInvalid)).to.be.revertedWith(
            "Claiming tokens on wrong chain"
        );
    });
    it("Bridge Fees with mock fee manager (ETH -> BSC)", async () => {
        const {
            router,
            ethBridge,
            bscBridge,
            ethTokenHolder,
            ethToken,
            bscToken,
            deployer
        } = await snapshot();

        // Deploy mock fee manager with 5% fee
        const feeManagerFactory = await ethers.getContractFactory("MockFeeManager");
        const feeManager = await feeManagerFactory.deploy();
        await ethBridge.connect(deployer).changeFeeManager(feeManager.address);
        await bscBridge.connect(deployer).changeFeeManager(feeManager.address);

        // Bridge 100 tokens

        await ethToken.connect(ethTokenHolder).approve(ethBridge.address, ethers.utils.parseEther('100'));

        // API TESTS or LOCAL SIG TEST

        // API TESTS

        // LOCAL SIG TEST
        const bridgeTx = await ethBridge.connect(ethTokenHolder).bridgeTokens(
            ethToken.address,
            ethers.utils.parseEther('100'),
            ethers.utils.formatBytes32String("BSC"),
            ethTokenHolder.address
        );
        const bridgeReceipt = await bridgeTx.wait();
        console.log(`With fee 5% (ETH -> BSC): contract ${ethBridge.address} and tx: ${bridgeReceipt.transactionHash}`);

        const lockedEvent = bridgeReceipt.events![bridgeReceipt.events!.length-1];
        const signature = await getBridgeSignature(
            router,
            "RADAR",
            lockedEvent.args![6],
            "ETH",
            "BSC",
            "dsacacscascad",
            lockedEvent.args![3],
            lockedEvent.args![4]
        );
        const signatureInvalid = await getBridgeSignature(
            ethTokenHolder,
            "RADAR",
            lockedEvent.args![6],
            "ETH",
            "BSC",
            "dsacacscascad",
            lockedEvent.args![3],
            lockedEvent.args![4]
        );

        const getEthBalanceAfterBridge = await ethToken.balanceOf(ethTokenHolder.address);
        expect(getEthBalanceAfterBridge).to.equal(0);
        const getEthBalanceOfBridgeAfterBridge = await ethToken.balanceOf(ethBridge.address);
        expect(getEthBalanceOfBridgeAfterBridge).to.equal(ethers.utils.parseEther('95'));
        const getFeeManagerBalance = await ethToken.balanceOf(feeManager.address);
        expect(getFeeManagerBalance).to.equal(ethers.utils.parseEther('5'));

        // Claim tokens BSC
        await expect(bscBridge.connect(ethTokenHolder).claimTokens(
            ethers.utils.formatBytes32String("RADAR"),
            lockedEvent.args![6],
            ethers.utils.formatBytes32String("ETH"),
            ethers.utils.formatBytes32String("BSC"),
            lockedEvent.args![4],
            ethers.utils.formatBytes32String("dsacacscascad"),
            ethTokenHolder.address,
            signatureInvalid)).to.be.revertedWith(
            "Router Signature Invalid"
        );
        await bscBridge.connect(ethTokenHolder).claimTokens(
            ethers.utils.formatBytes32String("RADAR"),
            lockedEvent.args![6],
            ethers.utils.formatBytes32String("ETH"),
            ethers.utils.formatBytes32String("BSC"),
            lockedEvent.args![4],
            ethers.utils.formatBytes32String("dsacacscascad"),
            ethTokenHolder.address,
            signature
        );
        const bscTokenBalanceAfterClaim = await bscToken.balanceOf(ethTokenHolder.address);
        expect(bscTokenBalanceAfterClaim).to.equal(ethers.utils.parseEther('95'));
    });
    it("Bridge Fees with mock fee manager (BSC -> ETH)", async () => {
        const {
            router,
            ethBridge,
            bscBridge,
            bscTokenHolder,
            ethTokenHolder,
            ethToken,
            bscToken,
            deployer
        } = await snapshot();

        // Deploy mock fee manager with 5% fee
        const feeManagerFactory = await ethers.getContractFactory("MockFeeManager");
        const feeManager = await feeManagerFactory.deploy();
        await ethBridge.connect(deployer).changeFeeManager(feeManager.address);
        await bscBridge.connect(deployer).changeFeeManager(feeManager.address);

        // Bridge 100 tokens

        // mock 100 tokens bridged
        await ethToken.connect(ethTokenHolder).transfer(ethBridge.address, ethers.utils.parseEther('100'));
        // API TESTS or LOCAL SIG TEST

        // API TESTS

        // LOCAL SIG TEST
        const bridgeTx = await bscBridge.connect(bscTokenHolder).bridgeTokens(
            bscToken.address,
            ethers.utils.parseEther('100'),
            ethers.utils.formatBytes32String("ETH"),
            bscTokenHolder.address
        );
        const bridgeReceipt = await bridgeTx.wait();
        console.log(`With fee 5% (BSC -> ETH): contract ${bscBridge.address} and tx: ${bridgeReceipt.transactionHash}`);

        const lockedEvent = bridgeReceipt.events![bridgeReceipt.events!.length-1];
        const signature = await getBridgeSignature(
            router,
            "RADAR",
            lockedEvent.args![6],
            "BSC",
            "ETH",
            "dsacacscascad",
            lockedEvent.args![3],
            lockedEvent.args![4]
        );
        const signatureInvalid = await getBridgeSignature(
            bscTokenHolder,
            "RADAR",
            lockedEvent.args![6],
            "BSC",
            "ETH",
            "dsacacscascad",
            lockedEvent.args![3],
            lockedEvent.args![4]
        );

        const getEthBalanceAfterBridge = await bscToken.balanceOf(bscTokenHolder.address);
        expect(getEthBalanceAfterBridge).to.equal(0);
        const getEthBalanceOfBridgeAfterBridge = await bscToken.totalSupply();
        expect(getEthBalanceOfBridgeAfterBridge).to.equal(ethers.utils.parseEther('5'));
        const feeManagerBalance = await bscToken.balanceOf(feeManager.address);
        expect(feeManagerBalance).to.equal(ethers.utils.parseEther('5'));

        // Claim tokens ETH
        await expect(ethBridge.connect(bscTokenHolder).claimTokens(
            ethers.utils.formatBytes32String("RADAR"),
            lockedEvent.args![6],
            ethers.utils.formatBytes32String("BSC"),
            ethers.utils.formatBytes32String("ETH"),
            lockedEvent.args![4],
            ethers.utils.formatBytes32String("dsacacscascad"),
            bscTokenHolder.address,
            signatureInvalid)).to.be.revertedWith(
            "Router Signature Invalid"
        );
        await ethBridge.connect(bscTokenHolder).claimTokens(
            ethers.utils.formatBytes32String("RADAR"),
            lockedEvent.args![6],
            ethers.utils.formatBytes32String("BSC"),
            ethers.utils.formatBytes32String("ETH"),
            lockedEvent.args![4],
            ethers.utils.formatBytes32String("dsacacscascad"),
            bscTokenHolder.address,
            signature
        );
        const bscTokenBalanceAfterClaim = await ethToken.balanceOf(bscTokenHolder.address);
        expect(bscTokenBalanceAfterClaim).to.equal(ethers.utils.parseEther('95'));
    });
    it("Remove Supported Token", async () => {
        const {
            ethBridge,
            router
        } = await snapshot();

        const tokenFactory = await ethers.getContractFactory("BridgedToken");
        const token = await tokenFactory.deploy(
            "TEST",
            "TEST",
            18,
            ethBridge.address,
            false
        );

        const getTokenId1 = await ethBridge.getTokenId(token.address)
        expect(getTokenId1).to.eq(ethers.utils.formatBytes32String(""));
        const getTokenById1 = await ethBridge.getTokenById(ethers.utils.formatBytes32String("TEST"));
        expect(getTokenById1).to.eq(ethers.constants.AddressZero);
        const getIsSupportedToken1 = await ethBridge.getIsSupportedToken(token.address);
        expect(getIsSupportedToken1).to.eq(false);
        const getSupportedTokensLenght1 = await ethBridge.getSupportedTokensLength();
        expect(getSupportedTokensLenght1).to.eq(1);

        await expect(ethBridge.removeSupportedToken(token.address)).to.be.revertedWith(
            "Token is not supported"
        );

        await ethBridge.addSupportedToken(
            token.address,
            true,
            ethers.utils.formatBytes32String("TEST"),
            router.address
        );

        const getTokenId2 = await ethBridge.getTokenId(token.address)
        expect(getTokenId2).to.eq(ethers.utils.formatBytes32String("TEST"));
        const getTokenById2 = await ethBridge.getTokenById(ethers.utils.formatBytes32String("TEST"));
        expect(getTokenById2).to.eq(token.address);
        const getIsSupportedToken2 = await ethBridge.getIsSupportedToken(token.address);
        expect(getIsSupportedToken2).to.eq(true);
        const getSupportedTokensLenght2 = await ethBridge.getSupportedTokensLength();
        expect(getSupportedTokensLenght2).to.eq(2);
        const getSupportedToken2 = await ethBridge.getSupportedTokenByIndex(1);
        expect(getSupportedToken2).to.eq(token.address);

        await ethBridge.removeSupportedToken(token.address);

        const getTokenId3 = await ethBridge.getTokenId(token.address)
        expect(getTokenId3).to.eq(ethers.utils.formatBytes32String(""));
        const getTokenById3 = await ethBridge.getTokenById(ethers.utils.formatBytes32String("TEST"));
        expect(getTokenById3).to.eq(ethers.constants.AddressZero);
        const getIsSupportedToken3 = await ethBridge.getIsSupportedToken(token.address);
        expect(getIsSupportedToken3).to.eq(false);
        const getSupportedTokensLenght3 = await ethBridge.getSupportedTokensLength();
        expect(getSupportedTokensLenght3).to.eq(1);
    });
    it("Bridge Tokens Corrupt Fee Manager", async () => {
        const {
            router,
            ethBridge,
            bscBridge,
            ethTokenHolder,
            ethToken,
            bscToken
        } = await snapshot();

        await ethBridge.changeFeeManager(bscBridge.address); // Corrupt fee manager

        // Bridge 100 tokens

        await ethToken.connect(ethTokenHolder).approve(ethBridge.address, ethers.utils.parseEther('100'));

        // API TESTS or LOCAL SIG TEST

        // API TESTS

        // LOCAL SIG TEST
        const bridgeTx = await ethBridge.connect(ethTokenHolder).bridgeTokens(
            ethToken.address,
            ethers.utils.parseEther('100'),
            ethers.utils.formatBytes32String("BSC"),
            ethTokenHolder.address
        );
        const bridgeReceipt = await bridgeTx.wait();
        console.log(`With fee 0% (ETH -> BSC): contract ${ethBridge.address} and tx: ${bridgeReceipt.transactionHash}`);

        const lockedEvent = bridgeReceipt.events![bridgeReceipt.events!.length-1];
        const signature = await getBridgeSignature(
            router,
            "RADAR",
            lockedEvent.args![6],
            "ETH",
            "BSC",
            "dsacacscascad",
            lockedEvent.args![3],
            lockedEvent.args![4]
        );
        const signatureInvalid = await getBridgeSignature(
            ethTokenHolder,
            "RADAR",
            lockedEvent.args![6],
            "ETH",
            "BSC",
            "dsacacscascad",
            lockedEvent.args![3],
            lockedEvent.args![4]
        );

        const getEthBalanceAfterBridge = await ethToken.balanceOf(ethTokenHolder.address);
        expect(getEthBalanceAfterBridge).to.equal(0);
        const getEthBalanceOfBridgeAfterBridge = await ethToken.balanceOf(ethBridge.address);
        expect(getEthBalanceOfBridgeAfterBridge).to.equal(ethers.utils.parseEther('100'));

        // Claim tokens BSC
        await expect(bscBridge.connect(ethTokenHolder).claimTokens(
            ethers.utils.formatBytes32String("RADAR"),
            ethers.utils.parseEther('100'),
            ethers.utils.formatBytes32String("ETH"),
            ethers.utils.formatBytes32String("BSC"),
            lockedEvent.args![4],
            ethers.utils.formatBytes32String("dsacacscascad"),
            ethTokenHolder.address,
            signatureInvalid)).to.be.revertedWith(
            "Router Signature Invalid"
        );
        await bscBridge.connect(ethTokenHolder).claimTokens(
            ethers.utils.formatBytes32String("RADAR"),
            ethers.utils.parseEther('100'),
            ethers.utils.formatBytes32String("ETH"),
            ethers.utils.formatBytes32String("BSC"),
            lockedEvent.args![4],
            ethers.utils.formatBytes32String("dsacacscascad"),
            ethTokenHolder.address,
            signature
        );
        const bscTokenBalanceAfterClaim = await bscToken.balanceOf(ethTokenHolder.address);
        expect(bscTokenBalanceAfterClaim).to.equal(ethers.utils.parseEther('100'));
        // Signature re-uses
        await expect(bscBridge.connect(ethTokenHolder).claimTokens(
            ethers.utils.formatBytes32String("RADAR"),
            ethers.utils.parseEther('100'),
            ethers.utils.formatBytes32String("ETH"),
            ethers.utils.formatBytes32String("BSC"),
            lockedEvent.args![4],
            ethers.utils.formatBytes32String("dsacacscascad"),
            ethTokenHolder.address,
            signatureInvalid)).to.be.revertedWith(
            "Double Spending"
        );

        // Wrong chain claim
        await expect(ethBridge.connect(ethTokenHolder).claimTokens(
            ethers.utils.formatBytes32String("RADAR"),
            ethers.utils.parseEther('100'),
            ethers.utils.formatBytes32String("ETH"),
            ethers.utils.formatBytes32String("BSC"),
            lockedEvent.args![4],
            ethers.utils.formatBytes32String("dsacacscascad"),
            ethTokenHolder.address,
            signatureInvalid)).to.be.revertedWith(
            "Claiming tokens on wrong chain"
        );
    });
    it("Token Ownership Transfer", async () => {
        const {
            ethBridge,
            deployer
        } = await snapshot();
        
        const ownedTokenFactory = await ethers.getContractFactory("MockOwnedToken");
        const ownedToken = await ownedTokenFactory.deploy();

        const getOwner1 = await ownedToken.owner();
        expect(getOwner1).to.eq(deployer.address);

        await ownedToken.transferOwnership(ethBridge.address);
        await ethBridge.claimTokenOwnership(ownedToken.address);

        const getOwner2 = await ownedToken.owner();
        expect(getOwner2).to.eq(ethBridge.address);

        await ethBridge.passTokenOwnership(ownedToken.address, deployer.address);

        const getPOwner = await ownedToken.pendingOwner();
        expect(getPOwner).to.eq(deployer.address);

        await ownedToken.connect(deployer).claimOwnership();

        const getOwner3 = await ownedToken.owner();
        expect(getOwner3).to.eq(deployer.address);
    });
});