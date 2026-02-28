// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title CatboticaZodiacBadges
 * @author BeyondVerse Studio — Silo 09
 * @notice ERC-1155 contract for the Catbotica Celestial Cat-Circuit Zodiac Badge Collection.
 *         Twelve zodiac-frequency calibration templates pre-loaded into every Catbotica unit's firmware.
 *         Each annual Luck-Module Recalibration Protocol (LMRP) cycle activates the corresponding badge.
 *
 * @dev Token IDs 1-12 map to Chinese zodiac animals:
 *      1=Tiger(2022), 2=Rabbit(2023), 3=Dragon(2024), 4=Snake(2025), 5=Horse(2026),
 *      6=Goat(2027), 7=Monkey(2028), 8=Rooster(2029), 9=Dog(2030), 10=Pig(2031),
 *      11=Rat(2032), 12=Ox(2033)
 *
 *      Lore Anchor: LS-CATBOTICA-ANCHOR-012
 *      Royalty: 7.5% (750 bps) — 80% treasury / 20% UGC creator fund
 */
contract CatboticaZodiacBadges is
    ERC1155,
    ERC1155Supply,
    ERC2981,
    AccessControl,
    Pausable
{
    using Strings for uint256;

    // ══════════════════════════════════════════════════════════════
    //                          ROLES
    // ══════════════════════════════════════════════════════════════

    /// @notice Role for addresses authorized to mint badges (claim service backend).
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @notice Role for addresses authorized to update metadata URIs.
    bytes32 public constant URI_SETTER_ROLE = keccak256("URI_SETTER_ROLE");

    // ══════════════════════════════════════════════════════════════
    //                        CONSTANTS
    // ══════════════════════════════════════════════════════════════

    /// @notice Total number of zodiac badges in the collection.
    uint256 public constant TOTAL_ZODIAC_BADGES = 12;

    // ══════════════════════════════════════════════════════════════
    //                          STATE
    // ══════════════════════════════════════════════════════════════

    /// @notice Human-readable collection name (ERC-1155 metadata standard).
    string public name;

    /// @notice Collection ticker symbol.
    string public symbol;

    /// @dev Contract-level metadata URI (OpenSea contractURI standard).
    string private _contractURI;

    /// @dev Base URI prefix for token metadata (fallback when no per-token override).
    string private _baseURI;

    /// @dev Per-token URI overrides. Takes priority over baseURI + tokenId pattern.
    mapping(uint256 => string) private _tokenURIs;

    /// @notice Whether a badge is currently active for LMRP claiming.
    mapping(uint256 => bool) public badgeActive;

    /// @notice Tracks whether a wallet has already claimed a specific badge.
    mapping(address => mapping(uint256 => bool)) public hasClaimed;

    // ══════════════════════════════════════════════════════════════
    //                         EVENTS
    // ══════════════════════════════════════════════════════════════

    event BadgeActivated(uint256 indexed tokenId, string zodiacName);
    event BadgeDeactivated(uint256 indexed tokenId);
    event BadgeClaimed(
        address indexed claimer,
        uint256 indexed tokenId,
        string claimId
    );
    event ContractURIUpdated(string newURI);

    // ══════════════════════════════════════════════════════════════
    //                         ERRORS
    // ══════════════════════════════════════════════════════════════

    error InvalidTokenId(uint256 tokenId);
    error BadgeNotActive(uint256 tokenId);
    error AlreadyClaimed(address claimer, uint256 tokenId);
    error ZeroAddress();

    // ══════════════════════════════════════════════════════════════
    //                       CONSTRUCTOR
    // ══════════════════════════════════════════════════════════════

    /**
     * @param baseURI_             Base metadata URI (e.g., "ipfs://Qm.../")
     * @param contractMetadataURI  Contract-level metadata URI for marketplaces
     * @param royaltyReceiver      Address to receive royalties (treasury wallet)
     * @param royaltyBps           Royalty in basis points (750 = 7.5%)
     */
    constructor(
        string memory baseURI_,
        string memory contractMetadataURI,
        address royaltyReceiver,
        uint96 royaltyBps
    ) ERC1155(baseURI_) {
        name = "Catbotica: The Celestial Cat-Circuit";
        symbol = "CATBADGE";
        _baseURI = baseURI_;
        _contractURI = contractMetadataURI;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(URI_SETTER_ROLE, msg.sender);

        // ERC-2981: 7.5% royalty per lore anchor LS-CATBOTICA-ANCHOR-012
        _setDefaultRoyalty(royaltyReceiver, royaltyBps);
    }

    // ══════════════════════════════════════════════════════════════
    //                        MINTING
    // ══════════════════════════════════════════════════════════════

    /**
     * @notice Mint a single zodiac badge to a claimer.
     * @dev Called by the claim service backend after verifying wallet signature.
     *      One badge per type per wallet enforced on-chain.
     *
     * @param to       Recipient wallet address
     * @param tokenId  Zodiac badge ID (1-12)
     * @param claimId  Off-chain LMRP claim reference (e.g., "LMRP-XXXXX-XXXX")
     */
    function mintBadge(
        address to,
        uint256 tokenId,
        string calldata claimId
    ) external onlyRole(MINTER_ROLE) whenNotPaused {
        if (to == address(0)) revert ZeroAddress();
        if (tokenId == 0 || tokenId > TOTAL_ZODIAC_BADGES)
            revert InvalidTokenId(tokenId);
        if (!badgeActive[tokenId]) revert BadgeNotActive(tokenId);
        if (hasClaimed[to][tokenId]) revert AlreadyClaimed(to, tokenId);

        hasClaimed[to][tokenId] = true;
        _mint(to, tokenId, 1, "");

        emit BadgeClaimed(to, tokenId, claimId);
    }

    /**
     * @notice Batch mint multiple zodiac badges to a single wallet.
     * @dev Used for retroactive claims (hold-duration mechanic) where a wallet
     *      is eligible for multiple past zodiac cycles at once.
     *
     * @param to        Recipient wallet address
     * @param tokenIds  Array of zodiac badge IDs (each 1-12)
     * @param claimId   Shared off-chain claim reference
     */
    function batchMintBadges(
        address to,
        uint256[] calldata tokenIds,
        string calldata claimId
    ) external onlyRole(MINTER_ROLE) whenNotPaused {
        if (to == address(0)) revert ZeroAddress();

        uint256 len = tokenIds.length;
        uint256[] memory amounts = new uint256[](len);

        for (uint256 i = 0; i < len; i++) {
            uint256 tokenId = tokenIds[i];
            if (tokenId == 0 || tokenId > TOTAL_ZODIAC_BADGES)
                revert InvalidTokenId(tokenId);
            if (!badgeActive[tokenId]) revert BadgeNotActive(tokenId);
            if (hasClaimed[to][tokenId])
                revert AlreadyClaimed(to, tokenId);

            hasClaimed[to][tokenId] = true;
            amounts[i] = 1;
        }

        _mintBatch(to, tokenIds, amounts, "");

        // Emit per-badge events for indexer compatibility
        for (uint256 i = 0; i < len; i++) {
            emit BadgeClaimed(to, tokenIds[i], claimId);
        }
    }

    // ══════════════════════════════════════════════════════════════
    //                    BADGE LIFECYCLE
    // ══════════════════════════════════════════════════════════════

    /**
     * @notice Activate a badge for LMRP claiming (opens the claim window).
     * @param tokenId    Badge ID to activate (1-12)
     * @param zodiacName Human-readable zodiac name for event log
     */
    function activateBadge(
        uint256 tokenId,
        string calldata zodiacName
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (tokenId == 0 || tokenId > TOTAL_ZODIAC_BADGES)
            revert InvalidTokenId(tokenId);
        badgeActive[tokenId] = true;
        emit BadgeActivated(tokenId, zodiacName);
    }

    /**
     * @notice Deactivate a badge (close the LMRP claiming window).
     * @param tokenId Badge ID to deactivate
     */
    function deactivateBadge(
        uint256 tokenId
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (tokenId == 0 || tokenId > TOTAL_ZODIAC_BADGES)
            revert InvalidTokenId(tokenId);
        badgeActive[tokenId] = false;
        emit BadgeDeactivated(tokenId);
    }

    /**
     * @notice Batch activate multiple badges at once.
     * @param tokenIds    Array of badge IDs to activate
     * @param zodiacNames Array of human-readable zodiac names
     */
    function batchActivateBadges(
        uint256[] calldata tokenIds,
        string[] calldata zodiacNames
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(tokenIds.length == zodiacNames.length, "Length mismatch");
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            if (tokenId == 0 || tokenId > TOTAL_ZODIAC_BADGES)
                revert InvalidTokenId(tokenId);
            badgeActive[tokenId] = true;
            emit BadgeActivated(tokenId, zodiacNames[i]);
        }
    }

    // ══════════════════════════════════════════════════════════════
    //                    URI MANAGEMENT
    // ══════════════════════════════════════════════════════════════

    /**
     * @notice Update the base URI prefix for all tokens.
     * @param newBaseURI New base URI (e.g., "ipfs://QmNewHash/")
     */
    function setBaseURI(
        string calldata newBaseURI
    ) external onlyRole(URI_SETTER_ROLE) {
        _baseURI = newBaseURI;
    }

    /**
     * @notice Set a per-token URI override (individual IPFS CID).
     * @param tokenId   Token ID (1-12)
     * @param tokenURI_ Full URI for this specific token
     */
    function setTokenURI(
        uint256 tokenId,
        string calldata tokenURI_
    ) external onlyRole(URI_SETTER_ROLE) {
        if (tokenId == 0 || tokenId > TOTAL_ZODIAC_BADGES)
            revert InvalidTokenId(tokenId);
        _tokenURIs[tokenId] = tokenURI_;
        emit URI(tokenURI_, tokenId);
    }

    /**
     * @notice Set contract-level metadata URI (OpenSea collection page).
     * @param newContractURI Full URI to collection metadata JSON
     */
    function setContractURI(
        string calldata newContractURI
    ) external onlyRole(URI_SETTER_ROLE) {
        _contractURI = newContractURI;
        emit ContractURIUpdated(newContractURI);
    }

    /**
     * @notice Returns the metadata URI for a given token ID.
     * @dev Per-token override takes priority. Falls back to baseURI/{id}.json.
     */
    function uri(
        uint256 tokenId
    ) public view override returns (string memory) {
        string memory tokenURI_ = _tokenURIs[tokenId];
        if (bytes(tokenURI_).length > 0) {
            return tokenURI_;
        }
        return
            string(abi.encodePacked(_baseURI, tokenId.toString(), ".json"));
    }

    /**
     * @notice Contract-level metadata URI (OpenSea / marketplace standard).
     */
    function contractURI() public view returns (string memory) {
        return _contractURI;
    }

    // ══════════════════════════════════════════════════════════════
    //                      VIEW HELPERS
    // ══════════════════════════════════════════════════════════════

    /**
     * @notice Check claim status for all 12 badges for a given wallet.
     * @param wallet Address to check
     * @return claimed Array of 12 booleans (index 0 = tokenId 1, etc.)
     */
    function getClaimStatus(
        address wallet
    ) external view returns (bool[12] memory claimed) {
        for (uint256 i = 0; i < 12; i++) {
            claimed[i] = hasClaimed[wallet][i + 1];
        }
    }

    /**
     * @notice Get active status for all 12 badges.
     * @return active Array of 12 booleans (index 0 = tokenId 1, etc.)
     */
    function getActiveBadges()
        external
        view
        returns (bool[12] memory active)
    {
        for (uint256 i = 0; i < 12; i++) {
            active[i] = badgeActive[i + 1];
        }
    }

    // ══════════════════════════════════════════════════════════════
    //                         ADMIN
    // ══════════════════════════════════════════════════════════════

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Update the default royalty configuration.
     * @param receiver      New royalty receiver address
     * @param feeNumerator  New royalty in basis points
     */
    function setDefaultRoyalty(
        address receiver,
        uint96 feeNumerator
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    // ══════════════════════════════════════════════════════════════
    //                       OVERRIDES
    // ══════════════════════════════════════════════════════════════

    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155, ERC1155Supply) {
        super._update(from, to, ids, values);
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC1155, ERC2981, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
