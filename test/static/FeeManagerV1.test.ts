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
    const [deployer, otherAddress1, otherAddress2] = await ethers.getSigners();
    

    // CUSTOM
    const factory = await ethers.getContractFactory("FeeManagerV1");
    const feeManager = await factory.deploy(
        10000, // 1%
        [],
        []
    );

    const tokenFactory = await ethers.getContractFactory("BridgedToken");
    const mockToken = await tokenFactory.deploy("Radar ETH", "RADARETH", 18, otherAddress2.address, true);

    await mockToken.mint(deployer.address, ethers.utils.parseEther('1000'));


    return {
        deployer,
        otherAddress1,
        otherAddress2,
        feeManager,
        mockToken,
        tokenFactory
    }
}

describe('FeeManagerV1', () => {
    it('State Getters', async () => {
        const { feeManager, deployer } = await snapshot();

        const getFixedPercRate = await feeManager.getFixedPercRate();
        expect(getFixedPercRate).to.eq(10000);

        const getMaxFeeForToken = await feeManager.getMaxFeeForToken(ethers.constants.AddressZero);
        expect(getMaxFeeForToken).to.eq(0);

        const getOwner = await feeManager.getOwner();
        expect(getOwner).to.eq(deployer.address);
    });

    it('Access Control', async () => {
        const { feeManager, otherAddress1 } = await snapshot();

        await expect(feeManager.connect(otherAddress1).passOwnership(ethers.constants.AddressZero)).to.be.revertedWith(
            "Unauthorized"
        );

        await expect(feeManager.connect(otherAddress1).changePercentageFee(0)).to.be.revertedWith(
            "Unauthorized"
        );

        await expect(feeManager.connect(otherAddress1).changeTokenMaxFee(ethers.constants.AddressZero, 0)).to.be.revertedWith(
            "Unauthorized"
        );

        await expect(feeManager.connect(otherAddress1).withdrawTokens(ethers.constants.AddressZero, 0, ethers.constants.AddressZero)).to.be.revertedWith(
            "Unauthorized"
        );
    });
    it('Pass Ownership', async () => {
        const { deployer, otherAddress1, feeManager } = await snapshot();

        const getOwner1 = await feeManager.getOwner();
        expect(getOwner1).to.eq(deployer.address);

        await feeManager.connect(deployer).passOwnership(otherAddress1.address);

        const getOwner2 = await feeManager.getOwner();
        expect(getOwner2).to.eq(otherAddress1.address);

        await expect(feeManager.connect(deployer).passOwnership(ethers.constants.AddressZero)).to.be.revertedWith(
            "Unauthorized"
        );

        await feeManager.connect(otherAddress1).passOwnership(deployer.address);
    });
    it('Change Percentage Fee', async () => {
        const { feeManager } = await snapshot();

        await feeManager.changePercentageFee(100000);

        const getFee = await feeManager.getFixedPercRate();
        expect(getFee).to.eq(100000);

        await expect(feeManager.changePercentageFee(1500000)).to.be.revertedWith(
            "Fee too big"
        );
    });
    it('Change maxToken fee', async () => {
        const { feeManager } = await snapshot();

        const mockRadarAddress = "0xf03a2dc374d494fbe894563fe22ee544d826aa50";

        await feeManager.changeTokenMaxFee(mockRadarAddress, ethers.utils.parseEther('50')); // Max 50 RADAR

        const getMaxTokenFee = await feeManager.getMaxFeeForToken(mockRadarAddress);
        expect(getMaxTokenFee).to.eq(ethers.utils.parseEther('50'));
    });
    it('Withdraw tokens', async () => {
        const { feeManager, otherAddress1, mockToken } = await snapshot();

        await mockToken.transfer(feeManager.address, ethers.utils.parseEther('500'));

        const oaBal1 = await mockToken.balanceOf(otherAddress1.address);
        expect(oaBal1).to.eq(0);
        const fmBal1 = await mockToken.balanceOf(feeManager.address);
        expect(fmBal1).to.eq(ethers.utils.parseEther('500'));

        await feeManager.withdrawTokens(mockToken.address, ethers.utils.parseEther('100'), otherAddress1.address);

        const oaBal2 = await mockToken.balanceOf(otherAddress1.address);
        expect(oaBal2).to.eq(ethers.utils.parseEther('100'));
        const fmBal2 = await mockToken.balanceOf(feeManager.address);
        expect(fmBal2).to.eq(ethers.utils.parseEther('400'));

        await feeManager.withdrawTokens(mockToken.address, ethers.utils.parseEther('1000000'), otherAddress1.address);

        const oaBal3 = await mockToken.balanceOf(otherAddress1.address);
        expect(oaBal3).to.eq(ethers.utils.parseEther('500'));
        const fmBal3 = await mockToken.balanceOf(feeManager.address);
        expect(fmBal3).to.eq(0);
    });
    it('Get Fee', async () => {
        const { feeManager, mockToken, otherAddress1 } = await snapshot();

        // Without token registered
        const noRegisterFee = await feeManager.getBridgeFee(
            mockToken.address,
            ethers.constants.AddressZero,
            ethers.utils.parseEther('100'),
            "0x4253430000000000000000000000000000000000000000000000000000000000",
            ethers.constants.AddressZero
        );
        expect(noRegisterFee).to.eq(0);


        // Max Fee set, but get 1%
        await feeManager.changePercentageFee(10000);
        await feeManager.changeTokenMaxFee(mockToken.address, ethers.utils.parseEther('50'));

        const getPercFee = await feeManager.getBridgeFee(
            mockToken.address,
            ethers.constants.AddressZero,
            ethers.utils.parseEther('100'),
            "0x4253430000000000000000000000000000000000000000000000000000000000",
            ethers.constants.AddressZero
        );
        expect(getPercFee).to.eq(10000); // Should be 1%

        // Max Fee
        const getMaxFee = await feeManager.getBridgeFee(
            mockToken.address,
            ethers.constants.AddressZero,
            ethers.utils.parseEther('100000'),
            "0x4253430000000000000000000000000000000000000000000000000000000000",
            ethers.constants.AddressZero
        );
        expect(getMaxFee).to.eq(500); // should be 0.05%
    });
    it('Get Fee Base', async () => {
        const { feeManager } = await snapshot();

        // Should always be the constant (1 000 000)
        const getFeeBase = await feeManager.getFeeBase();
        expect(getFeeBase).to.eq(1000000);
    });
    it('Bridge with fee (max and fixed)', async () => {
        const { feeManager, tokenFactory, otherAddress1, otherAddress2, deployer } = await snapshot();

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

        const ethToken = await tokenFactory.deploy("Radar ETH", "RADARETH", 18, otherAddress2.address, true);
        const bscToken = await tokenFactory.deploy("Radar BSC", "RADARBSC", 18, bscBridge.address, true);

        await ethToken.connect(deployer).mint(otherAddress2.address, ethers.utils.parseEther('100'));
        await bscToken.connect(deployer).mint(otherAddress2.address, ethers.utils.parseEther('100000'));

        await ethBridge.connect(deployer).addSupportedToken(
            ethToken.address,
            false,
            ethers.utils.formatBytes32String("RADAR"),
            otherAddress1.address
        );
        await ethToken.connect(deployer).mint(ethBridge.address, ethers.utils.parseEther('10000000'));
        await bscBridge.attach(bscBridge.address).connect(deployer).addSupportedToken(
            bscToken.address,
            true,
            ethers.utils.formatBytes32String("RADAR"),
            otherAddress1.address
        );

        await ethBridge.changeFeeManager(feeManager.address);
        await bscBridge.changeFeeManager(feeManager.address);

        await feeManager.changeTokenMaxFee(ethToken.address, ethers.utils.parseEther('50'));
        await feeManager.changeTokenMaxFee(bscToken.address, ethers.utils.parseEther('50'));

        const initialEthBal = await ethToken.balanceOf(feeManager.address);
        expect(initialEthBal).to.eq(0);

        await ethToken.connect(otherAddress2).approve(ethBridge.address, ethers.utils.parseEther('100'));
        const bridgeTx = await ethBridge.connect(otherAddress2).bridgeTokens(
            ethToken.address,
            ethers.utils.parseEther('100'),
            ethers.utils.formatBytes32String('BSC'),
            otherAddress2.address
        );
        const bridgeReceipt = await bridgeTx.wait();
        const lockedEvent = bridgeReceipt.events![bridgeReceipt.events!.length-1];
        const signature = await getBridgeSignature(
            otherAddress1,
            "RADAR",
            lockedEvent.args![6],
            "ETH",
            "BSC",
            "dsacacscascad",
            lockedEvent.args![3],
            lockedEvent.args![4]
        );

        const afterEthBal = await ethToken.balanceOf(feeManager.address);
        expect(afterEthBal).to.eq(ethers.utils.parseEther('1'));
        const afterUserEthBal = await ethToken.balanceOf(otherAddress2.address);
        expect(afterUserEthBal).to.eq(0);

        await bscBridge.connect(otherAddress2).claimTokens(
            ethers.utils.formatBytes32String("RADAR"),
            lockedEvent.args![6],
            ethers.utils.formatBytes32String("ETH"),
            ethers.utils.formatBytes32String("BSC"),
            lockedEvent.args![4],
            ethers.utils.formatBytes32String("dsacacscascad"),
            otherAddress2.address,
            signature
        );

        const afterUserBscBal = await bscToken.balanceOf(otherAddress2.address);
        expect(afterUserBscBal).to.eq(ethers.utils.parseEther('100099'));

        const bridgeTx2 = await bscBridge.connect(otherAddress2).bridgeTokens(
            bscToken.address,
            ethers.utils.parseEther('100099'),
            ethers.utils.formatBytes32String("ETH"),
            otherAddress2.address
        );

        const bridgeReceipt2 = await bridgeTx2.wait();
        const lockedEvent2 = bridgeReceipt2.events![bridgeReceipt2.events!.length-1];
        const signature2 = await getBridgeSignature(
            otherAddress1,
            "RADAR",
            lockedEvent2.args![6],
            "BSC",
            "ETH",
            "dsacacscascadd",
            lockedEvent2.args![3],
            lockedEvent2.args![4]
        );

        const afterBscBal = await bscToken.balanceOf(otherAddress2.address);
        expect(afterBscBal).to.eq(0);

        var afterBscFeeManagerBal = await bscToken.balanceOf(feeManager.address);
        afterBscFeeManagerBal = afterBscFeeManagerBal.div(ethers.BigNumber.from((10**16).toString()));
        expect(afterBscFeeManagerBal).to.be.closeTo(ethers.BigNumber.from('5000'), 10);

        await ethBridge.connect(otherAddress2).claimTokens(
            ethers.utils.formatBytes32String("RADAR"),
            lockedEvent2.args![6],
            ethers.utils.formatBytes32String("BSC"),
            ethers.utils.formatBytes32String("ETH"),
            lockedEvent2.args![4],
            ethers.utils.formatBytes32String("dsacacscascadd"),
            otherAddress2.address,
            signature2
        );

        var finalBscTokenBal = await ethToken.balanceOf(otherAddress2.address);
        finalBscTokenBal = finalBscTokenBal.div(ethers.BigNumber.from((10**16).toString()));
        expect(finalBscTokenBal).to.be.closeTo(ethers.BigNumber.from('10004900'), 10);
    });
    it("Initialize with tokens", async () => {
        const {
            otherAddress1
        } = await snapshot();

        const fmFactory = await ethers.getContractFactory("FeeManagerV1");
        const fm = await fmFactory.deploy(
            100,
            [otherAddress1.address],
            [ethers.utils.parseEther('2500')]
        );

        const getMaxFee = await fm.getMaxFeeForToken(otherAddress1.address);
        expect(getMaxFee).to.eq(ethers.utils.parseEther('2500'));
    });
});