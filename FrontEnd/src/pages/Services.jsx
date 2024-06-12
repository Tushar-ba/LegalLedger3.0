import React, { useState } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';
import LegalLedgerABI from '../utils/LegalLedgerABI';
import { toast, ToastContainer, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const contractAddress = "0x84966b37b448840c921734589ce16737ba82c30d"; // Add your contract address
const pinataApiKey = "7a49cda21daa4f797cd2"; // Add your Pinata API key
const pinataSecretApiKey = "7e7a21397e16f5d0263844573656199b5b111381a10cdde3bc107d2bc8fc4df9"; // Add your Pinata Secret API key

const Services = () => {
  const [form, setForm] = useState({
    publicKey: "",
    name: "",
    sex: "",
    age: "",
    phoneNumber: "",
    aaddharNumber: "",
    email: "",
    address: "",
    file: null,
    IPFShash: "",
  });

  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [retriveRecords, setRetriveRecords] = useState({});
  const [metamaskAddress, setMetamaskAddress] = useState("");
  const [connected, setConnected] = useState(false);
  const [modderAddress, setModderAddress] = useState("");
  const [modderList, setModderList] = useState([]);

  const connectToMetamask = async () => {
    if (window.ethereum) {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      await web3Provider.send("eth_requestAccounts", []);
      const web3Signer = await web3Provider.getSigner();
      const web3Contract = new ethers.Contract(contractAddress, LegalLedgerABI, web3Signer);
      const address = await web3Signer.getAddress();
      setProvider(web3Provider);
      setSigner(web3Signer);
      setContract(web3Contract);
      setMetamaskAddress(address);
      setConnected(true);
    } else {
      console.error("metamask not found");
    }
  };

  const handleAddModder = async () => {
    if (contract && modderAddress) {
      try {
        const tx = await contract.addModder(modderAddress);
        await tx.wait();
        console.log("Modder added successfully");
        setModderAddress("");
        fetchModders();
      } catch (error) {
        console.error("Error adding modder:", error);
      }
    }
  };

  const fetchModders = async () => {
    if (contract) {
      try {
        const moddersList = await contract.viewModders();
        setModderList(moddersList);
      } catch (error) {
        console.error("Error fetching modders:", error);
      }
    }
  };

  const handleDeleteModder = async (address) => {
    if (contract && address) {
      try {
        const tx = await contract.deleteModders(address);
        await tx.wait();
        console.log("Modder deleted successfully");
        fetchModders();
      } catch (error) {
        console.error("Error deleting modder:", error);
      }
    }
  };



  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm({
      ...form,
      [name]: files ? files[0] : value,
    });
  };

  const handleUpload = async () => {
    if (form.file) {
      const formData = new FormData();
      formData.append("file", form.file);

      const metadata = JSON.stringify({
        name: form.file.name,
        keyvalues: {
          patientAddress: form.publicKey, // Ensure this is correct
          name: form.name,
          email: form.email,
        },
      });
      formData.append("pinataMetadata", metadata);

      try {
        const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
          maxBodyLength: "Infinity",
          headers: {
            "Content-Type": "multipart/form-data",
            pinata_api_key: pinataApiKey,
            pinata_secret_api_key: pinataSecretApiKey,
          },
        });
        const ipfsHash = res.data.IpfsHash;
        console.log("IPFS Hash:", ipfsHash); // Log the retrieved IPFS hash
        setForm((prevForm) => ({ ...prevForm, IPFShash: ipfsHash }));
        toast.info('File uploaded', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
          transition: Bounce,
        });
        return ipfsHash; // Return the IPFS hash
      } catch (error) {
        console.error("Error uploading file to Pinata:", error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ipfsHash = await handleUpload(); // Wait for handleUpload to complete
    if (contract && ipfsHash) {
      try {
        const updatedForm = { ...form, IPFShash: ipfsHash };
        const tx = await contract.createRecord(
          updatedForm.publicKey,
          updatedForm.name,
          updatedForm.sex,
          updatedForm.age,
          updatedForm.phoneNumber,
          updatedForm.aaddharNumber,
          updatedForm.email,
          updatedForm.address,
          updatedForm.IPFShash,
        );
        await tx.wait();
      } catch (error) {
        console.error("error creating record", error);
      }
    }
  };

  const handleGetRecord = async (e) => {
    e.preventDefault();
    try {
      const record = await contract.viewRecords(form.publicKey);
      console.log("Retrieved record:", record); // Log the retrieved record
      setRetriveRecords({
        name: record[0],
        sex: record[1],
        age: record[2],
        phoneNumber: record[3],
        aaddharNumber: record[4],
        email: record[5],
        address: record[6],
        IPFShash: record[7],
      });
    } catch (error) {
      console.error("error retrieving the record", error);
    }
  };

  const handleDeleteRecord = async (e) => {
    e.preventDefault();
    if (contract) {
      try {
        const tx = await contract.deleteRecord(form.publicKey);
        await tx.wait();
        toast.success("Record deleted successfully", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
          transition: Bounce,
        });
        alert("Record Deleted")
        setRetriveRecords(null);
      } catch (error) {
        console.error("Error deleting record:", error);
      }
    };
  }


  return (
    <> 
    <div>
      <button onClick={connectToMetamask}>
        {connected ? metamaskAddress : "Connect to Metamask"}
      </button>
      <div>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="publicKey"
            placeholder="Public Key"
            value={form.publicKey}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="sex"
            placeholder="Sex"
            value={form.sex}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="age"
            placeholder="Age"
            value={form.age}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="phoneNumber"
            placeholder="Phone Number"
            value={form.phoneNumber}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="aaddharNumber"
            placeholder="Aaddhar Number"
            value={form.aaddharNumber}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="email"
            placeholder="E-mail"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="address"
            placeholder="Address"
            value={form.address}
            onChange={handleChange}
            required
          />
          <input type="file" name="file" onChange={handleChange} required />

          <button type="button" onClick={handleUpload}>Upload</button>
          <button type="submit">Create Record</button>
          <button type="button" onClick={handleGetRecord}>Get Record</button>
        </form>
      </div>
      {retriveRecords && (
        <div>
          <h2>Retrieved Record</h2>
          <p>Name: {retriveRecords.name}</p>
          <p>Sex: {retriveRecords.sex}</p>
          <p>Age: {retriveRecords.age}</p>
          <p>Phone Number: {retriveRecords.phoneNumber}</p>
          <p>Aaddhar Number: {retriveRecords.aaddharNumber}</p>
          <p>Email: {retriveRecords.email}</p>
          <p>Address: {retriveRecords.address}</p>
          <p>IPFS Hash:{" "} <a
              href={`https://olive-legislative-meerkat-242.mypinata.cloud/ipfs/${retriveRecords.IPFShash}`}
              target="_blank"
              rel="noopener noreferrer"
             className="bg-[#BEADFA] p-1 rounded-xl font-semibold  font-sans  hover:bg-[#DFCCFB] ">
              View file
            </a></p>
          
        </div>
      )}
      <button onClick={handleDeleteRecord}>Delete record</button>
    </div>
    <h1>Modder Management</h1>
    <div>
      <input
        type="text"
        placeholder="Enter modder address"
        value={modderAddress}
        onChange={(e) => setModderAddress(e.target.value)}
      />
      <button onClick={handleAddModder}>Add Modder</button>
    </div>
    <div>
      <h2>Existing Modders</h2>
      <button onClick={fetchModders}>Fetch Modders</button>
      <ul>
        {modderList.map((modder, index) => (
          <li key={index}>
            {modder}
            <button onClick={() => handleDeleteModder(modder)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
    </>
  );
};

export default Services;
