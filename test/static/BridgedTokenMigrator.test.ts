import { expect } from "chai";
import { ethers } from "ethers";
import { BridgedTokenMigrator__factory, BridgedToken__factory } from "../../typechain";

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
    const factoryToken = new BridgedToken__factory(deployer);
    const bridgedToken = await factoryToken.deploy(
        "Radar",
        "RADAR",
        18,
        otherAddress1.address,
        true
    );
    const oldToken = await factoryToken.deploy(
        "RadarOld",
        "RADAROLD",
        18,
        deployer.address,
        false
    );
    await oldToken.connect(deployer).mint(otherAddress1.address, 100);
    await oldToken.connect(deployer).mint(otherAddress2.address, 50);
    const factory = new BridgedTokenMigrator__factory(deployer);
    const bridgedTokenMigrator = await factory.deploy(
        oldToken.address,
        bridgedToken.address
    );

    // Pass authority
    await bridgedToken.connect(deployer).passMigratorAuthority(bridgedTokenMigrator.address);
    await bridgedTokenMigrator.connect(deployer).acceptMigratorAuthority();

    return {
        deployer,
        otherAddress1,
        otherAddress2,
        bridgedTokenMigrator,
        bridgedToken,
        oldToken
    }
}

describe('BridgedTokenMigrator Static Tests', () => {
    it("State Getters", async () => {
        const { bridgedTokenMigrator, oldToken, bridgedToken } = await snapshot();

        const getOldTokenCall = await bridgedTokenMigrator.getOldToken();
        expect(getOldTokenCall).to.equal(oldToken.address);

        const getNewTokenCall = await bridgedTokenMigrator.getNewToken();
        expect(getNewTokenCall).to.equal(bridgedToken.address);

        const tokensNotMigratedCall = await bridgedTokenMigrator.tokensNotMigrated();
        expect(tokensNotMigratedCall).to.equal(150);

        const migrationFinishedCall = await bridgedTokenMigrator.migrationFinished();
        expect(migrationFinishedCall).to.equal(false);
    });
    it("Migrates Tokens and extra over-mint protection", async () => {
        const {
            bridgedTokenMigrator,
            oldToken,
            bridgedToken,
            otherAddress1,
            otherAddress2
        } = await snapshot();

        // Migrate Tokens from address1
        const burnAddressBalanceBefore = await oldToken.balanceOf(bridgedTokenMigrator.address);
        expect(burnAddressBalanceBefore).to.equal(0);
        const otherAddress1NewTokenBalanceBefore = await bridgedToken.balanceOf(otherAddress1.address);
        expect(otherAddress1NewTokenBalanceBefore).to.equal(0);

        await oldToken.connect(otherAddress1).approve(bridgedTokenMigrator.address, "0xfffffffffffffffffffffffffff");
        const migrateTx1 = await bridgedTokenMigrator.connect(otherAddress1).migrateTokens();

        const otherAddress1NewTokenBalanceAfter = await bridgedToken.balanceOf(otherAddress1.address);
        expect(otherAddress1NewTokenBalanceAfter).to.equal(100);
        const burnAddressBalanceAfter = await oldToken.balanceOf(bridgedTokenMigrator.address);
        expect(burnAddressBalanceAfter).to.equal(100);

        // Check leftToMigrate decreased
        const leftToMigrateCall1 = await bridgedTokenMigrator.tokensNotMigrated();
        expect(leftToMigrateCall1).to.equal(50);
        // Check migrationFinished() false
        const migrationFinishedCall1 = await bridgedTokenMigrator.migrationFinished();
        expect(migrationFinishedCall1).to.equal(false);

        // Migrate Tokens from address2
        const otherAddress2NewTokenBalanceBefore = await bridgedToken.balanceOf(otherAddress2.address);
        expect(otherAddress2NewTokenBalanceBefore).to.equal(0);

        await oldToken.connect(otherAddress2).approve(bridgedTokenMigrator.address, "0xfffffffffffffffffffffffffff");
        const migrateTx2 = await bridgedTokenMigrator.connect(otherAddress2).migrateTokens();

        const otherAddress2NewTokenBalanceAfter = await bridgedToken.balanceOf(otherAddress2.address);
        expect(otherAddress2NewTokenBalanceAfter).to.equal(50);
        const burnAddressBalanceAfter2 = await oldToken.balanceOf(bridgedTokenMigrator.address);
        expect(burnAddressBalanceAfter2).to.equal(150);
        
        // Check leftToMigrate decreased
        const leftToMigrateCall2 = await bridgedTokenMigrator.tokensNotMigrated();
        expect(leftToMigrateCall2).to.equal(0);
        // Check migrationFinished() false
        const migrationFinishedCall2 = await bridgedTokenMigrator.migrationFinished();
        expect(migrationFinishedCall2).to.equal(true);
    });
});