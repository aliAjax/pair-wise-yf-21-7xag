import type { ColorThread, DamageArea } from "../types";

interface Props {
  colors: ColorThread[];
  usedByCode: Map<string, number>;
  pickCode?: string | null;
  onPick?: (code: string) => void;
  compact?: boolean;
}

/** 材料色卡：显示每个色号余线；派色模式下可点击选取，用完的色号不可派 */
export default function ColorCard({ colors, usedByCode, pickCode, onPick, compact }: Props) {
  return (
    <div className={`color-card${compact ? " is-compact" : ""}`}>
      {colors.map((c) => {
        const used = usedByCode.get(c.code) ?? 0;
        const empty = c.stock <= 0;
        const picked = pickCode === c.code;
        return (
          <button
            key={c.code}
            type="button"
            className={`swatch ${empty ? "is-empty" : ""} ${picked ? "is-picked" : ""}`}
            disabled={empty && !!onPick}
            onClick={() => onPick?.(c.code)}
            title={
              empty
                ? `${c.code} ${c.name} 已用完，不能派出`
                : `${c.code} ${c.name} · 余线 ${c.stock} 卷${used ? ` · 在派 ${used} 处` : ""}`
            }
          >
            <span className="swatch-chip" style={{ background: c.hex }} />
            <span className="swatch-meta">
              <b>{c.code}</b>
              <i>{c.name}</i>
            </span>
            <span className={`swatch-stock ${empty ? "is-zero" : ""}`}>
              {empty ? "已用完" : `余 ${c.stock}`}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function colorUsage(areas: DamageArea[][]): Map<string, number> {
  const map = new Map<string, number>();
  for (const list of areas) {
    for (const a of list) {
      if (a.colorCode) map.set(a.colorCode, (map.get(a.colorCode) ?? 0) + 1);
    }
  }
  return map;
}
