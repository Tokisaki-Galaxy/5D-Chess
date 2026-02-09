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

/** 检查是否将死 */
export function isCheckmate(
  color: PieceColor,
  gameState: GameState,
): boolean {
  const timeline = gameState.timelines.get(gameState.currentTimeline);
  if (!timeline) return false;
  const board = timeline.boards.get(gameState.currentTurn);
  if (!board) return false;

  if (!isKingInCheck(color, board)) return false;

  const pieces = getPiecesByColor(board, color);
  return pieces.every(
    (piece: Piece) => getLegalMoves(piece, board).length === 0,
  );
}

/** 检查是否僵局 */
export function isStalemate(gameState: GameState): boolean {
  const timeline = gameState.timelines.get(gameState.currentTimeline);
  if (!timeline) return false;
  const board = timeline.boards.get(gameState.currentTurn);
  if (!board) return false;

  const color = gameState.currentPlayer;
  if (isKingInCheck(color, board)) return false;

  const pieces = getPiecesByColor(board, color);
  return pieces.every(
    (piece: Piece) => getLegalMoves(piece, board).length === 0,
  );
}

/** 检查是否和棋（材料不足） */
export function isDraw(gameState: GameState): boolean {
  const timeline = gameState.timelines.get(gameState.currentTimeline);
  if (!timeline) return false;
  const board = timeline.boards.get(gameState.currentTurn);
  if (!board) return false;

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
