import { expect } from "chai";
import { ethers } from "ethers";
import { FeeManagerV1__factory, BridgedToken__factory } from "../../typechain";

const snapshot = async () => {
    const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
    const deployer = ethers.Wallet.fromMnemonic(
        "test test test test test test test test test test test junk",
        `m/44'/60'/0'/0/0`
    ).connect(provider);
    const otherAddress1 = ethers.Wallet.fromMnemonic(
        "test test test test test test test test test test test junk",
        `m/44'/60'/0'/0/1`
    ).connect(provider);
    const otherAddress2 = ethers.Wallet.fromMnemonic(
        "test test test test test test test test test test test junk",
        `m/44'/60'/0'/0/2`
    ).connect(provider);
    

    // CUSTOM
    const factory = new FeeManagerV1__factory(deployer)
    const feeManager = await factory.deploy(
        100, // 1%
        [],
        []
    );

    const tokenFactory = new BridgedToken__factory(deployer);
    const mockToken = await tokenFactory.deploy("Radar ETH", "RADARETH", 18, otherAddress2.address, true);

    await mockToken.mint(deployer.address, ethers.utils.parseEther('1000'));


    return {
        deployer,
        otherAddress1,
        otherAddress2,
        feeManager,
        mockToken
    }
}

describe('FeeManagerV1', () => {
    it('State Getters', async () => {
        const { feeManager, deployer } = await snapshot();

        const getFixedPercRate = await feeManager.getFixedPercRate();
        expect(getFixedPercRate).to.eq(100);

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

        await feeManager.changePercentageFee(1000);

        const getFee = await feeManager.getFixedPercRate();
        expect(getFee).to.eq(1000);

        await expect(feeManager.changePercentageFee(1000000)).to.be.revertedWith(
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
    it.skip('Get Fee', async () => {});
    it.skip('Get Fee Base', async () => {});
    it.skip('Bridge with fee (max and fixed)', async () => {});
});