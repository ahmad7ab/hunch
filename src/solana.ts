import { address, createClient, createSolanaRpc, lamports, type Address } from '@solana/kit';
import { walletWithoutSigner } from '@solana/kit-plugin-wallet';

export const CLUSTER = 'devnet' as const;
export const RPC_URL = 'https://api.devnet.solana.com';

// Read-only RPC for balances and airdrops.
export const rpc = createSolanaRpc(RPC_URL);

// Wallet Standard discovery + connection. Practice mode never asks the wallet to sign,
// so the wallet is attached without becoming the payer.
export const client = createClient().use(walletWithoutSigner({ chain: 'solana:devnet' }));
export type AppClient = typeof client;

export const LAMPORTS_PER_SOL = 1_000_000_000n;

export async function fetchBalanceSol(owner: Address): Promise<number> {
  const { value } = await rpc.getBalance(owner, { commitment: 'confirmed' }).send();
  return Number(value) / Number(LAMPORTS_PER_SOL);
}

export async function requestDevnetSol(owner: Address): Promise<string> {
  return rpc.requestAirdrop(owner, lamports(LAMPORTS_PER_SOL), { commitment: 'confirmed' }).send();
}

export function toAddress(value: string): Address {
  return address(value);
}

export function shortAddress(value: string): string {
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

export function explorerTx(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${CLUSTER}`;
}
