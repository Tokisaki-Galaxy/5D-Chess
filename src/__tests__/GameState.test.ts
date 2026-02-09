import { describe, it, expect } from "vitest";
import {
  createInitialBoard,
  createInitialGameState,
  getPieceAt,
  getPiecesByColor,
  PIECE_SYMBOLS,
} from "../game/engine/GameState";

describe("GameState", () => {
  describe("createInitialBoard", () => {
    it("should create a board with 32 pieces", () => {
      const board = createInitialBoard(0, 0);
      expect(board.pieces.length).toBe(32);
    });

    it("should have 16 white pieces and 16 black pieces", () => {
      const board = createInitialBoard(0, 0);
      const white = board.pieces.filter((p) => p.color === "white");
      const black = board.pieces.filter((p) => p.color === "black");
      expect(white.length).toBe(16);
      expect(black.length).toBe(16);
    });

    it("should place kings at correct positions", () => {
      const board = createInitialBoard(0, 0);
      const whiteKing = board.pieces.find(
        (p) => p.type === "king" && p.color === "white",
      );
      const blackKing = board.pieces.find(
        (p) => p.type === "king" && p.color === "black",
      );
      expect(whiteKing?.position.x).toBe(4);
      expect(whiteKing?.position.y).toBe(0);
      expect(blackKing?.position.x).toBe(4);
      expect(blackKing?.position.y).toBe(7);
    });

    it("should place pawns on correct rows", () => {
      const board = createInitialBoard(0, 0);
      const whitePawns = board.pieces.filter(
        (p) => p.type === "pawn" && p.color === "white",
      );
      const blackPawns = board.pieces.filter(
        (p) => p.type === "pawn" && p.color === "black",
      );
      whitePawns.forEach((p) => expect(p.position.y).toBe(1));
      blackPawns.forEach((p) => expect(p.position.y).toBe(6));
    });
  });

  describe("createInitialGameState", () => {
    it("should start with white to move", () => {
      const state = createInitialGameState();
      expect(state.currentPlayer).toBe("white");
    });

    it("should have status playing", () => {
      const state = createInitialGameState();
      expect(state.gameStatus).toBe("playing");
    });

    it("should have one timeline", () => {
      const state = createInitialGameState();
      expect(state.timelines.size).toBe(1);
    });

    it("should have empty move history", () => {
      const state = createInitialGameState();
      expect(state.moveHistory.length).toBe(0);
    });
  });

  describe("getPieceAt", () => {
    it("should find a piece at a valid position", () => {
      const board = createInitialBoard(0, 0);
      const piece = getPieceAt(board, 0, 0);
      expect(piece).toBeDefined();
      expect(piece?.type).toBe("rook");
      expect(piece?.color).toBe("white");
    });

    it("should return undefined for empty squares", () => {
      const board = createInitialBoard(0, 0);
      const piece = getPieceAt(board, 3, 3);
      expect(piece).toBeUndefined();
    });
  });

  describe("getPiecesByColor", () => {
    it("should return 16 white pieces", () => {
      const board = createInitialBoard(0, 0);
      expect(getPiecesByColor(board, "white").length).toBe(16);
    });
  });

  describe("PIECE_SYMBOLS", () => {
    it("should have symbols for all piece types", () => {
      expect(PIECE_SYMBOLS.king.white).toBe("♔");
      expect(PIECE_SYMBOLS.king.black).toBe("♚");
      expect(PIECE_SYMBOLS.pawn.white).toBe("♙");
    });
  });
});
