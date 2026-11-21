import { useMemo, useRef, useState } from 'react';
import { ClientProvider } from '@solana/react';
import { RotateCcw } from 'lucide-react';
import { client } from './solana';
import { closesIn, fmtCompactSol, fmtPct, fmtSol, positionPayout, totalPool, yesChance, type Category } from './markets';
import { usePracticeStore } from './store';
import { TugBar } from './components/TugBar';
import { Slip } from './components/Slip';
import { useOwnerKey, WalletControl } from './components/WalletControl';

const FILTERS: Array<'All' | Category> = ['All', 'Solana', 'Crypto', 'Sports', 'World'];

function Board() {
  const owner = useOwnerKey();
  const { markets, balance, positions, nextSerial, place, reset } = usePracticeStore(owner);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const [selectedId, setSelectedId] = useState(markets[0].id);
  const slipRef = useRef<HTMLDivElement>(null);

  const shown = useMemo(() => (filter === 'All' ? markets : markets.filter((m) => m.category === filter)), [markets, filter]);
  const selected = markets.find((m) => m.id === selectedId) ?? markets[0];

  const pick = (id: string) => {
    setSelectedId(id);
    if (window.matchMedia('(max-width: 959px)').matches) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      requestAnimationFrame(() => slipRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }));
    }
  };

  const staked = positions.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="page">
      <header className="top">
        <div className="brand">
          <span className="wordmark">Hunch</span>
          <span className="mode-pill">
            <span className="live-dot" aria-hidden />
            Practice mode on devnet
          </span>
        </div>
        <WalletControl />
      </header>

      <main className="layout">
        <section className="board" aria-labelledby="board-title">
          <div className="board-head">
            <div>
              <h1 id="board-title" className="board-title">Call it before it happens.</h1>
              <p className="board-lede">
                Pick a side on real-world questions. Odds move with every prediction, and the winning side splits the pot.
                Stakes here are practice SOL, so nothing leaves your wallet.
              </p>
            </div>
          </div>

          <div className="filters" role="tablist" aria-label="Filter markets">
            {FILTERS.map((f) => (
              <button key={f} role="tab" aria-selected={filter === f} className="filter" onClick={() => setFilter(f)}>
                {f}
              </button>
            ))}
          </div>

          <ul className="markets">
            {shown.map((m) => (
              <li key={m.id}>
                <button className="market" aria-pressed={m.id === selected.id} onClick={() => pick(m.id)}>
                  <span className="market-q">{m.question}</span>
                  <span className="market-meta">
                    <span>{m.category}</span>
                    <span>{closesIn(m.closesAt)}</span>
                    <span className="num">{fmtCompactSol(totalPool(m))} pooled</span>
                    <span className="num">{m.traders} traders</span>
                  </span>
                  <TugBar chance={yesChance(m)} />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <aside className="rail" ref={slipRef} aria-label="Selected market">
          <Slip
            key={owner}
            market={selected}
            balance={balance}
            serial={nextSerial}
            onPlace={(side, amount) => place(selected.id, side, amount)}
          />
          <p className="side-detail">{selected.detail}</p>
        </aside>

        <section className="book" aria-labelledby="book-title">
          <div className="book-head">
            <h2 id="book-title" className="book-title">Your predictions</h2>
            {positions.length > 0 && (
              <button className="btn btn-quiet" onClick={reset}>
                <RotateCcw size={16} aria-hidden />
                Reset practice
              </button>
            )}
          </div>
          {positions.length === 0 ? (
            <p className="empty">
              Nothing placed yet. Pick a market, choose Yes or No, and your predictions show up here with what they'd pay right now.
            </p>
          ) : (
            <>
              <p className="book-summary num">
                {fmtSol(staked)} staked across {positions.length} prediction{positions.length === 1 ? '' : 's'}, {fmtSol(balance)} left to play
              </p>
              <div className="table-wrap">
                <table className="positions">
                  <thead>
                    <tr>
                      <th scope="col">Market</th>
                      <th scope="col">Call</th>
                      <th scope="col" className="r">Stake</th>
                      <th scope="col" className="r">Pays now if right</th>
                      <th scope="col" className="r">Yes chance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((p) => {
                      const m = markets.find((x) => x.id === p.marketId);
                      if (!m) return null;
                      return (
                        <tr key={p.id}>
                          <td>
                            <button className="link" onClick={() => pick(m.id)}>
                              {m.question}
                            </button>
                          </td>
                          <td>
                            <span className={`call call-${p.side}`}>{p.side === 'yes' ? 'Yes' : 'No'}</span>
                          </td>
                          <td className="r num">{fmtSol(p.amount)}</td>
                          <td className="r num">{fmtSol(positionPayout(m, p))}</td>
                          <td className="r num">{fmtPct(yesChance(m))}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </main>

      <footer className="foot">
        <p>
          Hunch runs on Solana devnet. Markets, pools and practice balances live in this browser until the on-chain program is deployed.
          Wallet balances and airdrops are real devnet calls.
        </p>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <ClientProvider client={client}>
      <Board />
    </ClientProvider>
  );
}
