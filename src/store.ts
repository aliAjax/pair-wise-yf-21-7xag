import type { AppState, Carpet, DamageArea } from "./types";

const STORAGE_KEY = "carpet-repair-archive-v1";

export const ORIGINS = ["波斯", "安纳托利亚", "高加索", "藏毯"];

export const STEPS = [
  "清理拆解",
  "配色比对",
  "打底补线",
  "纹样补织",
  "修剪平整",
  "水洗定型",
];

export function uid(): string {
  return (
    Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4)
  );
}

/** 已开工（写过工序记录）的区域，色号锁定不可再改 */
export function isLocked(area: DamageArea): boolean {
  return area.logs.length > 0;
}

/** 工序进度：按已补齐色号的区域占比计算 */
export function progressOf(carpet: Carpet): {
  assigned: number;
  total: number;
  pct: number;
} {
  const total = carpet.areas.length;
  const assigned = carpet.areas.filter((a) => a.swatchId !== null).length;
  return {
    assigned,
    total,
    pct: total === 0 ? 0 : Math.round((assigned / total) * 100),
  };
}

function seedState(): AppState {
  return {
    swatches: [
      { id: "sw-101", code: "RC-101", name: "茜草红", hex: "#9b2c2c", stock: 6 },
      { id: "sw-102", code: "RC-102", name: "深茜红", hex: "#7c2d12", stock: 3 },
      { id: "sw-201", code: "RC-201", name: "靛蓝", hex: "#1e3a8a", stock: 0 },
      { id: "sw-202", code: "RC-202", name: "天青蓝", hex: "#3b82f6", stock: 4 },
      { id: "sw-301", code: "RC-301", name: "藏红金黄", hex: "#d97706", stock: 5 },
      { id: "sw-302", code: "RC-302", name: "驼黄", hex: "#b45309", stock: 2 },
      { id: "sw-401", code: "RC-401", name: "核桃棕", hex: "#78350f", stock: 0 },
      { id: "sw-402", code: "RC-402", name: "深棕", hex: "#451a03", stock: 7 },
      { id: "sw-501", code: "RC-501", name: "松石绿", hex: "#0f766e", stock: 3 },
      { id: "sw-502", code: "RC-502", name: "墨绿", hex: "#14532d", stock: 2 },
      { id: "sw-601", code: "RC-601", name: "本白", hex: "#f5f0e6", stock: 9 },
      { id: "sw-701", code: "RC-701", name: "炭黑", hex: "#1f2937", stock: 1 },
    ],
    carpets: [
      {
        id: "CAR-092",
        name: "克尔曼花卉纹地毯",
        origin: "波斯",
        era: "约1960年代",
        knotDensity: "42 结/cm²",
        material: "羊毛（棉经棉纬）",
        dyeType: "植物染",
        status: "修复中",
        areas: [
          {
            id: "a-092-1",
            label: "区域 1",
            x: 18,
            y: 68,
            swatchId: "sw-101",
            before: "右下角边缘约 8cm 磨损露经，流苏脱落。",
            after: "",
            logs: [
              {
                id: "l-092-1",
                date: "2026-09-10",
                step: "清理拆解",
                note: "拆除松散旧线，清理断面。",
              },
              {
                id: "l-092-2",
                date: "2026-09-15",
                step: "打底补线",
                note: "按 RC-101 茜草红补地色。",
              },
            ],
          },
          {
            id: "a-092-2",
            label: "区域 2",
            x: 52,
            y: 44,
            swatchId: "sw-201",
            before: "中心奖章纹靛蓝缺口约 3cm。",
            after: "",
            logs: [],
          },
          {
            id: "a-092-3",
            label: "区域 3",
            x: 80,
            y: 30,
            swatchId: null,
            before: "虫蛀小洞两处。",
            after: "",
            logs: [],
          },
        ],
      },
      {
        id: "CAR-117",
        name: "祈祷毯（米哈拉布纹）",
        origin: "安纳托利亚",
        era: "约1930年代",
        knotDensity: "36 结/cm²",
        material: "羊毛（毛经毛纬）",
        dyeType: "植物染，局部早期化学染",
        status: "修复中",
        areas: [
          {
            id: "a-117-1",
            label: "区域 1",
            x: 50,
            y: 38,
            swatchId: "sw-102",
            before: "拱门主纹缺口，深茜红缺失。",
            after: "",
            logs: [
              {
                id: "l-117-1",
                date: "2026-09-18",
                step: "配色比对",
                note: "自然光下比对 RC-102 与 RC-101，定 RC-102。",
              },
            ],
          },
          {
            id: "a-117-2",
            label: "区域 2",
            x: 30,
            y: 74,
            swatchId: null,
            before: "下边框断裂约 5cm。",
            after: "",
            logs: [],
          },
        ],
      },
      {
        id: "CAR-131",
        name: "几何纹跑马毯",
        origin: "高加索",
        era: "约1950年代",
        knotDensity: "30 结/cm²",
        material: "羊毛",
        dyeType: "植物染",
        status: "待验收",
        areas: [
          {
            id: "a-131-1",
            label: "区域 1",
            x: 36,
            y: 40,
            swatchId: "sw-501",
            before: "几何纹缺角，松石绿脱线。",
            after: "已按 RC-501 补织，色泽过渡自然。",
            logs: [
              {
                id: "l-131-1",
                date: "2026-09-02",
                step: "纹样补织",
                note: "按 RC-501 补织几何纹。",
              },
              {
                id: "l-131-2",
                date: "2026-09-08",
                step: "修剪平整",
                note: "剪平绒面，与旧绒齐平。",
              },
            ],
          },
          {
            id: "a-131-2",
            label: "区域 2",
            x: 68,
            y: 62,
            swatchId: "sw-601",
            before: "边穗磨损。",
            after: "本白线重结边穗。",
            logs: [
              {
                id: "l-131-3",
                date: "2026-09-05",
                step: "打底补线",
                note: "RC-601 重结边穗。",
              },
            ],
          },
        ],
      },
      {
        id: "CAR-138",
        name: "藏式团花炕毯",
        origin: "藏毯",
        era: "约1970年代",
        knotDensity: "26 结/cm²",
        material: "羊毛（牦牛毛混纺）",
        dyeType: "植物染",
        status: "待修复",
        areas: [
          {
            id: "a-138-1",
            label: "区域 1",
            x: 50,
            y: 50,
            swatchId: null,
            before: "团花中心局部褪色，需比对靛蓝系色卡。",
            after: "",
            logs: [],
          },
        ],
      },
    ],
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed && Array.isArray(parsed.carpets) && Array.isArray(parsed.swatches)) {
        return parsed;
      }
    }
  } catch {
    // 数据损坏时回退到演示数据
  }
  return seedState();
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 存储不可用时静默失败，页面内状态仍可用
  }
}

export function resetState(): AppState {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  return seedState();
}
