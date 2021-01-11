// const People = artifacts.require("People");
// const truffleAssert = require("truffle-assertions");
//
// contract("People", async function(accounts) {
//
//   let instance;
//
//   before(async function() {
//     instance = await People.deployed();
//   });
//
//   afterEach(async function() {
//     await instance.withdrawAll();
//   });
//
//   // beforeEach, after, afterEach
//
//   it("Should be less than 150 years old", async function() {
//     await truffleAssert.fails(instance.createPerson("Peter", 151, 200, {value: web3.utils.toWei("1", "ether")}), truffleAssert.ErrorType.REVERT);
//   });
//
//   it("Shouldn't create person without payment", async function() {
//     await truffleAssert.fails(instance.createPerson("Peter", 51, 200, {value: 1000}), truffleAssert.ErrorType.REVERT);
//   });
//
//   it("Should mark person as senior", async function() {
//     await instance.createPerson("Bob", 67, 185, {value: web3.utils.toWei("1", "ether")});
//     let result = await instance.getPerson();
//     assert(result.senior === true && result.age.toNumber() == 67, "Senior status is not set properly");
//   });
//
//   it("should be able to delete Person", async function() {
//     await instance.createPerson("Bob", 43, 192, {from: accounts[0], value: web3.utils.toWei("1", "ether")});
//     await truffleAssert.passes(instance.deletePerson(accounts[0], {from: accounts[0]}));
//   });
//
//   it("should NOT be able to delete Person", async function() {
//     let instance = await People.new();
//     await instance.createPerson("Bob", 43, 192, {from: accounts[0], value: web3.utils.toWei("1", "ether")});
//     await truffleAssert.fails(instance.deletePerson(accounts[0], {from: accounts[1]}), truffleAssert.ErrorType.REVERT);
//     await instance.withdrawAll();
//   });
//
//   it("Balance should increase after create person", async function() {
//     let instance = await People.new();
//     // balance is zero when contract is just created
//     let balance = await web3.eth.getBalance(instance.address);
//     assert(balance == 0, "Balance should be 0 from the beginning ");
//
//     // create Person method increases balance + 1 ether
//     await instance.createPerson("Bob", 43, 192, {from: accounts[0], value: web3.utils.toWei("1", "ether")});
//     balance = await web3.eth.getBalance(instance.address);
//     assert(balance == web3.utils.toWei("1", "ether"), "Balance should be 1 ether after person creation");
//     await instance.withdrawAll();
//   });
//
//   it("Delete person should not change balance", async function() {
//     let instance = await People.new();
//     await instance.createPerson("Bob", 43, 192, {from: accounts[0], value: web3.utils.toWei("1", "ether")});
//     let balance = await web3.eth.getBalance(instance.address);
//     await truffleAssert.passes(instance.deletePerson(accounts[0], {from: accounts[0]}));
//     let newBalance = await web3.eth.getBalance(instance.address);
//     assert(balance == newBalance, "Balance should not change");
//     await instance.withdrawAll();
//   });
//
//   it("Delete person not as contract owner fails", async function() {
//     let instance = await People.new();
//     await instance.createPerson("Bob", 43, 192, {from: accounts[0], value: web3.utils.toWei("1", "ether")});
//     await truffleAssert.fails(instance.deletePerson(accounts[0], {from: accounts[1]}), truffleAssert.ErrorType.REVERT);
//     await instance.withdrawAll();
//   });
//
//   it("withdrawAll should transfer balance to creator's address", async function() {
//     let instance = await People.new();
//     await instance.createPerson("Bob", 43, 192, {from: accounts[0], value: web3.utils.toWei("1", "ether")});
//     // withdrawAll moves balance from contract to address that created contract
//     let balance = await web3.eth.getBalance(instance.address);
//     let accountBalance = await web3.eth.getBalance(accounts[0]);
//     await instance.withdrawAll();
//     let newAccountBalance = await web3.eth.getBalance(accounts[0]);
//
//     balance = await web3.eth.getBalance(instance.address);
//     assert(balance == 0, "Balance should be 0 after withdrawAll");
//
//     assert(newAccountBalance > accountBalance, "Balance should increase by 1 ether for address that created main contract ");
//     await instance.withdrawAll();
//   });
//
// });
