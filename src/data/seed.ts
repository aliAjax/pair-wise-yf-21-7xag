import type { ArchiveState, ColorThread, DamageArea, Origin, ProcessLog, Rug } from "../types";

export const STORAGE_KEY = "rug-restore-archive-v1";

let seq = 0;
export function uid(prefix = "id"): string {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq}-${Math.random().toString(36).slice(2, 7)}`;
}

function iso(hoursAgo: number): string {
  return new Date(Date.now() - hoursAgo * 3600_000).toISOString();
}

let areaSeq = 0;
function area(
  partial: Omit<DamageArea, "id" | "logs" | "beforeNote" | "afterNote" | "colorCode"> &
    Partial<Pick<DamageArea, "logs" | "beforeNote" | "afterNote" | "colorCode">>,
): DamageArea {
  areaSeq += 1;
  return {
    id: uid("area"),
    colorCode: null,
    beforeNote: "",
    afterNote: "",
    logs: [],
    ...partial,
  };
}

function log(hoursAgo: number, content: string): ProcessLog {
  return { id: uid("log"), at: iso(hoursAgo), content };
}

export const SEED_COLORS: ColorThread[] = [
  { code: "S-01", name: "石榴红", hex: "#8c2f1b", stock: 6 },
  { code: "S-02", name: "赭石", hex: "#a65a2b", stock: 4 },
  { code: "S-03", name: "胭脂", hex: "#b34a5e", stock: 0 },
  { code: "S-04", name: "驼绒", hex: "#c9a36a", stock: 5 },
  { code: "S-05", name: "姜黄", hex: "#d9a441", stock: 0 },
  { code: "S-06", name: "橄榄绿", hex: "#6e7f4a", stock: 3 },
  { code: "S-07", name: "靛蓝", hex: "#243b6b", stock: 7 },
  { code: "S-08", name: "藏青", hex: "#1b2a4a", stock: 2 },
  { code: "S-09", name: "松石", hex: "#2f8f83", stock: 4 },
  { code: "S-10", name: "藕粉", hex: "#d8a7a0", stock: 0 },
  { code: "S-11", name: "玄黑", hex: "#2b2620", stock: 3 },
  { code: "S-12", name: "本白", hex: "#efe7d6", stock: 8 },
  { code: "S-13", name: "赤陶", hex: "#9c5236", stock: 2 },
  { code: "S-14", name: "苔绿", hex: "#7d8c58", stock: 1 },
];

function rug(
  code: string,
  name: string,
  origin: Origin,
  era: string,
  knotDensity: number,
  material: string,
  dyeType: string,
  areas: DamageArea[],
  status: Rug["status"],
  hoursAgo: number,
): Rug {
  return {
    id: uid("rug"),
    code,
    name,
    origin,
    era,
    knotDensity,
    material,
    dyeType,
    areas,
    status,
    createdAt: iso(hoursAgo),
  };
}

export function buildSeedState(): ArchiveState {
  const rugs: Rug[] = [
    rug(
      "CAR-092",
      "波斯边缘磨损毯",
      "波斯",
      "约1960s",
      38,
      "羊毛绒头，棉经棉纬",
      "植物染为主，局部化学染",
      [
        area({
          label: "左边框磨白",
          x: 12, y: 42, r: 9,
          colorCode: "S-02",
          beforeNote: "左侧边框起绒磨平，露出纬纱，赭石色褪浅约两成。",
          afterNote: "",
          logs: [
            log(50, "清洗除尘，记录磨白范围 24cm。"),
            log(30, "按 S-02 赭石 合股补绒，已补 11cm。"),
          ],
        }),
        area({
          label: "角头开线",
          x: 90, y: 12, r: 7,
          colorCode: "S-11",
          beforeNote: "右上角锁边开线 6cm，绒头打结松散。",
          afterNote: "",
          logs: [log(20, "重新锁边，玄黑线压缝，等待补绒。")],
        }),
        area({ label: "主纹褪色点", x: 55, y: 58, r: 5 }),
      ],
      "修复中",
      120,
    ),
    rug(
      "CAR-117",
      "安纳托利亚中心纹毯",
      "安纳托利亚",
      "约1980s",
      42,
      "羊毛绒头，羊毛经纬",
      "植物染",
      [
        area({
          label: "中心纹缺口",
          x: 50, y: 50, r: 8,
          colorCode: "S-09",
          beforeNote: "中央菱形主纹缺绒约掌心大，松石底色裸露。",
          afterNote: "",
          logs: [log(72, "拓样并留存中心纹样图。"), log(14, "S-09 松石色线到货，开始补绒。")],
        }),
        area({ label: "下边框虫蛀", x: 50, y: 88, r: 6 }),
      ],
      "修复中",
      96,
    ),
    rug(
      "CAR-138",
      "藏毯靛蓝褪色片",
      "藏毯",
      "约1970s",
      46,
      "高原羊毛，羊毛经",
      "植物染（靛蓝）",
      [
        area({
          label: "右下褪色块",
          x: 78, y: 70, r: 10,
          colorCode: "S-07",
          beforeNote: "右侧靠下靛蓝整体褪色，出现明显色斑。",
          afterNote: "分层补染补绒完成，远观无色差，顺绒方向一致。",
          logs: [
            log(200, "比色：S-07 靛蓝最接近，记录湿色差。"),
            log(120, "补织底层，分三层叠色。"),
            log(36, "补绒收尾并修剪齐平，拍摄修复后照片。"),
          ],
        }),
        area({
          label: "上端流苏断股",
          x: 50, y: 6, r: 5,
          colorCode: "S-12",
          beforeNote: "上端流苏断股 4 根，结穗松散。",
          afterNote: "本白线重结流苏，股数补齐。",
          logs: [log(40, "重结流苏并加固边结。")],
        }),
      ],
      "待验收",
      240,
    ),
    rug(
      "CAR-141",
      "高加索几何纹祈祷毯",
      "高加索",
      "约1990s",
      50,
      "羊毛绒头，羊毛纬",
      "植物染",
      [
        area({ label: "祈祷龛尖缺绒", x: 50, y: 26, r: 6 }),
        area({ label: "左侧几何纹断线", x: 22, y: 60, r: 7 }),
      ],
      "待修复",
      24,
    ),
    rug(
      "CAR-105",
      "波斯石榴纹客厅毯",
      "波斯",
      "约1950s",
      34,
      "羊毛绒头，棉经",
      "植物染",
      [
        area({
          label: "石榴纹补绒",
          x: 35, y: 40, r: 7,
          colorCode: "S-01",
          beforeNote: "左侧石榴纹缺绒，红色斑驳。",
          afterNote: "石榴红补绒完成，纹样接顺。",
          logs: [
            log(300, "清洗、固色。"),
            log(260, "S-01 石榴红补绒，接纹样。"),
            log(220, "修剪、拍照存档。"),
          ],
        }),
        area({
          label: "边框补线",
          x: 86, y: 84, r: 6,
          colorCode: "S-13",
          beforeNote: "右下边框赤陶色磨损。",
          afterNote: "赤陶色补齐，压边平整。",
          logs: [log(180, "S-13 补边框并锁边。")],
        }),
      ],
      "待验收",
      320,
    ),
  ];

  return { rugs, colors: SEED_COLORS.map((c) => ({ ...c })) };
}
