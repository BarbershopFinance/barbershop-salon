// SPDX-License-Identifier: MIT

/* Stop by for a cut at Barbershop.Finance!

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

    event SquarePurchased(
        address indexed userAddress,
        uint256 indexed sid,
        uint256 indexed level,
        string text,
        string image,
        string link
    );

    struct Square {
        address userAddress;
        uint256 amountBurned;

        uint256 sid;
        string link;
        string image;
        string text;
    }

    address private burnAddress = 0x000000000000000000000000000000000000dEaD;

    IERC20 public hairToken;

    uint256 public constant SQUARES_PER_LEVEL = 16;
    uint256 public constant MAX_MESSAGE_LENGTH = 152;
    uint256 public constant STARTING_PRICE = 100e18; // 100 hair
    
    uint256 public numLevels;
    mapping (uint256 => mapping (uint256 => Square)) public levels;

    constructor(IERC20 _hairToken) {
        hairToken = _hairToken;
    }

    /**
     * @dev Each level increases the burn price by a factor of 10.
     * @return Current rate.
     */
    function currentRate() public view returns (uint256) {
        return 10 * numLevels * STARTING_PRICE;
    }

    // Users who have been censored due to inappropriate content
    mapping (address => bool) public blocklist;
    modifier allowedAddress() {
        require(!blocklist[msg.sender], "blocklist: address not allowed");
        _;
    }

    /**
     * @dev A square can only be purchased by one address per level.
     * @param _sid The square id.
     * @return Whether the square is available for purchase
     */
    function isValidSquare(uint256 _sid) internal view returns (bool) {
        require(_sid < SQUARES_PER_LEVEL);
        // BoardLevel storage boardLevel = allLevels[numLevels];

        // for (uint256 idx = 0; idx < boardLevel.squares.length; ++idx) {
        //     Square memory sq = boardLevel.squares[idx]; 

        //     // user already has a square this level, or square is already taken
        //     if (sq.sid == _sid || sq.userAddress == msg.sender) {
        //         return false;
        //     }
        // }

        return true;
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
        require(bytes(_text).length <= MAX_MESSAGE_LENGTH, "text too long");
        require(isValidSquare(_squareId));

        // BoardLevel memory boardLevel = allLevels[numLevels];
        uint256 amount = currentRate();
        // do i need a check?
        // require(_value <= balances[msg.sender]);
        hairToken.safeTransferFrom(msg.sender, burnAddress, amount);

        Square storage sq = levels[numLevels][_squareId];
        sq.text = _text;
        sq.image = _image;
        sq.link = _link;

        emit SquarePurchased(msg.sender, _squareId, numLevels, _text, _image, _link);
    }

    // Square can be updated until someone else takes it
    // function updateSquare(uint _idx, string _link, string _image, string _title, bool _NSFW) {
    //     // do we want this?
    // }

    // Add a new lp to the pool. Can only be called by the owner.
    function addNewLevel() internal {
        // require(allFull);
        // do we need this?
        // BoardLevel storage level = 
    }

    // View function to see total HAIR burned on frontend.
    function totalHairBurned() external view returns (uint256) {
        // todo: update
        return 100;
    }
}
