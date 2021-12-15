const { admin } = require('@openzeppelin/truffle-upgrades');

const gnosisSafe = process.env.GNOSIS_SAFE;

module.exports = async function (_, network) {
  // Don't change ProxyAdmin ownership for our develop network
  if (network !== 'develop') {
    // The owner of the ProxyAdmin can upgrade our contracts
    await admin.transferProxyAdminOwnership(gnosisSafe);
  }
};