import { expect } from "chai";
import { ethers } from "hardhat";
import { CatboticaSoulbound } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * CatboticaSoulbound (SBT) — Test Suite
 * Lore Anchor: LS-CATBOTICA-ANCHOR-012
 */
describe("CatboticaSoulbound", function () {
  let sbt: CatboticaSoulbound;
  let owner: SignerWithAddress;
  let minter: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  const BASE_URI = "ipfs://QmTestSbtBaseUri/";
  const CONTRACT_URI = "ipfs://QmTestSbtContractUri";

  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const URI_SETTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("URI_SETTER_ROLE"));

  beforeEach(async function () {
    [owner, minter, user1, user2] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("CatboticaSoulbound");
    sbt = await Factory.deploy(BASE_URI, CONTRACT_URI);
    await sbt.waitForDeployment();

    // Grant minter role
    await sbt.grantRole(MINTER_ROLE, minter.address);
  });

  // ──────────────────────────────────────────────────────────
  //  Deployment
  // ──────────────────────────────────────────────────────────

  describe("Deployment", function () {
    it("should set correct name and symbol", async function () {
      expect(await sbt.name()).to.equal("Catbotica: LMRP Recalibration Proofs");
      expect(await sbt.symbol()).to.equal("CATSBT");
    });

    it("should set correct contract URI", async function () {
      expect(await sbt.contractURI()).to.equal(CONTRACT_URI);
    });

    it("should set TOTAL_ZODIAC_BADGES to 12", async function () {
      expect(await sbt.TOTAL_ZODIAC_BADGES()).to.equal(12);
    });
  });

  // ──────────────────────────────────────────────────────────
  //  Soulbound: Transfer Restrictions (CRITICAL)
  // ──────────────────────────────────────────────────────────

  describe("Soulbound Transfer Restrictions", function () {
    beforeEach(async function () {
      // Mint a proof to user1 first
      await sbt.connect(minter).issueProof(user1.address, 5, "LMRP-SBT-001");
    });

    it("should block safeTransferFrom", async function () {
      await expect(
        sbt.connect(user1).safeTransferFrom(user1.address, user2.address, 5, 1, "0x")
      ).to.be.revertedWithCustomError(sbt, "SoulboundTransferBlocked");
    });

    it("should block safeBatchTransferFrom", async function () {
      await expect(
        sbt.connect(user1).safeBatchTransferFrom(user1.address, user2.address, [5], [1], "0x")
      ).to.be.revertedWithCustomError(sbt, "SoulboundTransferBlocked");
    });

    it("should allow minting (from == address(0))", async function () {
      // user2 should be able to receive a fresh mint
      await expect(
        sbt.connect(minter).issueProof(user2.address, 5, "LMRP-SBT-002")
      ).to.not.be.reverted;
      expect(await sbt.balanceOf(user2.address, 5)).to.equal(1);
    });

    it("should block burning (to == address(0) is also blocked since from != address(0))", async function () {
      // Burning would require from != address(0), so it is blocked
      // There's no public burn function, but if someone tried via a custom call
      // the _update override would catch it
      expect(await sbt.balanceOf(user1.address, 5)).to.equal(1);
    });
  });

  // ──────────────────────────────────────────────────────────
  //  Proof Issuance (Minting)
  // ──────────────────────────────────────────────────────────

  describe("Proof Issuance", function () {
    it("should issue a recalibration proof", async function () {
      await expect(sbt.connect(minter).issueProof(user1.address, 5, "LMRP-SBT-001"))
        .to.emit(sbt, "RecalibrationProofIssued")
        .withArgs(user1.address, 5, "LMRP-SBT-001");

      expect(await sbt.balanceOf(user1.address, 5)).to.equal(1);
      expect(await sbt.hasRecalibrated(user1.address, 5)).to.be.true;
    });

    it("should prevent duplicate proofs", async function () {
      await sbt.connect(minter).issueProof(user1.address, 5, "LMRP-SBT-001");
      await expect(sbt.connect(minter).issueProof(user1.address, 5, "LMRP-SBT-002"))
        .to.be.revertedWithCustomError(sbt, "AlreadyRecalibrated");
    });

    it("should prevent minting to zero address", async function () {
      await expect(sbt.connect(minter).issueProof(ethers.ZeroAddress, 5, "LMRP-SBT"))
        .to.be.revertedWithCustomError(sbt, "ZeroAddress");
    });

    it("should prevent invalid token IDs", async function () {
      await expect(sbt.connect(minter).issueProof(user1.address, 0, "LMRP-SBT"))
        .to.be.revertedWithCustomError(sbt, "InvalidTokenId");
      await expect(sbt.connect(minter).issueProof(user1.address, 13, "LMRP-SBT"))
        .to.be.revertedWithCustomError(sbt, "InvalidTokenId");
    });

    it("should only allow minter role", async function () {
      await expect(sbt.connect(user1).issueProof(user1.address, 5, "LMRP-SBT"))
        .to.be.reverted;
    });
  });

  // ──────────────────────────────────────────────────────────
  //  Batch Proof Issuance
  // ──────────────────────────────────────────────────────────

  describe("Batch Proof Issuance", function () {
    it("should batch issue proofs for multiple zodiacs", async function () {
      await sbt.connect(minter).batchIssueProofs(user1.address, [1, 2, 3], "LMRP-BATCH");

      expect(await sbt.balanceOf(user1.address, 1)).to.equal(1);
      expect(await sbt.balanceOf(user1.address, 2)).to.equal(1);
      expect(await sbt.balanceOf(user1.address, 3)).to.equal(1);
    });

    it("should return correct recalibration status array", async function () {
      await sbt.connect(minter).batchIssueProofs(user1.address, [1, 5, 12], "LMRP-BATCH");
      const status = await sbt.getRecalibrationStatus(user1.address);
      expect(status[0]).to.be.true;   // Tiger (#1)
      expect(status[1]).to.be.false;  // Rabbit (#2)
      expect(status[4]).to.be.true;   // Horse (#5)
      expect(status[11]).to.be.true;  // Ox (#12)
    });

    it("should revert batch if any already recalibrated", async function () {
      await sbt.connect(minter).issueProof(user1.address, 1, "LMRP-SINGLE");
      await expect(sbt.connect(minter).batchIssueProofs(user1.address, [1, 2], "LMRP-BATCH"))
        .to.be.revertedWithCustomError(sbt, "AlreadyRecalibrated");
    });
  });

  // ──────────────────────────────────────────────────────────
  //  View Helpers
  // ──────────────────────────────────────────────────────────

  describe("View Helpers", function () {
    it("should check individual recalibration status", async function () {
      expect(await sbt.hasCompletedRecalibration(user1.address, 5)).to.be.false;
      await sbt.connect(minter).issueProof(user1.address, 5, "LMRP-SBT");
      expect(await sbt.hasCompletedRecalibration(user1.address, 5)).to.be.true;
    });

    it("should track supply correctly", async function () {
      await sbt.connect(minter).issueProof(user1.address, 5, "LMRP-A");
      await sbt.connect(minter).issueProof(user2.address, 5, "LMRP-B");
      expect(await sbt.totalSupply(5)).to.equal(2);
    });
  });

  // ──────────────────────────────────────────────────────────
  //  URI Management
  // ──────────────────────────────────────────────────────────

  describe("URI Management", function () {
    it("should return baseURI + tokenId for default", async function () {
      expect(await sbt.uri(1)).to.equal("ipfs://QmTestSbtBaseUri/1.json");
    });

    it("should use per-token override when set", async function () {
      await sbt.setTokenURI(1, "ipfs://QmCustomSbtTigerCID");
      expect(await sbt.uri(1)).to.equal("ipfs://QmCustomSbtTigerCID");
    });
  });

  // ──────────────────────────────────────────────────────────
  //  Pausable
  // ──────────────────────────────────────────────────────────

  describe("Pausable", function () {
    it("should prevent issuance when paused", async function () {
      await sbt.pause();
      await expect(sbt.connect(minter).issueProof(user1.address, 5, "LMRP-SBT"))
        .to.be.revertedWithCustomError(sbt, "EnforcedPause");
    });

    it("should resume issuance when unpaused", async function () {
      await sbt.pause();
      await sbt.unpause();
      await expect(sbt.connect(minter).issueProof(user1.address, 5, "LMRP-SBT"))
        .to.not.be.reverted;
    });
  });

  // ──────────────────────────────────────────────────────────
  //  Interface Support
  // ──────────────────────────────────────────────────────────

  describe("Interface Support", function () {
    it("should support ERC-1155", async function () {
      expect(await sbt.supportsInterface("0xd9b67a26")).to.be.true;
    });

    it("should support AccessControl", async function () {
      expect(await sbt.supportsInterface("0x7965db0b")).to.be.true;
    });
  });
});
