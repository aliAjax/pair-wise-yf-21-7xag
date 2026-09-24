import { useMemo, useState } from "react";
import type { Carpet } from "../types";
import { isLocked, progressOf } from "../store";

interface ArchiveListProps {
  carpets: Carpet[];
  origins: string[];
  activeId: string | null;
  onOpen: (id: string) => void;
  onNewCarpet: (data: NewCarpetData) => void;
}

export interface NewCarpetData {
  name: string;
  origin: string;
  era: string;
  knotDensity: string;
  material: string;
  dyeType: string;
}

/** 按产地筛选的档案列表；各块地毯的破损标记与工序进度随档案一起显示 */
export default function ArchiveList({
  carpets,
  origins,
  activeId,
  onOpen,
  onNewCarpet,
}: ArchiveListProps) {
  const [filter, setFilter] = useState<string>("全部");
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(
    () => (filter === "全部" ? carpets : carpets.filter((c) => c.origin === filter)),
    [carpets, filter]
  );

  return (
    <section className="panel archive">
      <div className="heading">
        <div>
          <p>档案库</p>
          <h2>纹样与修复档案</h2>
        </div>
        <button className="primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "收起" : "新增地毯"}
        </button>
      </div>

      <div className="origin-filter" role="group" aria-label="按产地筛选">
        {["全部", ...origins].map((o) => (
          <button
            key={o}
            className={filter === o ? "chip active" : "chip"}
            onClick={() => setFilter(o)}
          >
            {o}
            <em>{o === "全部" ? carpets.length : carpets.filter((c) => c.origin === o).length}</em>
          </button>
        ))}
      </div>

      {showForm && <NewCarpetForm origins={origins} onSubmit={(d) => { onNewCarpet(d); setShowForm(false); }} />}

      <div className="archive-list">
        {filtered.length === 0 && (
          <p className="muted empty-tip">该产地下暂无档案。</p>
        )}
        {filtered.map((c) => {
          const p = progressOf(c);
          const lockedCount = c.areas.filter(isLocked).length;
          return (
            <article
              key={c.id}
              className={"archive-card" + (c.id === activeId ? " active" : "")}
              onClick={() => onOpen(c.id)}
            >
              <div className="archive-top">
                <div>
                  <h3>{c.name}</h3>
                  <p className="archive-no">
                    {c.id} · {c.origin} · {c.era}
                  </p>
                </div>
                <StatusBadge status={c.status} ready={p.pct === 100 && p.total > 0} />
              </div>

              <p className="archive-meta">
                结密度 {c.knotDensity} · {c.material} · {c.dyeType}
              </p>

              <div className="archive-progress">
                <div className="progress-track">
                  <div className="progress-bar" style={{ width: `${p.pct}%` }} />
                </div>
                <span>
                  补齐色号 {p.assigned}/{p.total} 区域 · {p.pct}%
                </span>
              </div>

              <ul className="area-dots" aria-label="破损区域标记">
                {c.areas.length === 0 && <li className="muted">尚未圈定破损区域</li>}
                {c.areas.map((a, i) => (
                  <li key={a.id} className={a.swatchId ? "assigned" : "unassigned"}>
                    <span>{i + 1}</span>
                    <b>{a.swatchId ? "已派色" : "待派色"}</b>
                    {isLocked(a) && <em>已开工</em>}
                  </li>
                ))}
              </ul>

              <p className="archive-locked muted">
                {lockedCount > 0 ? `${lockedCount} 个区域已写工序记录，色号锁定` : "尚无区域开工"}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function StatusBadge({ status, ready }: { status: Carpet["status"]; ready: boolean }) {
  return (
    <span className={"status-badge " + (ready ? "ready" : status === "待修复" ? "todo" : "doing")}>
      {status}
      {ready && status !== "待验收" && <em>（可标待验收）</em>}
    </span>
  );
}

function NewCarpetForm({
  origins,
  onSubmit,
}: {
  origins: string[];
  onSubmit: (d: NewCarpetData) => void;
}) {
  return (
    <form
      className="new-carpet"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        onSubmit({
          name: String(fd.get("name") ?? "").trim(),
          origin: String(fd.get("origin") ?? origins[0]),
          era: String(fd.get("era") ?? "").trim(),
          knotDensity: String(fd.get("knotDensity") ?? "").trim(),
          material: String(fd.get("material") ?? "").trim(),
          dyeType: String(fd.get("dyeType") ?? "").trim(),
        });
      }}
    >
      <label>
        <span>名称</span>
        <input name="name" placeholder="如：大不里士藤蔓纹地毯" required />
      </label>
      <label>
        <span>产地</span>
        <select name="origin" defaultValue={origins[0]}>
          {origins.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </label>
      <label>
        <span>年代</span>
        <input name="era" placeholder="如：约1940年代" />
      </label>
      <label>
        <span>结密度</span>
        <input name="knotDensity" placeholder="如：38 结/cm²" />
      </label>
      <label>
        <span>材质</span>
        <input name="material" placeholder="如：羊毛（棉经）" />
      </label>
      <label>
        <span>染色类型</span>
        <input name="dyeType" placeholder="如：植物染" />
      </label>
      <button className="primary" type="submit">建档</button>
    </form>
  );
}
