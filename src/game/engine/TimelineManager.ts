import type { Board, Timeline } from "../../types/timeline.types";

/**
 * 时间线管理器 - Week 5-6 将完善
 * 当前为基础结构定义
 */

/** 创建新时间线分支 */
export function createTimeline(
  parentTimeline: number,
  branchTurn: number,
  initialBoard: Board,
  nextId: number,
): Timeline {
  return {
    id: nextId,
    parentTimeline,
    branchTurn,
    boards: new Map([[branchTurn, initialBoard]]),
    isActive: true,
  };
}

/** 检查时间旅行是否会创建新时间线 */
export function willCreateTimeline(
  targetTimeline: number,
  targetTurn: number,
  timelines: Map<number, Timeline>,
): boolean {
  const tl = timelines.get(targetTimeline);
  if (!tl) return true;
  // 如果目标回合已有棋盘，则在现有时间线上操作；否则创建分支
  return !tl.boards.has(targetTurn);
}
