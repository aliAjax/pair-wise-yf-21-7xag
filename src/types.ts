export type Origin = "波斯" | "安纳托利亚" | "高加索" | "藏毯";

export const ORIGINS: Origin[] = ["波斯", "安纳托利亚", "高加索", "藏毯"];

export type RugStatus = "待修复" | "修复中" | "待验收" | "已验收";

export interface DamageArea {
  id: string;
  label: string;
  /** 0-100，纹样图坐标系 */
  x: number;
  y: number;
  /** 圈选半径，占纹样图宽度的百分比 */
  r: number;
  colorCode: string | null;
  beforeNote: string;
  afterNote: string;
  logs: ProcessLog[];
}

export interface ProcessLog {
  id: string;
  /** ISO 时间 */
  at: string;
  content: string;
}

export interface Rug {
  id: string;
  code: string;
  name: string;
  origin: Origin;
  era: string;
  /** 结密度，结/平方分米 */
  knotDensity: number | "";
  material: string;
  dyeType: string;
  status: RugStatus;
  areas: DamageArea[];
  createdAt: string;
}

export interface ColorThread {
  code: string;
  name: string;
  hex: string;
  stock: number;
}

export interface ArchiveState {
  rugs: Rug[];
  colors: ColorThread[];
}
