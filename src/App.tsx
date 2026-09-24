import { useMemo, useState } from "react";
import type { Origin } from "./types";
import { useArchive } from "./store";
import { rugProgress } from "./domain";
import RugList from "./components/RugList";
import RugDetail from "./components/RugDetail";
import NewRugForm from "./components/NewRugForm";
import ColorCard, { colorUsage } from "./components/ColorCard";
import Toasts from "./components/Toasts";

export default function App() {
  const archive = useArchive();
  const { state } = archive;
  const [filter, setFilter] = useState<Origin | "全部">("全部");
  const [selectedId, setSelectedId] = useState<string | null>(state.rugs[0]?.id ?? null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

  const rug = state.rugs.find((r) => r.id === selectedId) ?? state.rugs[0] ?? null;

  const metrics = useMemo(() => {
    const doing = state.rugs.filter((r) => r.status === "修复中").length;
    const areas = state.rugs.reduce((n, r) => n + r.areas.length, 0);
    const emptyColors = state.colors.filter((c) => c.stock <= 0).length;
    const finishedRugs = state.rugs.filter(
      (r) => r.status === "待验收" || r.status === "已验收",
    ).length;
    const finishRate = state.rugs.length
      ? Math.round((finishedRugs / state.rugs.length) * 100)
      : 0;
    return [
      { label: "修复中", value: doing },
      { label: "纹样档案", value: state.rugs.length },
      { label: "破损区域", value: areas },
      { label: "色卡 可用/总数", value: `${state.colors.length - emptyColors}/${state.colors.length}` },
      { label: "完工待验收率", value: `${finishRate}%` },
    ];
  }, [state]);

  const usedByCode = colorUsage(state.rugs.map((r) => r.areas));

  function handleFilter(f: Origin | "全部") {
    setFilter(f);
    // 筛选后若当前毯子不在结果中，自动选结果中的第一块
    if (rug) {
      const inView = f === "全部" || rug.origin === f;
      if (!inView) {
        const next = state.rugs.find((r) => r.origin === (f as Origin)) ?? null;
        setSelectedId(next?.id ?? null);
        setSelectedAreaId(null);
      }
    }
  }

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">▦</span>
          <div>
            <h1>纹样与修复档案</h1>
            <p>手工地毯修复工作室 · 补线色号按区派料，工序与用线对得上</p>
          </div>
        </div>
        <div className="topbar-actions">
          <NewRugForm
            onCreate={(input) => {
              const id = archive.addRug(input);
              setSelectedId(id);
              setFilter("全部");
              setSelectedAreaId(null);
              return id;
            }}
          />
          <button type="button" className="ghost" onClick={archive.resetDemo}>
            重置示例数据
          </button>
        </div>
      </header>

      <section className="metrics">
        {metrics.map((m) => (
          <article key={m.label}>
            <small>{m.label}</small>
            <strong>{m.value}</strong>
          </article>
        ))}
      </section>

      <div className="layout">
        <RugList
          rugs={state.rugs}
          colors={state.colors}
          filter={filter}
          counts={archive.counts}
          selectedId={rug?.id ?? null}
          onFilter={handleFilter}
          onSelect={(r) => {
            setSelectedId(r.id);
            setSelectedAreaId(null);
          }}
        />

        <div className="main-col">
          {rug ? (
            <RugDetail
              key={rug.id}
              rug={rug}
              colors={state.colors}
              selectedAreaId={selectedAreaId}
              onSelectArea={setSelectedAreaId}
              onAddArea={(x, y) => archive.addArea(rug.id, x, y)}
              onPatchArea={(areaId, patch) => archive.updateArea(rug.id, areaId, patch)}
              onAssign={(areaId, code) => archive.assignColor(rug.id, areaId, code)}
              onUnassign={(areaId) => archive.unassignColor(rug.id, areaId)}
              onAddLog={(areaId, content) => archive.addLog(rug.id, areaId, content)}
              onRequestAcceptance={() => archive.requestAcceptance(rug.id)}
              onApprove={() => archive.setStatus(rug.id, "已验收")}
            />
          ) : (
            <section className="panel empty-state">
              <p>还没有地毯档案，先新建一块，再到纹样图上圈破损区域。</p>
            </section>
          )}

          <section className="panel color-panel">
            <div className="panel-head">
              <div>
                <h2>材料色卡</h2>
                <span className="muted">库存为 0 的色号无法再派出；数字为余线卷数</span>
              </div>
            </div>
            <ColorCard colors={state.colors} usedByCode={usedByCode} />
            {rug && (
              <p className="hint">
                当前在看：{rug.code}，补色进度 {rugProgress(rug).assigned}/{rugProgress(rug).total}
              </p>
            )}
          </section>
        </div>
      </div>

      <footer className="foot">
        规则：已写完工序记录的区域视为已开工，色号锁定不可改；所有破损区域补齐色号后才能标待验收。数据保存在本浏览器。
      </footer>

      <Toasts toasts={archive.toasts} onDismiss={archive.dismissToast} />
    </main>
  );
}
