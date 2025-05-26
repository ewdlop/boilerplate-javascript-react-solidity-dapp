const express = require('express');
const Web3 = require('web3');
const { deployContract } = require('./scripts/deploy');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Initialize Web3 with more specific configuration
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.ETHEREUM_NODE_URL || 'http://localhost:8545', {
  timeout: 30000, // 30 seconds
  reconnect: {
    auto: true,
    delay: 5000,
    maxAttempts: 5,
    onTimeout: false
  }
}));

// Load contract info
let contractInfo;
try {
  contractInfo = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, 'contract-info.json'), 'utf8')
  );
  console.log('Contract info loaded:', contractInfo.address);
} catch (error) {
  console.log('No contract info found, contract needs to be deployed');
}

// Initialize contract if deployed
let contract;
if (contractInfo) {
  try {
    contract = new web3.eth.Contract(contractInfo.abi, contractInfo.address);
    console.log('Contract initialized at:', contractInfo.address);
    
    // Verify contract deployment
    web3.eth.getCode(contractInfo.address).then(code => {
      if (code === '0x') {
        console.error('Warning: No contract code found at address:', contractInfo.address);
      } else {
        console.log('Contract code verified at address:', contractInfo.address);
      }
    });
  } catch (error) {
    console.error('Error initializing contract:', error);
  }
}

