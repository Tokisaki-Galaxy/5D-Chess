import type { Piece, Move } from "./game.types";

/** 棋盘状态 */
export interface Board {
  pieces: Piece[];
  turn: number;
  timeline: number;
  lastMove?: Move;
}

/** 时间线 */
export interface Timeline {
  id: number;
  parentTimeline: number | null; // 父时间线ID
  branchTurn: number; // 从哪个回合分支
  boards: Map<number, Board>; // 回合号 -> 棋盘状态
  isActive: boolean;
}
