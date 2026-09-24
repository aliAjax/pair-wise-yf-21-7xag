import { useRef, type MouseEvent } from "react";
import type { ColorThread, DamageArea, Rug } from "../types";
import { isAreaStarted } from "../domain";

interface Props {
  rug: Rug;
  colors: ColorThread[];
  selectedAreaId?: string | null;
  marking?: boolean;
  mini?: boolean;
  onSelectArea?: (area: DamageArea) => void;
  onAddPoint?: (x: number, y: number) => void;
}

/** 纹样标记图：SVG 画毯面纹样，破损区域用覆盖层圆圈逐个标出 */
export default function PatternMap({
  rug,
  colors,
  selectedAreaId,
  marking = false,
  mini = false,
  onSelectArea,
  onAddPoint,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  function pointFromEvent(e: MouseEvent): { x: number; y: number } | null {
    const el = ref.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return {
      x: Math.min(97, Math.max(3, x)),
      y: Math.min(97, Math.max(3, y)),
    };
  }

  function handleClick(e: MouseEvent) {
    if (!marking || !onAddPoint) return;
    const p = pointFromEvent(e);
    if (p) onAddPoint(p.x, p.y);
  }

  return (
    <div
      ref={ref}
      className={`pattern-map${marking ? " is-marking" : ""}${mini ? " is-mini" : ""}`}
      onClick={handleClick}
      role={marking ? "button" : undefined}
      title={marking ? "在纹样图上点击，圈出破损区域" : undefined}
    >
      <RugMotif origin={rug.origin} />
      <div className="markers">
        {rug.areas.map((a, i) => {
          const color = colors.find((c) => c.code === a.colorCode);
          const locked = isAreaStarted(a);
          const selected = a.id === selectedAreaId;
          const className = `marker ${selected ? "is-selected" : ""} ${color ? "is-assigned" : ""}`;
          const style = {
            left: `${a.x}%`,
            top: `${a.y}%`,
            width: `${a.r * 2}%`,
            aspectRatio: "1",
            borderColor: color ? color.hex : undefined,
            background: color ? `${color.hex}33` : undefined,
          };
          const title = `${a.label}${color ? ` · ${color.code} ${color.name}` : " · 未派色"}${
            locked ? " · 已开工锁定" : ""
          }`;
          const inner = (
            <>
              <span className="marker-no" style={{ background: color ? color.hex : undefined }}>
                {mini ? "" : i + 1}
              </span>
              {locked && <span className="marker-lock">🔒</span>}
            </>
          );

          // 迷你图嵌在列表按钮里，用非交互元素避免嵌套按钮
          if (mini) {
            return (
              <span key={a.id} className={className} style={style} title={title}>
                {inner}
              </span>
            );
          }
          return (
            <button
              key={a.id}
              type="button"
              className={className}
              style={style}
              onClick={(e) => {
                e.stopPropagation();
                onSelectArea?.(a);
              }}
              title={title}
            >
              {inner}
            </button>
          );
        })}
      </div>
      {marking && <div className="map-hint">圈选模式：点击毯面任意位置添加破损区域</div>}
    </div>
  );
}

/** 各产地略有区别的几何纹样底图，纯 SVG，无外部图片依赖 */
function RugMotif({ origin }: { origin: Rug["origin"] }) {
  return (
    <svg className="rug-motif" viewBox="0 0 100 72" preserveAspectRatio="none" aria-hidden>
      <rect x="0" y="0" width="100" height="72" fill="#efe6d2" />
      <rect x="1.5" y="1.5" width="97" height="69" fill="none" stroke="#7c2d12" strokeWidth="1.1" />
      <rect x="4" y="4" width="92" height="64" fill="none" stroke="#b45309" strokeWidth="0.8" />
      <rect x="7" y="7" width="86" height="58" fill="#f3ecdc" stroke="#0f766e" strokeWidth="0.5" />

      {/* 边框上的连续菱形纹 */}
      {Array.from({ length: 10 }).map((_, i) => (
        <g key={`t${i}`} stroke="#8c2f1b" strokeWidth="0.4" fill="#c9a36a">
          <rect
            x={10 + i * 8.9}
            y="4.6"
            width="2.6"
            height="2.6"
            transform={`rotate(45 ${11.3 + i * 8.9} 5.9)`}
          />
          <rect
            x={10 + i * 8.9}
            y="64.8"
            width="2.6"
            height="2.6"
            transform={`rotate(45 ${11.3 + i * 8.9} 66.1)`}
          />
        </g>
      ))}

      {/* 中心主纹：菱形徽章 + 内外层 */}
      <g>
        <polygon points="50,16 74,36 50,56 26,36" fill="#243b6b" opacity="0.9" />
        <polygon points="50,21 67,36 50,51 33,36" fill="#8c2f1b" opacity="0.85" />
        <polygon points="50,26 60,36 50,46 40,36" fill="#d9a441" opacity="0.9" />
        <circle cx="50" cy="36" r="3.2" fill="#efe6d2" />
        <circle cx="50" cy="36" r="1.5" fill="#0f766e" />
      </g>

      {/* 两侧枝蔓纹 */}
      {[15, 85].map((cx) => (
        <g key={cx}>
          <path
            d={`M${cx} 18 q-7 9 0 18 q7 9 0 18`}
            fill="none"
            stroke="#6e7f4a"
            strokeWidth="1.1"
          />
          <circle cx={cx - 3} cy="27" r="1.8" fill="#b34a5e" />
          <circle cx={cx + 3} cy="45" r="1.8" fill="#b34a5e" />
        </g>
      ))}

      {origin === "高加索" || origin === "安纳托利亚" ? (
        <g stroke="#1b2a4a" strokeWidth="0.7" fill="none">
          <polyline points="14,60 20,56 26,60 32,56" />
          <polyline points="68,56 74,60 80,56 86,60" />
        </g>
      ) : (
        <g fill="#6e7f4a" opacity="0.8">
          <circle cx="20" cy="58" r="1.6" />
          <circle cx="30" cy="60" r="1.2" />
          <circle cx="70" cy="60" r="1.2" />
          <circle cx="80" cy="58" r="1.6" />
        </g>
      )}
    </svg>
  );
}
