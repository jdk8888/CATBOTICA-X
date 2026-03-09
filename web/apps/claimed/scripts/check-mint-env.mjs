#!/usr/bin/env node
/**
 * Check that all env vars required for live mint (ERC-1155 airdrop on Base) are set.
 * Run from claimed app root: node scripts/check-mint-env.mjs
 * Loads .env.local if present (simple parse; no dotenv dependency).
 */

const fs = require("fs");
const path = require("path");

function loadEnvFile(filePath) {
  const full = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(full)) return {};
  const text = fs.readFileSync(full, "utf8");
  const out = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m) {
      const val = m[2].replace(/^["']|["']$/g, "").trim();
      out[m[1]] = val;
    }
  }
  return out;
}

const envLocal = loadEnvFile(".env.local");
const env = { ...process.env, ...envLocal };

const required = [
  { key: "NEXT_PUBLIC_BASE_ERC1155_ADDRESS", desc: "ERC-1155 contract on Base (8453)" },
  { key: "NEXT_PUBLIC_BASE_SBT_ADDRESS", desc: "SBT contract on Base (8453)" },
  { key: "BASE_RPC_URL", desc: "Base RPC URL (server-side mint)" },
  { key: "CLAIM_SERVICE_PRIVATE_KEY", desc: "Claim-service wallet private key (server-only)" },
];

const optional = [
  { key: "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID", desc: "WalletConnect project ID" },
  { key: "NEXT_PUBLIC_BASE_SEPOLIA_ERC1155_ADDRESS", desc: "For Base Sepolia testnet" },
  { key: "NEXT_PUBLIC_BASE_SEPOLIA_SBT_ADDRESS", desc: "For Base Sepolia testnet" },
];

console.log("");
console.log("  CATBOTICA Claimed App — Mint env check");
console.log("  (Reads .env.local if present)");
console.log("");

let ok = true;
for (const { key, desc } of required) {
  const val = env[key];
  const set = val && val.length > 0 && val !== "0x0000000000000000000000000000000000000000";
  if (!set) {
    console.log("  \u2717 " + key + " — MISSING (required for live mint)");
    console.log("      " + desc);
    ok = false;
  } else {
    const preview = key.includes("PRIVATE") ? "0x***" : (val.length > 20 ? val.slice(0, 10) + "..." : val);
    console.log("  \u2713 " + key + " = " + preview);
  }
}

console.log("");
for (const { key, desc } of optional) {
  const val = env[key];
  const set = val && val.length > 0;
  console.log("  " + (set ? "\u2713" : " ") + " " + key + (set ? " (set)" : " — optional"));
}

console.log("");
if (ok) {
  console.log("  Mint is configured. API will call mintBadge + issueProof on Base after each claim.");
} else {
  console.log("  Mint is NOT fully configured. Claims will succeed but status will be 'pending_mint'.");
  console.log("  Add the missing vars to .env.local or Vercel Environment Variables.");
}
console.log("");

process.exit(ok ? 0 : 1);
