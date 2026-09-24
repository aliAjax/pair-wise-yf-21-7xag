import { useCallback, useEffect, useMemo, useState } from "react";
import type { ArchiveState, ColorThread, DamageArea, Rug, RugStatus } from "./types";
import { buildSeedState, STORAGE_KEY, uid } from "./data/seed";
import { isFullyAssigned } from "./domain";

function loadState(): ArchiveState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ArchiveState;
      if (parsed && Array.isArray(parsed.rugs) && Array.isArray(parsed.colors)) {
        return parsed;
      }
    }
  } catch {
    /* 存档损坏时回退到示例数据 */
  }
  return buildSeedState();
}

export interface NewRugInput {
  code: string;
  name: string;
  origin: Rug["origin"];
  era: string;
  knotDensity: number | "";
  material: string;
  dyeType: string;
}

export interface Toast {
  id: string;
  kind: "error" | "success" | "info";
  text: string;
}

export function useArchive() {
  const [state, setState] = useState<ArchiveState>(loadState);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const pushToast = useCallback((kind: Toast["kind"], text: string) => {
    const id = uid("toast");
    setToasts((prev) => [...prev.slice(-3), { id, kind, text }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const resetDemo = useCallback(() => {
    setState(buildSeedState());
    pushToast("info", "已恢复示例档案。");
  }, [pushToast]);

  const addRug = useCallback(
    (input: NewRugInput): string => {
      const rug: Rug = {
        id: uid("rug"),
        areas: [],
        status: "待修复",
        createdAt: new Date().toISOString(),
        ...input,
      };
      setState((s) => ({ ...s, rugs: [rug, ...s.rugs] }));
      pushToast("success", `档案 ${rug.code} 已建立，接着在纹样图上圈出破损区域。`);
      return rug.id;
    },
    [pushToast],
  );

  const updateRug = useCallback((rugId: string, patch: Partial<Rug>) => {
    setState((s) => ({
      ...s,
      rugs: s.rugs.map((r) => (r.id === rugId ? { ...r, ...patch } : r)),
    }));
  }, []);

  /** 在纹样图坐标（0-100）上圈一个破损区域 */
  const addArea = useCallback((rugId: string, x: number, y: number): string => {
    const area: DamageArea = {
      id: uid("area"),
      label: "",
      x: Math.min(94, Math.max(6, x)),
      y: Math.min(94, Math.max(6, y)),
      r: 6,
      colorCode: null,
      beforeNote: "",
      afterNote: "",
      logs: [],
    };
    setState((s) => ({
      ...s,
      rugs: s.rugs.map((r) => {
        if (r.id !== rugId) return r;
        area.label = `破损点 ${r.areas.length + 1}`;
        // 新增破损点会拉低补齐进度，已报验收/已验收的毯子退回修复中
        const status: RugStatus =
          r.status === "待验收" || r.status === "已验收" ? "修复中" : r.status;
        return { ...r, areas: [...r.areas, area], status };
      }),
    }));
    return area.id;
  }, []);

  const updateArea = useCallback(
    (rugId: string, areaId: string, patch: Partial<DamageArea>) => {
      setState((s) => ({
        ...s,
        rugs: s.rugs.map((r) =>
          r.id !== rugId
            ? r
            : { ...r, areas: r.areas.map((a) => (a.id === areaId ? { ...a, ...patch } : a)) },
        ),
      }));
    },
    [],
  );

  /** 派色 / 改色：校验开工锁定与余线库存，并按一卷备线扣减 */
  const assignColor = useCallback(
    (rugId: string, areaId: string, code: string): boolean => {
      const rug = state.rugs.find((r) => r.id === rugId);
      const area = rug?.areas.find((a) => a.id === areaId);
      const color = state.colors.find((c) => c.code === code);
      if (!rug || !area) return false;

      if (area.logs.length > 0) {
        pushToast(
          "error",
          `区域「${area.label}」已开工并写过工序记录，色号 ${area.colorCode} 已锁定，不能改派。`,
        );
        return false;
      }
      if (!color) {
        pushToast("error", "色号不存在，请重选。");
        return false;
      }
      if (color.stock <= 0) {
        pushToast(
          "error",
          `色号 ${color.code} ${color.name} 已用完，不能派出，请当场换一个有余线的色号。`,
        );
        return false;
      }
      if (rug.areas.some((a) => a.id !== areaId && a.colorCode === code)) {
        pushToast("error", `本毯已有区域派了 ${code}，请按区域另选色号备线。`);
        return false;
      }

      const oldCode = area.colorCode;
      if (oldCode === code) {
        pushToast("info", `区域「${area.label}」派的本来就是 ${code}。`);
        return true;
      }

      setState((s) => ({
        ...s,
        colors: s.colors.map((c) => adjustStock(c, code, -1, oldCode)),
        rugs: s.rugs.map((r) =>
          r.id !== rugId
            ? r
            : {
                ...r,
                areas: r.areas.map((a) => (a.id === areaId ? { ...a, colorCode: code } : a)),
              },
        ),
      }));
      pushToast(
        "success",
        `已给「${area.label}」派 ${code} ${color.name}，该色号余线 ${color.stock - 1} 卷。`,
      );
      return true;
    },
    [state, pushToast],
  );

  /** 撤色：仅未开工区域允许，余线退回色卡 */
  const unassignColor = useCallback(
    (rugId: string, areaId: string) => {
      const rug = state.rugs.find((r) => r.id === rugId);
      const area = rug?.areas.find((a) => a.id === areaId);
      if (!rug || !area) return;
      if (area.logs.length > 0) {
        pushToast("error", `区域「${area.label}」已开工，色号锁定，不能撤回。`);
        return;
      }
      const code = area.colorCode;
      if (!code) return;
      setState((s) => ({
        ...s,
        colors: s.colors.map((c) => (c.code === code ? { ...c, stock: c.stock + 1 } : c)),
        rugs: s.rugs.map((r) =>
          r.id !== rugId
            ? r
            : {
                ...r,
                areas: r.areas.map((a) =>
                  a.id === areaId ? { ...a, colorCode: null } : a,
                ),
              },
        ),
      }));
      pushToast("info", `已撤回 ${code}，余线退回色卡。`);
    },
    [state, pushToast],
  );

  /** 记一道工序；首道工序自动把地毯带入修复中，同时锁定该区域色号 */
  const addLog = useCallback(
    (rugId: string, areaId: string, content: string) => {
      const text = content.trim();
      if (!text) return;
      setState((s) => ({
        ...s,
        rugs: s.rugs.map((r) => {
          if (r.id !== rugId) return r;
          const hadAnyLog = r.areas.some((a) => a.logs.length > 0);
          return {
            ...r,
            status: !hadAnyLog && r.status === "待修复" ? "修复中" : r.status,
            areas: r.areas.map((a) =>
              a.id === areaId
                ? {
                    ...a,
                    logs: [
                      ...a.logs,
                      { id: uid("log"), at: new Date().toISOString(), content: text },
                    ],
                  }
                : a,
            ),
          };
        }),
      }));
      pushToast("success", "工序已记录，该区域色号随即锁定。");
    },
    [pushToast],
  );

  /** 标待验收：必须全部破损区域都补齐色号 */
  const requestAcceptance = useCallback(
    (rugId: string) => {
      const rug = state.rugs.find((r) => r.id === rugId);
      if (!rug) return;
      if (!isFullyAssigned(rug)) {
        const left = rug.areas.filter((a) => !a.colorCode).length;
        pushToast(
          "error",
          `还有 ${left} 个破损区域没补齐色号，全部补齐后才能标成待验收。`,
        );
        return;
      }
      setState((s) => ({
        ...s,
        rugs: s.rugs.map((r) => (r.id === rugId ? { ...r, status: "待验收" } : r)),
      }));
      pushToast("success", `${rug.code} 已标为待验收。`);
    },
    [state, pushToast],
  );

  const setStatus = useCallback((rugId: string, status: RugStatus) => {
    setState((s) => ({
      ...s,
      rugs: s.rugs.map((r) => (r.id === rugId ? { ...r, status } : r)),
    }));
  }, []);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of state.rugs) map.set(r.origin, (map.get(r.origin) ?? 0) + 1);
    return map;
  }, [state.rugs]);

  return {
    state,
    toasts,
    counts,
    dismissToast,
    resetDemo,
    addRug,
    updateRug,
    addArea,
    updateArea,
    assignColor,
    unassignColor,
    addLog,
    requestAcceptance,
    setStatus,
  };
}

function adjustStock(c: ColorThread, addCode: string, delta: number, oldCode: string | null) {
  if (c.code === addCode) return { ...c, stock: Math.max(0, c.stock + delta) };
  if (oldCode && c.code === oldCode) return { ...c, stock: c.stock - delta };
  return c;
}
