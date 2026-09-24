import { useRef, useState } from "react";
import type { Carpet, DamageArea, Swatch } from "../types";

interface PatternMapProps {
  carpet: Carpet;
  swatches: Swatch[];
  activeAreaId: string | null;
  onSelect: (areaId: string) => void;
  onAddArea: (x: number, y: number) => void;
}

/** 纹样图：破损区域以圆圈逐个标出，点击空白处可新增破损区域 */
export default function PatternMap({
  carpet,
  swatches,
  activeAreaId,
  onSelect,
  onAddArea,
}: PatternMapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState<{ x: number; y: number } | null>(null);

  function colorOf(area: DamageArea): string {
    const sw = swatches.find((s) => s.id === area.swatchId);
    return sw ? sw.hex : "#94a3b8";
  }

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPending({ x: Math.round(x), y: Math.round(y) });
  }

  function confirmAdd() {
    if (pending) {
      onAddArea(pending.x, pending.y);
      setPending(null);
    }
  }

  return (
    <div className="map-wrap">
      <div
        ref={ref}
        className="pattern-map"
        onClick={handleClick}
        role="img"
        aria-label={`${carpet.name}纹样图，点击空白处标记破损区域`}
        title="点击空白处标记新的破损区域"
      >
        {/* 装饰性纹样（不可选） */}
        <svg className="pattern-deco" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <rect x="4" y="4" width="92" height="92" rx="1.5" fill="none" stroke="#c9b79c" strokeWidth="0.6" />
          <rect x="8" y="8" width="84" height="84" rx="1" fill="none" stroke="#c9b79c" strokeWidth="0.4" />
          <circle cx="50" cy="50" r="18" fill="none" stroke="#b9966c" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="11" fill="none" stroke="#b9966c" strokeWidth="0.5" />
          <path d="M50 32 L55 45 L50 50 L45 45 Z M50 68 L45 55 L50 50 L55 55 Z M32 50 L45 45 L50 50 L45 55 Z M68 50 L55 55 L50 50 L55 45 Z"
            fill="none" stroke="#b9966c" strokeWidth="0.4" />
          <g fill="none" stroke="#c9b79c" strokeWidth="0.35">
            <circle cx="20" cy="20" r="5" />
            <circle cx="80" cy="20" r="5" />
            <circle cx="20" cy="80" r="5" />
            <circle cx="80" cy="80" r="5" />
          </g>
        </svg>

        {carpet.areas.map((area, idx) => {
          const active = area.id === activeAreaId;
          return (
            <button
              key={area.id}
              type="button"
              className={"damage-marker" + (active ? " active" : "")}
              style={
                {
                  left: `${area.x}%`,
                  top: `${area.y}%`,
                  "--marker": colorOf(area),
                } as React.CSSProperties
              }
              onClick={(e) => {
                e.stopPropagation();
                onSelect(area.id);
              }}
              title={area.label}
            >
              <span>{idx + 1}</span>
            </button>
          );
        })}

        {pending && (
          <div className="marker-pending" style={{ left: `${pending.x}%`, top: `${pending.y}%` }}>
            <span>+</span>
          </div>
        )}
      </div>

      {pending ? (
        <div className="map-confirm">
          在 ({pending.x}, {pending.y}) 标记新破损区域？
          <button className="primary" onClick={confirmAdd}>确认标记</button>
          <button onClick={() => setPending(null)}>取消</button>
        </div>
      ) : (
        <p className="map-hint">点击纹样图空白处圈出新的破损区域。圆圈颜色即所派补线色，灰色表示尚未派色。</p>
      )}
    </div>
  );
}
