/**
 * Test mint on Base Sepolia: mintBadge(tokenId 5) + issueProof for a recipient.
 * Use this to verify the flow works before finalizing badge art/metadata.
 * Contracts use placeholder URIs; you can set real IPFS later via setBaseURI.
 *
 * Usage:
 *   set RECIPIENT_ADDRESS and optionally CLAIM_ID, then:
 *   npx hardhat run scripts/test-mint-sepolia.ts --network baseSepolia
 *
 * Example (PowerShell):
 *   $env:RECIPIENT_ADDRESS="0xYourWallet"; $env:CLAIM_ID="LMRP-TEST-001"; npx hardhat run scripts/test-mint-sepolia.ts --network baseSepolia
 *
 * Requires: CLAIM_SERVICE_PRIVATE_KEY in .env (the minter wallet).
 * Deployment: deployments/baseSepolia-84532.json must exist (run deploy-all.ts first).
 */

import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const TOKEN_ID_HORSE = 5; // Year of the Horse 2026

async function main() {
  const recipient = process.env.RECIPIENT_ADDRESS;
  const claimId = process.env.CLAIM_ID || "LMRP-TEST-001";

  if (!recipient || !ethers.isAddress(recipient)) {
    console.error("Set RECIPIENT_ADDRESS in env (the wallet that will receive the badge).");
    process.exit(1);
  }

  const claimKey = process.env.CLAIM_SERVICE_PRIVATE_KEY;
  if (!claimKey || !claimKey.startsWith("0x")) {
    console.error("Set CLAIM_SERVICE_PRIVATE_KEY in .env (minter wallet).");
    process.exit(1);
  }

  const network = await ethers.provider.getNetwork();
  if (Number(network.chainId) !== 84532) {
    console.error("This script is for Base Sepolia (84532). Use --network baseSepolia.");
    process.exit(1);
  }

  const manifestPath = path.join(__dirname, "..", "deployments", "baseSepolia-84532.json");
  if (!fs.existsSync(manifestPath)) {
    console.error("No deployments/baseSepolia-84532.json. Run deploy-all.ts --network baseSepolia first.");
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const erc1155Address = manifest.contracts?.erc1155?.address;
  const sbtAddress = manifest.contracts?.sbt?.address;
  if (!erc1155Address || !sbtAddress) {
    console.error("Manifest missing erc1155 or sbt address.");
    process.exit(1);
  }

  const signer = new ethers.Wallet(claimKey, ethers.provider);
  console.log("");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  CATBOTICA — Test mint (Base Sepolia)");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Recipient:", recipient);
  console.log("  Claim ID: ", claimId);
  console.log("  Token ID: ", TOKEN_ID_HORSE, "(Horse 2026)");
  console.log("  Minter:   ", signer.address);
  console.log("");

  const badges = await ethers.getContractAt("CatboticaZodiacBadges", erc1155Address, signer);
  const sbt = await ethers.getContractAt("CatboticaSoulbound", sbtAddress, signer);

  console.log("  [1/2] mintBadge...");
  const tx1 = await badges.mintBadge(recipient, TOKEN_ID_HORSE, claimId);
  const receipt1 = await tx1.wait();
  console.log("  ✓ Badge minted. Tx:", receipt1?.hash);

  console.log("  [2/2] issueProof (SBT)...");
  const tx2 = await sbt.issueProof(recipient, TOKEN_ID_HORSE, claimId);
  const receipt2 = await tx2.wait();
  console.log("  ✓ SBT issued. Tx:", receipt2?.hash);

  console.log("");
  console.log("  View on Base Sepolia explorer:");
  console.log("  https://sepolia.basescan.org/address/" + recipient + "#nfttransfers");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
