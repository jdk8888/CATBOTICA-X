/**
 * Grant MINTER_ROLE to CLAIM_SERVICE_WALLET on both CatboticaZodiacBadges and CatboticaSoulbound.
 * Use this if you deployed without setting CLAIM_SERVICE_WALLET, or added a new claim-service wallet.
 *
 * Usage:
 *   npx hardhat run scripts/grant-minter-role.ts --network baseSepolia
 *   npx hardhat run scripts/grant-minter-role.ts --network base
 *
 * Requires in .env:
 *   DEPLOYER_PRIVATE_KEY (must be DEFAULT_ADMIN_ROLE holder)
 *   CLAIM_SERVICE_WALLET (address to grant MINTER_ROLE)
 *
 * Contract addresses: from deployments/<network>-<chainId>.json, or override with:
 *   ERC1155_ADDRESS=0x... SBT_ADDRESS=0x...
 */

import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));

async function main() {
  const claimServiceWallet = process.env.CLAIM_SERVICE_WALLET;
  if (!claimServiceWallet || !ethers.isAddress(claimServiceWallet)) {
    console.error("ERROR: Set CLAIM_SERVICE_WALLET in .env (e.g. 0x...)");
    process.exit(1);
  }

  const network = await ethers.provider.getNetwork();
  const networkName = network.name;
  const chainId = Number(network.chainId);

  let erc1155Address = process.env.ERC1155_ADDRESS;
  let sbtAddress = process.env.SBT_ADDRESS;

  if (!erc1155Address || !sbtAddress) {
    const manifestPath = path.join(__dirname, "..", "deployments", `${networkName}-${chainId}.json`);
    if (!fs.existsSync(manifestPath)) {
      console.error(`ERROR: No deployment manifest at ${manifestPath}. Deploy first with deploy-all.ts, or set ERC1155_ADDRESS and SBT_ADDRESS in .env`);
      process.exit(1);
    }
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    erc1155Address = manifest.contracts?.erc1155?.address;
    sbtAddress = manifest.contracts?.sbt?.address;
    if (!erc1155Address || !sbtAddress) {
      console.error("ERROR: Manifest missing contracts.erc1155.address or contracts.sbt.address");
      process.exit(1);
    }
  }

  const [deployer] = await ethers.getSigners();
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  CATBOTICA — Grant MINTER_ROLE to Claim Service");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Network:     ${networkName} (${chainId})`);
  console.log(`  Grant to:    ${claimServiceWallet}`);
  console.log(`  ERC-1155:    ${erc1155Address}`);
  console.log(`  SBT:         ${sbtAddress}`);
  console.log("");

  const badges = await ethers.getContractAt("CatboticaZodiacBadges", erc1155Address);
  const sbt = await ethers.getContractAt("CatboticaSoulbound", sbtAddress);

  const tx1 = await badges.grantRole(MINTER_ROLE, claimServiceWallet);
  await tx1.wait();
  console.log("  ✓ MINTER_ROLE granted on CatboticaZodiacBadges");

  const tx2 = await sbt.grantRole(MINTER_ROLE, claimServiceWallet);
  await tx2.wait();
  console.log("  ✓ MINTER_ROLE granted on CatboticaSoulbound");

  console.log("");
  console.log("  Done. Claim-service wallet can now call mintBadge and issueProof.");
  console.log("═══════════════════════════════════════════════════════════");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
