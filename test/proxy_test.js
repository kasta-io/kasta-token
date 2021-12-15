const { expect } = require('chai');
const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
 
const KastaToken = artifacts.require("KastaToken");
const KastaTokenV1 = artifacts.require("KastaTokenV1");
const KastaTokenV2 = artifacts.require("KastaTokenV1");

const gnosisSafe = process.env.GNOSIS_SAFE;
const totalSupply = 1500000000;

const AVAILABLE_BALANCE = 5;

contract('KastaToken (proxy)', function () {
  beforeEach(async function () {
    // Deploy a new KastaToken contract for each test
    this.kastaTokenPrevious = await deployProxy(KastaToken, [gnosisSafe]);
    this.kastaToken = await upgradeProxy(this.kastaTokenPrevious.address, KastaTokenV1);

    this.decimalsMultiplier = 10 ** (await this.kastaToken.decimals());
  });
 
  it('returns a value previously initialized', async function () {
    const expectedTotalSupply = (BigInt(this.decimalsMultiplier) * BigInt(totalSupply)).toString();
    const contractTotalSupply = (await this.kastaToken.totalSupply()).toString();
    expect(expectedTotalSupply).to.equal(contractTotalSupply);
  });

});

contract('KastaToken upgradeability', function (accounts) { 
  beforeEach(async function () {
    this.kastaTokenPrevious = await deployProxy(KastaToken, [accounts[1]]);
    this.kastaToken = await upgradeProxy(this.kastaTokenPrevious.address, KastaTokenV1);
    this.decimalsMultiplier = 10 ** (await this.kastaToken.decimals());
    const transferAmount = BigInt(this.decimalsMultiplier * AVAILABLE_BALANCE).toString();
    await this.kastaToken.transfer(accounts[2], transferAmount, { from: accounts[1] });

    this.stakeAmount = BigInt(this.decimalsMultiplier * AVAILABLE_BALANCE).toString();
    await this.kastaToken.stake(this.stakeAmount, { from: accounts[2] });

    this.kastaTokenNew = await upgradeProxy(this.kastaToken.address, KastaTokenV2);
  });

  it('balances remains after contract upgrade', async function () {
    const contractBalance = (await this.kastaTokenNew.balanceOf(this.kastaTokenNew.address)).toString();
    expect(contractBalance).to.equal(this.stakeAmount);
    const accountBalance = (await this.kastaTokenNew.balanceOf(accounts[2])).toString();
    expect(accountBalance).to.equal('0');
  });

  it('user can unstake after contract upgrade', async function () {
    const unstakeAmount = (BigInt(this.decimalsMultiplier * AVAILABLE_BALANCE) - BigInt(100)).toString();
    await this.kastaTokenNew.unstake(unstakeAmount, { from: accounts[2] });

    const contractBalance = (await this.kastaTokenNew.balanceOf(this.kastaTokenNew.address)).toString();
    expect(contractBalance).to.equal('100');
    const accountBalance = (await this.kastaTokenNew.balanceOf(accounts[2])).toString();
    expect(accountBalance).to.equal(unstakeAmount);
  });

});