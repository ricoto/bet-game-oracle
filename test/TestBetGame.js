const BetGame = artifacts.require("BetGame");
const truffleAssert = require("truffle-assertions");

contract("BetGame", async function(accounts) {

  var instance;

  after(async function() {
    var gInstance = await BetGame.deployed();
    await gInstance.destroy({from: accounts[0]});
  });

  beforeEach(async function() {
    instance = await BetGame.new({from: accounts[0], value: web3.utils.toWei("1", "ether")});
  });

  afterEach(async function() {
    await instance.destroy({from: accounts[0]});
  });

  it("Try to bet with more than .1 ether", async function() {
    await truffleAssert.passes(instance.makeBet(0, {from: accounts[0], value: web3.utils.toWei("0.2", "ether")}));
  });

  it("Try to bet with less than .1 ether", async function() {
    await truffleAssert.fails(instance.makeBet(0, {from: accounts[0], value: web3.utils.toWei("0.05", "ether")}), truffleAssert.ErrorType.REVERT);
  });

  it("Bet 10 times with .1 ether", async function() {
    var heads = false;
    for (var i = 0; i < 10; i++) {
      await truffleAssert.passes(instance.makeBet(heads ? 0 : 1, {from: accounts[0], value: web3.utils.toWei("0.1", "ether")}));
    }
  });

  it("WithdrawAll and try to bet", async function() {
    await truffleAssert.passes(instance.withdrawAll({from: accounts[0]}));
    let gameBalance = await instance.getGameBalance();
    await assert(gameBalance == 0, "Balance is not zero: " + gameBalance);
    await truffleAssert.fails(instance.makeBet(0, {from: accounts[0], value: web3.utils.toWei("0.1", "ether")}), truffleAssert.ErrorType.REVERT);
  });

  it("Claim prize", async function() {
    var bets = 0;
    for (;;) {
      bets++;
      await truffleAssert.passes(instance.makeBet(0, {from: accounts[1], value: web3.utils.toWei("0.1", "ether")}));
      let playerBalance = await instance.getPlayerBalance(accounts[1]);
      if (playerBalance > 0) {
        console.log("Made " + bets + " bet attempts");
        break;
      }
    }
    await truffleAssert.passes(instance.claimPrize({from: accounts[1]}));
    playerBalance = await instance.getPlayerBalance(accounts[1]);
    assert(playerBalance == 0, "Player's prize is not claimed: " + playerBalance);
  });

  it("Make bet with different player and do withdrawAll", async function() {
    var bets = 0;
    for (;;) {
      bets++;
      await truffleAssert.passes(instance.makeBet(0, {from: accounts[1], value: web3.utils.toWei("0.1", "ether")}));
      let playerBalance = await instance.getPlayerBalance(accounts[1]);
      if (playerBalance > 0) {
        console.log("Made " + bets + " bet attempts");
        break;
      }
    }
    await truffleAssert.passes(instance.withdrawAll({from: accounts[0]}));
    let gameBalance = await instance.getContractBalance();
    await assert(gameBalance == 0, "Balance is not zero: " + gameBalance);
  });

  it("WithdrawAll and send 1 ether to contract and try to bet", async function() {
    await truffleAssert.passes(instance.withdrawAll({from: accounts[0]}));
    await truffleAssert.passes(instance.send(web3.utils.toWei("1", "ether"), {from: accounts[0]}));
    await truffleAssert.passes(instance.makeBet(0, {from: accounts[0], value: web3.utils.toWei("0.1", "ether")}));
  });

  it("Try to destroy contract and try to bet", async function() {
    await truffleAssert.passes(instance.destroy({from: accounts[0]}));
  });

  it("Destroy contract not as owner", async function() {
    await truffleAssert.fails(instance.destroy({from: accounts[1]}), truffleAssert.ErrorType.REVERT);
  });

});
