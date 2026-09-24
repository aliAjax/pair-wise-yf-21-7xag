import type { ColorThread, Origin, Rug } from "../types";
import { ORIGINS } from "../types";
import { rugProgress } from "../domain";
import PatternMap from "./PatternMap";

interface Props {
  rugs: Rug[];
  colors: ColorThread[];
  filter: Origin | "全部";
  counts: Map<string, number>;
  selectedId: string | null;
  onFilter: (f: Origin | "全部") => void;
  onSelect: (rug: Rug) => void;
}

const STATUS_CLASS: Record<string, string> = {
  待修复: "st-todo",
  修复中: "st-doing",
  待验收: "st-review",
  已验收: "st-done",
};

/** 左侧档案列表：按产地筛选，破损标记与工序进度随筛选一起显示 */
export default function RugList({ rugs, colors, filter, counts, selectedId, onFilter, onSelect }: Props) {
  const shown = filter === "全部" ? rugs : rugs.filter((r) => r.origin === filter);

  return (
    <aside className="panel archive-panel">
      <div className="panel-head">
        <h2>纹样档案</h2>
        <span className="muted">{shown.length} 块在册</span>
      </div>

      <div className="filter-chips" role="tablist" aria-label="按产地筛选">
        {(["全部", ...ORIGINS] as const).map((o) => (
          <button
            key={o}
            type="button"
            className={`chip ${filter === o ? "is-active" : ""}`}
            onClick={() => onFilter(o)}
          >
            {o}
            <em>{o === "全部" ? rugs.length : counts.get(o) ?? 0}</em>
          </button>
        ))}
      </div>

      <div className="rug-list">
        {shown.length === 0 && <p className="empty">该产地暂无档案。</p>}
        {shown.map((rug) => {
          const p = rugProgress(rug);
          return (
            <button
              key={rug.id}
              type="button"
              className={`rug-item ${rug.id === selectedId ? "is-selected" : ""}`}
              onClick={() => onSelect(rug)}
            >
              <div className="rug-item-map">
                <PatternMap rug={rug} colors={colors} mini />
              </div>
              <div className="rug-item-body">
                <div className="rug-item-top">
                  <b>{rug.code}</b>
                  <span className={`status ${STATUS_CLASS[rug.status]}`}>{rug.status}</span>
                </div>
                <p className="rug-item-name">{rug.name}</p>
                <p className="rug-item-meta">
                  {rug.origin} · {rug.era} · 结密度 {rug.knotDensity || "—"}
                </p>
                <div className="progress">
                  <div className="progress-track">
                    <div
                      className={`progress-fill ${p.pct === 100 && p.total > 0 ? "is-full" : ""}`}
                      style={{ width: `${p.pct}%` }}
                    />
                  </div>
                  <span className="progress-text">
                    补色 {p.assigned}/{p.total}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
