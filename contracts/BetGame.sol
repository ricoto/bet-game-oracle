pragma solidity 0.6.12;

import "./Ownable.sol";
import "./Payable.sol";
import "./ReentranceGuard.sol";
import "./provableAPI.sol";

contract BetGame is Ownable, Payable, ReentranceGuard, usingProvable {

  // min bet price
  uint constant internal MIN_BET_PRICE = 100000000 gwei; // 1/10 of ether
  // initial min balance required to create game
  uint constant internal INITIAL_BALANCE = 1 ether;
  // number of bytes returned from oracle that generates random number
  uint256 constant private NUM_BYTES_REQUESTED = 1;
  // current amount of active queries. contract cannot be destroyed if someone's bet still in progress
  uint private activeQueries = 0;
  // game balance after we know result of bet
  uint private gameBalance;
  // since bet process is two stage operation with oracle, we want to
  // have guarantee that contract has enough money on balance
  // we keep pessimistic balance as if player always wins
  uint private estimatedGameBalance;
  // enum representin two possible coin states
  enum COIN_STATE {HEAD, TAIL}
  // since we can't iterate through map keys and still required to distribute money accumulated by players
  // array of all players with duplication
  address payable[] private players;
  // keeping balance per player
  mapping(address => uint) private playerBalances;
  // queryId/PlayerBet maping
  mapping(bytes32 => PlayerBet) private playerBets;
  // event indicating start of bet process
  event MakeBetStartedEvent(address playerAddress, bytes32 queryId);
  // event indicating end of bet process
  event MakeBetFinishEvent(address playerAddress, bytes32 queryId, bool win);
  // withdraw all money from contract event
  event WithdrawAllEvent(string message);
  // event indicating that query to oracle is sent
  event LogNewProvableQueryEvent(string message);
  // event indicating that money was sent to contract address
  event BalanceAddedEvent(string message, uint amount);
  // event indicating that player is trying to claim prize
  event ClaimPrizeEvent(string message);
  // this struc represents required information for one bet
  struct PlayerBet {
    address payable playerAddress;
    COIN_STATE coinState;
    uint betPrice;
    bool exists;
  }

  // initializing balances in payable constructor
  constructor() public payable costs(INITIAL_BALANCE) {
    gameBalance = INITIAL_BALANCE;
    estimatedGameBalance = gameBalance;
    emit BalanceAddedEvent("Balance initialized vai constructor", address(this).balance);
  }

  // returns current game balance
  function getGameBalance() public view returns (uint balance) {
    return gameBalance;
  }

  // returns current contract balance
  function getContractBalance() public view returns (uint balance) {
    return address(this).balance;
  }

  // returns player's balance
  function getPlayerBalance(address playerAddress) public view returns(uint balance){
    return playerBalances[playerAddress];
  }

  // payable function to make bet
  function makeBet(COIN_STATE coinState) public payable costs(MIN_BET_PRICE) nonReentrant("makeBet") hasEnoughBalance(estimatedGameBalance, msg.value) {
    // increment amount of active queries
    activeQueries++;
    // adjust pessimistic game balance (as if player always wins)
    estimatedGameBalance -= msg.value;
    // create instance of player bet structure
    PlayerBet memory playerBet = PlayerBet(msg.sender, coinState, msg.value, true);
    // request oracle for random number
    bytes32 queryId = requestRandomNumber();
    // UNCOMMENT THIS LINE WHEN TESTING ONLY
    // bytes32 queryId = requestRandomNumberStub(coinState, msg.value);
    // store PlayerBet by query id
    playerBets[queryId] = playerBet;
    players.push(msg.sender);
    // emit bet started event
    emit MakeBetStartedEvent(playerBet.playerAddress, queryId);
  }

  // invoking oracle method to generate random number
  function requestRandomNumber() payable public returns (bytes32){
    // no delay
    uint queryExecutionDelay = 0;
    // gas for callback function
    uint gasForCallback = 200000;
    // invoke oracle method and get back query id for tracking when it comes to callback function
    bytes32 queryId = provable_newRandomDSQuery(queryExecutionDelay, NUM_BYTES_REQUESTED, gasForCallback);
    // emit query event
    emit LogNewProvableQueryEvent("Random number request sent...");
    return queryId;
  }

  // withdraw all money from contract and distribute between owner and players
  function withdrawAll() public isOwner() nonReentrant("withdrawAll")  {
    if (address(this).balance <= 0) {
      return;
    }
    // can withdraw only if all bets are processed
    require(address(this).balance > 0 && activeQueries == 0, "Cannot withdraw until all bets are processed");
    if (gameBalance > 0) {
      // transfer owner's part of contract balance
      msg.sender.transfer(gameBalance);
      // can reset gameBalance after transfer since method is nonReentrant
      gameBalance = 0;
      estimatedGameBalance = 0;

    }
    if (gameBalance != address(this).balance) {
      // TODO: gas consuming operation since array might have duplicates
      for (uint i=0; i<players.length; i++) {
        uint playerBalance = playerBalances[players[i]];
        if (playerBalance > 0) {
          claimPrize(players[i]);
        }
      }
    }
    // emit withdraw all successful event
    emit WithdrawAllEvent("Successfully completed");
  }

  // method for players to claim their prize
  function claimPrize() public nonReentrant("claimPrize") {
    // invoke private function with msg.sender as parameter
    claimPrize(msg.sender);
  }

  // method for players to claim their prize
  function claimPrize(address payable playerAddress) private {
    // store player's balance in local variable
    uint playerBalance = playerBalances[playerAddress];
    // change players balance to 0
    playerBalances[playerAddress] = 0;
    // can claim if balance is greater than 0
    require(playerBalance > 0, "Player has zero balance");
    // can claim only if contract has enough balance to pay
    require(address(this).balance >= playerBalance, "Contract has not enough balance to pay the player");
    // transfer money from contract to player
    playerAddress.transfer(playerBalance);
    emit ClaimPrizeEvent("Success");
  }

  // callback function for oracle
  function __callback(bytes32 queryId, string memory result, bytes memory proof) public override nonReentrant("__callback") {
    require(msg.sender == provable_cbAddress(), "_callback can be called from provable_cbAddress");
    callback(queryId, result, proof);
  }

  // internal callback function with all logic
  function callback(bytes32 queryId, string memory result, bytes memory proof) private nonReentrant("callback") {
    // find PlayerBet by query id
    PlayerBet memory playerBet = playerBets[queryId];
    require(playerBet.exists, "Bet does not exist for player or was already processed");
    // change exists to false so it won't be processed if there is second call with the same query id
    playerBets[queryId].exists = false;
    // decrease active queries
    activeQueries--;
    // get random number from result
    uint256 randomNumber = uint256(keccak256(abi.encodePacked(result)));
    // convert random number to random coin state
    COIN_STATE randomState = randomNumber % 2 == 0 ? COIN_STATE.HEAD : COIN_STATE.TAIL;
    // keep win/lose in local variable
    bool win = randomState == playerBet.coinState;
    // update player balance if he wins
    playerBalances[playerBet.playerAddress] += win ? playerBet.betPrice * 2 : 0;
    // update estimatedGameBalance if player loses
    estimatedGameBalance += win ? 0 : playerBet.betPrice;
    // update game balance
    gameBalance += win ? -playerBet.betPrice : playerBet.betPrice;
    // emit bet finish event with player adddress and game result
    emit MakeBetFinishEvent(playerBet.playerAddress, queryId, win);
  }

  // function used for internal testing in Ganache
  function requestRandomNumberStub(COIN_STATE coinState, uint betValue) payable public returns (bytes32){
    bytes32 queryId = bytes32(keccak256(abi.encodePacked(msg.sender)));
    // create instance of player bet structure
    PlayerBet memory playerBet = PlayerBet(msg.sender, coinState, betValue, true);
    // store PlayerBet by query id
    playerBets[queryId] = playerBet;
    // simulate callback invocation
    uint256 proof = 1;
    bytes memory proofBytes = abi.encodePacked(proof);
    callback(queryId, string(abi.encodePacked(block.timestamp)), proofBytes);
    // emit query event
    emit LogNewProvableQueryEvent("Random number request sent...");
    return queryId;
  }

  // in case someone wants to recharge game balance
  fallback() external payable {
    gameBalance += msg.value;
    estimatedGameBalance += msg.value;
    emit BalanceAddedEvent("Balance added via fallback", address(this).balance);
  }

  // destroy contract if balance is distributed successfully among all parties
  function destroy() public isOwner {
    // distribute payments to players and contract owner
    withdrawAll();
    // destroy contract
    selfdestruct(msg.sender);
  }

}
