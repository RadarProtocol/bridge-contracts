import { expect } from "chai";
import exp from "constants";
import { ethers, ContractFactory } from "ethers";
import { BridgedToken__factory } from "../../typechain";

const snapshot = async (migratorToken: boolean) => {
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
    const factory = new BridgedToken__factory(deployer);
    const bridgedToken = await factory.deploy(
        "Radar",
        "RADAR",
        18,
        otherAddress1.address,
        migratorToken
    );

    return {
        deployer,
        otherAddress1,
        otherAddress2,
        bridgedToken
    }
}

describe('BridgedToken Static Tests', () => {
    it("Access Control", async () => {
        const { deployer, otherAddress1, otherAddress2, bridgedToken } = await snapshot(true);

        // Mint AC
        await expect(bridgedToken.connect(otherAddress2).mint(otherAddress1.address, 1000)).to.be.revertedWith(
            "Unauthorized"
        );
        await bridgedToken.connect(otherAddress1).mint(deployer.address, 1);
        await bridgedToken.connect(deployer).mint(deployer.address, 1); // Migrator
        const balanceCall = await bridgedToken.balanceOf(deployer.address);
        expect(balanceCall).to.equal(2);

        // Burn AC
        await expect(bridgedToken.connect(otherAddress2).burn(otherAddress1.address, 1000)).to.be.revertedWith(
            "Unauthorized"
        );
        await bridgedToken.connect(otherAddress1).burn(deployer.address, 1);
        await bridgedToken.connect(deployer).burn(deployer.address, 1); // Migrator
        const balanceCall2 = await bridgedToken.balanceOf(deployer.address);
        expect(balanceCall2).to.equal(0);

        // Migration AC
        await expect(bridgedToken.connect(otherAddress2).passMigratorAuthority(otherAddress1.address)).to.be.revertedWith(
            "Unauthorized"
        );
        await expect(bridgedToken.connect(otherAddress2).acceptMigratorAuthority()).to.be.revertedWith(
            "Unauthorized"
        );
        await bridgedToken.connect(deployer).passMigratorAuthority(otherAddress2.address);
        await bridgedToken.connect(otherAddress2).acceptMigratorAuthority();
    });

    it("State Getters", async () => {
        const { deployer, otherAddress1, otherAddress2, bridgedToken } = await snapshot(true);

        const getBridgeCall = await bridgedToken.getBridge();
        expect(getBridgeCall).to.equal(otherAddress1.address);

        const getMigratorCall = await bridgedToken.getMigrator();
        expect(getMigratorCall).to.equal(deployer.address);
    });

    it("Passing Migration Authority", async () => {
        const { deployer, otherAddress1, otherAddress2, bridgedToken } = await snapshot(true);

        await expect(bridgedToken.connect(otherAddress2).mint(deployer.address, 1)).to.be.revertedWith(
            "Unauthorized"
        );
        await bridgedToken.connect(deployer).mint(deployer.address, 1);
        
        await bridgedToken.connect(deployer).passMigratorAuthority(otherAddress2.address);
        await bridgedToken.connect(otherAddress2).acceptMigratorAuthority();

        await bridgedToken.connect(otherAddress2).mint(deployer.address, 1);
        await expect(bridgedToken.connect(deployer).mint(deployer.address, 1)).to.be.revertedWith(
            "Unauthorized"
        );
    });
});