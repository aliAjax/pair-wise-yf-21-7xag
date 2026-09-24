import { useState } from "react";
import type { ColorThread, DamageArea, Rug } from "../types";
import { isAreaStarted, rugProgress } from "../domain";
import PatternMap from "./PatternMap";
import AreaEditor from "./AreaEditor";

interface Props {
  rug: Rug;
  colors: ColorThread[];
  selectedAreaId: string | null;
  onSelectArea: (id: string | null) => void;
  onAddArea: (x: number, y: number) => string;
  onPatchArea: (areaId: string, patch: Partial<DamageArea>) => void;
  onAssign: (areaId: string, code: string) => void;
  onUnassign: (areaId: string) => void;
  onAddLog: (areaId: string, content: string) => void;
  onRequestAcceptance: () => void;
  onApprove: () => void;
}

export default function RugDetail(props: Props) {
  const { rug, colors } = props;
  const [marking, setMarking] = useState(false);
  const area = rug.areas.find((a) => a.id === props.selectedAreaId) ?? null;
  const p = rugProgress(rug);
  const canReview = p.pct === 100 && p.total > 0;

  return (
    <section className="panel detail">
      <header className="detail-head">
        <div>
          <div className="detail-title-row">
            <h2>{rug.name}</h2>
            <span className={`status st-${statusKey(rug.status)}`}>{rug.status}</span>
          </div>
          <dl className="meta-grid">
            <div><dt>编号</dt><dd>{rug.code}</dd></div>
            <div><dt>产地</dt><dd>{rug.origin}</dd></div>
            <div><dt>年代</dt><dd>{rug.era || "—"}</dd></div>
            <div>
              <dt>结密度</dt>
              <dd>{rug.knotDensity === "" ? "—" : `${rug.knotDensity} 结/d㎡`}</dd>
            </div>
            <div><dt>材质</dt><dd>{rug.material || "—"}</dd></div>
            <div><dt>染色</dt><dd>{rug.dyeType || "—"}</dd></div>
          </dl>
        </div>
        <div className="detail-actions">
          <button
            type="button"
            className={marking ? "primary" : ""}
            onClick={() => setMarking((m) => !m)}
          >
            {marking ? "完成圈选" : "＋ 圈出破损区"}
          </button>
        </div>
      </header>

      <div className="detail-body">
        <div className="map-col">
          <PatternMap
            rug={rug}
            colors={colors}
            marking={marking}
            selectedAreaId={area?.id}
            onAddPoint={(x, y) => {
              const id = props.onAddArea(x, y);
              props.onSelectArea(id);
            }}
            onSelectArea={(a) => props.onSelectArea(a.id === area?.id ? null : a.id)}
          />

          <div className="area-strip">
            {rug.areas.length === 0 && (
              <p className="muted">还没有破损标记，点「圈出破损区」后在纹样图上逐个点击。</p>
            )}
            {rug.areas.map((a, i) => {
              const c = colors.find((x) => x.code === a.colorCode);
              return (
                <button
                  key={a.id}
                  type="button"
                  className={`area-chip ${a.id === area?.id ? "is-selected" : ""}`}
                  onClick={() => props.onSelectArea(a.id === area?.id ? null : a.id)}
                >
                  <b>{i + 1}. {a.label}</b>
                  <span className="area-chip-sub">
                    {a.colorCode ? (
                      <>
                        <i className="dot" style={{ background: c?.hex }} />
                        {a.colorCode}
                      </>
                    ) : (
                      <span className="warn">未派色</span>
                    )}
                    {isAreaStarted(a) && <em className="lock">🔒 已开工</em>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="side-col">
          <div className="progress-card">
            <div className="progress-card-top">
              <b>工序进度</b>
              <span>
                {p.assigned}/{p.total} 区域已补线色号
              </span>
            </div>
            <div className="progress-track lg">
              <div
                className={`progress-fill ${canReview ? "is-full" : ""}`}
                style={{ width: `${p.pct}%` }}
              />
            </div>
            <p className="hint">
              进度按「补齐色号的区域」计算；全部补齐后才能标成待验收。
            </p>
            <div className="review-actions">
              {rug.status !== "待验收" && rug.status !== "已验收" && (
                <button
                  type="button"
                  className="primary"
                  disabled={!canReview}
                  onClick={props.onRequestAcceptance}
                  title={canReview ? "" : "还有区域未补齐色号"}
                >
                  标为待验收
                </button>
              )}
              {rug.status === "待验收" && (
                <>
                  <span className="review-note">已全部补齐，等待验收</span>
                  <button type="button" className="primary" onClick={props.onApprove}>
                    通过验收
                  </button>
                </>
              )}
              {rug.status === "已验收" && <span className="review-note done">已通过验收归档</span>}
            </div>
          </div>

          {area ? (
            <AreaEditor
              rug={rug}
              area={area}
              colors={colors}
              onPatch={(patch) => props.onPatchArea(area.id, patch)}
              onAssign={(code) => props.onAssign(area.id, code)}
              onUnassign={() => props.onUnassign(area.id)}
              onAddLog={(content) => props.onAddLog(area.id, content)}
              onClose={() => props.onSelectArea(null)}
            />
          ) : (
            <div className="area-placeholder panel-inner">
              <p>在纹样图上点一个圈，或从下方区域条选择，即可派色并写修复记录。</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function statusKey(status: Rug["status"]): string {
  return { 待修复: "todo", 修复中: "doing", 待验收: "review", 已验收: "done" }[status];
}
