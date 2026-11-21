// Parimutuel market engine. Every prediction goes into the YES or NO pool;
// when a market resolves, the winning pool splits the whole pot (minus the fee)
// in proportion to stake. Runs in the browser until the on-chain program ships.

export type Side = 'yes' | 'no';
export type Category = 'Solana' | 'Crypto' | 'Sports' | 'World';

export type Market = {
  id: string;
  question: string;
  detail: string;
  category: Category;
  closesAt: string; // ISO date
  yesPool: number; // SOL
  noPool: number; // SOL
  traders: number;
};

export type Position = {
  id: string;
  marketId: string;
  side: Side;
  amount: number;
  oddsAtEntry: number; // payout multiple quoted when placed
  placedAt: number;
};

export const FEE = 0.02;
export const STARTING_PRACTICE_BALANCE = 25;

export const SEED_MARKETS: Market[] = [
  {
    id: 'sol-300',
    question: 'Will SOL close above $300 on December 31, 2026?',
    detail: 'Resolves YES if the SOL/USD daily close on Dec 31, 2026 (UTC) is above $300.00 on a major spot index.',
    category: 'Crypto',
    closesAt: '2026-12-31T23:59:00Z',
    yesPool: 412.5,
    noPool: 618.2,
    traders: 318,
  },
  {
    id: 'firedancer-stake',
    question: 'Will Firedancer validators hold over 30% of stake by March 31, 2027?',
    detail: 'Resolves YES if public validator client dashboards show Firedancer above 30% of active stake on Mar 31, 2027.',
    category: 'Solana',
    closesAt: '2027-03-31T23:59:00Z',
    yesPool: 205.0,
    noPool: 161.4,
    traders: 142,
  },
  {
    id: 'q1-uptime',
    question: 'Will Solana mainnet go all of Q1 2027 without a block production halt?',
    detail: 'Resolves NO if the cluster stops producing blocks for 10 minutes or more at any point between Jan 1 and Mar 31, 2027.',
    category: 'Solana',
    closesAt: '2027-03-31T23:59:00Z',
    yesPool: 540.8,
    noPool: 96.3,
    traders: 201,
  },
  {
    id: 'btc-ath',
    question: 'Will Bitcoin set a new all-time high before February 1, 2027?',
    detail: 'Resolves YES if BTC/USD prints a price above its previous record high on a major spot index before Feb 1, 2027.',
    category: 'Crypto',
    closesAt: '2027-01-31T23:59:00Z',
    yesPool: 288.0,
    noPool: 301.7,
    traders: 266,
  },
  {
    id: 'super-bowl-ot',
    question: 'Will the February 2027 Super Bowl go to overtime?',
    detail: 'Resolves YES if regulation ends tied and the game is decided in overtime.',
    category: 'Sports',
    closesAt: '2027-02-14T23:00:00Z',
    yesPool: 38.6,
    noPool: 311.9,
    traders: 97,
  },
  {
    id: 'ucl-penalties',
    question: 'Will the 2027 Champions League final be decided on penalties?',
    detail: 'Resolves YES if the final is level after extra time and goes to a penalty shootout.',
    category: 'Sports',
    closesAt: '2027-05-29T21:00:00Z',
    yesPool: 52.1,
    noPool: 230.4,
    traders: 74,
  },
  {
    id: 'nyc-snow',
    question: 'Will it snow in New York City on Christmas Day 2026?',
    detail: 'Resolves YES if the Central Park station records measurable snowfall (0.1 inch or more) on Dec 25, 2026.',
    category: 'World',
    closesAt: '2026-12-25T23:59:00Z',
    yesPool: 61.0,
    noPool: 148.5,
    traders: 129,
  },
  {
    id: 'moon-landing',
    question: 'Will a crewed mission land on the Moon before 2028?',
    detail: 'Resolves YES if astronauts touch down on the lunar surface before Jan 1, 2028, by any agency or company.',
    category: 'World',
    closesAt: '2027-12-31T23:59:00Z',
    yesPool: 133.2,
    noPool: 207.9,
    traders: 188,
  },
];

export function yesChance(m: Pick<Market, 'yesPool' | 'noPool'>): number {
  const total = m.yesPool + m.noPool;
  return total === 0 ? 0.5 : m.yesPool / total;
}

export function totalPool(m: Pick<Market, 'yesPool' | 'noPool'>): number {
  return m.yesPool + m.noPool;
}

export type Quote = {
  payout: number; // SOL returned if the side wins, stake included
  multiple: number; // payout / stake
  chanceAfter: number; // YES chance after this prediction lands
  fee: number;
};

/** What a stake would pay if its side wins, given the pools after it lands. */
export function quote(m: Market, side: Side, amount: number): Quote {
  const yes = m.yesPool + (side === 'yes' ? amount : 0);
  const no = m.noPool + (side === 'no' ? amount : 0);
  const sidePool = side === 'yes' ? yes : no;
  const pot = yes + no;
  const gross = amount > 0 ? (amount / sidePool) * pot : 0;
  const fee = gross * FEE;
  const payout = gross - fee;
  return {
    payout,
    multiple: amount > 0 ? payout / amount : (pot / Math.max(sidePool, 1e-9)) * (1 - FEE),
    chanceAfter: yes / pot,
    fee,
  };
}

/** Current estimate of what an open position would pay if its side wins. */
export function positionPayout(m: Market, p: Position): number {
  const sidePool = p.side === 'yes' ? m.yesPool : m.noPool;
  return (p.amount / sidePool) * totalPool(m) * (1 - FEE);
}

export function applyPrediction(m: Market, side: Side, amount: number): Market {
  return side === 'yes'
    ? { ...m, yesPool: m.yesPool + amount, traders: m.traders + 1 }
    : { ...m, noPool: m.noPool + amount, traders: m.traders + 1 };
}

export function closesIn(iso: string, now = Date.now()): string {
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return 'Closed';
  const days = Math.floor(ms / 86_400_000);
  if (days >= 60) return `Closes ${new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`;
  if (days >= 1) return `Closes in ${days} day${days === 1 ? '' : 's'}`;
  const hours = Math.max(1, Math.floor(ms / 3_600_000));
  return `Closes in ${hours} hour${hours === 1 ? '' : 's'}`;
}

const sol = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 });
const compact = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1, notation: 'compact' });

export function fmtSol(n: number): string {
  return `${sol.format(n)} SOL`;
}

export function fmtCompactSol(n: number): string {
  return `${compact.format(n)} SOL`;
}

export function fmtPct(chance: number): string {
  return `${Math.round(chance * 100)}%`;
}
