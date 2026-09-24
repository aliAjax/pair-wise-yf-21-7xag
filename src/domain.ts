import type { ColorThread, DamageArea, Rug, RugStatus } from "./types";

/** 已有工序记录即视为已开工：派色后锁定，不许再改色号 */
export function isAreaStarted(area: DamageArea): boolean {
  return area.logs.length > 0;
}

/** 区域是否已补齐色号 */
export function isAreaAssigned(area: DamageArea): boolean {
  return area.colorCode !== null;
}

export function rugProgress(rug: Rug): { total: number; assigned: number; pct: number } {
  const total = rug.areas.length;
  const assigned = rug.areas.filter(isAreaAssigned).length;
  return { total, assigned, pct: total === 0 ? 0 : Math.round((assigned / total) * 100) };
}

export function isFullyAssigned(rug: Rug): boolean {
  return rug.areas.length > 0 && rug.areas.every(isAreaAssigned);
}

export function statusLabel(status: RugStatus): string {
  return status;
}

/**
 * 派色校验：
 * 1. 已开工（写过工序记录）的区域不能改色号；
 * 2. 色卡里库存为 0（已用完）的色号不能派出。
 * 返回错误文案；null 表示可以派。
 */
export function validateAssign(
  area: DamageArea,
  color: ColorThread | undefined,
  colors: ColorThread[],
): string | null {
  if (isAreaStarted(area)) {
    return `区域「${area.label}」已开工且写过工序记录，色号已锁定，不能再改。`;
  }
  if (!color) {
    return "请选择一个色号。";
  }
  const live = colors.find((c) => c.code === color.code);
  if (!live || live.stock <= 0) {
    return `色号 ${color.code} ${color.name} 已经用完，不能再派出，请当场换一个有余线的色号。`;
  }
  return null;
}

export function findColor(colors: ColorThread[], code: string | null): ColorThread | undefined {
  return code ? colors.find((c) => c.code === code) : undefined;
}

/** 每块地毯只允许一个区域使用同一色号（补线按区域备料），跨地毯可复用 */
export function codeUsedElsewhere(rug: Rug, code: string, areaId: string): boolean {
  return rug.areas.some((a) => a.id !== areaId && a.colorCode === code);
}
