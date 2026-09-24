import { useState } from "react";
import type { ColorThread, DamageArea, Rug } from "../types";
import { isAreaStarted } from "../domain";

interface Props {
  rug: Rug;
  area: DamageArea;
  colors: ColorThread[];
  onPatch: (patch: Partial<DamageArea>) => void;
  onAssign: (code: string) => void;
  onUnassign: () => void;
  onAddLog: (content: string) => void;
  onClose: () => void;
}

/** 单个破损区域：派色、修复前后记录、工序记录 */
export default function AreaEditor({
  rug,
  area,
  colors,
  onPatch,
  onAssign,
  onUnassign,
  onAddLog,
  onClose,
}: Props) {
  const [logText, setLogText] = useState("");
  const started = isAreaStarted(area);
  const current = colors.find((c) => c.code === area.colorCode);
  const usedCodes = new Set(
    rug.areas.filter((a) => a.id !== area.id && a.colorCode).map((a) => a.colorCode),
  );

  return (
    <div className="area-editor">
      <div className="area-editor-head">
        <input
          className="area-label-input"
          value={area.label}
          onChange={(e) => onPatch({ label: e.target.value })}
          placeholder="给破损区域起名"
        />
        <button type="button" className="ghost" onClick={onClose} aria-label="关闭区域面板">
          ✕
        </button>
      </div>

      {started && (
        <div className="lock-banner">
          🔒 已有 {area.logs.length} 道工序记录，该区域已开工，<b>色号锁定不可更改</b>，避免记录与实际用线错开。
        </div>
      )}

      <fieldset className="block" disabled={started}>
        <legend>补线色号{started ? "（已锁定）" : ""}</legend>
        <div className="assign-row">
          <select
            value={area.colorCode ?? ""}
            onChange={(e) => e.target.value && onAssign(e.target.value)}
          >
            <option value="">未派色 — 请选择色号</option>
            {colors.map((c) => {
              const empty = c.stock <= 0;
              const usedHere = usedCodes.has(c.code);
              return (
                <option key={c.code} value={c.code} disabled={usedHere}>
                  {c.code} {c.name}
                  {empty ? "（已用完，点了也会提示换一个）" : usedHere ? "（本毯他处已派）" : ` · 余 ${c.stock}`}
                </option>
              );
            })}
          </select>
          {current && (
            <span className="picked-chip" style={{ ["--c" as string]: current.hex }}>
              <i />
              {current.code} {current.name}
            </span>
          )}
          {area.colorCode && !started && (
            <button type="button" className="ghost danger" onClick={onUnassign}>
              撤色退库
            </button>
          )}
        </div>
        <p className="hint">在下方色卡点选派色：已用完的色号置灰不可派；已开工区域整体锁定。</p>
        {!started && (
          <div className="pick-grid">
            {colors.map((c) => {
              const empty = c.stock <= 0;
              const usedHere = usedCodes.has(c.code);
              const picked = area.colorCode === c.code;
              return (
                <button
                  key={c.code}
                  type="button"
                  className={`pick ${empty ? "is-empty" : ""} ${usedHere ? "is-used" : ""} ${
                    picked ? "is-picked" : ""
                  }`}
                  disabled={usedHere}
                  onClick={() => onAssign(c.code)}
                  title={
                    empty
                      ? `${c.code} 已用完，点击会当场提示另选`
                      : usedHere
                        ? `${c.code} 本毯他处已派`
                        : `派 ${c.code} ${c.name}`
                  }
                >
                  <span className="pick-chip" style={{ background: c.hex }} />
                  <b>{c.code}</b>
                  <i>{empty ? "已用完" : usedHere ? "占用中" : `余${c.stock}`}</i>
                </button>
              );
            })}
          </div>
        )}
      </fieldset>

      <div className="block">
        <label className="field">
          <span>修复前的样子</span>
          <textarea
            rows={2}
            value={area.beforeNote}
            onChange={(e) => onPatch({ beforeNote: e.target.value })}
            placeholder="破损范围、褪色、磨白、开线等情况"
          />
        </label>
        <label className="field">
          <span>修复后的样子</span>
          <textarea
            rows={2}
            value={area.afterNote}
            onChange={(e) => onPatch({ afterNote: e.target.value })}
            placeholder="补线接法、色差、绒向与修剪情况"
          />
        </label>
      </div>

      <div className="block">
        <span className="block-title">工序记录（{area.logs.length}）</span>
        <ol className="logs">
          {area.logs.map((l) => (
            <li key={l.id}>
              <time>{new Date(l.at).toLocaleString("zh-CN", { hour12: false })}</time>
              <p>{l.content}</p>
            </li>
          ))}
          {area.logs.length === 0 && <li className="muted">还没有工序记录；记下第一道工序后色号即锁定。</li>}
        </ol>
        <div className="log-add">
          <input
            value={logText}
            onChange={(e) => setLogText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && logText.trim()) {
                onAddLog(logText);
                setLogText("");
              }
            }}
            placeholder="如：S-02 合股补绒 11cm"
          />
          <button
            type="button"
            className="primary small"
            disabled={!logText.trim()}
            onClick={() => {
              onAddLog(logText);
              setLogText("");
            }}
          >
            记工序
          </button>
        </div>
      </div>
    </div>
  );
}
