import type { Piece, PieceColor } from "../../types/game.types";
import type { Board } from "../../types/timeline.types";
import type { GameState } from "./GameState";
import { getPiecesByColor } from "./GameState";
import { isValidSpatialMove, getLegalMoves } from "./MoveValidator";

/**
 * 胜负判定
 */

/** 检查国王是否被将军 */
export function isKingInCheck(color: PieceColor, board: Board): boolean {
  const king = board.pieces.find(
    (p: Piece) => p.type === "king" && p.color === color,
  );
  if (!king) return false;

  const opponentColor: PieceColor = color === "white" ? "black" : "white";
  const opponents = getPiecesByColor(board, opponentColor);

  return opponents.some((piece: Piece) => {
    // 国王只检查基本移动（避免递归）
    if (piece.type === "king") {
      const dx = Math.abs(king.position.x - piece.position.x);
      const dy = Math.abs(king.position.y - piece.position.y);
      return dx <= 1 && dy <= 1 && (dx > 0 || dy > 0);
    }
    return isValidSpatialMove(piece, king.position, board);
  });
}

/** 检查移动后自己国王是否被将军 */
export function isKingInCheckAfterMove(
  piece: Piece,
  to: { x: number; y: number },
  board: Board,
): boolean {
  let capturedId: string | undefined;

  const targetPiece = board.pieces.find(
    (p: Piece) => p.position.x === to.x && p.position.y === to.y,
  );
  if (targetPiece) {
    capturedId = targetPiece.id;
  }

  // 吃过路兵：兵斜走到空格
  if (
    piece.type === "pawn" &&
    Math.abs(to.x - piece.position.x) === 1 &&
    !targetPiece
  ) {
    const epPawn = board.pieces.find(
      (p: Piece) =>
        p.position.x === to.x && p.position.y === piece.position.y,
    );
    if (epPawn) {
      capturedId = epPawn.id;
    }
  }

  let newPieces = board.pieces
    .filter((p: Piece) => p.id !== piece.id && p.id !== capturedId)
    .concat({
      ...piece,
      position: { ...piece.position, x: to.x, y: to.y },
    });

  // 王车易位：同时移动车
  if (piece.type === "king" && Math.abs(to.x - piece.position.x) === 2) {
    const rookFromX = to.x > piece.position.x ? 7 : 0;
    const rookToX = to.x > piece.position.x ? to.x - 1 : to.x + 1;
    newPieces = newPieces.map((p: Piece) =>
      p.position.x === rookFromX &&
      p.position.y === piece.position.y &&
      p.type === "rook" &&
      p.color === piece.color
        ? { ...p, position: { ...p.position, x: rookToX } }
        : p,
    );
  }

  const simulatedBoard: Board = { ...board, pieces: newPieces };
  return isKingInCheck(piece.color, simulatedBoard);
}

/** 检查是否将死（检查所有活跃时间线） */
export function isCheckmate(
  color: PieceColor,
  gameState: GameState,
): boolean {
  // 在5D Chess中，需要在所有活跃时间线的最新棋盘上检查
  // 简化规则：只要在当前活跃时间线上将死即算将死
  for (const [, timeline] of gameState.timelines) {
    if (!timeline.isActive) continue;

    // 获取该时间线最新的棋盘
    let latestTurn = -1;
    for (const turn of timeline.boards.keys()) {
      if (turn > latestTurn) latestTurn = turn;
    }
    const board = timeline.boards.get(latestTurn);
    if (!board) continue;

    // 检查该棋盘上是否有被将死的国王
    const king = board.pieces.find(
      (p: Piece) => p.type === "king" && p.color === color,
    );
    if (!king) continue;

    if (!isKingInCheck(color, board)) continue;

    const pieces = getPiecesByColor(board, color);
    const allTrapped = pieces.every(
      (piece: Piece) => getLegalMoves(piece, board).length === 0,
    );
    if (allTrapped) return true;
  }

  return false;
}

/** 检查是否僵局（检查所有活跃时间线） */
export function isStalemate(gameState: GameState): boolean {
  const color = gameState.currentPlayer;

  for (const [, timeline] of gameState.timelines) {
    if (!timeline.isActive) continue;

    let latestTurn = -1;
    for (const turn of timeline.boards.keys()) {
      if (turn > latestTurn) latestTurn = turn;
    }
    const board = timeline.boards.get(latestTurn);
    if (!board) continue;

    const king = board.pieces.find(
      (p: Piece) => p.type === "king" && p.color === color,
    );
    if (!king) continue;

    if (isKingInCheck(color, board)) continue;

    const pieces = getPiecesByColor(board, color);
    const noMoves = pieces.every(
      (piece: Piece) => getLegalMoves(piece, board).length === 0,
    );
    if (noMoves) return true;
  }

  return false;
}

/** 检查是否材料不足（无法将死） */
function hasInsufficientMaterial(board: Board): boolean {
  const whitePieces = getPiecesByColor(board, "white");
  const blackPieces = getPiecesByColor(board, "black");

  // K vs K
  if (whitePieces.length === 1 && blackPieces.length === 1) return true;

  // K+B vs K 或 K+N vs K
  if (whitePieces.length === 1 && blackPieces.length === 2) {
    return blackPieces.some(
      (p: Piece) => p.type === "bishop" || p.type === "knight",
    );
  }
  if (whitePieces.length === 2 && blackPieces.length === 1) {
    return whitePieces.some(
      (p: Piece) => p.type === "bishop" || p.type === "knight",
    );
  }

  return false;
}

/** 检查是否和棋（材料不足，检查所有活跃时间线） */
export function isDraw(gameState: GameState): boolean {
  for (const [, timeline] of gameState.timelines) {
    if (!timeline.isActive) continue;

    let latestTurn = -1;
    for (const turn of timeline.boards.keys()) {
      if (turn > latestTurn) latestTurn = turn;
    }
    const board = timeline.boards.get(latestTurn);
    if (!board) continue;

    if (!hasInsufficientMaterial(board)) return false;
  }

  return true;
}
