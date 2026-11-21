import { useCallback, useEffect, useState } from 'react';
import { applyPrediction, quote, SEED_MARKETS, STARTING_PRACTICE_BALANCE, type Market, type Position, type Side } from './markets';

// Practice state lives in this browser only. Each wallet (or "guest") gets its own book.
type Book = { balance: number; positions: Position[]; serial: number };
type Saved = { markets: Market[]; books: Record<string, Book> };

const KEY = 'hunch.v1';

function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Saved;
      if (Array.isArray(parsed.markets) && parsed.books) return parsed;
    }
  } catch {
    /* storage unavailable or corrupt: start fresh */
  }
  return { markets: SEED_MARKETS, books: {} };
}

function save(state: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode: keep state in memory only */
  }
}

const freshBook = (): Book => ({ balance: STARTING_PRACTICE_BALANCE, positions: [], serial: 4200 });

export function usePracticeStore(owner: string) {
  const [state, setState] = useState<Saved>(load);

  useEffect(() => save(state), [state]);

  const book = state.books[owner] ?? freshBook();

  const place = useCallback(
    (marketId: string, side: Side, amount: number): boolean => {
      const current = state.books[owner] ?? freshBook();
      const market = state.markets.find((m) => m.id === marketId);
      if (!market || !(amount > 0) || amount > current.balance + 1e-9) return false;
      const serial = current.serial + 1;
      const placed: Position = {
        id: `${marketId}-${serial}`,
        marketId,
        side,
        amount,
        oddsAtEntry: quote(market, side, amount).multiple,
        placedAt: Date.now(),
      };
      setState({
        markets: state.markets.map((m) => (m.id === marketId ? applyPrediction(m, side, amount) : m)),
        books: {
          ...state.books,
          [owner]: { balance: current.balance - amount, positions: [placed, ...current.positions], serial },
        },
      });
      return true;
    },
    [owner, state],
  );

  const reset = useCallback(() => {
    setState((prev) => {
      const books = { ...prev.books };
      delete books[owner];
      return { markets: SEED_MARKETS, books };
    });
  }, [owner]);

  return { markets: state.markets, balance: book.balance, positions: book.positions, nextSerial: book.serial + 1, place, reset };
}
