const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const { expectRevert} = require('@openzeppelin/test-helpers');

const KastaToken = artifacts.require("KastaToken");
const KastaTokenV1 = artifacts.require("KastaTokenV1");

const AVAILABLE_BALANCE = 5;

contract('KastaToken allocation amounts', function (accounts) {
  beforeEach(async function () {
    // Deploy a new KastaToken contract for each test
    this.kastaTokenPrevious = await deployProxy(KastaToken, [accounts[1]]);
    this.kastaToken = await upgradeProxy(this.kastaTokenPrevious.address, KastaTokenV1);
  });

  it('cannot allocate 0', async function () {
    await expectRevert(this.kastaToken.allocate(0, accounts[3], 'testing', { from: accounts[1] }),
      'KastaToken: Cannot allocate 0 tokens');
  });

  it('can allocate less than available balance', async function () {
    const balance = await this.kastaToken.balanceOf(accounts[1]);
    const allocateAmount = (BigInt(balance) - BigInt(1)).toString();
    await this.kastaToken.allocate(allocateAmount, accounts[3], 'testing',  { from: accounts[1] });
  });

  it('can allocate exact available balance', async function () {
    const balance = await this.kastaToken.balanceOf(accounts[1]);
    await this.kastaToken.allocate(balance, accounts[3], 'testing',  { from: accounts[1] });
  });

  it('cannot allocate more than available balance', async function () {
    const balance = await this.kastaToken.balanceOf(accounts[1]);
    const allocateAmount = (BigInt(balance) + BigInt(1)).toString();
    await expectRevert(this.kastaToken.allocate(allocateAmount, accounts[3], 'testing',  { from: accounts[1] }),
      'ERC20: transfer amount exceeds balance -- Reason given: ERC20: transfer amount exceeds balance');
  });

  it('cannot allocate more than available balance on different calls', async function () {
    const balance = await this.kastaToken.balanceOf(accounts[1]);
    const allocateAmount = (BigInt(balance) - BigInt(1)).toString();
    await this.kastaToken.allocate(allocateAmount, accounts[3], 'testing', { from: accounts[1] })
    await this.kastaToken.allocate("1", accounts[3], 'testing', { from: accounts[1] });
    await expectRevert(this.kastaToken.allocate("1", accounts[3], 'testing',  { from: accounts[1] }),
      'ERC20: transfer amount exceeds balance -- Reason given: ERC20: transfer amount exceeds balance');
  });
});

contract('KastaToken allocation pausing', function (accounts) {
  beforeEach(async function () {
    // Deploy a new KastaToken contract for each test
    this.kastaTokenPrevious = await deployProxy(KastaToken, [accounts[1]]);
    this.kastaToken = await upgradeProxy(this.kastaTokenPrevious.address, KastaTokenV1);
  });
 
  it('cannot allocate while contract paused', async function () {
    await this.kastaToken.pause({ from: accounts[1] });
    await expectRevert(this.kastaToken.allocate(1, accounts[3], 'testing', { from: accounts[1] }),
      'KastaToken: Cannot allocate tokens while paused');
  });
  
  it('allocation is allowed when contract unpaused', async function () {
    await this.kastaToken.pause({ from: accounts[1] });
    await expectRevert(this.kastaToken.allocate(1, accounts[3], 'testing', { from: accounts[1] }),
      'KastaToken: Cannot allocate tokens while paused');
    await this.kastaToken.unpause({ from: accounts[1] });
    this.kastaToken.allocate(1, accounts[3], 'testing',  { from: accounts[1] })
  });
});


contract('KastaToken allocation role access', function (accounts) {
  beforeEach(async function () {
    // Deploy a new KastaToken contract for each test
    this.kastaTokenPrevious = await deployProxy(KastaToken, [accounts[1]]);
    this.kastaToken = await upgradeProxy(this.kastaTokenPrevious.address, KastaTokenV1);
    this.decimalsMultiplier = 10 ** (await this.kastaToken.decimals());
    const transferAmount = BigInt(this.decimalsMultiplier * AVAILABLE_BALANCE).toString();
    await this.kastaToken.transfer(accounts[2], transferAmount, { from: accounts[1] });
    this.adminRole = await this.kastaToken.DEFAULT_ADMIN_ROLE();
    this.pauserRole = await this.kastaToken.PAUSER_ROLE()
  });
 
  it('cannot allocate without admin role', async function () {
    await expectRevert(this.kastaToken.allocate(1, accounts[3], 'testing', { from: accounts[2] }),
      'KastaToken: must have admin role to allocate');
  });
  
  it('allocation is allowed when role granted', async function () {
    await this.kastaToken.grantRole(this.adminRole, accounts[2], { from: accounts[1] })
    this.kastaToken.allocate(1, accounts[3], 'testing',  { from: accounts[2] })
  });

  it('cannot allocate with pauser role', async function () {
    await this.kastaToken.grantRole(this.pauserRole, accounts[4], { from: accounts[1] })
    await expectRevert(this.kastaToken.allocate(1, accounts[3], 'testing', { from: accounts[4] }),
      'KastaToken: must have admin role to allocate');
  });
});
