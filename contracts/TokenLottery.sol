// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract TokenLottery {
    IERC20 public immutable token;
    address public owner;
    
    uint256 public ticketPrice = 10 * 10**18; // 10 STK tokens
    uint256 public maxTicketsPerRound = 100;
    uint256 public currentRound = 1;
    
    struct Round {
        uint256 roundId;
        uint256 startTime;
        uint256 endTime;
        uint256 totalTickets;
        uint256 prizePool;
        address winner;
        bool isActive;
        bool isFinished;
    }
    
    struct Ticket {
        address player;
        uint256 roundId;
        uint256 ticketNumber;
        uint256 purchaseTime;
    }
    
    mapping(uint256 => Round) public rounds;
    mapping(uint256 => Ticket[]) public roundTickets;
    mapping(address => uint256[]) public playerTickets;
    mapping(uint256 => mapping(address => uint256)) public playerTicketCount;
    
    // Events
    event RoundStarted(uint256 indexed roundId, uint256 startTime, uint256 endTime);
    event TicketPurchased(address indexed player, uint256 indexed roundId, uint256 ticketNumber);
    event RoundFinished(uint256 indexed roundId, address indexed winner, uint256 prizeAmount);
    event PrizeWithdrawn(address indexed winner, uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }
    
    modifier roundActive(uint256 _roundId) {
        require(rounds[_roundId].isActive, "Round not active");
        require(block.timestamp <= rounds[_roundId].endTime, "Round ended");
        _;
    }
    
    constructor(address _token) {
        token = IERC20(_token);
        owner = msg.sender;
        _startNewRound();
    }
    
    function buyTicket() external roundActive(currentRound) {
        require(
            rounds[currentRound].totalTickets < maxTicketsPerRound,
            "Round is full"
        );
        
        // Transfer tokens from player
        token.transferFrom(msg.sender, address(this), ticketPrice);
        
        // Create ticket
        uint256 ticketNumber = rounds[currentRound].totalTickets + 1;
        Ticket memory newTicket = Ticket({
            player: msg.sender,
            roundId: currentRound,
            ticketNumber: ticketNumber,
            purchaseTime: block.timestamp
        });
        
        roundTickets[currentRound].push(newTicket);
        playerTickets[msg.sender].push(ticketNumber);
        playerTicketCount[currentRound][msg.sender]++;
        
        rounds[currentRound].totalTickets++;
        rounds[currentRound].prizePool += ticketPrice;
        
        emit TicketPurchased(msg.sender, currentRound, ticketNumber);
        
        // Auto-finish round if full
        if (rounds[currentRound].totalTickets >= maxTicketsPerRound) {
            _finishRound(currentRound);
        }
    }
    
    function buyMultipleTickets(uint256 _amount) external roundActive(currentRound) {
        require(_amount > 0 && _amount <= 10, "Can buy 1-10 tickets at once");
        require(
            rounds[currentRound].totalTickets + _amount <= maxTicketsPerRound,
            "Not enough tickets available"
        );
        
        uint256 totalCost = ticketPrice * _amount;
        token.transferFrom(msg.sender, address(this), totalCost);
        
        for (uint256 i = 0; i < _amount; i++) {
            uint256 ticketNumber = rounds[currentRound].totalTickets + 1;
            Ticket memory newTicket = Ticket({
                player: msg.sender,
                roundId: currentRound,
                ticketNumber: ticketNumber,
                purchaseTime: block.timestamp
            });
            
            roundTickets[currentRound].push(newTicket);
            playerTickets[msg.sender].push(ticketNumber);
            playerTicketCount[currentRound][msg.sender]++;
            
            rounds[currentRound].totalTickets++;
            
            emit TicketPurchased(msg.sender, currentRound, ticketNumber);
        }
        
        rounds[currentRound].prizePool += totalCost;
        
        // Auto-finish round if full
        if (rounds[currentRound].totalTickets >= maxTicketsPerRound) {
            _finishRound(currentRound);
        }
    }
    
    function finishRound() external onlyOwner {
        require(rounds[currentRound].isActive, "Round not active");
        require(
            block.timestamp > rounds[currentRound].endTime || 
            rounds[currentRound].totalTickets >= maxTicketsPerRound,
            "Round cannot be finished yet"
        );
        
        _finishRound(currentRound);
    }
    
    function _finishRound(uint256 _roundId) internal {
        require(rounds[_roundId].totalTickets > 0, "No tickets sold");
        
        // Generate pseudo-random winner
        uint256 winningTicket = _generateRandomNumber(_roundId) % rounds[_roundId].totalTickets;
        address winner = roundTickets[_roundId][winningTicket].player;
        
        rounds[_roundId].winner = winner;
        rounds[_roundId].isActive = false;
        rounds[_roundId].isFinished = true;
        
        // Calculate prize (90% to winner, 10% to house)
        uint256 prizeAmount = (rounds[_roundId].prizePool * 90) / 100;
        uint256 houseAmount = rounds[_roundId].prizePool - prizeAmount;
        
        // Transfer prize to winner
        token.transfer(winner, prizeAmount);
        
        // Transfer house cut to owner
        token.transfer(owner, houseAmount);
        
        emit RoundFinished(_roundId, winner, prizeAmount);
        
        // Start new round
        _startNewRound();
    }
    
    function _startNewRound() internal {
        currentRound++;
        rounds[currentRound] = Round({
            roundId: currentRound,
            startTime: block.timestamp,
            endTime: block.timestamp + 24 hours, // 24 hour rounds
            totalTickets: 0,
            prizePool: 0,
            winner: address(0),
            isActive: true,
            isFinished: false
        });
        
        emit RoundStarted(currentRound, block.timestamp, block.timestamp + 24 hours);
    }
    
    function _generateRandomNumber(uint256 _roundId) internal view returns (uint256) {
        // Simple pseudo-random number generation
        // Note: This is not truly random and should not be used in production
        return uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.difficulty,
            _roundId,
            rounds[_roundId].totalTickets,
            msg.sender
        )));
    }
    
    // View functions
    function getCurrentRoundInfo() external view returns (
        uint256 roundId,
        uint256 startTime,
        uint256 endTime,
        uint256 totalTickets,
        uint256 prizePool,
        uint256 timeRemaining,
        bool isActive
    ) {
        Round memory round = rounds[currentRound];
        return (
            round.roundId,
            round.startTime,
            round.endTime,
            round.totalTickets,
            round.prizePool,
            round.endTime > block.timestamp ? round.endTime - block.timestamp : 0,
            round.isActive
        );
    }
    
    function getRoundInfo(uint256 _roundId) external view returns (
        uint256 roundId,
        uint256 startTime,
        uint256 endTime,
        uint256 totalTickets,
        uint256 prizePool,
        address winner,
        bool isFinished
    ) {
        Round memory round = rounds[_roundId];
        return (
            round.roundId,
            round.startTime,
            round.endTime,
            round.totalTickets,
            round.prizePool,
            round.winner,
            round.isFinished
        );
    }
    
    function getPlayerTickets(address _player, uint256 _roundId) external view returns (uint256) {
        return playerTicketCount[_roundId][_player];
    }
    
    function getRoundTickets(uint256 _roundId) external view returns (Ticket[] memory) {
        return roundTickets[_roundId];
    }
    
    function getPlayerHistory(address _player) external view returns (uint256[] memory) {
        return playerTickets[_player];
    }
    
    function calculateWinChance(address _player, uint256 _roundId) external view returns (uint256) {
        if (rounds[_roundId].totalTickets == 0) return 0;
        return (playerTicketCount[_roundId][_player] * 10000) / rounds[_roundId].totalTickets; // Returns percentage * 100
    }
    
    // Owner functions
    function setTicketPrice(uint256 _newPrice) external onlyOwner {
        require(_newPrice > 0, "Price must be greater than 0");
        ticketPrice = _newPrice;
    }
    
    function setMaxTicketsPerRound(uint256 _maxTickets) external onlyOwner {
        require(_maxTickets > 0 && _maxTickets <= 1000, "Invalid max tickets");
        maxTicketsPerRound = _maxTickets;
    }
    
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = token.balanceOf(address(this));
        token.transfer(owner, balance);
    }
    
    function updateOwner(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        owner = _newOwner;
    }
    
    // Statistics
    function getTotalRounds() external view returns (uint256) {
        return currentRound;
    }
    
    function getContractStats() external view returns (
        uint256 totalRounds,
        uint256 currentRoundTickets,
        uint256 currentPrizePool,
        uint256 ticketPriceWei
    ) {
        return (
            currentRound,
            rounds[currentRound].totalTickets,
            rounds[currentRound].prizePool,
            ticketPrice
        );
    }
} 