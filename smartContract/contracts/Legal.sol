// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

contract LegalLedger{


address public superOwner;
address[] private modderList;

mapping(address=>bool) private modders;
mapping(address=>Record) private Records;
mapping(address=>bool) private recordExists;


struct Record{
    string name;
    string sex;
    uint16 age;
    uint256 aaddharNumber;
    string phoneNumber;
    string email;
    string Address;
    string IPFShash;
}

modifier onlyOwner(){
    require(superOwner == msg.sender,"Only Super Owner can perform this action");
    _;
}

constructor(){
    superOwner = msg.sender;
    modders[superOwner]=true;
}

function addModder(address _newModder) public onlyOwner {
    require(!modders[_newModder],"Ownership already Exists");
    modders[_newModder]=true;
    modderList.push(_newModder);
}

function viewModders() public view returns(address[] memory _exisitingModders){
    return modderList;
}

function deleteModders(address _modder)public onlyOwner{
    require(modders[_modder],"ownership does not exisit");
    delete modders[_modder];
    for (uint i= 0;i<modderList.length;i++){
        if(modderList[i]==_modder){
            modderList[i]=modderList[modderList.length-1];
            modderList.pop();
            break;
        }
    }
}


function createRecord(
    address _publicKey,
    string memory _name,
    string memory _sex,
    uint16  _age,
    uint256 _aaddharNumber,
    string memory _phoneNumber,
    string memory _email,
    string memory _Address,
    string memory _IPFShash
) public {
    require(modders[msg.sender],"only modders can create a record");
    require(!recordExists[_publicKey], "Record Already exists");

    Records[_publicKey]=Record({
        name:_name,
        sex:_sex,
        age: _age,
        phoneNumber: _phoneNumber,
        aaddharNumber: _aaddharNumber,
        email: _email,
        Address: _Address,
        IPFShash:_IPFShash
    });

    recordExists[_publicKey]=true;
}

function UpdateRecord(
        address _PublicKey,
        string memory _name,
        string memory _sex,
        uint16 _age,
        string memory _phoneNumber,
        uint256 _aaddharNumber,
        string memory _email,
        string memory _address,
        string memory _IPFShash
    )public{
        require(modders[msg.sender],"Only Modders can create a record");
        require(recordExists[_PublicKey], "Record Doesn't exists for this address");

        Records[_PublicKey] = Record({
            name: _name,
            sex: _sex,
            age: _age,
            phoneNumber: _phoneNumber,
            aaddharNumber: _aaddharNumber,
            email: _email,
            Address:_address,
            IPFShash: _IPFShash
        });

        recordExists[_PublicKey] = true;
    }

    function viewRecords(address _PublicKey) public view returns(
        string memory _name,
        string memory _sex,
        uint16 _age,
        string memory _phoneNumber,
        uint256 _aaddharNumber,
        string memory _email,
        string memory _address,
        string memory _IPFShash
    ){
        require(recordExists[_PublicKey],"Record does not exist for this address");
        require(modders[msg.sender],"Only Modders can create a record");
        Record storage record = Records[_PublicKey];
        return(
            record.name,
            record.sex,
            record.age,
            record.phoneNumber,
            record.aaddharNumber,
            record.email,
            record.Address,
            record.IPFShash
        );
    }
}
