const Web3 = require('web3');
const fs = require('fs');
const path = require('path');
const solc = require('solc');

// Read the contract source
const contractPath = path.resolve(__dirname, '../contracts/SimpleToken.sol');
const source = fs.readFileSync(contractPath, 'utf8');

// Compile the contract
function compileContract() {
  const input = {
    language: 'Solidity',
    sources: {
      'SimpleToken.sol': {
        content: source,
      },
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      outputSelection: {
        '*': {
          '*': ['*'],
        },
      },
      evmVersion: 'london'
    },
  };

  try {
    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    
    if (output.errors) {
      const errors = output.errors.filter(error => error.severity === 'error');
      if (errors.length > 0) {
        throw new Error(`Compilation errors: ${JSON.stringify(errors, null, 2)}`);
      }
    }

    const contract = output.contracts['SimpleToken.sol']['SimpleToken'];
    if (!contract) {
      throw new Error('Contract compilation failed - no output');
    }

    return {
      abi: contract.abi,
      bytecode: contract.evm.bytecode.object,
    };
  } catch (error) {
    console.error('Compilation error:', error);
    throw error;
  }
}

async function deployContract() {
  try {
    // Initialize Web3
    const web3 = new Web3(process.env.ETHEREUM_NODE_URL || 'http://localhost:8545');
    
    // Get the account
    const accounts = await web3.eth.getAccounts();
    const account = accounts[0];

    console.log('Deploying from account:', account);

    // Compile the contract
    console.log('Compiling contract...');
    const { abi, bytecode } = compileContract();
    console.log('Contract compiled successfully');

    // Create contract instance
    const TokenContract = new web3.eth.Contract(abi);

    // Get the deployment transaction
    const deployTransaction = TokenContract.deploy({
      data: bytecode,
      arguments: [
        'Simple Token',
        'STK',
        18,
        '1000000'
      ],
    });

    // Estimate gas
    console.log('Estimating gas...');
    const gasEstimate = await deployTransaction.estimateGas({
      from: account
    });

    // Add 20% buffer to gas estimate
    const gasLimit = Math.floor(gasEstimate * 1.2);
    const gasPrice = await web3.eth.getGasPrice();

    console.log('Estimated gas:', gasEstimate);
    console.log('Gas limit with buffer:', gasLimit);
    console.log('Gas price:', gasPrice);
    console.log('Deploying from account:', account);
    console.log('Initial supply:', '1000000 tokens');

    // Deploy the contract with the calculated gas limit
    console.log('Deploying contract...');
    const token = await deployTransaction.send({
      from: account,
      gas: gasLimit,
      gasPrice: gasPrice
    });

    console.log('Contract deployed at:', token.options.address);
    
    // Verify the initial supply
    const initialBalance = await token.methods.balanceOf(account).call();
    console.log('Initial balance of deployer:', web3.utils.fromWei(initialBalance, 'ether'));

    // Save the contract address and ABI
    const deploymentInfo = {
      address: token.options.address,
      abi: abi,
    };

    fs.writeFileSync(
      path.resolve(__dirname, '../contract-info.json'),
      JSON.stringify(deploymentInfo, null, 2)
    );

    return deploymentInfo;
  } catch (error) {
    console.error('Deployment failed:', error);
    if (error.receipt) {
      console.error('Transaction receipt:', error.receipt);
    }
    throw error;
  }
}

// Run deployment if this script is called directly
if (require.main === module) {
  deployContract()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { deployContract }; 