import { describe, it, expect, vi } from "vitest";
import type { PieceColor, PieceType, Piece } from "../types/game.types";
import type { Board } from "../types/timeline.types";
import type { GameState } from "../game/engine/GameState";
import { getAIMove } from "../game/ai/ChessAI";
import { createInitialGameState } from "../game/engine/GameState";

function makePiece(
  type: PieceType,
  color: PieceColor,
  x: number,
  y: number,
  hasMoved = false,
): Piece {
  return {
    id: `${color}-${type}-${x}-${y}`,
    type,
    color,
    position: { x, y, timeline: 0, turn: 0 },
    hasMoved,
  };
}

function createCustomBoard(pieces: Piece[]): Board {
  return { pieces, turn: 0, timeline: 0 };
}

function createGameStateFromBoard(
  board: Board,
  currentPlayer: PieceColor = "white",
): GameState {
  const timeline = {
    id: 0,
    parentTimeline: null,
    branchTurn: 0,
    boards: new Map([[0, board]]),
    isActive: true,
  };
  return {
    timelines: new Map([[0, timeline]]),
    currentTimeline: 0,
    currentTurn: 0,
    currentPlayer,
    moveHistory: [],
    gameStatus: "playing",
  };
}

describe("ChessAI", () => {
  describe("getAIMove", () => {
    it("should return a valid move for initial position", () => {
      const gs = createInitialGameState();
      const move = getAIMove(gs, "easy");
      expect(move).not.toBeNull();
      expect(move!.piece.color).toBe("white");
      expect(move!.from).toBeDefined();
      expect(move!.to).toBeDefined();
    });

    it("should return null when no legal moves exist (checkmate position)", () => {
      // Black king checkmated
      const board = createCustomBoard([
        makePiece("king", "black", 7, 7),
        makePiece("rook", "white", 0, 7, true),
        makePiece("pawn", "black", 6, 6),
        makePiece("pawn", "black", 7, 6),
        makePiece("king", "white", 0, 0),
      ]);
      const gs = createGameStateFromBoard(board, "black");
      const move = getAIMove(gs, "easy");
      expect(move).toBeNull();
    });

    it("should return a move with easy difficulty", () => {
      const gs = createInitialGameState();
      const move = getAIMove(gs, "easy");
      expect(move).not.toBeNull();
      expect(move!.id).toContain("ai-move");
    });

    it("should prefer captures with medium difficulty", () => {
      // Set up position where white can capture a high-value piece
      const board = createCustomBoard([
        makePiece("king", "white", 4, 0),
        makePiece("rook", "white", 3, 3, true),
        makePiece("queen", "black", 3, 6, true),
        makePiece("king", "black", 4, 7),
      ]);
      const gs = createGameStateFromBoard(board, "white");

      // Run multiple times to check medium prefers capture
      let captureCount = 0;
      const runs = 10;
      for (let i = 0; i < runs; i++) {
        const move = getAIMove(gs, "medium");
        if (move && move.capturedPiece) {
          captureCount++;
        }
      }
      // Medium difficulty should capture when available
      expect(captureCount).toBeGreaterThan(0);
    });

    it("should prefer captures with hard difficulty", () => {
      const board = createCustomBoard([
        makePiece("king", "white", 4, 0),
        makePiece("rook", "white", 3, 3, true),
        makePiece("queen", "black", 3, 6, true),
        makePiece("king", "black", 4, 7),
      ]);
      const gs = createGameStateFromBoard(board, "white");
      const move = getAIMove(gs, "hard");
      expect(move).not.toBeNull();
      // Hard difficulty evaluates moves, should find the queen capture
      expect(move!.capturedPiece).toBeDefined();
      expect(move!.capturedPiece!.type).toBe("queen");
    });

    it("should return null when timeline is missing", () => {
      const gs: GameState = {
        timelines: new Map(),
        currentTimeline: 0,
        currentTurn: 0,
        currentPlayer: "white",
        moveHistory: [],
        gameStatus: "playing",
      };
      const move = getAIMove(gs, "easy");
      expect(move).toBeNull();
    });

    it("should return a move for black pieces", () => {
      const gs = createInitialGameState();
      gs.currentPlayer = "black";
      const move = getAIMove(gs, "easy");
      expect(move).not.toBeNull();
      expect(move!.piece.color).toBe("black");
    });

    it("should set promotionChoice to queen when pawn promotes", () => {
      // White pawn about to promote
      const board = createCustomBoard([
        makePiece("king", "white", 0, 0),
        makePiece("pawn", "white", 3, 6, true),
        makePiece("king", "black", 7, 7),
      ]);
      const gs = createGameStateFromBoard(board, "white");
      const move = getAIMove(gs, "hard");
      expect(move).not.toBeNull();
      // The pawn should be selected and promoted
      if (move!.piece.type === "pawn" && move!.to.y === 7) {
        expect(move!.promotionChoice).toBe("queen");
        expect(move!.isPromotion).toBe(true);
      }
    });
  });
});
