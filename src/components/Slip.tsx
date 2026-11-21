import { useEffect, useId, useState } from 'react';
import { Check } from 'lucide-react';
import { closesIn, FEE, fmtPct, fmtSol, quote, type Market, type Side } from '../markets';
import { TugBar } from './TugBar';

const QUICK = [0.5, 1, 2, 5];

type Props = {
  market: Market;
  balance: number;
  serial: number;
  onPlace: (side: Side, amount: number) => boolean;
};

export function Slip({ market, balance, serial, onPlace }: Props) {
  const [side, setSide] = useState<Side>('yes');
  const [raw, setRaw] = useState('1');
  const [placed, setPlaced] = useState<{ side: Side; amount: number } | null>(null);
  const amountId = useId();

  useEffect(() => setPlaced(null), [market.id]);

  const amount = Number.parseFloat(raw);
  const valid = Number.isFinite(amount) && amount > 0;
  const tooMuch = valid && amount > balance + 1e-9;
  const q = quote(market, side, valid ? amount : 0);
  const problem = !valid
    ? raw.trim() === ''
      ? 'Enter how much SOL to put on this.'
      : 'Enter an amount above zero.'
    : tooMuch
      ? `That's more than your ${fmtSol(balance)} practice balance.`
      : null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (problem) return;
    if (onPlace(side, amount)) setPlaced({ side, amount });
  };

  return (
    <form className="slip" onSubmit={submit} aria-labelledby="slip-title">
      <div className="slip-head">
        <h2 id="slip-title" className="slip-title">Prediction slip</h2>
        <span className="slip-serial num">No. {String(serial).padStart(6, '0')}</span>
      </div>

      <p className="slip-question">{market.question}</p>
      <p className="slip-meta">{closesIn(market.closesAt)}</p>
      <TugBar chance={market.yesPool / (market.yesPool + market.noPool)} preview={valid && !tooMuch ? q.chanceAfter : undefined} />

      <fieldset className="side-pick">
        <legend className="field-label">Your call</legend>
        {(['yes', 'no'] as const).map((s) => (
          <label key={s} className={`side side-${s}`}>
            <input type="radio" name="side" value={s} checked={side === s} onChange={() => setSide(s)} />
            <span className="side-word">{s === 'yes' ? 'Yes' : 'No'}</span>
            <span className="side-odds num">{quote(market, s, 0).multiple.toFixed(2)}×</span>
          </label>
        ))}
      </fieldset>

      <div className="field">
        <label className="field-label" htmlFor={amountId}>
          Stake
        </label>
        <div className={`amount ${problem && raw !== '' ? 'amount-bad' : ''}`}>
          <input
            id={amountId}
            className="num"
            inputMode="decimal"
            autoComplete="off"
            value={raw}
            onChange={(e) => setRaw(e.target.value.replace(/[^0-9.]/g, ''))}
            aria-invalid={problem != null}
            aria-describedby={`${amountId}-hint`}
          />
          <span className="amount-unit">SOL</span>
        </div>
        <div className="quick">
          {QUICK.map((v) => (
            <button key={v} type="button" className="chip num" onClick={() => setRaw(String(v))} disabled={v > balance}>
              {v}
            </button>
          ))}
          <button type="button" className="chip" onClick={() => setRaw(String(Math.floor(balance * 100) / 100))} disabled={balance <= 0}>
            Max
          </button>
        </div>
        <p id={`${amountId}-hint`} className={problem ? 'field-error' : 'field-hint'}>
          {problem ?? `Practice balance ${fmtSol(balance)}`}
        </p>
      </div>

      <div className="perforation" aria-hidden />

      <dl className="receipt">
        <div>
          <dt>Pays if {side === 'yes' ? 'yes' : 'no'}</dt>
          <dd className="num receipt-big">{valid && !tooMuch ? fmtSol(q.payout) : '–'}</dd>
        </div>
        <div>
          <dt>Multiple</dt>
          <dd className="num">{valid && !tooMuch ? `${q.multiple.toFixed(2)}×` : '–'}</dd>
        </div>
        <div>
          <dt>Yes chance after</dt>
          <dd className="num">{valid && !tooMuch ? fmtPct(q.chanceAfter) : '–'}</dd>
        </div>
        <div>
          <dt>Fee ({FEE * 100}% of winnings)</dt>
          <dd className="num">{valid && !tooMuch ? fmtSol(q.fee) : '–'}</dd>
        </div>
      </dl>

      <button type="submit" className={`btn btn-place btn-place-${side}`} disabled={problem != null}>
        Place {side === 'yes' ? 'Yes' : 'No'} prediction
      </button>

      <p className="slip-confirm" role="status" aria-live="polite">
        {placed && (
          <>
            <Check size={16} aria-hidden /> Placed {fmtSol(placed.amount)} on {placed.side === 'yes' ? 'Yes' : 'No'}.
          </>
        )}
      </p>
    </form>
  );
}
