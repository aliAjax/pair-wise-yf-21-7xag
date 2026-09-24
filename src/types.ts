export type CarpetStatus = "待修复" | "修复中" | "待验收";

export interface Swatch {
  id: string;
  code: string;
  name: string;
  hex: string;
  /** 剩余线量（绞），0 表示已用完，不可再派色 */
  stock: number;
}

export interface ProcessLog {
  id: string;
  date: string;
  step: string;
  note: string;
}

export interface DamageArea {
  id: string;
  label: string;
  /** 在纹样图上的位置，百分比坐标 0-100 */
  x: number;
  y: number;
  /** 派给的补线色号；null 表示待派色 */
  swatchId: string | null;
  /** 修复前的样子 */
  before: string;
  /** 修复后的样子 */
  after: string;
  /** 工序记录；一旦有记录即视为已开工，色号锁定 */
  logs: ProcessLog[];
}

export interface Carpet {
  id: string;
  name: string;
  origin: string;
  era: string;
  knotDensity: string;
  material: string;
  dyeType: string;
  status: CarpetStatus;
  areas: DamageArea[];
}

export interface AppState {
  swatches: Swatch[];
  carpets: Carpet[];
}
