import type { DamageArea, Swatch } from "../types";
import { STEPS, isLocked } from "../store";

interface AreaPanelProps {
  area: DamageArea | null;
  swatches: Swatch[];
  onChangeSwatch: (areaId: string, swatchId: string) => void;
  onChangeText: (
    areaId: string,
    field: "before" | "after",
    value: string
  ) => void;
  onAddLog: (areaId: string, step: string, note: string) => void;
  onDeleteArea: (areaId: string) => void;
}

/** 单个破损区域的派色、修复前后记录与工序记录 */
export default function AreaPanel({
  area,
  swatches,
  onChangeSwatch,
  onChangeText,
  onAddLog,
  onDeleteArea,
}: AreaPanelProps) {
  if (!area) {
    return (
      <div className="area-empty">
        <p>在左侧纹样图上选择或圈出一个破损区域。</p>
        <ul>
          <li>为每个区域挑选一个仍有余量的补线色号</li>
          <li>记录修复前、修复后的样子</li>
          <li>写过工序记录的区域已开工，色号自动锁定</li>
        </ul>
      </div>
    );
  }

  const locked = isLocked(area);
  const current = swatches.find((s) => s.id === area.swatchId) ?? null;
  // 当前色若已被耗尽（库存为 0）但此前已派给本区域，仍然保留显示，但不允许继续派给别的区域
  const currentExhausted = current !== null && current.stock <= 0;
  const areaId = area.id;

  function handlePick(value: string) {
    if (locked) return;
    if (value === "") {
      onChangeSwatch(areaId, "");
      return;
    }
    onChangeSwatch(areaId, value);
  }

  return (
    <div className="area-panel">
      <div className="area-head">
        <div>
          <h3>{area.label}</h3>
          <p className="muted">
            图上位置 ({area.x}, {area.y})
          </p>
        </div>
        <button
          className="danger-ghost"
          onClick={() => onDeleteArea(area.id)}
          disabled={locked}
          title={locked ? "已开工区域不能删除" : "删除该破损区域"}
        >
          删除区域
        </button>
      </div>

      <fieldset className="swatch-picker" disabled={locked}>
        <legend>
          补线色号
          {locked && (
            <span className="lock-tag">已开工 · 色号锁定</span>
          )}
        </legend>

        <label className="swatch-select">
          <span>从色卡选派（已用完的色号会当场拦截）</span>
          <select
            value={area.swatchId ?? ""}
            onChange={(e) => handlePick(e.target.value)}
          >
            <option value="">未派色 —— 请选择</option>
            {swatches.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} {s.name}
                {s.stock <= 0 ? "（已用完，不可派）" : `（余量 ${s.stock} 绞）`}
              </option>
            ))}
          </select>
        </label>

        <div className="swatch-grid">
          {swatches.map((s) => {
            const exhausted = s.stock <= 0;
            const selected = s.id === area.swatchId;
            return (
              <button
                key={s.id}
                type="button"
                title={
                  exhausted
                    ? `${s.code} ${s.name} 已用完，点击查看提示`
                    : `${s.code} ${s.name}，余量 ${s.stock} 绞`
                }
                className={
                  "swatch-chip" +
                  (selected ? " selected" : "") +
                  (exhausted ? " exhausted" : "")
                }
                disabled={locked}
                onClick={() => onChangeSwatch(area.id, s.id)}
              >
                <i style={{ background: s.hex }} />
                <b>{s.code}</b>
                {exhausted ? <em>已用完</em> : <em>余 {s.stock}</em>}
              </button>
            );
          })}
        </div>

        {current && (
          <p className={"picked-line" + (currentExhausted ? " warn" : "")}>
            当前派色：
            <i className="dot" style={{ background: current.hex }} />
            {current.code} {current.name}
            {currentExhausted &&
              "（该色现已无余量；如需改色请先补充库存）"}
          </p>
        )}
      </fieldset>

      <div className="ba-grid">
        <label>
          <span>修复前的样子</span>
          <textarea
            rows={4}
            value={area.before}
            onChange={(e) => onChangeText(area.id, "before", e.target.value)}
            placeholder="如：边缘 8cm 磨损露经，流苏脱落"
          />
        </label>
        <label>
          <span>修复后的样子</span>
          <textarea
            rows={4}
            value={area.after}
            onChange={(e) => onChangeText(area.id, "after", e.target.value)}
            placeholder="补织完成后填写"
          />
        </label>
      </div>

      <ProcessLogList area={area} onAddLog={onAddLog} />
    </div>
  );
}

function ProcessLogList({
  area,
  onAddLog,
}: {
  area: DamageArea;
  onAddLog: (areaId: string, step: string, note: string) => void;
}) {
  return (
    <div className="logs">
      <div className="logs-head">
        <h4>工序记录 {area.logs.length > 0 && `（${area.logs.length} 条，已开工）`}</h4>
        {isLocked(area) && (
          <span className="lock-tag small">有色号保护，记录不会再与用线错开</span>
        )}
      </div>

      {area.logs.length === 0 ? (
        <p className="muted">尚无工序记录。写下第一条后即视为开工，派定的色号将锁定。</p>
      ) : (
        <ol className="log-list">
          {area.logs.map((log) => (
            <li key={log.id}>
              <div className="log-meta">
                <b>{log.date}</b>
                <span>{log.step}</span>
              </div>
              <p>{log.note}</p>
            </li>
          ))}
        </ol>
      )}

      <AddLogForm onSubmit={(step, note) => onAddLog(area.id, step, note)} />
    </div>
  );
}

function AddLogForm({
  onSubmit,
}: {
  onSubmit: (step: string, note: string) => void;
}) {
  return (
    <details className="add-log">
      <summary>添加工序记录</summary>
      <LogFields onSubmit={onSubmit} />
    </details>
  );
}

function LogFields({
  onSubmit,
}: {
  onSubmit: (step: string, note: string) => void;
}) {
  const steps = STEPS;
  return (
    <form
      className="log-form"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const step = String(fd.get("step") ?? "");
        const note = String(fd.get("note") ?? "").trim();
        if (!step || !note) return;
        onSubmit(step, note);
        e.currentTarget.reset();
      }}
    >
      <label>
        <span>工序</span>
        <select name="step" defaultValue="">
          <option value="" disabled>选择工序</option>
          {steps.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </label>
      <label>
        <span>记录</span>
        <textarea name="note" rows={2} placeholder="当天做了什么、用了什么线" />
      </label>
      <button className="primary" type="submit">保存工序</button>
    </form>
  );
}
