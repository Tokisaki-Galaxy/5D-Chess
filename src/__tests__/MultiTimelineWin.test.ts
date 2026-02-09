import { describe, it, expect } from "vitest";
import type { Piece, PieceColor, PieceType } from "../types/game.types";
import type { Board, Timeline } from "../types/timeline.types";
import type { GameState } from "../game/engine/GameState";
import {
  isCheckmate,
  isStalemate,
  isDraw,
} from "../game/engine/WinCondition";

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

function createBoard(pieces: Piece[]): Board {
  return { pieces, turn: 0, timeline: 0 };
}

function createMultiTimelineGameState(
  boards: { tlId: number; pieces: Piece[] }[],
  currentPlayer: PieceColor = "white",
): GameState {
  const timelines = new Map<number, Timeline>();
  for (const b of boards) {
    timelines.set(b.tlId, {
      id: b.tlId,
      parentTimeline: b.tlId === 0 ? null : 0,
      branchTurn: 0,
      boards: new Map([[0, createBoard(b.pieces)]]),
      isActive: true,
    });
  }
  return {
    timelines,
    currentTimeline: 0,
    currentTurn: 0,
    currentPlayer,
    moveHistory: [],
    gameStatus: "playing",
  };
}

describe("Multi-Timeline WinCondition", () => {
  describe("isCheckmate - multi-timeline", () => {
    it("should detect checkmate on the first timeline with checkmate", () => {
      const gs = createMultiTimelineGameState([
        {
          tlId: 0,
          pieces: [
            makePiece("king", "black", 7, 7),
            makePiece("rook", "white", 0, 7, true),
            makePiece("pawn", "black", 6, 6),
            makePiece("pawn", "black", 7, 6),
            makePiece("king", "white", 0, 0),
          ],
        },
        {
          tlId: 1,
          pieces: [
            makePiece("king", "black", 4, 7),
            makePiece("king", "white", 4, 0),
          ],
        },
      ], "black");
      // Black is checkmated on timeline 0
      expect(isCheckmate("black", gs)).toBe(true);
    });

    it("should not detect checkmate if no timeline has it", () => {
      const gs = createMultiTimelineGameState([
        {
          tlId: 0,
          pieces: [
            makePiece("king", "black", 4, 7),
            makePiece("king", "white", 4, 0),
          ],
        },
        {
          tlId: 1,
          pieces: [
            makePiece("king", "black", 4, 7),
            makePiece("king", "white", 4, 0),
            makePiece("rook", "white", 0, 0, true),
          ],
        },
      ], "black");
      expect(isCheckmate("black", gs)).toBe(false);
    });
  });

  describe("isStalemate - multi-timeline", () => {
    it("should detect stalemate on any active timeline", () => {
      const gs = createMultiTimelineGameState([
        {
          tlId: 0,
          pieces: [
            makePiece("king", "black", 0, 7),
            makePiece("queen", "white", 1, 5, true),
            makePiece("king", "white", 2, 6, true),
          ],
        },
        {
          tlId: 1,
          pieces: [
            makePiece("king", "black", 4, 7),
            makePiece("king", "white", 4, 0),
          ],
        },
      ], "black");
      // Timeline 0 has stalemate for black
      expect(isStalemate(gs)).toBe(true);
    });

    it("should not detect stalemate if all timelines have moves available", () => {
      const gs = createMultiTimelineGameState([
        {
          tlId: 0,
          pieces: [
            makePiece("king", "black", 4, 7),
            makePiece("king", "white", 4, 0),
          ],
        },
      ], "black");
      expect(isStalemate(gs)).toBe(false);
    });
  });

  describe("isDraw - multi-timeline", () => {
    it("should detect draw when all timelines have insufficient material", () => {
      const gs = createMultiTimelineGameState([
        {
          tlId: 0,
          pieces: [
            makePiece("king", "white", 4, 0),
            makePiece("king", "black", 4, 7),
          ],
        },
        {
          tlId: 1,
          pieces: [
            makePiece("king", "white", 3, 0),
            makePiece("bishop", "white", 2, 0),
            makePiece("king", "black", 3, 7),
          ],
        },
      ]);
      expect(isDraw(gs)).toBe(true);
    });

    it("should not detect draw when any timeline has sufficient material", () => {
      const gs = createMultiTimelineGameState([
        {
          tlId: 0,
          pieces: [
            makePiece("king", "white", 4, 0),
            makePiece("king", "black", 4, 7),
          ],
        },
        {
          tlId: 1,
          pieces: [
            makePiece("king", "white", 3, 0),
            makePiece("queen", "white", 2, 0),
            makePiece("king", "black", 3, 7),
          ],
        },
      ]);
      // Timeline 1 has sufficient material (queen)
      expect(isDraw(gs)).toBe(false);
    });
  });
});
