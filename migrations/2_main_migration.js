const BetGame = artifacts.require("BetGame");

module.exports = function (deployer, network, accounts) {
  deployer.deploy(BetGame, {from: accounts[0], value: web3.utils.toWei("1", "ether")});
};
