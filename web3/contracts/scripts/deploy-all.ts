import { ethers } from "hardhat";

/**
 * Deploy BOTH CatboticaZodiacBadges (ERC-1155) + CatboticaSoulbound (SBT)
 * Then grant MINTER_ROLE on both to a shared claim service wallet.
 *
 * Lore Anchor: LS-CATBOTICA-ANCHOR-012
 *
 * Usage:
 *   npx hardhat run scripts/deploy-all.ts --network baseSepolia
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("═══════════════════════════════════════════════════════════");
  console.log("  CATBOTICA — Full On-Chain Layer Deployment");
  console.log("  Celestial Cat-Circuit: ERC-1155 + SBT");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Deployer:  ${deployer.address}`);
  console.log(`  Network:   ${network.name} (${network.chainId})`);
  console.log("");

  // ── Configuration ──
  const erc1155BaseURI = process.env.ERC1155_BASE_URI || "ipfs://PLACEHOLDER/";
  const erc1155ContractURI = process.env.ERC1155_CONTRACT_URI || "ipfs://PLACEHOLDER_COLLECTION/";
  const sbtBaseURI = process.env.SBT_BASE_URI || "ipfs://PLACEHOLDER_SBT/";
  const sbtContractURI = process.env.SBT_CONTRACT_URI || "ipfs://PLACEHOLDER_SBT_COLLECTION/";
  const treasuryWallet = process.env.TREASURY_WALLET_ADDRESS || deployer.address;
  const royaltyBps = parseInt(process.env.ROYALTY_BPS || "750");

  // ══════════════════════════════════════════════════════════════
  //  STEP 1: Deploy ERC-1155 Zodiac Badges
  // ══════════════════════════════════════════════════════════════
  console.log("  [1/4] Deploying CatboticaZodiacBadges (ERC-1155)...");
  const BadgesFactory = await ethers.getContractFactory("CatboticaZodiacBadges");
  const badges = await BadgesFactory.deploy(
    erc1155BaseURI,
    erc1155ContractURI,
    treasuryWallet,
    royaltyBps
  );
  await badges.waitForDeployment();
  const badgesAddress = await badges.getAddress();
  console.log(`  ✓ ERC-1155 deployed to: ${badgesAddress}`);

  // ══════════════════════════════════════════════════════════════
  //  STEP 2: Deploy SBT Recalibration Proofs
  // ══════════════════════════════════════════════════════════════
  console.log("  [2/4] Deploying CatboticaSoulbound (SBT)...");
  const SbtFactory = await ethers.getContractFactory("CatboticaSoulbound");
  const sbt = await SbtFactory.deploy(sbtBaseURI, sbtContractURI);
  await sbt.waitForDeployment();
  const sbtAddress = await sbt.getAddress();
  console.log(`  ✓ SBT deployed to: ${sbtAddress}`);

  // ══════════════════════════════════════════════════════════════
  //  STEP 3: Activate badges (current + retroactive)
  // ══════════════════════════════════════════════════════════════
  console.log("  [3/4] Activating badges #1-5 (Tiger-Horse, 2022-2026)...");
  const activateIds = [1, 2, 3, 4, 5];
  const activateNames = ["Tiger", "Rabbit", "Dragon", "Snake", "Horse"];
  const activateTx = await badges.batchActivateBadges(activateIds, activateNames);
  await activateTx.wait();
  console.log("  ✓ Badges #1-5 activated");

  // ══════════════════════════════════════════════════════════════
  //  STEP 4: Grant MINTER_ROLE to claim service (if configured)
  // ══════════════════════════════════════════════════════════════
  const claimServiceWallet = process.env.CLAIM_SERVICE_WALLET;
  if (claimServiceWallet) {
    console.log(`  [4/4] Granting MINTER_ROLE to claim service: ${claimServiceWallet}`);
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));

    const grantBadgeTx = await badges.grantRole(MINTER_ROLE, claimServiceWallet);
    await grantBadgeTx.wait();
    console.log("  ✓ MINTER_ROLE granted on ERC-1155");

    const grantSbtTx = await sbt.grantRole(MINTER_ROLE, claimServiceWallet);
    await grantSbtTx.wait();
    console.log("  ✓ MINTER_ROLE granted on SBT");
  } else {
    console.log("  [4/4] CLAIM_SERVICE_WALLET not set — deployer retains MINTER_ROLE");
    console.log("        Set CLAIM_SERVICE_WALLET in .env and re-run to grant access.");
  }

  // ══════════════════════════════════════════════════════════════
  //  DEPLOYMENT SUMMARY
  // ══════════════════════════════════════════════════════════════
  console.log("");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  CATBOTICA ON-CHAIN LAYER — DEPLOYMENT COMPLETE");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("");
  console.log("  Contracts:");
  console.log(`    ERC-1155 (Zodiac Badges): ${badgesAddress}`);
  console.log(`    SBT (Recal. Proofs):      ${sbtAddress}`);
  console.log("");
  console.log("  Configuration:");
  console.log(`    Treasury:     ${treasuryWallet}`);
  console.log(`    Royalty:      ${royaltyBps} bps (${royaltyBps / 100}%)`);
  console.log(`    Active Badges: #1-5 (Tiger through Horse)`);
  console.log("");
  console.log("  Next Steps:");
  console.log("    1. Upload metadata JSONs to IPFS (Pinata/NFT.Storage)");
  console.log("    2. Update .env with real IPFS CIDs");
  console.log("    3. Call setBaseURI() on both contracts");
  console.log("    4. Set CLAIM_SERVICE_WALLET and grant MINTER_ROLE");
  console.log("    5. Update claim page with contract addresses");
  console.log("");
  console.log("  Verify Commands:");
  console.log(`    npx hardhat verify --network <net> ${badgesAddress} "${erc1155BaseURI}" "${erc1155ContractURI}" "${treasuryWallet}" ${royaltyBps}`);
  console.log(`    npx hardhat verify --network <net> ${sbtAddress} "${sbtBaseURI}" "${sbtContractURI}"`);
  console.log("═══════════════════════════════════════════════════════════");

  // ── Write deployment manifest ──
  const manifest = {
    project: "CATBOTICA",
    loreAnchor: "LS-CATBOTICA-ANCHOR-012",
    network: network.name,
    chainId: Number(network.chainId),
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: {
      erc1155: {
        name: "CatboticaZodiacBadges",
        address: badgesAddress,
        baseURI: erc1155BaseURI,
        contractURI: erc1155ContractURI,
        royaltyBps,
        treasuryWallet,
      },
      sbt: {
        name: "CatboticaSoulbound",
        address: sbtAddress,
        baseURI: sbtBaseURI,
        contractURI: sbtContractURI,
      },
    },
    activeBadges: [1, 2, 3, 4, 5],
  };

  const fs = await import("fs");
  const path = await import("path");
  const manifestPath = path.join(__dirname, "..", "deployments", `${network.name}-${network.chainId}.json`);
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n  Deployment manifest saved to: ${manifestPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
