pragma solidity 0.6.12;

abstract contract ReentranceGuard {

  mapping(string => bool) enteredMap;

  modifier nonReentrant(string memory methodName) {
    require(!enteredMap[methodName], "Has already entered this method once");
    enteredMap[methodName] = true;
    _;
    enteredMap[methodName] = false;
  }

}
