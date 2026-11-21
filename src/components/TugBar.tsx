import { fmtPct } from '../markets';

/** YES vs NO split. Width animates when the pools move. */
export function TugBar({ chance, size = 'md', preview }: { chance: number; size?: 'md' | 'lg'; preview?: number }) {
  const yes = Math.min(Math.max(chance, 0.02), 0.98);
  return (
    <div className={`tug tug-${size}`}>
      <div className="tug-labels">
        <span className="tug-yes">
          <span className="num">{fmtPct(chance)}</span> yes
        </span>
        <span className="tug-no">
          <span className="num">{fmtPct(1 - chance)}</span> no
        </span>
      </div>
      <div
        className="tug-track"
        role="img"
        aria-label={`${fmtPct(chance)} chance of yes, ${fmtPct(1 - chance)} chance of no`}
      >
        <div className="tug-fill" style={{ width: `${yes * 100}%` }} />
        {preview != null && Math.abs(preview - chance) > 0.001 && (
          <div className="tug-ghost" style={{ left: `${Math.min(Math.max(preview, 0.02), 0.98) * 100}%` }} aria-hidden />
        )}
      </div>
    </div>
  );
}
