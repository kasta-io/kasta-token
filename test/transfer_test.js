const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const { expectRevert} = require('@openzeppelin/test-helpers');

const KastaToken = artifacts.require("KastaToken");
const KastaTokenV1 = artifacts.require("KastaTokenV1");

const AVAILABLE_BALANCE = 5;

contract('KastaToken transfer', function (accounts) {
  beforeEach(async function () {
    // Deploy a new KastaToken contract for each test
    this.kastaTokenPrevious = await deployProxy(KastaToken, [accounts[1]]);
    this.kastaToken = await upgradeProxy(this.kastaTokenPrevious.address, KastaTokenV1);
    this.decimalsMultiplier = 10 ** (await this.kastaToken.decimals());
    const transferAmount = BigInt(this.decimalsMultiplier * AVAILABLE_BALANCE).toString();
    await this.kastaToken.transfer(accounts[2], transferAmount, { from: accounts[1] });
  });
 
  it('cannot transfer tokens while contract is paused', async function () {
    await this.kastaToken.pause({ from: accounts[1] });
    await expectRevert(this.kastaToken.transfer(accounts[3], 1, { from: accounts[2] }),
      'ERC20Pausable: token transfer while paused -- Reason given: ERC20Pausable: token transfer while paused');
  });

  it('can transfer tokens while contract is unpaused', async function () {
    await this.kastaToken.pause({ from: accounts[1] });
    await expectRevert(this.kastaToken.transfer(accounts[3], 1, { from: accounts[2] }),
      'ERC20Pausable: token transfer while paused -- Reason given: ERC20Pausable: token transfer while paused');
    await this.kastaToken.unpause({ from: accounts[1] });
    await this.kastaToken.transfer(accounts[3], 1, { from: accounts[2] });
  });
});
