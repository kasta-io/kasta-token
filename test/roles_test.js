const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const { expectRevert } = require('@openzeppelin/test-helpers');

const KastaToken = artifacts.require("KastaToken");
const KastaTokenV1 = artifacts.require("KastaTokenV1");

contract("KastaToken grant roles", function (accounts) {
  beforeEach(async function () {
    // Deploy a new contract for each test
    this.kastaTokenPrevious = await deployProxy(KastaToken, [accounts[1]]);
    this.kastaToken = await upgradeProxy(this.kastaTokenPrevious.address, KastaTokenV1);
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

contract("KastaToken can't grant roles", function (accounts) {
  beforeEach(async function () {
    // Deploy a new contract for each test
    this.kastaTokenPrevious = await deployProxy(KastaToken, [accounts[1]]);
    this.kastaToken = await upgradeProxy(this.kastaTokenPrevious.address, KastaTokenV1);
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
