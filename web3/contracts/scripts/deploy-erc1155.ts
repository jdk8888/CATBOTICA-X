import { ethers } from "hardhat";

/**
 * Deploy CatboticaZodiacBadges (ERC-1155)
 * Lore Anchor: LS-CATBOTICA-ANCHOR-012
 *
 * Usage:
 *   npx hardhat run scripts/deploy-erc1155.ts --network baseSepolia
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  CATBOTICA — Deploying CatboticaZodiacBadges (ERC-1155)");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Deployer:  ${deployer.address}`);
  console.log(`  Network:   ${(await ethers.provider.getNetwork()).name}`);
  console.log(`  Chain ID:  ${(await ethers.provider.getNetwork()).chainId}`);
  console.log("");

  // ── Configuration ──
  const baseURI = process.env.ERC1155_BASE_URI || "ipfs://PLACEHOLDER/";
  const contractURI = process.env.ERC1155_CONTRACT_URI || "ipfs://PLACEHOLDER_COLLECTION/";
  const treasuryWallet = process.env.TREASURY_WALLET_ADDRESS || deployer.address;
  const royaltyBps = parseInt(process.env.ROYALTY_BPS || "750"); // 7.5%

  console.log(`  Base URI:      ${baseURI}`);
  console.log(`  Contract URI:  ${contractURI}`);
  console.log(`  Treasury:      ${treasuryWallet}`);
  console.log(`  Royalty:       ${royaltyBps} bps (${royaltyBps / 100}%)`);
  console.log("");

  // ── Deploy ──
  const CatboticaZodiacBadges = await ethers.getContractFactory("CatboticaZodiacBadges");
  const badges = await CatboticaZodiacBadges.deploy(
    baseURI,
    contractURI,
    treasuryWallet,
    royaltyBps
  );

  await badges.waitForDeployment();
  const address = await badges.getAddress();

  console.log("  ✓ CatboticaZodiacBadges deployed to:", address);
  console.log("");

  // ── Activate current badge (Horse = tokenId 5 for 2026) ──
  console.log("  Activating Badge #5 (Horse — 2026)...");
  const activateTx = await badges.activateBadge(5, "Horse");
  await activateTx.wait();
  console.log("  ✓ Badge #5 (Horse) activated for LMRP claiming");
  console.log("");

  // ── Activate retroactive badges (Tiger through Snake = 1-4) ──
  console.log("  Activating retroactive badges #1-4 (Tiger-Snake, 2022-2025)...");
  const retroIds = [1, 2, 3, 4];
  const retroNames = ["Tiger", "Rabbit", "Dragon", "Snake"];
  const batchActivateTx = await badges.batchActivateBadges(retroIds, retroNames);
  await batchActivateTx.wait();
  console.log("  ✓ Badges #1-4 activated for retroactive claiming");
  console.log("");

  // ── Summary ──
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  DEPLOYMENT COMPLETE");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Contract:  ${address}`);
  console.log(`  Verify:    npx hardhat verify --network <network> ${address} "${baseURI}" "${contractURI}" "${treasuryWallet}" ${royaltyBps}`);
  console.log("═══════════════════════════════════════════════════════════");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
