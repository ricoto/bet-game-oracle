var web3 = new Web3(Web3.givenProvider);
var contractInstance;
var walletAddress;
var currentQueryId = -1;

$(document).ready(function() {
    window.ethereum.enable().then(function(accounts) {
      walletAddress = accounts[0];
      contractInstance = new web3.eth.Contract(window.abi, "0x172BD35910b3feFE7252113Fe5e923db56e109A7", {from: walletAddress});
      // contractInstance = new web3.eth.Contract(window.abi, "0x0A7e5fE8EE9226326749D99DcE9c8049FBd55382", {from: walletAddress});

      $("#make_bet_button").click(makeBet);
      $("#get_game_balance_button").click(getGameBalance);
      $("#get_wallet_balance_button").click(getWalletBalance);
      $("#get_player_balance_button").click(getPlayerBalance);
      $("#get_contract_balance_button").click(getContractBalance);
      $("#claim_prize_button").click(claimPrize);
      $("#destroy_button").click(destroy);
      contractInstance.events.MakeBetStartedEvent
      (
        {filter: {playerAddress: walletAddress}, fromBlock: 'latest'},
        betStarted
      ).on("error", error);
      contractInstance.events.MakeBetFinishEvent
      (
        {filter: {playerAddress: walletAddress, queryId: currentQueryId}, fromBlock: 'latest'},
        betFinished
      ).on("error", error);

    });
});

function betStarted(error, event) {
  queryId = event.returnValues.queryId;
  $("#make_bet_button").attr("disabled", "disabled");
}

function betFinished(error, event) {
  queryId = -1;
  $("#make_bet_button").removeAttr("disabled");
  $("#win").text(event.returnValues.win ? "You win": "You lost");
}


function error(error, receipt) {
  alert("Error: " + error);
}

async function makeBet() {
  var headsOrTails = $('input[name="headsOrTails"]:checked').val();
  var config = {
    value: web3.utils.toWei("100000000", "gwei")
  };

  var res = await contractInstance.methods.makeBet(headsOrTails == "HEADS" ? 0 : 1).send(config);
}

function getGameBalance() {
   contractInstance.methods.getGameBalance().call().then(function(res) {
    $("#game_balance").text(res + " wei");
  });
}

function getContractBalance() {
   contractInstance.methods.getContractBalance().call().then(function(res) {
    $("#contract_balance").text(res + " wei");
  });
}

function getPlayerBalance() {
   contractInstance.methods.getPlayerBalance(walletAddress).call().then(function(res) {
    $("#player_balance").text(res + " wei");
  });
}

function getWalletBalance() {
  web3.eth.getBalance(walletAddress, function(err, result) {
    $("#wallet_balance").text(result + " wei");
  });
}

function claimPrize() {
  contractInstance.methods.claimPrize().send().on("receipt", function() { alert("Claimed"); });
}

function destroy() {
  contractInstance.methods.destroy().send().on("receipt", function() { alert("Destroyed"); });
}
