const { expectRevert} = require('@openzeppelin/test-helpers');
const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
 
const KastaToken = artifacts.require("KastaToken");
const KastaTokenV1 = artifacts.require("KastaTokenV1");

const AVAILABLE_BALANCE = 5;

contract('KastaToken staking', function (accounts) {
  beforeEach(async function () {
    // Deploy a new KastaToken contract for each test
    this.kastaTokenPrevious = await deployProxy(KastaToken, [accounts[1]]);
    this.kastaToken = await upgradeProxy(this.kastaTokenPrevious.address, KastaTokenV1);
    this.decimalsMultiplier = 10 ** (await this.kastaToken.decimals());
    const transferAmount = BigInt(this.decimalsMultiplier * AVAILABLE_BALANCE).toString();
    await this.kastaToken.transfer(accounts[2], transferAmount, { from: accounts[1] });
  });
 
  it('cannot stake 0', async function () {
    await expectRevert(this.kastaToken.stake(0, { from: accounts[2] }), 'KastaToken: Cannot stake 0 tokens')
  });
  
  it('cannot stake while contract paused', async function () {
    await this.kastaToken.pause({ from: accounts[1] });
    await expectRevert(this.kastaToken.stake(1, { from: accounts[2] }), 'KastaToken: Cannot stake tokens while paused')
  });
  
  it('stake is allowed when contract unpaused', async function () {
    await this.kastaToken.pause({ from: accounts[1] });
    await expectRevert(this.kastaToken.stake(1, { from: accounts[2] }), 'KastaToken: Cannot stake tokens while paused')
    await this.kastaToken.unpause({ from: accounts[1] });
    await this.kastaToken.stake(1, { from: accounts[2] });
  });

  it('can stake less than balance', async function () {
    const stakeAmount = (BigInt(this.decimalsMultiplier * AVAILABLE_BALANCE) - BigInt(1)).toString();
    await this.kastaToken.stake(stakeAmount, { from: accounts[2] });
  });

  it('can stake exact available balance', async function () {
    const stakeAmount = BigInt(this.decimalsMultiplier * AVAILABLE_BALANCE).toString();
    await this.kastaToken.stake(stakeAmount, { from: accounts[2] });
  });

  it('cannot stake more than balance', async function () {
    const stakeAmount = (BigInt(this.decimalsMultiplier * AVAILABLE_BALANCE) + BigInt(1)).toString();
    await expectRevert(this.kastaToken.stake(stakeAmount, { from: accounts[2] }), 'KastaToken: Cannot stake more tokens than unstaked balance')
  });

  it('cannot stake more than balance on different calls', async function () {
    const stakeAmount = (BigInt(this.decimalsMultiplier * AVAILABLE_BALANCE) - BigInt(1)).toString();
    await this.kastaToken.stake(stakeAmount, { from: accounts[2] })
    await this.kastaToken.stake("1", { from: accounts[2] });
    await expectRevert(this.kastaToken.stake(1, { from: accounts[2] }), 'KastaToken: Cannot stake more tokens than unstaked balance');
  });

  it('admin role cannot stake tokens', async function () {
    await expectRevert(this.kastaToken.stake(1, { from: accounts[1] }), 'KastaToken: admin role cannot stake tokens')
  });
});

contract('KastaToken staking and balance', function (accounts) {
  beforeEach(async function () {
    // Deploy a new KastaToken contract for each test
    this.kastaTokenPrevious = await deployProxy(KastaToken, [accounts[1]]);
    this.kastaToken = await upgradeProxy(this.kastaTokenPrevious.address, KastaTokenV1);
    this.decimalsMultiplier = 10 ** (await this.kastaToken.decimals());
    const transferAmount = BigInt(this.decimalsMultiplier * AVAILABLE_BALANCE).toString();
    await this.kastaToken.transfer(accounts[2], transferAmount, { from: accounts[1] });
  });
 
  it('staked tokens are transferred to contract address', async function () {
    const stakeAmount = BigInt(this.decimalsMultiplier * AVAILABLE_BALANCE).toString();
    await this.kastaToken.stake(stakeAmount, { from: accounts[2] });
    const contractBalance = (await this.kastaToken.balanceOf(this.kastaToken.address)).toString();
    expect(contractBalance).to.equal(stakeAmount);
    const accountBalance = (await this.kastaToken.balanceOf(accounts[2])).toString();
    expect(accountBalance).to.equal('0');
  });
  
  it('cannot transfer staked tokens', async function () {
    const stakeAmount = BigInt(this.decimalsMultiplier * AVAILABLE_BALANCE).toString();
    await this.kastaToken.stake(stakeAmount, { from: accounts[2] });
    await expectRevert(this.kastaToken.transfer(accounts[3], stakeAmount, { from: accounts[2] }),
      'ERC20: transfer amount exceeds balance -- Reason given: ERC20: transfer amount exceeds balance');
  });
});
