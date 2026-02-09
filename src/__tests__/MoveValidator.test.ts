import { describe, it, expect } from "vitest";
import {
  isInBounds,
  isValidSpatialMove,
  getLegalMoves,
} from "../game/engine/MoveValidator";
import { createInitialBoard, getPieceAt } from "../game/engine/GameState";

describe("MoveValidator", () => {
  describe("isInBounds", () => {
    it("should return true for valid coordinates", () => {
      expect(isInBounds(0, 0)).toBe(true);
      expect(isInBounds(7, 7)).toBe(true);
      expect(isInBounds(3, 4)).toBe(true);
    });

    it("should return false for out-of-bounds coordinates", () => {
      expect(isInBounds(-1, 0)).toBe(false);
      expect(isInBounds(0, 8)).toBe(false);
      expect(isInBounds(8, 0)).toBe(false);
    });
  });

  describe("isValidSpatialMove - Pawn", () => {
    it("should allow white pawn to move forward one square", () => {
      const board = createInitialBoard(0, 0);
      const pawn = getPieceAt(board, 4, 1)!;
      expect(
        isValidSpatialMove(pawn, { x: 4, y: 2, timeline: 0, turn: 0 }, board),
      ).toBe(true);
    });

    it("should allow white pawn to move forward two squares from start", () => {
      const board = createInitialBoard(0, 0);
      const pawn = getPieceAt(board, 4, 1)!;
      expect(
        isValidSpatialMove(pawn, { x: 4, y: 3, timeline: 0, turn: 0 }, board),
      ).toBe(true);
    });

    it("should not allow white pawn to move backward", () => {
      const board = createInitialBoard(0, 0);
      const pawn = getPieceAt(board, 4, 1)!;
      expect(
        isValidSpatialMove(pawn, { x: 4, y: 0, timeline: 0, turn: 0 }, board),
      ).toBe(false);
    });
  });

  describe("isValidSpatialMove - Knight", () => {
    it("should allow L-shaped moves", () => {
      const board = createInitialBoard(0, 0);
      const knight = getPieceAt(board, 1, 0)!;
      expect(
        isValidSpatialMove(knight, { x: 2, y: 2, timeline: 0, turn: 0 }, board),
      ).toBe(true);
      expect(
        isValidSpatialMove(knight, { x: 0, y: 2, timeline: 0, turn: 0 }, board),
      ).toBe(true);
    });

    it("should not allow non-L-shaped moves", () => {
      const board = createInitialBoard(0, 0);
      const knight = getPieceAt(board, 1, 0)!;
      expect(
        isValidSpatialMove(knight, { x: 1, y: 2, timeline: 0, turn: 0 }, board),
      ).toBe(false);
    });
  });

  describe("getLegalMoves", () => {
    it("should return legal moves for a pawn at starting position", () => {
      const board = createInitialBoard(0, 0);
      const pawn = getPieceAt(board, 4, 1)!;
      const moves = getLegalMoves(pawn, board);
      expect(moves.length).toBe(2); // one and two squares forward
    });

    it("should return legal moves for a knight at starting position", () => {
      const board = createInitialBoard(0, 0);
      const knight = getPieceAt(board, 1, 0)!;
      const moves = getLegalMoves(knight, board);
      expect(moves.length).toBe(2); // only 2 squares reachable from b1
    });
  });
});
