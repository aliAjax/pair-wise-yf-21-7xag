import { useState } from "react";
import type { Swatch } from "../types";

interface ColorCardProps {
  swatches: Swatch[];
  onAdjust: (id: string, delta: number) => void;
  onAdd: (data: Omit<Swatch, "id">) => void;
}

/** 材料色卡：余量为 0 的色号标记为已用完，派色时不可选 */
export default function ColorCard({ swatches, onAdjust, onAdd }: ColorCardProps) {
  const [open, setOpen] = useState(false);
  const exhaustedCount = swatches.filter((s) => s.stock <= 0).length;

  return (
    <section className="panel color-card">
      <div className="heading">
        <div>
          <p>材料色卡</p>
          <h2>补线色号台账</h2>
        </div>
        <span className="pill">
          {swatches.length - exhaustedCount} 个可用 · {exhaustedCount} 个已用完
        </span>
      </div>

      <div className="color-grid">
        {swatches.map((s) => {
          const exhausted = s.stock <= 0;
          return (
            <article
              key={s.id}
              className={"color-tile" + (exhausted ? " exhausted" : "")}
            >
              <div className="color-swatch" style={{ background: s.hex }}>
                {exhausted && <span className="out-stamp">已用完</span>}
              </div>
              <div className="color-info">
                <b>{s.code}</b>
                <span className="muted">{s.name}</span>
                <span className="stock-line">
                  余量 <strong>{s.stock}</strong> 绞
                </span>
                <div className="stock-ctrl">
                  <button onClick={() => onAdjust(s.id, -1)} disabled={exhausted}>
                    用 1 绞
                  </button>
                  <button onClick={() => onAdjust(s.id, 1)}>补 1 绞</button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <details className="add-color" open={open} onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}>
        <summary>新增色号</summary>
        <form
          className="color-form"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const code = String(fd.get("code") ?? "").trim();
            const name = String(fd.get("name") ?? "").trim();
            const hex = String(fd.get("hex") ?? "#7c2d12");
            const stock = Number(fd.get("stock") ?? 0);
            if (!code || !name) return;
            onAdd({ code, name, hex, stock: Number.isFinite(stock) ? stock : 0 });
            e.currentTarget.reset();
            setOpen(false);
          }}
        >
          <label>
            <span>色号</span>
            <input name="code" placeholder="RC-801" required />
          </label>
          <label>
            <span>名称</span>
            <input name="name" placeholder="如：石榴黄" required />
          </label>
          <label>
            <span>颜色</span>
            <input name="hex" type="color" defaultValue="#7c2d12" />
          </label>
          <label>
            <span>余量（绞）</span>
            <input name="stock" type="number" min={0} defaultValue={2} />
          </label>
          <button className="primary" type="submit">加入色卡</button>
        </form>
      </details>
    </section>
  );
}
