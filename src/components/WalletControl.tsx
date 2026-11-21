import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Droplets, LogOut, Wallet } from 'lucide-react';
import { useConnect, useConnectedWallet, useDisconnect, useWallets, WalletReadyGate } from '@solana/kit-plugin-wallet/react';
import { client, explorerTx, fetchBalanceSol, requestDevnetSol, shortAddress, toAddress } from '../solana';

type AirdropState = { kind: 'idle' } | { kind: 'busy' } | { kind: 'done'; signature: string } | { kind: 'error'; message: string };

function ConnectedMenu() {
  const connected = useConnectedWallet(client);
  const { dispatch: disconnect } = useDisconnect(client);
  const [open, setOpen] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [airdrop, setAirdrop] = useState<AirdropState>({ kind: 'idle' });
  const ref = useRef<HTMLDivElement>(null);
  const addr = connected?.account.address;

  useEffect(() => {
    if (!addr) return;
    let live = true;
    const tick = () =>
      fetchBalanceSol(toAddress(addr))
        .then((b) => live && setBalance(b))
        .catch(() => live && setBalance(null));
    tick();
    const id = window.setInterval(tick, 15_000);
    return () => {
      live = false;
      window.clearInterval(id);
    };
  }, [addr, airdrop.kind]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!connected || !addr) return null;

  const getSol = async () => {
    setAirdrop({ kind: 'busy' });
    try {
      const signature = await requestDevnetSol(toAddress(addr));
      setAirdrop({ kind: 'done', signature });
    } catch {
      setAirdrop({
        kind: 'error',
        message: 'The devnet faucet turned this request down. It rate-limits often, so try again in a minute or use faucet.solana.com.',
      });
    }
  };

  return (
    <div className="wallet" ref={ref}>
      <button className="btn btn-quiet wallet-trigger" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="wallet-balance num">{balance == null ? '–' : `${balance.toFixed(2)} SOL`}</span>
        <span className="wallet-addr">{shortAddress(addr)}</span>
        <ChevronDown size={16} aria-hidden />
      </button>
      {open && (
        <div className="menu" role="menu">
          <p className="menu-note">Devnet balance. Practice predictions don't spend it.</p>
          <button className="menu-item" role="menuitem" disabled={airdrop.kind === 'busy'} onClick={getSol}>
            <Droplets size={16} aria-hidden />
            {airdrop.kind === 'busy' ? 'Requesting 1 devnet SOL…' : 'Get 1 devnet SOL'}
          </button>
          {airdrop.kind === 'done' && (
            <a className="menu-link" href={explorerTx(airdrop.signature)} target="_blank" rel="noreferrer">
              Airdrop sent. View on Explorer
            </a>
          )}
          {airdrop.kind === 'error' && <p className="menu-error">{airdrop.message}</p>}
          <button className="menu-item" role="menuitem" onClick={() => disconnect()}>
            <LogOut size={16} aria-hidden />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}

function ConnectMenu() {
  const wallets = useWallets(client);
  const { dispatch: connect, status, error } = useConnect(client);
  const [open, setOpen] = useState(false);
  const solanaWallets = wallets.filter((w) => w.chains.some((c) => c.startsWith('solana:')));

  return (
    <div className="wallet">
      <button className="btn btn-ink" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Wallet size={16} aria-hidden />
        {status === 'running' ? 'Connecting…' : 'Connect wallet'}
      </button>
      {open && (
        <div className="menu" role="menu">
          {solanaWallets.length === 0 ? (
            <p className="menu-note">
              No Solana wallet found in this browser. Install Phantom, Solflare or Backpack, switch it to devnet, then reload.
            </p>
          ) : (
            solanaWallets.map((w) => (
              <button
                key={w.name}
                className="menu-item"
                role="menuitem"
                onClick={() => {
                  connect(w);
                  setOpen(false);
                }}
              >
                {w.icon ? <img src={w.icon} alt="" width={18} height={18} /> : <Wallet size={16} aria-hidden />}
                {w.name}
              </button>
            ))
          )}
          {error != null && <p className="menu-error">The wallet didn't connect. Approve the request in the wallet, or pick another one.</p>}
        </div>
      )}
    </div>
  );
}

function Switch() {
  const connected = useConnectedWallet(client);
  return connected ? <ConnectedMenu /> : <ConnectMenu />;
}

export function WalletControl() {
  return (
    <WalletReadyGate client={client} fallback={<span className="wallet-loading">Looking for wallets…</span>}>
      <Switch />
    </WalletReadyGate>
  );
}

export function useOwnerKey(): string {
  return useConnectedWallet(client)?.account.address ?? 'guest';
}
