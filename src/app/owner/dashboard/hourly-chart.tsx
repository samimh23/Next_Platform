'use client';

import { useState } from 'react';
import { formatDT } from '@/lib/money';

type Hour = { hour: number; revenue: number; tickets: number };

const H = 220; // plot height
const PAD = { top: 12, right: 8, bottom: 24, left: 44 };
const SLOT = 32; // width per hour
const BAR = 20; // ≤ 24px, the rest of the slot is air

/** Clean axis steps in dinars: 1, 2, 5, 10, 20, 50… */
function niceStep(maxDT: number): number {
  const raw = maxDT / 4;
  const pow = 10 ** Math.floor(Math.log10(Math.max(raw, 1)));
  return [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? 10 * pow;
}

/** Café revenue per hour (Tunisia time). One series → no legend; the card title names it. */
export function HourlyChart({ data }: { data: Hour[] }) {
  const [active, setActive] = useState<number | null>(null);

  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Pas encore de vente aujourd’hui.</p>;
  }

  // Show a normal café day (7h → 20h) and stretch to include any earlier/later sale.
  const first = Math.min(7, ...data.map((d) => d.hour));
  const last = Math.max(20, ...data.map((d) => d.hour));
  const hours = Array.from({ length: last - first + 1 }, (_, i) => first + i);
  const byHour = new Map(data.map((d) => [d.hour, d]));

  const maxDT = Math.max(...data.map((d) => d.revenue)) / 1000;
  const step = niceStep(maxDT);
  const top = Math.ceil(maxDT / step) * step;
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  const y = (millimes: number) => PAD.top + H - (millimes / 1000 / top) * H;
  const width = PAD.left + hours.length * SLOT + PAD.right;
  const activeData = active !== null ? byHour.get(active) : undefined;

  return (
    <div className="grid gap-3">
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${PAD.top + H + PAD.bottom}`}
          className="h-auto w-full"
          role="img"
          aria-label="Chiffre d’affaires par heure"
        >
          {/* Recessive grid + y ticks (DT) */}
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(t * 1000)} y2={y(t * 1000)} className="stroke-border" strokeWidth={1} />
              <text x={PAD.left - 6} y={y(t * 1000)} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[10px] tabular-nums">
                {t.toLocaleString('fr-FR')}
              </text>
            </g>
          ))}

          {hours.map((h, i) => {
            const d = byHour.get(h);
            const cx = PAD.left + i * SLOT + SLOT / 2;
            const barTop = d ? y(d.revenue) : PAD.top + H;
            const barH = PAD.top + H - barTop;
            return (
              <g key={h}>
                {/* Column: 4px rounded data-end, square at the baseline */}
                {d && barH > 0 && (
                  <path
                    d={roundedTopBar(cx - BAR / 2, barTop, BAR, barH, Math.min(4, barH))}
                    className="fill-chart-1 transition-opacity"
                    opacity={active === null || active === h ? 1 : 0.45}
                  />
                )}
                {/* Hit target: the whole slot, keyboard-focusable */}
                {d && (
                  <rect
                    x={cx - SLOT / 2}
                    y={PAD.top}
                    width={SLOT}
                    height={H}
                    fill="transparent"
                    tabIndex={0}
                    role="button"
                    aria-label={`${h}h–${h + 1}h : ${formatDT(d.revenue)}, ${d.tickets} ticket${d.tickets > 1 ? 's' : ''}`}
                    onPointerEnter={() => setActive(h)}
                    onPointerLeave={() => setActive(null)}
                    onFocus={() => setActive(h)}
                    onBlur={() => setActive(null)}
                    className="cursor-default outline-none"
                  />
                )}
                {h % 2 === 0 && (
                  <text x={cx} y={PAD.top + H + 16} textAnchor="middle" className="fill-muted-foreground text-[10px]">
                    {h}h
                  </text>
                )}
              </g>
            );
          })}
          <line x1={PAD.left} x2={width - PAD.right} y1={PAD.top + H} y2={PAD.top + H} className="stroke-border" strokeWidth={1} />
        </svg>

        {activeData && active !== null && (
          <div
            className="pointer-events-none absolute top-0 rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-sm"
            style={{ left: `${((PAD.left + (hours.indexOf(active) + 0.5) * SLOT) / width) * 100}%`, transform: 'translateX(-50%)' }}
          >
            <p className="font-semibold">{formatDT(activeData.revenue)}</p>
            <p className="text-muted-foreground">
              {active}h–{active + 1}h · {activeData.tickets} ticket{activeData.tickets > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Table view: every value reachable without hovering */}
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground">Voir en tableau</summary>
        <table className="mt-2 w-full text-left tabular-nums">
          <thead className="text-muted-foreground">
            <tr>
              <th className="py-1 font-medium">Heure</th>
              <th className="py-1 text-right font-medium">Tickets</th>
              <th className="py-1 text-right font-medium">Chiffre d’affaires</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.hour} className="border-t">
                <td className="py-1">
                  {d.hour}h–{d.hour + 1}h
                </td>
                <td className="py-1 text-right">{d.tickets}</td>
                <td className="py-1 text-right">{formatDT(d.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

/** Column path with rounded top corners only. */
function roundedTopBar(x: number, y: number, w: number, h: number, r: number): string {
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}
