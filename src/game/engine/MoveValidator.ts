import type { Piece } from "../../types/game.types";
import type { Position5D } from "../../types/game.types";
import type { Board } from "../../types/timeline.types";
import type { GameState } from "./GameState";
import { getPieceAt } from "./GameState";
import { isKingInCheck, isKingInCheckAfterMove } from "./WinCondition";

/**
 * 移动验证器 - 检查棋子移动是否合法
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
      if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1 && (dx !== 0 || dy !== 0))
        return true;
      if (dy === 0 && Math.abs(dx) === 2)
        return isValidCastling(piece, to, board);
      return false;
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
  // 吃过路兵
  if (Math.abs(dx) === 1 && dy === direction && !targetPiece) {
    return isValidEnPassant(piece, to, board);
  }

  return false;
}

/** 检查吃过路兵是否合法 */
function isValidEnPassant(
  piece: Piece,
  to: Position5D,
  board: Board,
): boolean {
  if (!board.lastMove) return false;
  const last = board.lastMove;
  if (last.piece.type !== "pawn") return false;
  if (Math.abs(last.to.y - last.from.y) !== 2) return false;
  if (last.to.x !== to.x) return false;
  if (last.to.y !== piece.position.y) return false;
  return true;
}

/** 检查王车易位是否合法 */
function isValidCastling(
  piece: Piece,
  to: Position5D,
  board: Board,
): boolean {
  if (piece.hasMoved) return false;
  if (isKingInCheck(piece.color, board)) return false;

  const direction = to.x > piece.position.x ? 1 : -1;
  const rookX = direction === 1 ? 7 : 0;
  const rook = getPieceAt(board, rookX, piece.position.y);
  if (!rook || rook.type !== "rook" || rook.color !== piece.color || rook.hasMoved)
    return false;

  // 检查路径是否畅通
  let cx = piece.position.x + direction;
  while (cx !== rookX) {
    if (getPieceAt(board, cx, piece.position.y)) return false;
    cx += direction;
  }

  // 检查国王经过的格子是否被攻击
  const midPos = { ...piece.position, x: piece.position.x + direction };
  if (
    isKingInCheckAfterMove(piece, { x: midPos.x, y: midPos.y }, board)
  )
    return false;

  return true;
}

