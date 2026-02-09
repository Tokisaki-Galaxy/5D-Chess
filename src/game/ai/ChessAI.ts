import type {
  AIDifficulty,
  Move,
  Piece,
  PieceType,
} from "../../types/game.types";
import type { Board } from "../../types/timeline.types";
import type { GameState } from "../engine/GameState";
import { getPieceAt, getPiecesByColor } from "../engine/GameState";
import { getLegalMoves, isPromotionMove } from "../engine/MoveValidator";

/** 棋子价值 */
const PIECE_VALUES: Record<PieceType, number> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 0,
};

/** 获取AI的移动 */
export function getAIMove(
  gameState: GameState,
  difficulty: AIDifficulty,
): Move | null {
  const timeline = gameState.timelines.get(gameState.currentTimeline);
  if (!timeline) return null;
  const board = timeline.boards.get(gameState.currentTurn);
  if (!board) return null;

  const color = gameState.currentPlayer;
  const pieces = getPiecesByColor(board, color);

  // 收集所有合法移动
  const allMoves: { piece: Piece; to: { x: number; y: number } }[] = [];
  for (const piece of pieces) {
    const moves = getLegalMoves(piece, board);
    for (const m of moves) {
      allMoves.push({ piece, to: { x: m.x, y: m.y } });
    }
  }

  if (allMoves.length === 0) return null;

  let chosen: { piece: Piece; to: { x: number; y: number } };

  switch (difficulty) {
    case "easy":
      chosen = allMoves[Math.floor(Math.random() * allMoves.length)];
      break;
    case "medium":
      chosen = pickMediumMove(allMoves, board);
      break;
    case "hard":
      chosen = pickHardMove(allMoves, board, color);
      break;
    default:
      chosen = allMoves[Math.floor(Math.random() * allMoves.length)];
  }

  return buildMove(chosen.piece, chosen.to, board);
}

/** 中等难度：优先吃子 */
function pickMediumMove(
  allMoves: { piece: Piece; to: { x: number; y: number } }[],
  board: Board,
): { piece: Piece; to: { x: number; y: number } } {
  let bestCapture: { piece: Piece; to: { x: number; y: number } } | null = null;
  let bestValue = -1;

  for (const m of allMoves) {
    const target = getPieceAt(board, m.to.x, m.to.y);
    if (target) {
      const val = PIECE_VALUES[target.type];
      if (val > bestValue) {
        bestValue = val;
        bestCapture = m;
      }
    }
  }

  return bestCapture ?? allMoves[Math.floor(Math.random() * allMoves.length)];
}

/** 困难难度：1层深度评估 */
function pickHardMove(
  allMoves: { piece: Piece; to: { x: number; y: number } }[],
  board: Board,
  color: string,
): { piece: Piece; to: { x: number; y: number } } {
  let bestMove = allMoves[0];
  let bestScore = -Infinity;

  for (const m of allMoves) {
    const score = evaluateMove(m.piece, m.to, board, color);
    if (score > bestScore) {
      bestScore = score;
      bestMove = m;
    }
  }

  return bestMove;
}

/** 评估一步移动的分数 */
function evaluateMove(
  piece: Piece,
  to: { x: number; y: number },
  board: Board,
  color: string,
): number {
  let score = 0;

  // 吃子得分
  const target = getPieceAt(board, to.x, to.y);
  if (target) {
    score += PIECE_VALUES[target.type] * 10;
  }

  // 升变得分
  if (isPromotionMove(piece, to.y)) {
    score += 80;
  }

  // 控制中心
  const centerDist =
    Math.abs(to.x - 3.5) + Math.abs(to.y - 3.5);
  score += (4 - centerDist) * 0.5;

  // 兵的推进
  if (piece.type === "pawn") {
    const advance =
      color === "white" ? to.y - piece.position.y : piece.position.y - to.y;
    score += advance * 0.3;
  }

  return score;
}

/** 构建 Move 对象 */
function buildMove(
  piece: Piece,
  to: { x: number; y: number },
  board: Board,
): Move {
  const capturedPiece = getPieceAt(board, to.x, to.y) ?? undefined;
  const toPos = {
    x: to.x,
    y: to.y,
    timeline: piece.position.timeline,
    turn: piece.position.turn,
  };
  const promotion = isPromotionMove(piece, to.y);

  return {
    id: `ai-move-${Date.now()}`,
    piece,
    from: piece.position,
    to: toPos,
    capturedPiece,
    timestamp: Date.now(),
    isPromotion: promotion || undefined,
    promotionChoice: promotion ? "queen" : undefined,
  };
}
