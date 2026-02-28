import { ethers } from "hardhat";

/**
 * Deploy CatboticaSoulbound (SBT)
 * Lore Anchor: LS-CATBOTICA-ANCHOR-012
 *
 * Usage:
 *   npx hardhat run scripts/deploy-sbt.ts --network baseSepolia
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  CATBOTICA — Deploying CatboticaSoulbound (SBT)");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Deployer:  ${deployer.address}`);
  console.log(`  Network:   ${(await ethers.provider.getNetwork()).name}`);
  console.log(`  Chain ID:  ${(await ethers.provider.getNetwork()).chainId}`);
  console.log("");

  // ── Configuration ──
  const baseURI = process.env.SBT_BASE_URI || "ipfs://PLACEHOLDER_SBT/";
  const contractURI = process.env.SBT_CONTRACT_URI || "ipfs://PLACEHOLDER_SBT_COLLECTION/";

  console.log(`  Base URI:      ${baseURI}`);
  console.log(`  Contract URI:  ${contractURI}`);
  console.log("");

  // ── Deploy ──
  const CatboticaSoulbound = await ethers.getContractFactory("CatboticaSoulbound");
  const sbt = await CatboticaSoulbound.deploy(baseURI, contractURI);

  await sbt.waitForDeployment();
  const address = await sbt.getAddress();

  console.log("  ✓ CatboticaSoulbound deployed to:", address);
  console.log("");

  // ── Summary ──
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  DEPLOYMENT COMPLETE");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Contract:  ${address}`);
  console.log(`  Verify:    npx hardhat verify --network <network> ${address} "${baseURI}" "${contractURI}"`);
  console.log("═══════════════════════════════════════════════════════════");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
