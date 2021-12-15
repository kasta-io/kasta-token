const KastaToken = artifacts.require("KastaToken");
const KastaTokenV1 = artifacts.require("KastaTokenV1");
 
const { prepareUpgrade } = require('@openzeppelin/truffle-upgrades');
 
module.exports = async function (deployer) {
  const kastaToken = await KastaToken.deployed();
  await prepareUpgrade(kastaToken.address, KastaTokenV1, { deployer });
};