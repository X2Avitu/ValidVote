// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ValidVote {
    struct Poll {
        string question;
        string[] options;
        uint256 commitEndTime;
        uint256 revealEndTime;
        bool finalized;
        address creator;
    }

    // pollId => Poll
    mapping(uint256 => Poll) public polls;
    uint256 public pollCount;

    // pollId => optionIndex => votes count
    mapping(uint256 => mapping(uint256 => uint256)) public pollResults;

    // pollId => voter => commitment hash
    mapping(uint256 => mapping(address => bytes32)) public commitments;

    // pollId => voter => has revealed
    mapping(uint256 => mapping(address => bool)) public hasRevealed;

    event PollCreated(uint256 indexed pollId, string question, uint256 commitEndTime, uint256 revealEndTime);
    event VoteCommitted(uint256 indexed pollId, address indexed voter);
    event VoteRevealed(uint256 indexed pollId, address indexed voter, uint256 optionIndex);
    event PollFinalized(uint256 indexed pollId);

    function createPoll(
        string memory _question,
        string[] memory _options,
        uint256 _commitDuration,
        uint256 _revealDuration
    ) external returns (uint256) {
        require(_options.length > 1, "Must have at least 2 options");
        require(_commitDuration > 0 && _revealDuration > 0, "Durations must be > 0");

        uint256 pollId = pollCount++;
        Poll storage newPoll = polls[pollId];
        newPoll.question = _question;
        newPoll.options = _options;
        newPoll.commitEndTime = block.timestamp + _commitDuration;
        newPoll.revealEndTime = newPoll.commitEndTime + _revealDuration;
        newPoll.creator = msg.sender;

        emit PollCreated(pollId, _question, newPoll.commitEndTime, newPoll.revealEndTime);
        return pollId;
    }

    function commitVote(uint256 _pollId, bytes32 _commitment) external {
        Poll storage poll = polls[_pollId];
        require(block.timestamp <= poll.commitEndTime, "Commit phase ended");
        require(commitments[_pollId][msg.sender] == bytes32(0), "Already committed");

        commitments[_pollId][msg.sender] = _commitment;
        emit VoteCommitted(_pollId, msg.sender);
    }

    function revealVote(uint256 _pollId, uint256 _optionIndex, bytes32 _salt) external {
        Poll storage poll = polls[_pollId];
        require(block.timestamp > poll.commitEndTime, "Commit phase not ended");
        require(block.timestamp <= poll.revealEndTime, "Reveal phase ended");
        require(!hasRevealed[_pollId][msg.sender], "Already revealed");
        require(_optionIndex < poll.options.length, "Invalid option");

        bytes32 commitment = commitments[_pollId][msg.sender];
        require(commitment != bytes32(0), "No commitment found");

        bytes32 expectedHash = keccak256(abi.encodePacked(_optionIndex, _salt, msg.sender, _pollId));
        require(commitment == expectedHash, "Invalid reveal");

        hasRevealed[_pollId][msg.sender] = true;
        pollResults[_pollId][_optionIndex]++;

        emit VoteRevealed(_pollId, msg.sender, _optionIndex);
    }

    function finalizePoll(uint256 _pollId) external {
        Poll storage poll = polls[_pollId];
        require(block.timestamp > poll.revealEndTime, "Reveal phase not ended");
        require(!poll.finalized, "Already finalized");

        poll.finalized = true;
        emit PollFinalized(_pollId);
    }

    function getPollOptions(uint256 _pollId) external view returns (string[] memory) {
        return polls[_pollId].options;
    }

    function getPollResults(uint256 _pollId) external view returns (uint256[] memory) {
        Poll storage poll = polls[_pollId];
        uint256[] memory results = new uint256[](poll.options.length);
        for (uint256 i = 0; i < poll.options.length; i++) {
            results[i] = pollResults[_pollId][i];
        }
        return results;
    }
}