/** 检测是否为升变移动 */
export function isPromotionMove(piece: Piece, toY: number): boolean {
  if (piece.type !== "pawn") return false;
  return (
    (piece.color === "white" && toY === 7) ||
    (piece.color === "black" && toY === 0)
  );
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

/**
 * 检查是否为合法的时间旅行移动
 * 5D Chess中棋子可以跨时间线和回合移动：
 * - 车：可沿单一轴移动（包括时间轴和时间线轴）
 * - 象：可在任意两个轴的对角线上移动
 * - 后：车 + 象
 * - 马：L型跳跃可跨时间维度
 * - 国王：任意方向一步（包括时间维度）
 * - 兵：可沿时间轴前进一步
 */
export function isValidTimeTravel(
  piece: Piece,
  to: Position5D,
  gameState: GameState,
): boolean {
  const from = piece.position;

  // 不能移动到同一位置
  if (
    from.x === to.x &&
    from.y === to.y &&
    from.timeline === to.timeline &&
    from.turn === to.turn
  )
    return false;

  // 纯空间移动不属于时间旅行
  if (from.timeline === to.timeline && from.turn === to.turn) return false;

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dt = to.turn - from.turn; // 时间轴差
  const dl = to.timeline - from.timeline; // 时间线轴差

  // 检查目标时间线和回合是否存在棋盘
  const targetTimeline = gameState.timelines.get(to.timeline);
  if (!targetTimeline) return false;
  const targetBoard = targetTimeline.boards.get(to.turn);
  if (!targetBoard) return false;

  // 检查目标位置是否有友方棋子
  const targetPiece = getPieceAt(targetBoard, to.x, to.y);
  if (targetPiece && targetPiece.color === piece.color) return false;

  switch (piece.type) {
    case "rook":
      return isValidTimeTravelRook(dx, dy, dt, dl);
    case "bishop":
      return isValidTimeTravelBishop(dx, dy, dt, dl);
    case "queen":
      return (
        isValidTimeTravelRook(dx, dy, dt, dl) ||
        isValidTimeTravelBishop(dx, dy, dt, dl)
      );
    case "knight":
      return isValidTimeTravelKnight(dx, dy, dt, dl);
    case "king":
      return isValidTimeTravelKing(dx, dy, dt, dl);
    case "pawn":
      return isValidTimeTravelPawn(piece, dx, dy, dt, dl, targetBoard);
    default:
      return false;
  }
}

/** 车的时间旅行：沿单一轴移动（4个轴中的1个，其余为0） */
function isValidTimeTravelRook(
  dx: number,
  dy: number,
  dt: number,
  dl: number,
): boolean {
  const axes = [dx, dy, dt, dl];
  const nonZero = axes.filter((v) => v !== 0).length;
  return nonZero === 1;
}

/** 象的时间旅行：在任意两个轴的对角线移动（绝对值相等） */
function isValidTimeTravelBishop(
  dx: number,
  dy: number,
  dt: number,
  dl: number,
): boolean {
  const axes = [Math.abs(dx), Math.abs(dy), Math.abs(dt), Math.abs(dl)];
  const nonZero = axes.filter((v) => v !== 0);
  if (nonZero.length !== 2) return false;
  return nonZero[0] === nonZero[1];
}

/** 马的时间旅行：任意两个轴上的L型跳跃 */
function isValidTimeTravelKnight(
  dx: number,
  dy: number,
  dt: number,
  dl: number,
): boolean {
  const axes = [Math.abs(dx), Math.abs(dy), Math.abs(dt), Math.abs(dl)];
  const nonZero = axes.filter((v) => v !== 0);
  if (nonZero.length !== 2) return false;
  const sorted = nonZero.sort((a, b) => a - b);
  return sorted[0] === 1 && sorted[1] === 2;
}

/** 国王的时间旅行：任意方向最多一步 */
function isValidTimeTravelKing(
  dx: number,
  dy: number,
  dt: number,
  dl: number,
): boolean {
  return (
    Math.abs(dx) <= 1 &&
    Math.abs(dy) <= 1 &&
    Math.abs(dt) <= 1 &&
    Math.abs(dl) <= 1 &&
    (dx !== 0 || dy !== 0 || dt !== 0 || dl !== 0)
  );
}

/** 兵的时间旅行：可沿时间轴或时间线轴前进一步（不改变空间坐标或仅对角） */
function isValidTimeTravelPawn(
  piece: Piece,
  dx: number,
  dy: number,
  dt: number,
  dl: number,
  targetBoard: Board,
): boolean {
  const toX = piece.position.x + dx;
  const toY = piece.position.y + dy;

  // 兵只能沿时间线轴移动1步，不改变空间坐标
  if (dx === 0 && dy === 0) {
    const timeStep = Math.abs(dt) + Math.abs(dl);
    if (timeStep !== 1) return false;
    // 不能移动到有棋子的位置
    const target = getPieceAt(targetBoard, toX, toY);
    return !target;
  }

  // 兵可以斜向吃子（空间+时间维度各1步）
  if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
    const timeStep = Math.abs(dt) + Math.abs(dl);
    if (timeStep !== 1) return false;
    const target = getPieceAt(targetBoard, toX, toY);
    return !!target && target.color !== piece.color;
  }

  return false;
}

/** 获取棋子所有时间旅行合法移动位置 */
export function getTimeTravelMoves(
  piece: Piece,
  gameState: GameState,
): Position5D[] {
  const moves: Position5D[] = [];

  for (const [tlId, timeline] of gameState.timelines) {
    for (const [turn] of timeline.boards) {
      // 跳过当前时空（那是空间移动）
      if (tlId === piece.position.timeline && turn === piece.position.turn)
        continue;

      for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
          const to: Position5D = { x, y, timeline: tlId, turn };
          if (isValidTimeTravel(piece, to, gameState)) {
            moves.push(to);
          }
        }
      }
    }
  }

  return moves;
}

/** 获取棋子所有合法移动位置（含将军过滤） */
export function getLegalMoves(piece: Piece, board: Board, gameState?: GameState): Position5D[] {
  const moves: Position5D[] = [];

  // 空间移动
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      const to: Position5D = {
        x,
        y,
        timeline: piece.position.timeline,
        turn: piece.position.turn,
      };
      if (isValidSpatialMove(piece, to, board)) {
        if (!isKingInCheckAfterMove(piece, { x, y }, board)) {
          moves.push(to);
        }
      }
    }
  }

  // 时间旅行移动（需要 gameState 参数）
  if (gameState) {
    const timeMoves = getTimeTravelMoves(piece, gameState);
    moves.push(...timeMoves);
  }

  return moves;
}
