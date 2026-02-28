// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title CatboticaSoulbound
 * @author BeyondVerse Studio — Silo 09
 * @notice Soulbound Token (SBT) contract for Catbotica LMRP Recalibration Proofs.
 *         Non-transferable proof-of-recalibration certificates permanently recording
 *         that a unit completed its zodiac recalibration for a given year.
 *
 * @dev Built on ERC-1155 with transfer restrictions enforced in _update().
 *      Only minting (from == address(0)) is permitted. Transfers and burns are blocked.
 *
 *      Token IDs mirror the ERC-1155 badge collection:
 *      1=Tiger(2022), 2=Rabbit(2023), 3=Dragon(2024), 4=Snake(2025), 5=Horse(2026),
 *      6=Goat(2027), 7=Monkey(2028), 8=Rooster(2029), 9=Dog(2030), 10=Pig(2031),
 *      11=Rat(2032), 12=Ox(2033)
 *
 *      Lore Anchor: LS-CATBOTICA-ANCHOR-012
 *      Issuer: Catbotica Industries — Fulfillment Center
 */
contract CatboticaSoulbound is
    ERC1155,
    ERC1155Supply,
    AccessControl,
    Pausable
{
    using Strings for uint256;

    // ══════════════════════════════════════════════════════════════
    //                          ROLES
    // ══════════════════════════════════════════════════════════════

    /// @notice Role for addresses authorized to issue recalibration proofs.
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @notice Role for addresses authorized to update metadata URIs.
    bytes32 public constant URI_SETTER_ROLE = keccak256("URI_SETTER_ROLE");

    // ══════════════════════════════════════════════════════════════
    //                        CONSTANTS
    // ══════════════════════════════════════════════════════════════

    /// @notice Total number of zodiac recalibration proofs.
    uint256 public constant TOTAL_ZODIAC_BADGES = 12;

    // ══════════════════════════════════════════════════════════════
    //                          STATE
    // ══════════════════════════════════════════════════════════════

    /// @notice Human-readable collection name.
    string public name;

    /// @notice Collection ticker symbol.
    string public symbol;

    /// @dev Contract-level metadata URI.
    string private _contractURI;

    /// @dev Base URI prefix for token metadata.
    string private _baseURI;

    /// @dev Per-token URI overrides.
    mapping(uint256 => string) private _tokenURIs;

    /// @notice Tracks whether a wallet has received a recalibration proof for a zodiac.
    mapping(address => mapping(uint256 => bool)) public hasRecalibrated;

    // ══════════════════════════════════════════════════════════════
    //                         EVENTS
    // ══════════════════════════════════════════════════════════════

    event RecalibrationProofIssued(
        address indexed unit,
        uint256 indexed tokenId,
        string claimId
    );
    event ContractURIUpdated(string newURI);

    // ══════════════════════════════════════════════════════════════
    //                         ERRORS
    // ══════════════════════════════════════════════════════════════

    /// @notice Thrown when attempting to transfer a soulbound token.
    error SoulboundTransferBlocked();

    /// @notice Thrown when token ID is outside valid range (1-12).
    error InvalidTokenId(uint256 tokenId);

    /// @notice Thrown when wallet already has this recalibration proof.
    error AlreadyRecalibrated(address unit, uint256 tokenId);

    /// @notice Thrown when minting to zero address.
    error ZeroAddress();

    // ══════════════════════════════════════════════════════════════
    //                       CONSTRUCTOR
    // ══════════════════════════════════════════════════════════════

    /**
     * @param baseURI_             Base metadata URI for SBT tokens
     * @param contractMetadataURI  Contract-level metadata URI for marketplaces
     */
    constructor(
        string memory baseURI_,
        string memory contractMetadataURI
    ) ERC1155(baseURI_) {
        name = "Catbotica: LMRP Recalibration Proofs";
        symbol = "CATSBT";
        _baseURI = baseURI_;
        _contractURI = contractMetadataURI;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(URI_SETTER_ROLE, msg.sender);
    }

    // ══════════════════════════════════════════════════════════════
    //                        MINTING
    // ══════════════════════════════════════════════════════════════

    /**
     * @notice Issue a soulbound recalibration proof to a unit.
     * @dev Called by the claim service backend alongside ERC-1155 badge minting.
     *      One proof per zodiac per wallet enforced on-chain.
     *
     * @param to       Unit wallet address
     * @param tokenId  Zodiac proof ID (1-12, mirrors ERC-1155 badge IDs)
     * @param claimId  Off-chain LMRP claim reference (e.g., "LMRP-XXXXX-XXXX")
     */
    function issueProof(
        address to,
        uint256 tokenId,
        string calldata claimId
    ) external onlyRole(MINTER_ROLE) whenNotPaused {
        if (to == address(0)) revert ZeroAddress();
        if (tokenId == 0 || tokenId > TOTAL_ZODIAC_BADGES)
            revert InvalidTokenId(tokenId);
        if (hasRecalibrated[to][tokenId])
            revert AlreadyRecalibrated(to, tokenId);

        hasRecalibrated[to][tokenId] = true;
        _mint(to, tokenId, 1, "");

        emit RecalibrationProofIssued(to, tokenId, claimId);
    }

    /**
     * @notice Batch issue proofs for multiple zodiac cycles to one wallet.
     * @dev Used for retroactive proof issuance (hold-duration mechanic).
     *
     * @param to        Unit wallet address
     * @param tokenIds  Array of zodiac proof IDs (each 1-12)
     * @param claimId   Shared off-chain claim reference
     */
    function batchIssueProofs(
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
            if (hasRecalibrated[to][tokenId])
                revert AlreadyRecalibrated(to, tokenId);

            hasRecalibrated[to][tokenId] = true;
            amounts[i] = 1;
        }

        _mintBatch(to, tokenIds, amounts, "");

        for (uint256 i = 0; i < len; i++) {
            emit RecalibrationProofIssued(to, tokenIds[i], claimId);
        }
    }

    // ══════════════════════════════════════════════════════════════
    //                    SOULBOUND LOGIC
    // ══════════════════════════════════════════════════════════════

    /**
     * @dev Override _update to enforce soulbound (non-transferable) behavior.
     *      Only minting (from == address(0)) is allowed.
     *      Transfers and burns are permanently blocked per SBT spec:
     *        - transferable: false
     *        - revocable: false
     */
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155, ERC1155Supply) {
        // Only allow minting. Block all transfers and burns.
        if (from != address(0)) {
            revert SoulboundTransferBlocked();
        }
        super._update(from, to, ids, values);
    }

    // ══════════════════════════════════════════════════════════════
    //                    URI MANAGEMENT
    // ══════════════════════════════════════════════════════════════

    /**
     * @notice Update the base URI prefix for all tokens.
     */
    function setBaseURI(
        string calldata newBaseURI
    ) external onlyRole(URI_SETTER_ROLE) {
        _baseURI = newBaseURI;
    }

    /**
     * @notice Set a per-token URI override.
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
     * @notice Set contract-level metadata URI.
     */
    function setContractURI(
        string calldata newContractURI
    ) external onlyRole(URI_SETTER_ROLE) {
        _contractURI = newContractURI;
        emit ContractURIUpdated(newContractURI);
    }

    /**
     * @notice Returns the metadata URI for a given token ID.
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
     * @notice Contract-level metadata URI (marketplace standard).
     */
    function contractURI() public view returns (string memory) {
        return _contractURI;
    }

    // ══════════════════════════════════════════════════════════════
    //                      VIEW HELPERS
    // ══════════════════════════════════════════════════════════════

    /**
     * @notice Check if a wallet has completed recalibration for a specific zodiac.
     * @param unit     Wallet address to check
     * @param tokenId  Zodiac proof ID (1-12)
     */
    function hasCompletedRecalibration(
        address unit,
        uint256 tokenId
    ) external view returns (bool) {
        return hasRecalibrated[unit][tokenId];
    }

    /**
     * @notice Get all recalibration statuses for a wallet (all 12 zodiacs).
     * @param unit Wallet address to check
     * @return statuses Array of 12 booleans (index 0 = tokenId 1 / Tiger, etc.)
     */
    function getRecalibrationStatus(
        address unit
    ) external view returns (bool[12] memory statuses) {
        for (uint256 i = 0; i < 12; i++) {
            statuses[i] = hasRecalibrated[unit][i + 1];
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

    // ══════════════════════════════════════════════════════════════
    //                       OVERRIDES
    // ══════════════════════════════════════════════════════════════

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
