// SPDX-License-Identifier: MIT

/* Post your bulletin at Barbershop.Finance!

dP                         dP                                  dP
88                         88                                  88
88d888b. .d8888b. 88d888b. 88d888b. .d8888b. 88d888b. .d8888b. 88d888b. .d8888b. 88d888b.
88'  `88 88'  `88 88'  `88 88'  `88 88ooood8 88'  `88 Y8ooooo. 88'  `88 88'  `88 88'  `88
88.  .88 88.  .88 88       88.  .88 88.  ... 88             88 88    88 88.  .88 88.  .88
88Y8888' `88888P8 dP       88Y8888' `88888P' dP       `88888P' dP    dP `88888P' 88Y888P'
                                                                                 88
                                                                                 dP
                                                                                 */
pragma solidity 0.8.6;

import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import './HairToken.sol';

// Note This Bulletin is meant to be decentralized and encourages free speech.
// That said, the owner has the ability to censor addresses who post inappropriate content
// What's appropriate? Use your best judgement.
contract Bulletin is Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    event LevelComplete(uint256 level);
    event UserBannned(address bannedAddress);
    event SquarePurchased(uint256 indexed sid, address indexed userAddress, uint256 amount, string text, string image, string link);

    struct Square {
        uint256 sid;

        address userAddress;
        uint256 amount;

        string text;
        string image;
        string link;
    }

    address private burnAddress = 0x000000000000000000000000000000000000dEaD;

    IERC20 public hairToken;
    uint256 public totalHairBurned;

    uint256 public squaresPerLevel;
    uint256 public constant MAX_MESSAGE_LENGTH = 152;
    uint256 public constant STARTING_PRICE = 100e18; // 100 hair
    
    uint256 public currentLevel = 1;
    mapping (uint256 => Square) public squares;

    constructor(IERC20 _hairToken, uint256 _squaresPerLevel) {
        hairToken = _hairToken;
        squaresPerLevel = _squaresPerLevel;
    }

    /**
     * @dev Each level increases the burn price by a factor of 10.
     * @return Current rate.
     */
    function currentRate() public view returns (uint256) {
        return 10 ** (currentLevel - 1) * STARTING_PRICE;
    }

    mapping (address => bool) public blocklist;
    /**
     * @dev Users who have been censored due to inappropriate content
     */
    modifier allowedAddress() {
        require(!blocklist[msg.sender], "blocklist: address not allowed");
        _;
    }

    /**
     * @dev Each level increases the burn price by a factor of 10.
     * @param _bannedAddress The address to add to blocklist
     */
    function addToBlocklist(address _bannedAddress) onlyOwner external onlyOwner () {
        blocklist[_bannedAddress] = true;
        emit UserBannned(_bannedAddress);
    }

    /**
     * @dev Buying a square consists of burning an amount of tokens, dependent on current level.
            And providing the contents of the square.
     * @param _squareId The desired square.
     * @param _text Message. 152 character max.
     * @param _link Link in url form.
     * @param _image Image in url form.
     */
    function buySquare(
        uint256 _squareId,
        string calldata _text,
        string calldata _image,
        string calldata _link
    ) external nonReentrant allowedAddress {
        require(bytes(_text).length <= MAX_MESSAGE_LENGTH, "invalid square: text over 152 char limit");
        require(_squareId < squaresPerLevel * currentLevel, "invalid square: level not started");
        require(_squareId >= squaresPerLevel * (currentLevel - 1), "invalid square: level complete");
        require(squares[_squareId].userAddress == address(0), "invalid square: already claimed");

        uint256 amount = currentRate();
        hairToken.safeTransferFrom(msg.sender, burnAddress, amount);
        totalHairBurned = totalHairBurned + amount;

        Square storage sq = squares[_squareId];
        sq.userAddress = msg.sender;
        sq.amount = amount;
        sq.text = _text;
        sq.image = _image;
        sq.link = _link;

        emit SquarePurchased(_squareId, msg.sender, amount, _text, _image, _link);

        determineLevelCompletion();
    }

    /**
     * @dev A level is completed when all squares have been purchased.
     */
    function determineLevelCompletion() internal {
        uint256 counter = 0;
        for (uint256 idx = 0; idx < squaresPerLevel; ++idx) {
            Square memory sq = squares[(currentLevel - 1) * squaresPerLevel + idx]; 
            if (sq.userAddress != address(0)) {
                counter++;
            }
        }

        if (counter == squaresPerLevel) {
            emit LevelComplete(currentLevel);
            currentLevel++;
        }
    }
}
