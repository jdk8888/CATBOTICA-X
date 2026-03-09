/**
 * Print environment variables for the CATBOTICA claimed app (Next.js) from the latest deployment manifest.
 * Run after deploy-all.ts. Copy the output into Vercel Environment Variables or .env.local.
 *
 * Usage:
 *   npx hardhat run scripts/print-claimed-env.ts --network baseSepolia
 *   npx hardhat run scripts/print-claimed-env.ts --network base
 *
 * Optionally set BASE_RPC_FOR_CLAIM_APP to the RPC URL the *Next.js app* should use (e.g. Alchemy/Infura).
 */

import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const network = await ethers.provider.getNetwork();
  const networkName = network.name;
  const chainId = Number(network.chainId);

  const manifestPath = path.join(__dirname, "..", "deployments", `${networkName}-${chainId}.json`);
  if (!fs.existsSync(manifestPath)) {
    console.error(`No deployment found at ${manifestPath}. Run deploy-all.ts first.`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const erc1155 = manifest.contracts?.erc1155?.address;
  const sbt = manifest.contracts?.sbt?.address;

  if (!erc1155 || !sbt) {
    console.error("Manifest missing contract addresses.");
    process.exit(1);
  }

  const baseRpc = process.env.BASE_RPC_FOR_CLAIM_APP || process.env.BASE_RPC_URL || (chainId === 84532 ? "https://sepolia.base.org" : "https://mainnet.base.org");

  console.log("");
  console.log("# ─── Copy these into Vercel (or claimed app .env.local) ───");
  console.log("");
  if (chainId === 84532) {
    console.log(`NEXT_PUBLIC_BASE_SEPOLIA_ERC1155_ADDRESS=${erc1155}`);
    console.log(`NEXT_PUBLIC_BASE_SEPOLIA_SBT_ADDRESS=${sbt}`);
  } else {
    console.log(`NEXT_PUBLIC_BASE_ERC1155_ADDRESS=${erc1155}`);
    console.log(`NEXT_PUBLIC_BASE_SBT_ADDRESS=${sbt}`);
  }
  console.log(`BASE_RPC_URL=${baseRpc}`);
  console.log("");
  console.log("# CLAIM_SERVICE_PRIVATE_KEY = (your claim-service wallet private key, server-only; add in Vercel as secret)");
  console.log("");
  console.log("# ─── End ───");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
