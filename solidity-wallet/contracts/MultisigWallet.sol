// SPDX-License-Identifier: MIT
pragma solidity ^0.5.16;


/*
what we do in this contract:
- define events for deposit, submit-tx, confirm-tx, revoke-tx, execute-tx
- define variables for owners, number of confirmations required to execute a tx
- mapping if address is owner or not
- define transaction struct
- build constructor with owners and number of confirmations required for a tx
- callback function with deposit event emit
- create modifier for if tx exists, if tx is confirmed, if tx is executed
- modifier onlyOwner to check if msg.sender is owner 
- functions to submit, confirm, execute and revoke a transaction
- functions to get owners, tx infos, tx count, if tx is confirmed
*/


contract MultiSigWallet {
    
    // define the events

    event Deposit(address indexed sender, uint amount, uint balance);
    
    event SubmitTransaction(
        address indexed owner,
        uint indexed txIndex,
        address indexed to,
        uint value,
        bytes data
        );
    
    event ConfirmTransaction(address indexed owner, uint indexed txIndex);
    
    event RevokeConfirmation(address indexed owner, uint indexed txIndex);
    
    event ExecuteTransaction(address indexed owner, uint indexed txIndex);
    
    
    
    
     // store address of owners
    address[] owners;
    
    // this will tell whether an address is an owner or not
    mapping(address => bool) public isOwner;
    
    // store numbers of confirmations required to exec a transaction
    uint public numConfirmationsRequired;
    
    // build tx struct
    struct Transaction {
        // address sent to
        address to;
        // amount of ether
        uint value;
        // if it calls another function
        bytes data;
        // if tx is executed
        bool executed;
        // when owner approves transaction we store this is a mapping
        mapping(address => bool) isConfirmed;
        uint numConfirmations;
    }
    
    Transaction[] public transactions;
    
    // inputs to this constructur are 
    //  - the owners of the multisig MultiSigWallet
    //  - and the number of confirmations required
    constructor(address[] memory _owners, uint _numConfirmationsRequired) public {
        
        // first we do some input validation
        // and require that the array of owners is not empty
        // and also that number of confirmations > 0 and smaller or equal to number of owners
        
        require(_owners.length > 0, "owners required");
        require(
            _numConfirmationsRequired > 0 && _numConfirmationsRequired <= _owners.length,
            "invalid number of owners or required confirmations"
            );
            
            
        for (uint i = 0; i < _owners.length; i++) {
            address owner = _owners[i];    
            
            require(owner != address(0), "invalid owner");
            require(!isOwner[owner], "owner is not unique");
            
            isOwner[owner] = true;
            owners.push(owner);
        }
        
        numConfirmationsRequired = _numConfirmationsRequired;
        
    }
    
    // finally we need to define a fallback function so we can send ether to this contract
    function() payable external {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

     
     // define modifier for functions
    modifier onlyOwner() {
        require(isOwner[msg.sender], "not owner");
        _;
    }
   
    // only the owner of this ccontract
    // should be able to call this function
    function submitTransaction(address _to, uint _value, bytes memory _data )
        public
        onlyOwner 
    {
        
            // first we need the id of the transaction
            // we are about to create
            // for the id we will just use the current length of the tx array
            uint txIndex = transactions.length;
            
            // next we init a transaction struct
            // and then append it to the array of transactions
            transactions.push(Transaction({
                to: _to,
                value: _value,
                data: _data,
                executed: false,
                numConfirmations: 0
            }));
            
            // lastly we submit the event with msg.sender, current tx id, and the inputs
            emit SubmitTransaction(msg.sender, txIndex, _to, _value, _data);
    }
    
    // modifier to check if tx exists
    modifier txExists(uint _txIndex) {
        require(_txIndex < transactions.length, "tx does not exist");
        _;
    }
    
    // modifier to check if tx got already executed
    modifier notExecuted(uint _txIndex) {
        require(!transactions[_txIndex].executed, "tx already executed");
        _;
    }
    
    // modifier to check confirmation
    modifier notConfirmed(uint _txIndex) {
        require(!transactions[_txIndex].isConfirmed[msg.sender], "tx already confirmed");
        _;
    }
    
    // to confirm the tx
    function confirmTransaction(uint _txIndex) 
        public 
        onlyOwner 
        txExists(_txIndex)
        notExecuted(_txIndex)
        notConfirmed(_txIndex)
    {
        // first get transaction at the index
        Transaction storage transaction = transactions[_txIndex];
        
        // set isConfirmed to true
        transaction.isConfirmed[msg.sender] = true;
        transaction.numConfirmations += 1;
        emit ConfirmTransaction(msg.sender, _txIndex);
    }
    
    // to execute the tx
    function executeTransaction(uint _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];
        
        require(
            transaction.numConfirmations >= numConfirmationsRequired,
            "cannot execute tx"
            );
        
        transaction.executed = true;
        
        (bool success, ) = transaction.to.call.value(transaction.value)(transaction.data);
        require(success, "tx failed");
        
        emit ExecuteTransaction(msg.sender, _txIndex);
    }
    
    
    // to revoke confirmation
    function revokeConfirmation(uint _txIndex) 
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];
        
        require(transaction.isConfirmed[msg.sender] = true, "tx not confirmed");
        transaction.isConfirmed[msg.sender] = false;
        transaction.numConfirmations -= 1;
        
        emit RevokeConfirmation(msg.sender, _txIndex);
    }
    
    // get the owners
    function getOwners() public view returns (address[] memory) {
        return owners;
    }

    // get tx count
    function getTransactionCount() public view returns (uint) {
        return transactions.length;
    }

    // get all tx info
    function getTransaction(uint _txIndex)
        public
        view
        returns (address to, uint value, bytes memory data, bool executed, uint numConfirmations)
    {
        Transaction storage transaction = transactions[_txIndex];

        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed,
            transaction.numConfirmations
        );
    }

    // get confirmation status as boolean
    function isConfirmed(uint _txIndex, address _owner)
        public
        view
        returns (bool)
    {
        Transaction storage transaction = transactions[_txIndex];

        return transaction.isConfirmed[_owner];
    }
}