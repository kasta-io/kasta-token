const { expectRevert} = require('@openzeppelin/test-helpers');

const KastaToken = artifacts.require("KastaToken");

const AVAILABLE_BALANCE = 5;

contract('KastaToken individual tests - transfer', function (accounts) {
  beforeEach(async function () {
    // Deploy a new KastaToken contract for each test
    this.kastaToken = await KastaToken.new(accounts[1]);
    await this.kastaToken.initialize(accounts[1]);
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

contract("KastaToken individual tests - grant roles", function (accounts) {
  beforeEach(async function () {
    // Deploy a new contract for each test
    this.kastaToken = await KastaToken.new(accounts[1]);
    await this.kastaToken.initialize(accounts[1]);
    this.adminRole = await this.kastaToken.DEFAULT_ADMIN_ROLE();
    this.pauserRole = await this.kastaToken.PAUSER_ROLE()
  });

  it("deployer account should have admin role", async function () {
    const hasRole = await this.kastaToken.hasRole(this.adminRole, accounts[1])
    return assert.isTrue(hasRole);
  });

  it("deployer account should have pauser role", async function () {
    const hasRole = await this.kastaToken.hasRole(this.pauserRole, accounts[1])
    return assert.isTrue(hasRole);
  });
  
  it("deployer can grant admin role", async function () {
    await this.kastaToken.grantRole(this.adminRole, accounts[2], { from: accounts[1] })
    const hasRole = await this.kastaToken.hasRole(this.adminRole, accounts[2])
    return assert.isTrue(hasRole);
  });

  it("deployer can grant pauser role", async function () {
    await this.kastaToken.grantRole(this.pauserRole, accounts[2], { from: accounts[1] })
    const hasRole = await this.kastaToken.hasRole(this.pauserRole, accounts[2])
    return assert.isTrue(hasRole);
  });

});

contract("KastaToken individual tests - can't grant roles", function (accounts) {
  beforeEach(async function () {
    // Deploy a new contract for each test
    this.kastaToken = await KastaToken.new(accounts[1]);
    await this.kastaToken.initialize(accounts[1]);
    this.adminRole = await this.kastaToken.DEFAULT_ADMIN_ROLE();
    this.pauserRole = await this.kastaToken.PAUSER_ROLE()
  });
  
  it("non deployer account shouldn't have admin role", async function () {
    const hasRole = await this.kastaToken.hasRole(this.adminRole, accounts[2])
    return assert.isFalse(hasRole);
  });

  it("non deployer account shouldn't have pauser role", async function () {
    const hasRole = await this.kastaToken.hasRole(this.pauserRole, accounts[2])
    return assert.isFalse(hasRole);
  });
  
  it("non deployer can't grant admin role", async function () {
    await expectRevert(this.kastaToken.grantRole(this.adminRole, accounts[3], { from: accounts[2] }),
      `AccessControl: account ${accounts[2].toLowerCase()} is missing role 0x0000000000000000000000000000000000000000000000000000000000000000 -- Reason given: AccessControl: account ${accounts[2].toLowerCase()} is missing role 0x0000000000000000000000000000000000000000000000000000000000000000.`)
  });

  it("non deployer can't grant pauser role", async function () {
    await expectRevert(this.kastaToken.grantRole(this.pauserRole, accounts[3], { from: accounts[2] }),
    `AccessControl: account ${accounts[2].toLowerCase()} is missing role 0x0000000000000000000000000000000000000000000000000000000000000000 -- Reason given: AccessControl: account ${accounts[2].toLowerCase()} is missing role 0x0000000000000000000000000000000000000000000000000000000000000000.`)
  });

});


contract('KastaToken individual tests - staking', function (accounts) {
  beforeEach(async function () {
    // Deploy a new KastaToken contract for each test
    this.kastaToken = await KastaToken.new(accounts[1]);
    await this.kastaToken.initialize(accounts[1]);
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

contract('KastaToken individual tests - staking and balance', function (accounts) {
  beforeEach(async function () {
    // Deploy a new KastaToken contract for each test
    this.kastaToken = await KastaToken.new(accounts[1]);
    await this.kastaToken.initialize(accounts[1]);
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


contract('KastaToken individual tests - unstaking', function (accounts) {
  beforeEach(async function () {
    // Deploy a new KastaToken contract for each test
    this.kastaToken = await KastaToken.new(accounts[1]);
    await this.kastaToken.initialize(accounts[1]);
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

contract('KastaToken individual tests - unstaking and balance', function (accounts) {
  beforeEach(async function () {
    // Deploy a new KastaToken contract for each test
    this.kastaToken = await KastaToken.new(accounts[1]);
    await this.kastaToken.initialize(accounts[1]);
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