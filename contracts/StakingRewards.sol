// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract StakingRewards {
    IERC20 public immutable stakingToken;
    IERC20 public immutable rewardsToken;
    
    address public owner;
    uint256 public duration = 7 days;
    uint256 public finishAt;
    uint256 public updatedAt;
    uint256 public rewardRate;
    uint256 public rewardPerTokenStored;
    uint256 public totalSupply;
    
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;
    mapping(address => uint256) public balanceOf;
    mapping(address => uint256) public stakedAt;
    mapping(address => uint256) public lockPeriod;
    
    // Events
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardAdded(uint256 reward);
    event EmergencyWithdraw(address indexed user, uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }
    
    modifier updateReward(address _account) {
        rewardPerTokenStored = rewardPerToken();
        updatedAt = lastTimeRewardApplicable();
        
        if (_account != address(0)) {
            rewards[_account] = earned(_account);
            userRewardPerTokenPaid[_account] = rewardPerTokenStored;
        }
        _;
    }
    
    constructor(address _stakingToken, address _rewardToken) {
        owner = msg.sender;
        stakingToken = IERC20(_stakingToken);
        rewardsToken = IERC20(_rewardToken);
    }
    
    function lastTimeRewardApplicable() public view returns (uint256) {
        return _min(finishAt, block.timestamp);
    }
    
    function rewardPerToken() public view returns (uint256) {
        if (totalSupply == 0) {
            return rewardPerTokenStored;
        }
        
        return rewardPerTokenStored + 
            (rewardRate * (lastTimeRewardApplicable() - updatedAt) * 1e18) / totalSupply;
    }
    
    function stake(uint256 _amount) external updateReward(msg.sender) {
        require(_amount > 0, "Amount must be greater than 0");
        
        stakingToken.transferFrom(msg.sender, address(this), _amount);
        balanceOf[msg.sender] += _amount;
        totalSupply += _amount;
        stakedAt[msg.sender] = block.timestamp;
        
        emit Staked(msg.sender, _amount);
    }
    
    function stakeWithLock(uint256 _amount, uint256 _lockDays) external updateReward(msg.sender) {
        require(_amount > 0, "Amount must be greater than 0");
        require(_lockDays >= 1 && _lockDays <= 365, "Lock period must be 1-365 days");
        
        stakingToken.transferFrom(msg.sender, address(this), _amount);
        balanceOf[msg.sender] += _amount;
        totalSupply += _amount;
        stakedAt[msg.sender] = block.timestamp;
        lockPeriod[msg.sender] = _lockDays * 1 days;
        
        emit Staked(msg.sender, _amount);
    }
    
    function withdraw(uint256 _amount) external updateReward(msg.sender) {
        require(_amount > 0, "Amount must be greater than 0");
        require(balanceOf[msg.sender] >= _amount, "Insufficient staked balance");
        
        // Check lock period
        if (lockPeriod[msg.sender] > 0) {
            require(
                block.timestamp >= stakedAt[msg.sender] + lockPeriod[msg.sender],
                "Tokens are still locked"
            );
        }
        
        balanceOf[msg.sender] -= _amount;
        totalSupply -= _amount;
        stakingToken.transfer(msg.sender, _amount);
        
        emit Withdrawn(msg.sender, _amount);
    }
    
    function emergencyWithdraw() external {
        uint256 amount = balanceOf[msg.sender];
        require(amount > 0, "No staked tokens");
        
        balanceOf[msg.sender] = 0;
        totalSupply -= amount;
        
        // Apply penalty for emergency withdrawal (10% penalty)
        uint256 penalty = amount * 10 / 100;
        uint256 withdrawAmount = amount - penalty;
        
        stakingToken.transfer(msg.sender, withdrawAmount);
        // Penalty goes to contract owner
        stakingToken.transfer(owner, penalty);
        
        // Reset rewards
        rewards[msg.sender] = 0;
        userRewardPerTokenPaid[msg.sender] = 0;
        
        emit EmergencyWithdraw(msg.sender, withdrawAmount);
    }
    
    function earned(address _account) public view returns (uint256) {
        return (balanceOf[_account] * 
            (rewardPerToken() - userRewardPerTokenPaid[_account])) / 1e18 + 
            rewards[_account];
    }
    
    function getReward() external updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            
            // Apply lock period bonus
            if (lockPeriod[msg.sender] > 0) {
                uint256 bonus = calculateLockBonus(reward, lockPeriod[msg.sender]);
                reward += bonus;
            }
            
            rewardsToken.transfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }
    
    function calculateLockBonus(uint256 _reward, uint256 _lockPeriod) internal pure returns (uint256) {
        // Bonus calculation: 1% per 30 days locked, max 12%
        uint256 lockDays = _lockPeriod / 1 days;
        uint256 bonusPercent = (lockDays / 30) * 1; // 1% per 30 days
        if (bonusPercent > 12) bonusPercent = 12; // Max 12% bonus
        
        return (_reward * bonusPercent) / 100;
    }
    
    function compound() external updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "No rewards to compound");
        require(address(stakingToken) == address(rewardsToken), "Cannot compound different tokens");
        
        rewards[msg.sender] = 0;
        balanceOf[msg.sender] += reward;
        totalSupply += reward;
        
        emit Staked(msg.sender, reward);
        emit RewardPaid(msg.sender, reward);
    }
    
    // Owner functions
    function setRewardsDuration(uint256 _duration) external onlyOwner {
        require(finishAt < block.timestamp, "Reward duration not finished");
        duration = _duration;
    }
    
    function notifyRewardAmount(uint256 _amount) external onlyOwner updateReward(address(0)) {
        if (block.timestamp >= finishAt) {
            rewardRate = _amount / duration;
        } else {
            uint256 remainingRewards = (finishAt - block.timestamp) * rewardRate;
            rewardRate = (_amount + remainingRewards) / duration;
        }
        
        require(rewardRate > 0, "Reward rate must be greater than 0");
        require(
            rewardRate * duration <= rewardsToken.balanceOf(address(this)),
            "Reward amount too high"
        );
        
        finishAt = block.timestamp + duration;
        updatedAt = block.timestamp;
        
        emit RewardAdded(_amount);
    }
    
    // View functions
    function getStakingInfo(address _account) external view returns (
        uint256 stakedAmount,
        uint256 earnedRewards,
        uint256 lockTimeRemaining,
        uint256 stakingDuration,
        bool canWithdraw
    ) {
        stakedAmount = balanceOf[_account];
        earnedRewards = earned(_account);
        
        if (lockPeriod[_account] > 0) {
            uint256 unlockTime = stakedAt[_account] + lockPeriod[_account];
            lockTimeRemaining = unlockTime > block.timestamp ? unlockTime - block.timestamp : 0;
        }
        
        stakingDuration = stakedAt[_account] > 0 ? block.timestamp - stakedAt[_account] : 0;
        canWithdraw = lockTimeRemaining == 0;
    }
    
    function getPoolInfo() external view returns (
        uint256 totalStaked,
        uint256 rewardRatePerSecond,
        uint256 periodFinish,
        uint256 lastUpdate,
        uint256 rewardPerTokenValue
    ) {
        totalStaked = totalSupply;
        rewardRatePerSecond = rewardRate;
        periodFinish = finishAt;
        lastUpdate = updatedAt;
        rewardPerTokenValue = rewardPerToken();
    }
    
    function calculateAPY() external view returns (uint256) {
        if (totalSupply == 0 || rewardRate == 0) return 0;
        
        // APY = (rewardRate * 365 days * 100) / totalSupply
        return (rewardRate * 365 days * 100) / totalSupply;
    }
    
    // Utility functions
    function _min(uint256 x, uint256 y) private pure returns (uint256) {
        return x <= y ? x : y;
    }
    
    // Emergency functions
    function recoverERC20(address tokenAddress, uint256 tokenAmount) external onlyOwner {
        require(tokenAddress != address(stakingToken), "Cannot withdraw staking token");
        IERC20(tokenAddress).transfer(owner, tokenAmount);
    }
    
    function updateOwner(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
} 