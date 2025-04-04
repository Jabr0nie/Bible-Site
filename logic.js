const { Web3 } = require('web3');
const config = require('./config');
const ABI = require('./Abi');

const provider = new Web3.providers.HttpProvider("https://go.getblock.io/60e5a3f8fbcd4953b12b226760d7e5e1/");
const web3 = new Web3(provider);

const privateKey = process.env.PRIVATE_KEY;
const URL = process.env.URL;

const BibleAddress = '0x2896c67c0cea9D4954d6d8f695b6680fCfa7C0e0';
const BibleContract = new web3.eth.Contract(ABI, BibleAddress);

