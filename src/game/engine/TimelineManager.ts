import type { Board, Timeline } from "../../types/timeline.types";
import type { Piece } from "../../types/game.types";

/**
 * 时间线管理器 - 管理多时间线分支与导航
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
  // 向已经存在的回合移动总是会创建新的分支时间线
  const latestTurn = getLatestTurn(tl);
  if (targetTurn <= latestTurn) return true;
  // 向未来不存在的回合移动也创建分支
  return !tl.boards.has(targetTurn);
}

/** 获取下一个可用的时间线ID */
export function getNextTimelineId(timelines: Map<number, Timeline>): number {
  let maxId = 0;
  for (const id of timelines.keys()) {
    if (Math.abs(id) > Math.abs(maxId)) maxId = id;
  }
  // 新时间线ID交替为正/负以区分方向
  const nextAbs = Math.abs(maxId) + 1;
  // 白方创建的时间线为负，黑方为正（简化：根据时间线数量交替）
  return timelines.size % 2 === 0 ? nextAbs : -nextAbs;
}

/** 获取时间线的最新回合号 */
export function getLatestTurn(timeline: Timeline): number {
  let latest = timeline.branchTurn;
  for (const turn of timeline.boards.keys()) {
    if (turn > latest) latest = turn;
  }
  return latest;
}

/** 获取所有活跃时间线 */
export function getActiveTimelines(
  timelines: Map<number, Timeline>,
): Timeline[] {
  return Array.from(timelines.values()).filter((tl) => tl.isActive);
}

/** 获取指定时间线的指定回合棋盘，如果不存在则返回最近的棋盘 */
export function getBoardAtTurn(
  timeline: Timeline,
  turn: number,
): Board | undefined {
  if (timeline.boards.has(turn)) return timeline.boards.get(turn);
  // 查找最近的棋盘
  let closest: Board | undefined;
  let closestDiff = Infinity;
  for (const [t, board] of timeline.boards) {
    const diff = Math.abs(t - turn);
    if (diff < closestDiff) {
      closestDiff = diff;
      closest = board;
    }
  }
  return closest;
}

/** 在目标棋盘上放置一个棋子（时间旅行着陆） */
export function placePieceOnBoard(
  board: Board,
  piece: Piece,
  x: number,
  y: number,
  timeline: number,
  turn: number,
): Board {
  // 移除目标位置的棋子（如果有）
  const newPieces = board.pieces.filter(
    (p: Piece) => !(p.position.x === x && p.position.y === y),
  );
  // 添加时间旅行过来的棋子
  newPieces.push({
    ...piece,
    position: { x, y, timeline, turn },
    hasMoved: true,
  });
  return { ...board, pieces: newPieces };
}

/** 检查时间悖论（简化版：检查是否存在同一时间线上相同棋子的多个实例） */
export function checkParadox(timelines: Map<number, Timeline>): boolean {
  // 简化实现：如果时间线过多则可能存在悖论
  return timelines.size > 50;
}
