import { expect } from "chai";
import { ethers } from "hardhat";
import { CatboticaZodiacBadges } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * CatboticaZodiacBadges (ERC-1155) — Test Suite
 * Lore Anchor: LS-CATBOTICA-ANCHOR-012
 */
describe("CatboticaZodiacBadges", function () {
  let badges: CatboticaZodiacBadges;
  let owner: SignerWithAddress;
  let minter: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let treasury: SignerWithAddress;

  const BASE_URI = "ipfs://QmTestBaseUri/";
  const CONTRACT_URI = "ipfs://QmTestContractUri";
  const ROYALTY_BPS = 750; // 7.5%

  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const URI_SETTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("URI_SETTER_ROLE"));

  beforeEach(async function () {
    [owner, minter, user1, user2, treasury] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("CatboticaZodiacBadges");
    badges = await Factory.deploy(BASE_URI, CONTRACT_URI, treasury.address, ROYALTY_BPS);
    await badges.waitForDeployment();

    // Grant minter role to dedicated minter
    await badges.grantRole(MINTER_ROLE, minter.address);

    // Activate badges 1-5 for testing
    await badges.batchActivateBadges(
      [1, 2, 3, 4, 5],
      ["Tiger", "Rabbit", "Dragon", "Snake", "Horse"]
    );
  });

  // ──────────────────────────────────────────────────────────
  //  Deployment
  // ──────────────────────────────────────────────────────────

  describe("Deployment", function () {
    it("should set correct name and symbol", async function () {
      expect(await badges.name()).to.equal("Catbotica: The Celestial Cat-Circuit");
      expect(await badges.symbol()).to.equal("CATBADGE");
    });

    it("should set correct contract URI", async function () {
      expect(await badges.contractURI()).to.equal(CONTRACT_URI);
    });

    it("should configure ERC-2981 royalties", async function () {
      const salePrice = ethers.parseEther("1");
      const [receiver, royaltyAmount] = await badges.royaltyInfo(1, salePrice);
      expect(receiver).to.equal(treasury.address);
      // 7.5% of 1 ETH = 0.075 ETH
      expect(royaltyAmount).to.equal(ethers.parseEther("0.075"));
    });

    it("should grant admin, minter, and URI setter roles to deployer", async function () {
      const DEFAULT_ADMIN = ethers.ZeroHash;
      expect(await badges.hasRole(DEFAULT_ADMIN, owner.address)).to.be.true;
      expect(await badges.hasRole(MINTER_ROLE, owner.address)).to.be.true;
      expect(await badges.hasRole(URI_SETTER_ROLE, owner.address)).to.be.true;
    });

    it("should set TOTAL_ZODIAC_BADGES to 12", async function () {
      expect(await badges.TOTAL_ZODIAC_BADGES()).to.equal(12);
    });
  });

  // ──────────────────────────────────────────────────────────
  //  Badge Activation
  // ──────────────────────────────────────────────────────────

  describe("Badge Activation", function () {
    it("should activate a badge", async function () {
      await badges.activateBadge(6, "Goat");
      expect(await badges.badgeActive(6)).to.be.true;
    });

    it("should deactivate a badge", async function () {
      await badges.deactivateBadge(1);
      expect(await badges.badgeActive(1)).to.be.false;
    });

    it("should revert on invalid token ID", async function () {
      await expect(badges.activateBadge(0, "Invalid"))
        .to.be.revertedWithCustomError(badges, "InvalidTokenId");
      await expect(badges.activateBadge(13, "Invalid"))
        .to.be.revertedWithCustomError(badges, "InvalidTokenId");
    });

    it("should only allow admin to activate/deactivate", async function () {
      await expect(badges.connect(user1).activateBadge(6, "Goat"))
        .to.be.reverted;
      await expect(badges.connect(user1).deactivateBadge(1))
        .to.be.reverted;
    });

    it("should return correct active badges array", async function () {
      const active = await badges.getActiveBadges();
      expect(active[0]).to.be.true;  // Tiger
      expect(active[4]).to.be.true;  // Horse
      expect(active[5]).to.be.false; // Goat (not activated)
    });
  });

  // ──────────────────────────────────────────────────────────
  //  Minting
  // ──────────────────────────────────────────────────────────

  describe("Minting", function () {
    it("should mint a badge to a user", async function () {
      await expect(badges.connect(minter).mintBadge(user1.address, 5, "LMRP-TEST-0001"))
        .to.emit(badges, "BadgeClaimed")
        .withArgs(user1.address, 5, "LMRP-TEST-0001");

      expect(await badges.balanceOf(user1.address, 5)).to.equal(1);
      expect(await badges.hasClaimed(user1.address, 5)).to.be.true;
    });

    it("should prevent double claiming", async function () {
      await badges.connect(minter).mintBadge(user1.address, 5, "LMRP-TEST-0001");
      await expect(badges.connect(minter).mintBadge(user1.address, 5, "LMRP-TEST-0002"))
        .to.be.revertedWithCustomError(badges, "AlreadyClaimed");
    });

    it("should prevent minting inactive badges", async function () {
      await expect(badges.connect(minter).mintBadge(user1.address, 6, "LMRP-TEST"))
        .to.be.revertedWithCustomError(badges, "BadgeNotActive");
    });

    it("should prevent minting to zero address", async function () {
      await expect(badges.connect(minter).mintBadge(ethers.ZeroAddress, 5, "LMRP-TEST"))
        .to.be.revertedWithCustomError(badges, "ZeroAddress");
    });

    it("should prevent invalid token IDs", async function () {
      await expect(badges.connect(minter).mintBadge(user1.address, 0, "LMRP-TEST"))
        .to.be.revertedWithCustomError(badges, "InvalidTokenId");
      await expect(badges.connect(minter).mintBadge(user1.address, 13, "LMRP-TEST"))
        .to.be.revertedWithCustomError(badges, "InvalidTokenId");
    });

    it("should only allow minter role to mint", async function () {
      await expect(badges.connect(user1).mintBadge(user1.address, 5, "LMRP-TEST"))
        .to.be.reverted;
    });

    it("should track supply correctly", async function () {
      await badges.connect(minter).mintBadge(user1.address, 5, "LMRP-A");
      await badges.connect(minter).mintBadge(user2.address, 5, "LMRP-B");
      expect(await badges.totalSupply(5)).to.equal(2);
    });
  });

  // ──────────────────────────────────────────────────────────
  //  Batch Minting
  // ──────────────────────────────────────────────────────────

  describe("Batch Minting", function () {
    it("should batch mint multiple badges", async function () {
      await badges.connect(minter).batchMintBadges(user1.address, [1, 2, 3], "LMRP-BATCH");

      expect(await badges.balanceOf(user1.address, 1)).to.equal(1);
      expect(await badges.balanceOf(user1.address, 2)).to.equal(1);
      expect(await badges.balanceOf(user1.address, 3)).to.equal(1);
    });

    it("should return correct claim status array", async function () {
      await badges.connect(minter).batchMintBadges(user1.address, [1, 3, 5], "LMRP-BATCH");
      const status = await badges.getClaimStatus(user1.address);
      expect(status[0]).to.be.true;  // Tiger (#1)
      expect(status[1]).to.be.false; // Rabbit (#2)
      expect(status[2]).to.be.true;  // Dragon (#3)
      expect(status[3]).to.be.false; // Snake (#4)
      expect(status[4]).to.be.true;  // Horse (#5)
    });

    it("should revert batch if any badge already claimed", async function () {
      await badges.connect(minter).mintBadge(user1.address, 1, "LMRP-SINGLE");
      await expect(badges.connect(minter).batchMintBadges(user1.address, [1, 2], "LMRP-BATCH"))
        .to.be.revertedWithCustomError(badges, "AlreadyClaimed");
    });
  });

  // ──────────────────────────────────────────────────────────
  //  URI Management
  // ──────────────────────────────────────────────────────────

  describe("URI Management", function () {
    it("should return baseURI + tokenId for default", async function () {
      expect(await badges.uri(1)).to.equal("ipfs://QmTestBaseUri/1.json");
      expect(await badges.uri(12)).to.equal("ipfs://QmTestBaseUri/12.json");
    });

    it("should use per-token override when set", async function () {
      await badges.setTokenURI(1, "ipfs://QmCustomTigerCID");
      expect(await badges.uri(1)).to.equal("ipfs://QmCustomTigerCID");
      // Other tokens still use base
      expect(await badges.uri(2)).to.equal("ipfs://QmTestBaseUri/2.json");
    });

    it("should update base URI", async function () {
      await badges.setBaseURI("ipfs://QmNewBase/");
      expect(await badges.uri(5)).to.equal("ipfs://QmNewBase/5.json");
    });

    it("should update contract URI", async function () {
      await badges.setContractURI("ipfs://QmNewContractURI");
      expect(await badges.contractURI()).to.equal("ipfs://QmNewContractURI");
    });
  });

  // ──────────────────────────────────────────────────────────
  //  Pausable
  // ──────────────────────────────────────────────────────────

  describe("Pausable", function () {
    it("should prevent minting when paused", async function () {
      await badges.pause();
      await expect(badges.connect(minter).mintBadge(user1.address, 5, "LMRP-TEST"))
        .to.be.revertedWithCustomError(badges, "EnforcedPause");
    });

    it("should resume minting when unpaused", async function () {
      await badges.pause();
      await badges.unpause();
      await expect(badges.connect(minter).mintBadge(user1.address, 5, "LMRP-TEST"))
        .to.not.be.reverted;
    });
  });

  // ──────────────────────────────────────────────────────────
  //  ERC-2981 Royalties
  // ──────────────────────────────────────────────────────────

  describe("Royalties", function () {
    it("should return correct royalty info for any token", async function () {
      const price = ethers.parseEther("10");
      const [receiver, amount] = await badges.royaltyInfo(1, price);
      expect(receiver).to.equal(treasury.address);
      expect(amount).to.equal(ethers.parseEther("0.75")); // 7.5%
    });

    it("should allow admin to update royalty", async function () {
      await badges.setDefaultRoyalty(user1.address, 500); // 5%
      const [receiver, amount] = await badges.royaltyInfo(1, ethers.parseEther("10"));
      expect(receiver).to.equal(user1.address);
      expect(amount).to.equal(ethers.parseEther("0.5"));
    });
  });

  // ──────────────────────────────────────────────────────────
  //  Interface Support
  // ──────────────────────────────────────────────────────────

  describe("Interface Support", function () {
    it("should support ERC-1155", async function () {
      // ERC-1155 interface ID: 0xd9b67a26
      expect(await badges.supportsInterface("0xd9b67a26")).to.be.true;
    });

    it("should support ERC-2981", async function () {
      // ERC-2981 interface ID: 0x2a55205a
      expect(await badges.supportsInterface("0x2a55205a")).to.be.true;
    });

    it("should support AccessControl", async function () {
      // IAccessControl interface ID: 0x7965db0b
      expect(await badges.supportsInterface("0x7965db0b")).to.be.true;
    });
  });
});
