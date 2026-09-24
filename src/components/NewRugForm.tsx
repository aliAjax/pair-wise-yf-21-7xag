import { useState } from "react";
import type { Origin } from "../types";
import { ORIGINS } from "../types";
import type { NewRugInput } from "../store";

interface Props {
  onCreate: (input: NewRugInput) => string;
}

const EMPTY: NewRugInput = {
  code: "",
  name: "",
  origin: "波斯",
  era: "",
  knotDensity: "",
  material: "",
  dyeType: "",
};

/** 新地毯建档：产地、年代、结密度、材质、染色类型 */
export default function NewRugForm({ onCreate }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NewRugInput>(EMPTY);
  const [error, setError] = useState("");

  function set<K extends keyof NewRugInput>(key: K, value: NewRugInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit() {
    if (!form.code.trim()) {
      setError("请填写地毯编号，如 CAR-150。");
      return;
    }
    if (!form.name.trim()) {
      setError("请填写地毯名称或简述。");
      return;
    }
    onCreate({ ...form, code: form.code.trim(), name: form.name.trim() });
    setForm(EMPTY);
    setError("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button type="button" className="primary new-rug-toggle" onClick={() => setOpen(true)}>
        ＋ 新建地毯档案
      </button>
    );
  }

  return (
    <div className="panel new-rug-form">
      <div className="panel-head">
        <h2>新建地毯档案</h2>
        <button type="button" className="ghost" onClick={() => setOpen(false)}>
          取消
        </button>
      </div>
      <div className="form-grid">
        <label className="field">
          <span>编号 *</span>
          <input
            value={form.code}
            placeholder="CAR-150"
            onChange={(e) => set("code", e.target.value)}
          />
        </label>
        <label className="field">
          <span>名称 *</span>
          <input
            value={form.name}
            placeholder="波斯石榴纹客厅毯"
            onChange={(e) => set("name", e.target.value)}
          />
        </label>
        <label className="field">
          <span>产地</span>
          <select value={form.origin} onChange={(e) => set("origin", e.target.value as Origin)}>
            {ORIGINS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>年代</span>
          <input
            value={form.era}
            placeholder="约1960s"
            onChange={(e) => set("era", e.target.value)}
          />
        </label>
        <label className="field">
          <span>结密度（结/d㎡）</span>
          <input
            type="number"
            min={0}
            value={form.knotDensity}
            placeholder="42"
            onChange={(e) =>
              set("knotDensity", e.target.value === "" ? "" : Number(e.target.value))
            }
          />
        </label>
        <label className="field">
          <span>材质</span>
          <input
            value={form.material}
            placeholder="羊毛绒头，棉经棉纬"
            onChange={(e) => set("material", e.target.value)}
          />
        </label>
        <label className="field span-2">
          <span>染色类型</span>
          <input
            value={form.dyeType}
            placeholder="植物染 / 化学染 / 混合染"
            onChange={(e) => set("dyeType", e.target.value)}
          />
        </label>
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        <button type="button" className="primary" onClick={submit}>
          建档并圈破损
        </button>
      </div>
    </div>
  );
}
