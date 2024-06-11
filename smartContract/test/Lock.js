const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LegalLedger", function () {
  let LegalLedger, legalLedger;
  let owner, modder1, modder2, user1, user2;

  beforeEach(async function () {
    [owner, modder1, modder2, user1, user2] = await ethers.getSigners();
    LegalLedger = await ethers.getContractFactory("LegalLedger");
    legalLedger = await LegalLedger.deploy();
    await legalLedger.deployed();
  });

  it("Should set the right owner", async function () {
    expect(await legalLedger.superOwner()).to.equal(owner.address);
  });

  it("Owner should be able to add a modder", async function () {
    await legalLedger.addModder(modder1.address);
    expect(await legalLedger.viewModders()).to.include(modder1.address);
  });

  it("Should not allow non-owners to add a modder", async function () {
    await expect(legalLedger.connect(user1).addModder(user2.address)).to.be.revertedWith("Only Super Owner can perform this action");
  });

  it("Modders should be able to create a record", async function () {
    await legalLedger.addModder(modder1.address);
    await legalLedger.connect(modder1).createRecord(user1.address, "John Doe", "Male", 30, 1234567890, "1234567890", "john.doe@example.com", "123 Blockchain St", "Qm...");

    const record = await legalLedger.viewRecords(user1.address);
    expect(record.name).to.equal("John Doe");
  });

  it("Should not allow non-modders to create a record", async function () {
    await expect(legalLedger.connect(user1).createRecord(user2.address, "Jane Doe", "Female", 28, 1234567891, "0987654321", "jane.doe@example.com", "456 Blockchain St", "Qm...")).to.be.revertedWith("only modders can create a record");
  });

  it("Modders should be able to update a record", async function () {
    await legalLedger.addModder(modder1.address);
    await legalLedger.connect(modder1).createRecord(user1.address, "John Doe", "Male", 30, 1234567890, "1234567890", "john.doe@example.com", "123 Blockchain St", "Qm...");
    await legalLedger.connect(modder1).UpdateRecord(user1.address, "John Doe Updated", "Male", 31, "0987654321", 1234567890, "john.updated@example.com", "456 Blockchain St", "Qm...");

    const record = await legalLedger.viewRecords(user1.address);
    expect(record.name).to.equal("John Doe Updated");
    expect(record.age).to.equal(31);
  });

  it("Should not allow non-modders to update a record", async function () {
    await legalLedger.addModder(modder1.address);
    await legalLedger.connect(modder1).createRecord(user1.address, "John Doe", "Male", 30, 1234567890, "1234567890", "john.doe@example.com", "123 Blockchain St", "Qm...");
    await expect(legalLedger.connect(user2).UpdateRecord(user1.address, "John Doe Updated", "Male", 31, "0987654321", 1234567890, "john.updated@example.com", "456 Blockchain St", "Qm...")).to.be.revertedWith("Only Modders can create a record");
  });

  it("Should allow owner to remove a modder", async function () {
    await legalLedger.addModder(modder1.address);
    expect(await legalLedger.viewModders()).to.include(modder1.address);
    await legalLedger.deleteModders(modder1.address);
    expect(await legalLedger.viewModders()).to.not.include(modder1.address);
  });

  it("Should not allow non-owners to remove a modder", async function () {
    await legalLedger.addModder(modder1.address);
    await expect(legalLedger.connect(user1).deleteModders(modder1.address)).to.be.revertedWith("Only Super Owner can perform this action");
  });

  it("Should not allow creating duplicate records", async function () {
    await legalLedger.addModder(modder1.address);
    await legalLedger.connect(modder1).createRecord(user1.address, "John Doe", "Male", 30, 1234567890, "1234567890", "john.doe@example.com", "123 Blockchain St", "Qm...");
    await expect(legalLedger.connect(modder1).createRecord(user1.address, "John Doe", "Male", 30, 1234567890, "1234567890", "john.doe@example.com", "123 Blockchain St", "Qm...")).to.be.revertedWith("Record Already exists");
  });

  it("Should not allow viewing records by non-modders", async function () {
    await legalLedger.addModder(modder1.address);
    await legalLedger.connect(modder1).createRecord(user1.address, "John Doe", "Male", 30, 1234567890, "1234567890", "john.doe@example.com", "123 Blockchain St", "Qm...");
    await expect(legalLedger.connect(user1).viewRecords(user1.address)).to.be.revertedWith("Only Modders can create a record");
  });
});
