import type { Piece } from "../../types/game.types";
import type { Position5D } from "../../types/game.types";
import type { Board } from "../../types/timeline.types";
import type { GameState } from "./GameState";
import { getPieceAt } from "./GameState";

/**
 * 移动验证器 - 检查棋子移动是否合法
 * Week 3-4 将完善完整的移动规则
 */

/** 检查坐标是否在棋盘范围内 */
export function isInBounds(x: number, y: number): boolean {
  return x >= 0 && x < 8 && y >= 0 && y < 8;
}

/** 检查是否为合法的空间移动（基础版） */
export function isValidSpatialMove(
  piece: Piece,
  to: Position5D,
  board: Board,
): boolean {
  const from = piece.position;
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  if (!isInBounds(to.x, to.y)) return false;

  // 不能吃自己的棋子
  const targetPiece = getPieceAt(board, to.x, to.y);
  if (targetPiece && targetPiece.color === piece.color) return false;

  switch (piece.type) {
    case "pawn":
      return isValidPawnMove(piece, to, board, dx, dy);
    case "rook":
      return isValidRookMove(from, to, board);
    case "knight":
      return isValidKnightMove(dx, dy);
    case "bishop":
      return isValidBishopMove(from, to, board);
    case "queen":
      return isValidRookMove(from, to, board) || isValidBishopMove(from, to, board);
    case "king":
      return Math.abs(dx) <= 1 && Math.abs(dy) <= 1 && (dx !== 0 || dy !== 0);
    default:
      return false;
  }
}

function isValidPawnMove(
  piece: Piece,
  to: Position5D,
  board: Board,
  dx: number,
  dy: number,
): boolean {
  const direction = piece.color === "white" ? 1 : -1;
  const startRow = piece.color === "white" ? 1 : 6;
  const targetPiece = getPieceAt(board, to.x, to.y);

  // 前进一步
  if (dx === 0 && dy === direction && !targetPiece) return true;
  // 首次前进两步
  if (
    dx === 0 &&
    dy === 2 * direction &&
    piece.position.y === startRow &&
    !targetPiece &&
    !getPieceAt(board, to.x, piece.position.y + direction)
  )
    return true;
  // 斜吃
  if (Math.abs(dx) === 1 && dy === direction && targetPiece) return true;

  return false;
}

function isValidRookMove(from: Position5D, to: Position5D, board: Board): boolean {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx !== 0 && dy !== 0) return false;
  return isPathClear(from, to, board);
}

function isValidKnightMove(dx: number, dy: number): boolean {
  return (
    (Math.abs(dx) === 2 && Math.abs(dy) === 1) ||
    (Math.abs(dx) === 1 && Math.abs(dy) === 2)
  );
}

function isValidBishopMove(from: Position5D, to: Position5D, board: Board): boolean {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) !== Math.abs(dy)) return false;
  return isPathClear(from, to, board);
}

/** 检查路径是否畅通（不含起点和终点） */
function isPathClear(from: Position5D, to: Position5D, board: Board): boolean {
  const dx = Math.sign(to.x - from.x);
  const dy = Math.sign(to.y - from.y);
  let cx = from.x + dx;
  let cy = from.y + dy;

  while (cx !== to.x || cy !== to.y) {
    if (getPieceAt(board, cx, cy)) return false;
    cx += dx;
    cy += dy;
  }
  return true;
}

/** 检查是否为合法的时间旅行（占位，Week 5-6 实现） */
export function isValidTimeTravel(
  _piece: Piece,
  _to: Position5D,
  _gameState: GameState,
): boolean {
  // TODO: 实现时间旅行验证
  return false;
}

/** 获取棋子所有合法移动位置 */
export function getLegalMoves(piece: Piece, board: Board): Position5D[] {
  const moves: Position5D[] = [];
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      const to: Position5D = {
        x,
        y,
        timeline: piece.position.timeline,
        turn: piece.position.turn,
      };
      if (isValidSpatialMove(piece, to, board)) {
        moves.push(to);
      }
    }
  }
  return moves;
}
