import { expect } from "chai";
import { ethers } from "ethers";
import { RadarBridge__factory, BridgedToken__factory, RadarBridgeProxy__factory } from "../../typechain";

const generateBridgeSignature = async (
    signer: ethers.Wallet,
    signData: string
): Promise<string> => {
    const messageBytes = ethers.utils.arrayify(ethers.utils.keccak256(signData));
    const signature = await signer.signMessage(messageBytes);
    return signature;
}

const getNewRouterSignature = async (
    signer: ethers.Wallet,
    _tokenId: string,
    _newRouter: string,
    _chain: string
): Promise<string> => {
    const abiCoder = new ethers.utils.AbiCoder();
    const signData = abiCoder.encode(["bytes32", "bytes32", "address", "bytes32"], [
        ethers.utils.formatBytes32String("PASS OWNERSHIP"),
        ethers.utils.formatBytes32String(_tokenId),
        _newRouter,
        ethers.utils.formatBytes32String(_chain)
    ]);
    const sig = await generateBridgeSignature(signer, signData);

    return sig;
}

const snapshot = async () => {
    const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
    const deployer = ethers.Wallet.fromMnemonic(
        "test test test test test test test test test test test junk",
        `m/44'/60'/0'/0/0`
    ).connect(provider);
    const ethTokenHolder = ethers.Wallet.fromMnemonic(
        "test test test test test test test test test test test junk",
        `m/44'/60'/0'/0/1`
    ).connect(provider);
    const bscTokenHolder = ethers.Wallet.fromMnemonic(
        "test test test test test test test test test test test junk",
        `m/44'/60'/0'/0/2`
    ).connect(provider);
    const router = ethers.Wallet.fromMnemonic(
        "test test test test test test test test test test test junk",
        `m/44'/60'/0'/0/3`
    ).connect(provider);
    const randomAddress = ethers.Wallet.fromMnemonic(
        "test test test test test test test test test test test junk",
        `m/44'/60'/0'/0/4`
    ).connect(provider);

    const bridgeFactory = new RadarBridge__factory(deployer);
    const bridgeProxyFactory = new RadarBridgeProxy__factory(deployer);

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

    const tokenFactory = new BridgedToken__factory(deployer);
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

    });
    it("Bridge Tokens (ETH -> BSC)", async () => {});
    it("Bridge Tokens (BSC -> ETH)", async () => {});
    it("Pass Ownership", async () => {});
    it("Add and remove supported assets + bridge", async () => {});
    it("Upgrade Bridge Proxy", async () => {});
    it("Bridge Fees with mock fee manager", async () => {});
    it("Change Router for token", async () => {});
});