// API endpoints
app.post('/deploy', async (req, res) => {
  try {
    console.log('Starting contract deployment...');
    const deploymentInfo = await deployContract();
    console.log('Contract deployed successfully:', deploymentInfo.address);
    
    contractInfo = deploymentInfo;
    contract = new web3.eth.Contract(deploymentInfo.abi, deploymentInfo.address);
    
    // Verify deployment
    const code = await web3.eth.getCode(deploymentInfo.address);
    if (code === '0x') {
      throw new Error('Contract deployment verification failed - no code at address');
    }
    
    res.json(deploymentInfo);
  } catch (error) {
    console.error('Deployment error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/contract-info', (req, res) => {
  if (!contractInfo) {
    return res.status(404).json({ error: 'Contract not deployed' });
  }
  res.json(contractInfo);
});

app.get('/balance/:address', async (req, res) => {
  try {
    if (!contract) {
      console.error('Contract not initialized');
      return res.status(404).json({ error: 'Contract not deployed' });
    }

    const address = req.params.address;
    console.log('Checking balance for address:', address);

    // Validate address format
    if (!web3.utils.isAddress(address)) {
      console.error('Invalid address format:', address);
      return res.status(400).json({ error: 'Invalid Ethereum address format' });
    }

    // Verify contract exists
    const code = await web3.eth.getCode(contractInfo.address);
    if (code === '0x') {
      console.error('No contract code found at address:', contractInfo.address);
      return res.status(404).json({ error: 'Contract not found at address' });
    }

    // Add more debugging information
    console.log('Contract address:', contractInfo.address);
    console.log('Contract ABI:', JSON.stringify(contractInfo.abi, null, 2));
    
    try {
      // Get the first account from Ganache to use as the 'from' address
      const accounts = await web3.eth.getAccounts();
      const fromAddress = accounts[0];
      console.log('Using from address:', fromAddress);

      const balance = await contract.methods.balanceOf(address).call({
        from: fromAddress
      });
      console.log('Raw balance found:', balance);
      res.json({ balance: balance.toString() });
    } catch (callError) {
      console.error('Contract call error:', callError);
      throw callError;
    }
  } catch (error) {
    console.error('Balance check error:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Please ensure the contract is properly deployed and the address is correct'
    });
  }
});

app.post('/transfer', async (req, res) => {
  try {
    if (!contract) {
      return res.status(404).json({ error: 'Contract not deployed' });
    }
    const { from, to, amount } = req.body;
    
    // Validate addresses
    if (!web3.utils.isAddress(from) || !web3.utils.isAddress(to)) {
      return res.status(400).json({ error: 'Invalid Ethereum address format' });
    }

    // Verify contract exists
    const code = await web3.eth.getCode(contractInfo.address);
    if (code === '0x') {
      return res.status(404).json({ error: 'Contract not found at address' });
    }

    // Get the first account from Ganache to use as the 'from' address
    const accounts = await web3.eth.getAccounts();
    const fromAddress = accounts[0];
    
    // Convert amount to wei
    const amountInWei = web3.utils.toWei(amount.toString(), 'ether');
    
    // Send the transaction
    const receipt = await contract.methods.transfer(to, amountInWei).send({
      from: from,
      gas: 200000
    });
    
    res.json({ transactionHash: receipt.transactionHash });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Token approval endpoint
app.post('/approve', async (req, res) => {
  try {
    if (!contract) {
      return res.status(404).json({ error: 'Contract not deployed' });
    }
    const { owner, spender, amount } = req.body;
    
    // Validate addresses
    if (!web3.utils.isAddress(owner) || !web3.utils.isAddress(spender)) {
      return res.status(400).json({ error: 'Invalid Ethereum address format' });
    }

    // Verify contract exists
    const code = await web3.eth.getCode(contractInfo.address);
    if (code === '0x') {
      return res.status(404).json({ error: 'Contract not found at address' });
    }
    
    // Convert amount to wei
    const amountInWei = web3.utils.toWei(amount.toString(), 'ether');
    
    // Send the approval transaction
    const receipt = await contract.methods.approve(spender, amountInWei).send({
      from: owner,
      gas: 200000
    });
    
    res.json({ 
      transactionHash: receipt.transactionHash,
      owner,
      spender,
      amount: amountInWei
    });
  } catch (error) {
    console.error('Approval error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check allowance endpoint
app.get('/allowance/:owner/:spender', async (req, res) => {
  try {
    if (!contract) {
      return res.status(404).json({ error: 'Contract not deployed' });
    }

    const { owner, spender } = req.params;
    
    // Validate addresses
    if (!web3.utils.isAddress(owner) || !web3.utils.isAddress(spender)) {
      return res.status(400).json({ error: 'Invalid Ethereum address format' });
    }

    // Verify contract exists
    const code = await web3.eth.getCode(contractInfo.address);
    if (code === '0x') {
      return res.status(404).json({ error: 'Contract not found at address' });
    }

    // Get allowance
    const allowance = await contract.methods.allowance(owner, spender).call();
    
    res.json({ 
      allowance: allowance.toString(),
      owner,
      spender
    });
  } catch (error) {
    console.error('Allowance check error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get total supply endpoint
app.get('/total-supply', async (req, res) => {
  try {
    if (!contract) {
      return res.status(404).json({ error: 'Contract not deployed' });
    }

    // Verify contract exists
    const code = await web3.eth.getCode(contractInfo.address);
    if (code === '0x') {
      return res.status(404).json({ error: 'Contract not found at address' });
    }

    const totalSupply = await contract.methods.totalSupply().call();
    
    res.json({ 
      totalSupply: totalSupply.toString()
    });
  } catch (error) {
    console.error('Total supply error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get token info endpoint
app.get('/token-info', async (req, res) => {
  try {
    if (!contract) {
      return res.status(404).json({ error: 'Contract not deployed' });
    }

    // Verify contract exists
    const code = await web3.eth.getCode(contractInfo.address);
    if (code === '0x') {
      return res.status(404).json({ error: 'Contract not found at address' });
    }

    const [name, symbol, decimals, totalSupply] = await Promise.all([
      contract.methods.name().call(),
      contract.methods.symbol().call(),
      contract.methods.decimals().call(),
      contract.methods.totalSupply().call()
    ]);
    
    res.json({ 
      name,
      symbol,
      decimals: decimals.toString(),
      totalSupply: totalSupply.toString(),
      address: contractInfo.address
    });
  } catch (error) {
    console.error('Token info error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;

// Function to start server with port fallback
const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log('Contract address:', contractInfo?.address || 'Not deployed');
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is already in use. Trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
  return server;
};

// Start the server
startServer(PORT); 