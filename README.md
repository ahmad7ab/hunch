# Hunch

A prediction market on Solana devnet. Pick YES or NO on real-world questions; odds move with every prediction and the winning side splits the pot (parimutuel, 2% fee on winnings).

**Live:** https://ahmad7ab.github.io/hunch/

**Status:** practice mode. Markets, pools and balances run in the browser (25 practice SOL per wallet, saved locally). Wallet connection (Wallet Standard), devnet balance and the devnet SOL airdrop are real. The Anchor program that moves this on-chain is next.

## Run it

```bash
pnpm install
pnpm dev        # http://localhost:5199
```

## Stack

- React 19 + Vite + TypeScript
- `@solana/kit` 8 and `@solana/kit-plugin-wallet` (Wallet Standard discovery, no wallet-adapter)
- Bricolage Grotesque + IBM Plex Sans, self-hosted

## Layout

- `src/markets.ts` parimutuel engine: quotes, payouts, seed markets
- `src/store.ts` practice balances and positions per wallet
- `src/solana.ts` devnet RPC + wallet client
- `src/components/` slip, odds bar, wallet menu
