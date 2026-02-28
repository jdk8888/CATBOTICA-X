# Environment Variables Setup

Create a `.env.local` file in the root of the project with the following variables:

```bash
# WalletConnect Project ID
# Get your project ID from https://cloud.walletconnect.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# NFT Contract Configuration (Optional)
# If you want to verify NFT ownership before claiming
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_NFT_TOKEN_ID=
NEXT_PUBLIC_NFT_STANDARD=ERC721
NEXT_PUBLIC_CHAIN_ID=1
```

## Getting Your WalletConnect Project ID

1. Go to https://cloud.walletconnect.com
2. Sign up or log in
3. Create a new project
4. Copy your Project ID
5. Add it to `.env.local`

## Chain IDs

- `1` = Ethereum Mainnet
- `137` = Polygon
- `8453` = Base
- `42161` = Arbitrum

## NFT Verification (Optional)

If you want to require users to own a specific NFT before claiming:

1. Set `NEXT_PUBLIC_NFT_CONTRACT_ADDRESS` to your NFT contract address
2. Set `NEXT_PUBLIC_NFT_TOKEN_ID` if verifying a specific token (optional for ERC-721)
3. Set `NEXT_PUBLIC_NFT_STANDARD` to `ERC721` or `ERC1155`
4. Set `NEXT_PUBLIC_CHAIN_ID` to the chain where your NFT contract is deployed

If these are not set, NFT verification will be skipped.
