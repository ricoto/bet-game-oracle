pragma solidity 0.6.12;

abstract contract Ownable {

  address payable internal immutable owner;

  modifier isOwner() {
    require(msg.sender == owner, "Owner only can execute this method");
    _;
  }

  constructor() internal {
    owner = msg.sender;
  }

}
