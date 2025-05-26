const fs = require('fs');
const path = require('path');
const solc = require('solc');
const Web3 = require('web3');

// Connect to Ganache
const web3 = new Web3('http://localhost:8545');

async function deployLotteryContract() {
  try {
    console.log('🎰 Starting Lottery Contract Deployment...\n');

    // Get accounts
    const accounts = await web3.eth.getAccounts();
    const deployer = accounts[0];
    console.log(`📝 Deploying from account: ${deployer}`);

    // Load existing token contract info
    const contractInfoPath = path.join(__dirname, '..', 'contract-info.json');
    let tokenAddress;
    
    if (fs.existsSync(contractInfoPath)) {
      const contractInfo = JSON.parse(fs.readFileSync(contractInfoPath, 'utf8'));
      tokenAddress = contractInfo.address;
      console.log(`🪙 Using existing token contract: ${tokenAddress}`);
    } else {
      throw new Error('Token contract not found. Please deploy SimpleToken first.');
    }

    // Read the Solidity source code
    const lotteryContractPath = path.join(__dirname, '..', 'contracts', 'TokenLottery.sol');
    const lotterySource = fs.readFileSync(lotteryContractPath, 'utf8');

    // Compile the contract
    console.log('🔨 Compiling TokenLottery contract...');
    
    const input = {
      language: 'Solidity',
      sources: {
        'TokenLottery.sol': {
          content: lotterySource,
        },
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['*'],
          },
        },
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    };

    const compiled = JSON.parse(solc.compile(JSON.stringify(input)));

    // Check for compilation errors
    if (compiled.errors) {
      const errors = compiled.errors.filter(error => error.severity === 'error');
      if (errors.length > 0) {
        console.error('❌ Compilation errors:');
        errors.forEach(error => console.error(error.formattedMessage));
        return;
      }
    }

    const contract = compiled.contracts['TokenLottery.sol']['TokenLottery'];
    const abi = contract.abi;
    const bytecode = contract.evm.bytecode.object;

    console.log('✅ Contract compiled successfully!');

    // Get current gas price and estimate gas
    const gasPrice = await web3.eth.getGasPrice();
    console.log(`⛽ Current gas price: ${web3.utils.fromWei(gasPrice, 'gwei')} Gwei`);

    // Create contract instance
    const lotteryContract = new web3.eth.Contract(abi);

    // Estimate gas for deployment
    const gasEstimate = await lotteryContract.deploy({
      data: '0x' + bytecode,
      arguments: [tokenAddress]
    }).estimateGas({ from: deployer });

    const gasLimit = Math.floor(gasEstimate * 1.2); // Add 20% buffer
    console.log(`📊 Estimated gas: ${gasEstimate.toLocaleString()}`);
    console.log(`📊 Gas limit (with buffer): ${gasLimit.toLocaleString()}`);

    // Deploy the contract
    console.log('\n🚀 Deploying TokenLottery contract...');
    
    const deployedContract = await lotteryContract.deploy({
      data: '0x' + bytecode,
      arguments: [tokenAddress]
    }).send({
      from: deployer,
      gas: gasLimit,
      gasPrice: gasPrice
    });

    const lotteryAddress = deployedContract.options.address;
    console.log(`✅ TokenLottery contract deployed successfully!`);
    console.log(`📍 Contract address: ${lotteryAddress}`);

    // Get deployment transaction details
    const receipt = await web3.eth.getTransactionReceipt(deployedContract.options.address);
    console.log(`⛽ Gas used: ${receipt.gasUsed?.toLocaleString() || 'N/A'}`);
    console.log(`💰 Deployment cost: ${web3.utils.fromWei((receipt.gasUsed * gasPrice).toString(), 'ether')} ETH`);

    // Verify contract deployment
    const code = await web3.eth.getCode(lotteryAddress);
    if (code === '0x') {
      throw new Error('Contract deployment failed - no code at address');
    }

    // Test basic contract functions
    console.log('\n🧪 Testing contract functions...');
    
    const lotteryInstance = new web3.eth.Contract(abi, lotteryAddress);
    
    // Test view functions
    const owner = await lotteryInstance.methods.owner().call();
    const tokenAddr = await lotteryInstance.methods.token().call();
    const ticketPrice = await lotteryInstance.methods.ticketPrice().call();
    const maxTickets = await lotteryInstance.methods.maxTicketsPerRound().call();
    const currentRound = await lotteryInstance.methods.currentRound().call();
    
    console.log(`👤 Owner: ${owner}`);
    console.log(`🪙 Token: ${tokenAddr}`);
    console.log(`🎫 Ticket Price: ${web3.utils.fromWei(ticketPrice, 'ether')} STK`);
    console.log(`🎯 Max Tickets per Round: ${maxTickets}`);
    console.log(`🔄 Current Round: ${currentRound}`);

    // Get current round info
    const roundInfo = await lotteryInstance.methods.getCurrentRoundInfo().call();
    console.log(`🎰 Round ${roundInfo.roundId} - Tickets: ${roundInfo.totalTickets}/${maxTickets}`);
    console.log(`💰 Current Prize Pool: ${web3.utils.fromWei(roundInfo.prizePool, 'ether')} STK`);

    // Save lottery contract info
    const lotteryInfo = {
      address: lotteryAddress,
      abi: abi,
      bytecode: bytecode,
      deployedAt: new Date().toISOString(),
      deployer: deployer,
      tokenAddress: tokenAddress,
      ticketPrice: web3.utils.fromWei(ticketPrice, 'ether'),
      maxTicketsPerRound: maxTickets,
      gasUsed: receipt.gasUsed,
      deploymentCost: web3.utils.fromWei((receipt.gasUsed * gasPrice).toString(), 'ether')
    };

    const lotteryInfoPath = path.join(__dirname, '..', 'lottery-contract-info.json');
    fs.writeFileSync(lotteryInfoPath, JSON.stringify(lotteryInfo, null, 2));
    console.log(`💾 Lottery contract info saved to: ${lotteryInfoPath}`);

    console.log('\n🎉 Lottery contract deployment completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   🪙 Token Contract: ${tokenAddress}`);
    console.log(`   🎰 Lottery Contract: ${lotteryAddress}`);
    console.log(`   👤 Owner: ${deployer}`);
    console.log(`   🎫 Ticket Price: ${web3.utils.fromWei(ticketPrice, 'ether')} STK`);
    console.log(`   🎯 Max Tickets: ${maxTickets} per round`);
    console.log(`   🔄 Current Round: ${currentRound}`);
    console.log(`   ⏰ Round Duration: 24 hours`);

    return {
      lotteryAddress,
      tokenAddress,
      abi,
      owner: deployer
    };

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    if (error.data) {
      console.error('Error data:', error.data);
    }
    throw error;
  }
}

// Run deployment if called directly
if (require.main === module) {
  deployLotteryContract()
    .then(() => {
      console.log('\n✅ Deployment script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Deployment script failed:', error);
      process.exit(1);
    });
}

module.exports = { deployLotteryContract }; 