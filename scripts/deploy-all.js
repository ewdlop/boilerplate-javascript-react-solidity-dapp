const { deployContract } = require('./deploy');
const { deployStakingContract } = require('./deploy-staking');
const { deployLotteryContract } = require('./deploy-lottery');

async function deployAllContracts() {
  try {
    console.log('🚀 Starting Complete DApp Deployment...\n');
    console.log('=' .repeat(60));
    
    // Step 1: Deploy Token Contract
    console.log('\n📍 STEP 1: Deploying SimpleToken Contract');
    console.log('=' .repeat(60));
    const tokenResult = await deployContract();
    
    console.log('\n✅ Token deployment completed!');
    console.log(`   Address: ${tokenResult.contractAddress}`);
    
    // Step 2: Deploy Staking Contract
    console.log('\n📍 STEP 2: Deploying StakingRewards Contract');
    console.log('=' .repeat(60));
    const stakingResult = await deployStakingContract();
    
    console.log('\n✅ Staking deployment completed!');
    console.log(`   Address: ${stakingResult.stakingAddress}`);
    
    // Step 3: Deploy Lottery Contract
    console.log('\n📍 STEP 3: Deploying TokenLottery Contract');
    console.log('=' .repeat(60));
    const lotteryResult = await deployLotteryContract();
    
    console.log('\n✅ Lottery deployment completed!');
    console.log(`   Address: ${lotteryResult.lotteryAddress}`);
    
    // Final Summary
    console.log('\n🎉 ALL CONTRACTS DEPLOYED SUCCESSFULLY!');
    console.log('=' .repeat(60));
    console.log('\n📋 DEPLOYMENT SUMMARY:');
    console.log(`   🪙 SimpleToken:    ${tokenResult.contractAddress}`);
    console.log(`   🏦 StakingRewards: ${stakingResult.stakingAddress}`);
    console.log(`   🎰 TokenLottery:   ${lotteryResult.lotteryAddress}`);
    console.log(`   👤 Owner:          ${tokenResult.owner}`);
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('   1. Start your frontend: npm run frontend');
    console.log('   2. Use the Contract Deployment tab to interact with contracts');
    console.log('   3. Try staking tokens for rewards');
    console.log('   4. Buy lottery tickets and win prizes!');
    
    console.log('\n💡 CONTRACT FEATURES:');
    console.log('   🪙 SimpleToken: ERC20 token with 1M supply');
    console.log('   🏦 StakingRewards: Stake tokens, earn rewards, lock periods');
    console.log('   🎰 TokenLottery: Buy tickets, win prizes, 24h rounds');
    
    return {
      token: tokenResult,
      staking: stakingResult,
      lottery: lotteryResult
    };
    
  } catch (error) {
    console.error('\n❌ DEPLOYMENT FAILED:', error.message);
    console.error('\nPlease check the error above and try again.');
    throw error;
  }
}

// Run deployment if called directly
if (require.main === module) {
  deployAllContracts()
    .then(() => {
      console.log('\n🎊 Complete DApp deployment finished successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Complete DApp deployment failed:', error);
      process.exit(1);
    });
}

module.exports = { deployAllContracts }; 