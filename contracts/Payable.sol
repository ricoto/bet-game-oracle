pragma solidity 0.6.12;

abstract contract Payable {

  modifier costs(uint cost) {
    require(msg.value >= cost, string(abi.encodePacked("Min cost for operation is ", cost, " wei")));
    _;
  }

  modifier hasEnoughBalance(uint gameBalance, uint minRequiredBalance) {
    uint contractBalance = address(this).balance;
    require(gameBalance >= minRequiredBalance, "Not enough game balance to play");
    require(contractBalance >= gameBalance, "Not enough balance on contract to play");
    _;
  }

}
