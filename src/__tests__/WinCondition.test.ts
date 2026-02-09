import { describe, it, expect } from "vitest";
import type { Piece, PieceColor, PieceType } from "../types/game.types";
import type { Board } from "../types/timeline.types";
import type { GameState } from "../game/engine/GameState";
import {
  isKingInCheck,
  isKingInCheckAfterMove,
  isCheckmate,
  isStalemate,
  isDraw,
} from "../game/engine/WinCondition";
import { createInitialBoard } from "../game/engine/GameState";

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

describe("WinCondition", () => {
  describe("isKingInCheck", () => {
    it("should return false for initial position", () => {
      const board = createInitialBoard(0, 0);
      expect(isKingInCheck("white", board)).toBe(false);
      expect(isKingInCheck("black", board)).toBe(false);
    });

    it("should detect check by rook on same file", () => {
      const board = createCustomBoard([
        makePiece("king", "white", 4, 0),
        makePiece("rook", "black", 4, 5),
        makePiece("king", "black", 7, 7),
      ]);
      expect(isKingInCheck("white", board)).toBe(true);
    });

    it("should detect check by bishop on diagonal", () => {
      const board = createCustomBoard([
        makePiece("king", "white", 4, 0),
        makePiece("bishop", "black", 6, 2),
        makePiece("king", "black", 7, 7),
      ]);
      expect(isKingInCheck("white", board)).toBe(true);
    });

    it("should detect check by knight", () => {
      const board = createCustomBoard([
        makePiece("king", "white", 4, 0),
        makePiece("knight", "black", 5, 2),
        makePiece("king", "black", 7, 7),
      ]);
      expect(isKingInCheck("white", board)).toBe(true);
    });

    it("should detect check by pawn", () => {
      const board = createCustomBoard([
        makePiece("king", "white", 4, 4),
        makePiece("pawn", "black", 5, 5),
        makePiece("king", "black", 7, 7),
      ]);
      expect(isKingInCheck("white", board)).toBe(true);
    });

    it("should not detect check when piece is blocked", () => {
      const board = createCustomBoard([
        makePiece("king", "white", 4, 0),
        makePiece("pawn", "white", 4, 2),
        makePiece("rook", "black", 4, 5),
        makePiece("king", "black", 7, 7),
      ]);
      expect(isKingInCheck("white", board)).toBe(false);
    });

    it("should return false when no king exists", () => {
      const board = createCustomBoard([
        makePiece("rook", "black", 4, 5),
      ]);
      expect(isKingInCheck("white", board)).toBe(false);
    });
  });

  describe("isKingInCheckAfterMove", () => {
    it("should detect moving a pinned piece reveals check", () => {
      // White king at e1, white rook at e4 (pinned), black rook at e7
      const board = createCustomBoard([
        makePiece("king", "white", 4, 0),
        makePiece("rook", "white", 4, 3),
        makePiece("rook", "black", 4, 6),
        makePiece("king", "black", 7, 7),
      ]);
      const pinnedRook = board.pieces.find(
        (p) => p.type === "rook" && p.color === "white",
      )!;
      // Moving the rook sideways exposes the king
      expect(isKingInCheckAfterMove(pinnedRook, { x: 5, y: 3 }, board)).toBe(
        true,
      );
    });

    it("should detect moving king into attacked square", () => {
      const board = createCustomBoard([
        makePiece("king", "white", 4, 0),
        makePiece("rook", "black", 5, 7),
        makePiece("king", "black", 7, 7),
      ]);
      const king = board.pieces.find(
        (p) => p.type === "king" && p.color === "white",
      )!;
      // Moving king to x=5 which is attacked by black rook
      expect(isKingInCheckAfterMove(king, { x: 5, y: 0 }, board)).toBe(true);
    });

    it("should confirm move that resolves check", () => {
      // White king in check from black rook, white rook can block
      const board = createCustomBoard([
        makePiece("king", "white", 4, 0),
        makePiece("rook", "white", 2, 3),
        makePiece("rook", "black", 4, 5),
        makePiece("king", "black", 7, 7),
      ]);
      const whiteRook = board.pieces.find(
        (p) => p.type === "rook" && p.color === "white",
      )!;
      // Move rook to block at e4
      expect(isKingInCheckAfterMove(whiteRook, { x: 4, y: 3 }, board)).toBe(
        false,
      );
    });
  });

  describe("isCheckmate", () => {
    it("should detect checkmate (back rank mate)", () => {
      // Black king on h8, white rook gives back rank mate
      const board = createCustomBoard([
        makePiece("king", "black", 7, 7),
        makePiece("rook", "white", 0, 7, true),
        makePiece("pawn", "black", 6, 6),
        makePiece("pawn", "black", 7, 6),
        makePiece("king", "white", 0, 0),
      ]);
      const gs = createGameStateFromBoard(board, "black");
      expect(isCheckmate("black", gs)).toBe(true);
    });

    it("should not detect checkmate if blocking move exists", () => {
      // Black king in check but a piece can block
      const board = createCustomBoard([
        makePiece("king", "black", 4, 7),
        makePiece("rook", "white", 4, 0, true),
        makePiece("rook", "black", 2, 5, true),
        makePiece("king", "white", 0, 0),
      ]);
      const gs = createGameStateFromBoard(board, "black");
      expect(isCheckmate("black", gs)).toBe(false);
    });

    it("should not detect checkmate when not in check", () => {
      const board = createCustomBoard([
        makePiece("king", "white", 4, 0),
        makePiece("king", "black", 4, 7),
      ]);
      const gs = createGameStateFromBoard(board, "white");
      expect(isCheckmate("white", gs)).toBe(false);
    });
  });

  describe("isStalemate", () => {
    it("should detect stalemate when king has no moves and is not in check", () => {
      // Black king cornered at a8, white queen at b6, white king at c7
      // Black has no legal moves but is not in check
      const board = createCustomBoard([
        makePiece("king", "black", 0, 7),
        makePiece("queen", "white", 1, 5, true),
        makePiece("king", "white", 2, 6, true),
      ]);
      const gs = createGameStateFromBoard(board, "black");
      expect(isStalemate(gs)).toBe(true);
    });

    it("should not detect stalemate when king is in check", () => {
      // King in check with no moves = checkmate, not stalemate
      const board = createCustomBoard([
        makePiece("king", "black", 7, 7),
        makePiece("rook", "white", 0, 7, true),
        makePiece("pawn", "black", 6, 6),
        makePiece("pawn", "black", 7, 6),
        makePiece("king", "white", 0, 0),
      ]);
      const gs = createGameStateFromBoard(board, "black");
      expect(isStalemate(gs)).toBe(false);
    });

    it("should not detect stalemate when moves are available", () => {
      const board = createCustomBoard([
        makePiece("king", "white", 4, 0),
        makePiece("king", "black", 4, 7),
      ]);
      const gs = createGameStateFromBoard(board, "white");
      expect(isStalemate(gs)).toBe(false);
    });
  });

  describe("isDraw", () => {
    it("should detect K vs K as draw", () => {
      const board = createCustomBoard([
        makePiece("king", "white", 4, 0),
        makePiece("king", "black", 4, 7),
      ]);
      const gs = createGameStateFromBoard(board);
      expect(isDraw(gs)).toBe(true);
    });

    it("should detect K+B vs K as draw", () => {
      const board = createCustomBoard([
        makePiece("king", "white", 4, 0),
        makePiece("bishop", "white", 2, 0),
        makePiece("king", "black", 4, 7),
      ]);
      const gs = createGameStateFromBoard(board);
      expect(isDraw(gs)).toBe(true);
    });

    it("should detect K+N vs K as draw", () => {
      const board = createCustomBoard([
        makePiece("king", "white", 4, 0),
        makePiece("knight", "white", 1, 0),
        makePiece("king", "black", 4, 7),
      ]);
      const gs = createGameStateFromBoard(board);
      expect(isDraw(gs)).toBe(true);
    });

    it("should detect K vs K+B as draw", () => {
      const board = createCustomBoard([
        makePiece("king", "white", 4, 0),
        makePiece("king", "black", 4, 7),
        makePiece("bishop", "black", 5, 7),
      ]);
      const gs = createGameStateFromBoard(board);
      expect(isDraw(gs)).toBe(true);
    });

    it("should detect K vs K+N as draw", () => {
      const board = createCustomBoard([
        makePiece("king", "white", 4, 0),
        makePiece("king", "black", 4, 7),
        makePiece("knight", "black", 6, 7),
      ]);
      const gs = createGameStateFromBoard(board);
      expect(isDraw(gs)).toBe(true);
    });

    it("should NOT detect K+Q vs K as draw", () => {
      const board = createCustomBoard([
        makePiece("king", "white", 4, 0),
        makePiece("queen", "white", 3, 0),
        makePiece("king", "black", 4, 7),
      ]);
      const gs = createGameStateFromBoard(board);
      expect(isDraw(gs)).toBe(false);
    });

    it("should NOT detect full board as draw", () => {
      const board = createInitialBoard(0, 0);
      const gs = createGameStateFromBoard(board);
      expect(isDraw(gs)).toBe(false);
    });
  });
});
