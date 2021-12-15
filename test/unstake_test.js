const { expectRevert } = require('@openzeppelin/test-helpers');
const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');

const KastaToken = artifacts.require("KastaToken");
const KastaTokenV1 = artifacts.require("KastaTokenV1");

const AVAILABLE_BALANCE = 5;

contract('KastaToken unstaking', function (accounts) {
  beforeEach(async function () {
    // Deploy a new KastaToken contract for each test
    this.kastaTokenPrevious = await deployProxy(KastaToken, [accounts[1]]);
    this.kastaToken = await upgradeProxy(this.kastaTokenPrevious.address, KastaTokenV1);
    this.decimalsMultiplier = 10 ** (await this.kastaToken.decimals());
    const transferAmount = BigInt(this.decimalsMultiplier * AVAILABLE_BALANCE).toString();
    await this.kastaToken.transfer(accounts[2], transferAmount, { from: accounts[1] });
  });

  it('cannot unstake 0', async function () {
    await expectRevert(this.kastaToken.unstake(0, { from: accounts[2] }), 'KastaToken: Cannot unstake 0 tokens')
  });

  it('cannot unstake while contract paused', async function () {
    await this.kastaToken.stake(1, { from: accounts[2] })
    await this.kastaToken.pause({ from: accounts[1] });
    await expectRevert(this.kastaToken.unstake(1, { from: accounts[2] }), 'KastaToken: Cannot unstake tokens while paused')
  });

  it('unstake is allowed when contract unpaused', async function () {
    await this.kastaToken.stake(1, { from: accounts[2] })
    await this.kastaToken.pause({ from: accounts[1] });
    await expectRevert(this.kastaToken.unstake(1, { from: accounts[2] }), 'KastaToken: Cannot unstake tokens while paused')
    await this.kastaToken.unpause({ from: accounts[1] });
    await this.kastaToken.unstake(1, { from: accounts[2] })
  });

  it('cannot unstake more than staked', async function () {
    const stakeAmount = BigInt(this.decimalsMultiplier * AVAILABLE_BALANCE).toString();
    await this.kastaToken.stake(stakeAmount, { from: accounts[2] });

    const unstakeAmount = (BigInt(this.decimalsMultiplier * AVAILABLE_BALANCE) + BigInt(1)).toString();
    await expectRevert(this.kastaToken.unstake(unstakeAmount, { from: accounts[2] }), 'KastaToken: Cannot unstake more tokens than staked balance');
  });

  it('can unstake exact available balance', async function () {
    const stakeAmount = BigInt(this.decimalsMultiplier * AVAILABLE_BALANCE).toString();
    await this.kastaToken.stake(stakeAmount, { from: accounts[2] });

    const unstakeAmount = (BigInt(this.decimalsMultiplier * AVAILABLE_BALANCE)).toString();
    await this.kastaToken.unstake(unstakeAmount, { from: accounts[2] });
  });

  it('cannot unstake more than balance on different calls', async function () {
    const stakeAmount = BigInt(this.decimalsMultiplier * AVAILABLE_BALANCE).toString();
    await this.kastaToken.stake(stakeAmount, { from: accounts[2] })

    const unstakeAmount = (BigInt(this.decimalsMultiplier * AVAILABLE_BALANCE) - BigInt(1)).toString();
    await this.kastaToken.unstake(unstakeAmount, { from: accounts[2] });
    await this.kastaToken.unstake(1, { from: accounts[2] });

    await expectRevert(this.kastaToken.unstake(1, { from: accounts[2] }), 'KastaToken: Cannot unstake more tokens than staked balance');
  });
});

contract('KastaToken unstaking and balance', function (accounts) {
  beforeEach(async function () {
    // Deploy a new KastaToken contract for each test
    this.kastaTokenPrevious = await deployProxy(KastaToken, [accounts[1]]);
    this.kastaToken = await upgradeProxy(this.kastaTokenPrevious.address, KastaTokenV1);
    this.decimalsMultiplier = 10 ** (await this.kastaToken.decimals());
    const transferAmount = BigInt(this.decimalsMultiplier * AVAILABLE_BALANCE).toString();
    await this.kastaToken.transfer(accounts[2], transferAmount, { from: accounts[1] });
  });

  it('unstaked tokens are transferred back to the user', async function () {
    const stakeAmount = BigInt(this.decimalsMultiplier * AVAILABLE_BALANCE).toString();
    await this.kastaToken.stake(stakeAmount, { from: accounts[2] });

    const unstakeAmount = (BigInt(this.decimalsMultiplier * AVAILABLE_BALANCE) - BigInt(100)).toString();
    await this.kastaToken.unstake(unstakeAmount, { from: accounts[2] });
    const contractBalance = (await this.kastaToken.balanceOf(this.kastaToken.address)).toString();
    expect(contractBalance).to.equal("100");
    const accountBalance = (await this.kastaToken.balanceOf(accounts[2])).toString();
    expect(accountBalance).to.equal(unstakeAmount);
  });
});