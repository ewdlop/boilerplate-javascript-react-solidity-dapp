const fs = require('fs');
const path = require('path');
const solc = require('solc');
const Web3 = require('web3');

// Connect to Ganache
const web3 = new Web3('http://localhost:8545');

async function deployStakingContract() {
  try {
    console.log('🚀 Starting Staking Contract Deployment...\n');

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
    const stakingContractPath = path.join(__dirname, '..', 'contracts', 'StakingRewards.sol');
    const stakingSource = fs.readFileSync(stakingContractPath, 'utf8');

    // Compile the contract
    console.log('🔨 Compiling StakingRewards contract...');
    
    const input = {
      language: 'Solidity',
      sources: {
        'StakingRewards.sol': {
          content: stakingSource,
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

    const contract = compiled.contracts['StakingRewards.sol']['StakingRewards'];
    const abi = contract.abi;
    const bytecode = contract.evm.bytecode.object;

    console.log('✅ Contract compiled successfully!');

    // Get current gas price and estimate gas
    const gasPrice = await web3.eth.getGasPrice();
    console.log(`⛽ Current gas price: ${web3.utils.fromWei(gasPrice, 'gwei')} Gwei`);

    // Create contract instance
    const stakingContract = new web3.eth.Contract(abi);

    // Estimate gas for deployment
    const gasEstimate = await stakingContract.deploy({
      data: '0x' + bytecode,
      arguments: [tokenAddress, tokenAddress] // Using same token for staking and rewards
    }).estimateGas({ from: deployer });

    const gasLimit = Math.floor(gasEstimate * 1.2); // Add 20% buffer
    console.log(`📊 Estimated gas: ${gasEstimate.toLocaleString()}`);
    console.log(`📊 Gas limit (with buffer): ${gasLimit.toLocaleString()}`);

    // Deploy the contract
    console.log('\n🚀 Deploying StakingRewards contract...');
    
    const deployedContract = await stakingContract.deploy({
      data: '0x' + bytecode,
      arguments: [tokenAddress, tokenAddress] // Using same token for staking and rewards
    }).send({
      from: deployer,
      gas: gasLimit,
      gasPrice: gasPrice
    });

    const stakingAddress = deployedContract.options.address;
    console.log(`✅ StakingRewards contract deployed successfully!`);
    console.log(`📍 Contract address: ${stakingAddress}`);

    // Get deployment transaction details
    const receipt = await web3.eth.getTransactionReceipt(deployedContract.options.address);
    console.log(`⛽ Gas used: ${receipt.gasUsed?.toLocaleString() || 'N/A'}`);
    console.log(`💰 Deployment cost: ${web3.utils.fromWei((receipt.gasUsed * gasPrice).toString(), 'ether')} ETH`);

    // Verify contract deployment
    const code = await web3.eth.getCode(stakingAddress);
    if (code === '0x') {
      throw new Error('Contract deployment failed - no code at address');
    }

    // Test basic contract functions
    console.log('\n🧪 Testing contract functions...');
    
    const stakingInstance = new web3.eth.Contract(abi, stakingAddress);
    
    // Test view functions
    const owner = await stakingInstance.methods.owner().call();
    const stakingTokenAddr = await stakingInstance.methods.stakingToken().call();
    const rewardsTokenAddr = await stakingInstance.methods.rewardsToken().call();
    const duration = await stakingInstance.methods.duration().call();
    
    console.log(`👤 Owner: ${owner}`);
    console.log(`🪙 Staking Token: ${stakingTokenAddr}`);
    console.log(`🎁 Rewards Token: ${rewardsTokenAddr}`);
    console.log(`⏰ Reward Duration: ${duration / (24 * 60 * 60)} days`);

    // Save staking contract info
    const stakingInfo = {
      address: stakingAddress,
      abi: abi,
      bytecode: bytecode,
      deployedAt: new Date().toISOString(),
      deployer: deployer,
      stakingToken: tokenAddress,
      rewardsToken: tokenAddress,
      gasUsed: receipt.gasUsed,
      deploymentCost: web3.utils.fromWei((receipt.gasUsed * gasPrice).toString(), 'ether')
    };

    const stakingInfoPath = path.join(__dirname, '..', 'staking-contract-info.json');
    fs.writeFileSync(stakingInfoPath, JSON.stringify(stakingInfo, null, 2));
    console.log(`💾 Staking contract info saved to: ${stakingInfoPath}`);

    // Initialize rewards (optional)
    console.log('\n🎁 Setting up initial rewards...');
    
    // Transfer some tokens to the staking contract for rewards
    const tokenContract = new web3.eth.Contract(
      JSON.parse(fs.readFileSync(contractInfoPath, 'utf8')).abi,
      tokenAddress
    );

    // Transfer 10,000 STK tokens to staking contract for rewards
    const rewardAmount = web3.utils.toWei('10000', 'ether');
    await tokenContract.methods.transfer(stakingAddress, rewardAmount).send({
      from: deployer,
      gas: 100000
    });

    // Notify the staking contract about the rewards
    await stakingInstance.methods.notifyRewardAmount(rewardAmount).send({
      from: deployer,
      gas: 200000
    });

    console.log(`✅ Transferred ${web3.utils.fromWei(rewardAmount, 'ether')} STK tokens for rewards`);
    console.log(`✅ Reward period started for 7 days`);

    // Calculate and display APY
    const apy = await stakingInstance.methods.calculateAPY().call();
    console.log(`📈 Current APY: ${apy}%`);

    console.log('\n🎉 Staking contract deployment completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   🪙 Token Contract: ${tokenAddress}`);
    console.log(`   🏦 Staking Contract: ${stakingAddress}`);
    console.log(`   👤 Owner: ${deployer}`);
    console.log(`   💰 Initial Rewards: ${web3.utils.fromWei(rewardAmount, 'ether')} STK`);
    console.log(`   ⏰ Reward Duration: 7 days`);
    console.log(`   📈 APY: ${apy}%`);

    return {
      stakingAddress,
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
  deployStakingContract()
    .then(() => {
      console.log('\n✅ Deployment script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Deployment script failed:', error);
      process.exit(1);
    });
}

module.exports = { deployStakingContract }; 