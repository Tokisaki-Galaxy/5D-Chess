import { describe, it, expect } from "vitest";
import type { Piece, PieceColor, PieceType, Move } from "../types/game.types";
import type { Board } from "../types/timeline.types";
import {
  isPromotionMove,
  getLegalMoves,
  isValidSpatialMove,
} from "../game/engine/MoveValidator";

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

function createCustomBoard(pieces: Piece[], lastMove?: Move): Board {
  return { pieces, turn: 0, timeline: 0, lastMove };
}

describe("MoveValidator Advanced", () => {
  describe("isPromotionMove", () => {
    it("should detect white pawn on y=6 moving to y=7 as promotion", () => {
      const pawn = makePiece("pawn", "white", 3, 6, true);
      expect(isPromotionMove(pawn, 7)).toBe(true);
    });

    it("should detect black pawn on y=1 moving to y=0 as promotion", () => {
      const pawn = makePiece("pawn", "black", 3, 1, true);
      expect(isPromotionMove(pawn, 0)).toBe(true);
    });

    it("should not detect non-pawn piece as promotion", () => {
      const rook = makePiece("rook", "white", 3, 6, true);
      expect(isPromotionMove(rook, 7)).toBe(false);
    });

    it("should not detect pawn not reaching last rank as promotion", () => {
      const pawn = makePiece("pawn", "white", 3, 4, true);
      expect(isPromotionMove(pawn, 5)).toBe(false);
    });

    it("should not detect white pawn moving to y=0 as promotion", () => {
      const pawn = makePiece("pawn", "white", 3, 1);
      expect(isPromotionMove(pawn, 0)).toBe(false);
    });

    it("should not detect black pawn moving to y=7 as promotion", () => {
      const pawn = makePiece("pawn", "black", 3, 6);
      expect(isPromotionMove(pawn, 7)).toBe(false);
    });
  });

  describe("En Passant", () => {
    it("should allow valid en passant capture", () => {
      // White pawn on e5, black pawn just double-advanced to d5
      const whitePawn = makePiece("pawn", "white", 4, 4, true);
      const blackPawn = makePiece("pawn", "black", 3, 4, true);
      const lastMove: Move = {
        id: "last",
        piece: blackPawn,
        from: { x: 3, y: 6, timeline: 0, turn: 0 },
        to: { x: 3, y: 4, timeline: 0, turn: 0 },
        timestamp: Date.now(),
      };
      const board = createCustomBoard(
        [
          whitePawn,
          blackPawn,
          makePiece("king", "white", 4, 0),
          makePiece("king", "black", 4, 7),
        ],
        lastMove,
      );
      // White pawn captures en passant at d6
      expect(
        isValidSpatialMove(
          whitePawn,
          { x: 3, y: 5, timeline: 0, turn: 0 },
          board,
        ),
      ).toBe(true);
    });

    it("should not allow en passant if last move was not a double pawn push", () => {
      const whitePawn = makePiece("pawn", "white", 4, 4, true);
      const blackPawn = makePiece("pawn", "black", 3, 4, true);
      // Last move was a single pawn advance
      const lastMove: Move = {
        id: "last",
        piece: blackPawn,
        from: { x: 3, y: 5, timeline: 0, turn: 0 },
        to: { x: 3, y: 4, timeline: 0, turn: 0 },
        timestamp: Date.now(),
      };
      const board = createCustomBoard(
        [
          whitePawn,
          blackPawn,
          makePiece("king", "white", 4, 0),
          makePiece("king", "black", 4, 7),
        ],
        lastMove,
      );
      expect(
        isValidSpatialMove(
          whitePawn,
          { x: 3, y: 5, timeline: 0, turn: 0 },
          board,
        ),
      ).toBe(false);
    });

    it("should not allow en passant on wrong file", () => {
      const whitePawn = makePiece("pawn", "white", 4, 4, true);
      const blackPawn = makePiece("pawn", "black", 2, 4, true);
      // Black pawn double-advanced but on a different file (c-file, not adjacent)
      const lastMove: Move = {
        id: "last",
        piece: blackPawn,
        from: { x: 2, y: 6, timeline: 0, turn: 0 },
        to: { x: 2, y: 4, timeline: 0, turn: 0 },
        timestamp: Date.now(),
      };
      const board = createCustomBoard(
        [
          whitePawn,
          blackPawn,
          makePiece("king", "white", 4, 0),
          makePiece("king", "black", 4, 7),
        ],
        lastMove,
      );
      // Trying en passant on wrong file
      expect(
        isValidSpatialMove(
          whitePawn,
          { x: 2, y: 5, timeline: 0, turn: 0 },
          board,
        ),
      ).toBe(false);
    });

    it("should not allow en passant when no last move exists", () => {
      const whitePawn = makePiece("pawn", "white", 4, 4, true);
      const blackPawn = makePiece("pawn", "black", 3, 4, true);
      // No last move
      const board = createCustomBoard([
        whitePawn,
        blackPawn,
        makePiece("king", "white", 4, 0),
        makePiece("king", "black", 4, 7),
      ]);
      expect(
        isValidSpatialMove(
          whitePawn,
          { x: 3, y: 5, timeline: 0, turn: 0 },
          board,
        ),
      ).toBe(false);
    });
  });

  describe("Castling", () => {
    it("should allow valid kingside castling", () => {
      // King and rook unmoved, path clear
      const board = createCustomBoard([
        makePiece("king", "white", 4, 0),
        makePiece("rook", "white", 7, 0),
        makePiece("king", "black", 4, 7),
      ]);
      const king = board.pieces.find(
        (p) => p.type === "king" && p.color === "white",
      )!;
      expect(
        isValidSpatialMove(
          king,
          { x: 6, y: 0, timeline: 0, turn: 0 },
          board,
        ),
      ).toBe(true);
    });

    it("should allow valid queenside castling", () => {
      const board = createCustomBoard([
        makePiece("king", "white", 4, 0),
        makePiece("rook", "white", 0, 0),
        makePiece("king", "black", 4, 7),
      ]);
      const king = board.pieces.find(
        (p) => p.type === "king" && p.color === "white",
      )!;
      expect(
        isValidSpatialMove(
          king,
          { x: 2, y: 0, timeline: 0, turn: 0 },
          board,
        ),
      ).toBe(true);
    });

    it("should not allow castling if king has moved", () => {
      const board = createCustomBoard([
        makePiece("king", "white", 4, 0, true),
        makePiece("rook", "white", 7, 0),
        makePiece("king", "black", 4, 7),
      ]);
      const king = board.pieces.find(
        (p) => p.type === "king" && p.color === "white",
      )!;
      expect(
        isValidSpatialMove(
          king,
          { x: 6, y: 0, timeline: 0, turn: 0 },
          board,
        ),
      ).toBe(false);
    });

    it("should not allow castling if rook has moved", () => {
      const board = createCustomBoard([
        makePiece("king", "white", 4, 0),
        makePiece("rook", "white", 7, 0, true),
        makePiece("king", "black", 4, 7),
      ]);
      const king = board.pieces.find(
        (p) => p.type === "king" && p.color === "white",
      )!;
      expect(
        isValidSpatialMove(
          king,
          { x: 6, y: 0, timeline: 0, turn: 0 },
          board,
        ),
      ).toBe(false);
    });

    it("should not allow castling if path is blocked", () => {
      const board = createCustomBoard([
        makePiece("king", "white", 4, 0),
        makePiece("bishop", "white", 5, 0),
        makePiece("rook", "white", 7, 0),
        makePiece("king", "black", 4, 7),
      ]);
      const king = board.pieces.find(
        (p) => p.type === "king" && p.color === "white",
      )!;
      expect(
        isValidSpatialMove(
          king,
          { x: 6, y: 0, timeline: 0, turn: 0 },
          board,
        ),
      ).toBe(false);
    });

    it("should not allow castling while in check", () => {
      const board = createCustomBoard([
        makePiece("king", "white", 4, 0),
        makePiece("rook", "white", 7, 0),
        makePiece("rook", "black", 4, 5, true),
        makePiece("king", "black", 7, 7),
      ]);
      const king = board.pieces.find(
        (p) => p.type === "king" && p.color === "white",
      )!;
      expect(
        isValidSpatialMove(
          king,
          { x: 6, y: 0, timeline: 0, turn: 0 },
          board,
        ),
      ).toBe(false);
    });
  });

  describe("Check-aware getLegalMoves", () => {
    it("should not allow king to move into check", () => {
      const board = createCustomBoard([
        makePiece("king", "white", 4, 0),
        makePiece("rook", "black", 5, 7, true),
        makePiece("king", "black", 7, 7),
      ]);
      const king = board.pieces.find(
        (p) => p.type === "king" && p.color === "white",
      )!;
      const moves = getLegalMoves(king, board);
      // King should not be able to move to x=5 (rook file)
      const movesToFile5 = moves.filter((m) => m.x === 5);
      expect(movesToFile5.length).toBe(0);
    });

    it("should limit pinned piece moves", () => {
      // White rook is pinned to its king by a black rook
      const board = createCustomBoard([
        makePiece("king", "white", 4, 0),
        makePiece("rook", "white", 4, 3, true),
        makePiece("rook", "black", 4, 7, true),
        makePiece("king", "black", 0, 7),
      ]);
      const pinnedRook = board.pieces.find(
        (p) => p.type === "rook" && p.color === "white",
      )!;
      const moves = getLegalMoves(pinnedRook, board);
      // Pinned rook can only move along the pin line (x=4)
      const offFileMoves = moves.filter((m) => m.x !== 4);
      expect(offFileMoves.length).toBe(0);
      // But it should still be able to move along the file
      expect(moves.length).toBeGreaterThan(0);
    });

    it("should have zero legal moves for fully pinned piece that cannot move along pin line", () => {
      // White knight is pinned - knights can never move along pin lines
      const board = createCustomBoard([
        makePiece("king", "white", 4, 0),
        makePiece("knight", "white", 4, 2),
        makePiece("rook", "black", 4, 7, true),
        makePiece("king", "black", 0, 7),
      ]);
      const pinnedKnight = board.pieces.find(
        (p) => p.type === "knight" && p.color === "white",
      )!;
      const moves = getLegalMoves(pinnedKnight, board);
      expect(moves.length).toBe(0);
    });
  });
});
