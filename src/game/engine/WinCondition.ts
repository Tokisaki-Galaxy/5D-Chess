import type { PieceColor } from "../../types/game.types";
import type { GameState } from "./GameState";

/**
 * 胜负判定 - Week 5-6 将完善
 * 当前为基础结构定义
 */

/** 检查是否将军 */
export function isCheck(
  _color: PieceColor,
  _gameState: GameState,
): boolean {
  // TODO: 实现将军检测
  return false;
}

/** 检查是否将死（所有时间线） */
export function isCheckmate(
  _color: PieceColor,
  _gameState: GameState,
): boolean {
  // TODO: 实现将死检测
  return false;
}

/** 检查是否僵局 */
export function isStalemate(_gameState: GameState): boolean {
  // TODO: 实现僵局检测
  return false;
}

/** 检查是否和棋 */
export function isDraw(_gameState: GameState): boolean {
  // TODO: 实现和棋检测
  return false;
}
