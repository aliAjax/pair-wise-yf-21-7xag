import { useEffect, useMemo, useState } from "react";
import "./styles.css";
import type { Carpet, DamageArea, Swatch } from "./types";
import {
  ORIGINS,
  isLocked,
  loadState,
  progressOf,
  resetState,
  saveState,
  uid,
} from "./store";
import PatternMap from "./components/PatternMap";
import AreaPanel from "./components/AreaPanel";
import ColorCard from "./components/ColorCard";
import ArchiveList, { type NewCarpetData } from "./components/ArchiveList";

interface Toast {
  id: string;
  kind: "error" | "ok" | "info";
  text: string;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** 派色后自动随进度更新状态；待验收只在全部区域补齐色号时才能保持，否则自动退回 */
function deriveStatus(carpet: Carpet): Carpet["status"] {
  const p = progressOf(carpet);
  const allAssigned = p.total > 0 && p.assigned === p.total;
  if (carpet.status === "待验收" && allAssigned) return "待验收";
  const started =
    carpet.areas.some((a) => a.swatchId !== null) ||
    carpet.areas.some((a) => a.logs.length > 0);
  return started ? "修复中" : "待修复";
}

export default function App() {
  const [state, setState] = useState(loadState);
  const [activeCarpetId, setActiveCarpetId] = useState<string | null>(
    () => loadState().carpets[0]?.id ?? null
  );
  const [activeAreaId, setActiveAreaId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => saveState(state), [state]);

  const carpet =
    state.carpets.find((c) => c.id === activeCarpetId) ?? state.carpets[0] ?? null;
  const area =
    carpet?.areas.find((a) => a.id === activeAreaId) ?? carpet?.areas[0] ?? null;

  function pushToast(kind: Toast["kind"], text: string) {
    const t: Toast = { id: uid(), kind, text };
    setToasts((ts) => [...ts, t]);
    window.setTimeout(() => {
      setToasts((ts) => ts.filter((x) => x.id !== t.id));
    }, 3600);
  }

  function patchCarpet(carpetId: string, fn: (c: Carpet) => Carpet) {
    setState((s) => ({
      ...s,
      carpets: s.carpets.map((c) => {
        if (c.id !== carpetId) return c;
        const next = { ...fn(c) };
        // 任何档案改动后都重算状态：进度掉出 100% 时自动退出待验收
        next.status = deriveStatus(next);
        return next;
      }),
    }));
  }

  // ---------- 地毯建档 ----------
  function handleNewCarpet(d: NewCarpetData) {
    const id = `CAR-${Math.max(100, ...state.carpets.map((c) => Number(c.id.slice(4)) || 0)) + 1}`;
    const c: Carpet = {
      id,
      name: d.name,
      origin: d.origin,
      era: d.era || "年代待考",
      knotDensity: d.knotDensity || "未测",
      material: d.material || "未登记",
      dyeType: d.dyeType || "未登记",
      status: "待修复",
      areas: [],
    };
    setState((s) => ({ ...s, carpets: [c, ...s.carpets] }));
    setActiveCarpetId(c.id);
    setActiveAreaId(null);
    pushToast("ok", `已建档 ${id}，可在纹样图上圈出破损区域。`);
  }

  // ---------- 破损区域 ----------
  function handleAddArea(x: number, y: number) {
    if (!carpet) return;
    const newArea: DamageArea = {
      id: uid(),
      label: `区域 ${carpet.areas.length + 1}`,
      x,
      y,
      swatchId: null,
      before: "",
      after: "",
      logs: [],
    };
    patchCarpet(carpet.id, (c) => ({ ...c, areas: [...c.areas, newArea] }));
    setActiveAreaId(newArea.id);
  }

  function handleDeleteArea(areaId: string) {
    if (!carpet) return;
    patchCarpet(carpet.id, (c) => ({
      ...c,
      areas: c.areas.filter((a) => a.id !== areaId),
    }));
    if (activeAreaId === areaId) setActiveAreaId(null);
  }

  // ---------- 派色（两条硬规则） ----------
  function handleAssignSwatch(areaId: string, swatchId: string) {
    if (!carpet) return;
    const target = carpet.areas.find((a) => a.id === areaId);
    if (!target) return;

    // 规则：已开工、写过工序记录的区域不许再改色号
    if (isLocked(target)) {
      pushToast(
        "error",
        `${target.label}已开工并写有工序记录，色号不能再改，避免记录与实际用线错开。`
      );
      return;
    }

    if (swatchId === "") {
      const wasReady = carpet.status === "待验收";
      patchCarpet(carpet.id, (c) => ({
        ...c,
        areas: c.areas.map((a) => (a.id === areaId ? { ...a, swatchId: null } : a)),
      }));
      if (wasReady) pushToast("info", "色号补齐数已不足 100%，档案自动退出待验收。");
      return;
    }

    const swatch = state.swatches.find((s) => s.id === swatchId);
    if (!swatch) return;

    // 规则：色卡里已用完的色号不能再派出，当场提示换一个
    if (swatch.stock <= 0) {
      pushToast(
        "error",
        `${swatch.code} ${swatch.name} 已用完，不能派给${target.label}，请换一个有余量的色号。`
      );
      return;
    }

    patchCarpet(carpet.id, (c) => ({
      ...c,
      areas: c.areas.map((a) =>
        a.id === areaId ? { ...a, swatchId } : a
      ),
    }));
    pushToast("ok", `${target.label} 已派色 ${swatch.code} ${swatch.name}。`);
  }

  function handleChangeText(
    areaId: string,
    field: "before" | "after",
    value: string
  ) {
    if (!carpet) return;
    patchCarpet(carpet.id, (c) => ({
      ...c,
      areas: c.areas.map((a) => (a.id === areaId ? { ...a, [field]: value } : a)),
    }));
  }

  function handleAddLog(areaId: string, step: string, note: string) {
    if (!carpet) return;
    patchCarpet(carpet.id, (c) => ({
      ...c,
      areas: c.areas.map((a) =>
        a.id === areaId
          ? {
              ...a,
              logs: [...a.logs, { id: uid(), date: today(), step, note }],
            }
          : a
      ),
    }));
    pushToast("info", "工序已记录，该区域色号即日起锁定。");
  }

  // ---------- 验收 ----------
  function handleMarkAcceptance() {
    if (!carpet) return;
    const p = progressOf(carpet);
    if (p.total === 0 || p.assigned < p.total) {
      pushToast(
        "error",
        `还有 ${p.total - p.assigned} 个破损区域没补齐色号，全部补齐后才能标成待验收。`
      );
      return;
    }
    patchCarpet(carpet.id, (c) => ({ ...c, status: "待验收" }));
    pushToast("ok", `${carpet.name} 已标为待验收。`);
  }

  // ---------- 色卡 ----------
  function handleAdjustSwatch(id: string, delta: number) {
    setState((s) => ({
      ...s,
      swatches: s.swatches.map((sw) =>
        sw.id === id ? { ...sw, stock: Math.max(0, sw.stock + delta) } : sw
      ),
    }));
  }

  function handleAddSwatch(data: Omit<Swatch, "id">) {
    if (state.swatches.some((s) => s.code === data.code)) {
      pushToast("error", `色号 ${data.code} 已存在。`);
      return;
    }
    setState((s) => ({ ...s, swatches: [...s.swatches, { ...data, id: uid() }] }));
  }

  const stats = useMemo(() => {
    const inRepair = state.carpets.filter((c) => c.status !== "待验收").length;
    const allAreas = state.carpets.reduce((n, c) => n + c.areas.length, 0);
    const assignedAreas = state.carpets.reduce(
      (n, c) => n + c.areas.filter((a) => a.swatchId !== null).length,
      0
    );
    return {
      inRepair,
      files: state.carpets.length,
      colors: state.swatches.filter((s) => s.stock > 0).length,
      rate: allAreas === 0 ? 0 : Math.round((assignedAreas / allAreas) * 100),
    };
  }, [state]);

  function openCarpet(id: string) {
    setActiveCarpetId(id);
    setActiveAreaId(null);
  }

  return (
    <main className="app">
      <header className="hero">
        <p>手工地毯修复工作室 · 纹样与修复档案</p>
        <h1>补线对色号，修一块记一块</h1>
        <span>
          每块地毯登记产地、年代、结密度与材质；在纹样图上逐个圈出破损区域并派定补线色号。
          已用完的色号当场拦截，写过工序记录的区域色号自动锁定；全部区域补齐色号后方可标为待验收。
        </span>
      </header>

      <section className="metrics">
        <article><small>待修复 / 修复中</small><strong>{stats.inRepair}</strong></article>
        <article><small>纹样档案</small><strong>{stats.files}</strong></article>
        <article><small>可用色号</small><strong>{stats.colors}</strong></article>
        <article><small>区域补色完成率</small><strong>{stats.rate}%</strong></article>
      </section>

      <div className="layout">
        <div className="layout-left">
          <ArchiveList
            carpets={state.carpets}
            origins={ORIGINS}
            activeId={carpet?.id ?? null}
            onOpen={openCarpet}
            onNewCarpet={handleNewCarpet}
          />
          <ColorCard
            swatches={state.swatches}
            onAdjust={handleAdjustSwatch}
            onAdd={handleAddSwatch}
          />
        </div>

        <section className="panel studio">
          {carpet ? (
            <>
              <div className="heading">
                <div>
                  <p>{carpet.id} · {carpet.origin}</p>
                  <h2>{carpet.name}</h2>
                </div>
                <div className="head-actions">
                  <span className={"status-badge " + (carpet.status === "待验收" ? "ready" : carpet.status === "修复中" ? "doing" : "todo")}>
                    {carpet.status}
                  </span>
                  <button
                    className="primary"
                    onClick={handleMarkAcceptance}
                    disabled={carpet.status === "待验收"}
                  >
                    标为待验收
                  </button>
                </div>
              </div>

              <dl className="meta-grid">
                <div><dt>产地</dt><dd>{carpet.origin}</dd></div>
                <div><dt>年代</dt><dd>{carpet.era}</dd></div>
                <div><dt>结密度</dt><dd>{carpet.knotDensity}</dd></div>
                <div><dt>材质</dt><dd>{carpet.material}</dd></div>
                <div><dt>染色类型</dt><dd>{carpet.dyeType}</dd></div>
                <div>
                  <dt>补齐进度</dt>
                  <dd>
                    {progressOf(carpet).assigned}/{progressOf(carpet).total} 区域（{progressOf(carpet).pct}%）
                  </dd>
                </div>
              </dl>

              <div className="studio-grid">
                <div>
                  <h3 className="block-title">纹样标记图</h3>
                  <PatternMap
                    carpet={carpet}
                    swatches={state.swatches}
                    activeAreaId={area?.id ?? null}
                    onSelect={setActiveAreaId}
                    onAddArea={handleAddArea}
                  />
                </div>
                <AreaPanel
                  area={area}
                  swatches={state.swatches}
                  onChangeSwatch={handleAssignSwatch}
                  onChangeText={handleChangeText}
                  onAddLog={handleAddLog}
                  onDeleteArea={handleDeleteArea}
                />
              </div>
            </>
          ) : (
            <p className="muted">还没有档案，请先在左侧新增一块地毯。</p>
          )}
        </section>
      </div>

      <footer className="foot">
        <span>数据保存在本机浏览器 localStorage</span>
        <button
          onClick={() => {
            setState(resetState());
            setActiveCarpetId(null);
            setActiveAreaId(null);
            pushToast("info", "已恢复演示数据。");
          }}
        >
          恢复演示数据
        </button>
      </footer>

      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={"toast " + t.kind}>{t.text}</div>
        ))}
      </div>
    </main>
  );
}
