import { describe, it, expect } from "vitest";
import type { Piece, PieceColor, PieceType } from "../types/game.types";
import type { Board, Timeline } from "../types/timeline.types";
import type { GameState } from "../game/engine/GameState";
import {
  isValidTimeTravel,
  getTimeTravelMoves,
} from "../game/engine/MoveValidator";

function makePiece(
  type: PieceType,
  color: PieceColor,
  x: number,
  y: number,
  timeline = 0,
  turn = 0,
): Piece {
  return {
    id: `${color}-${type}-${x}-${y}-${timeline}-${turn}`,
    type,
    color,
    position: { x, y, timeline, turn },
    hasMoved: true,
  };
}

function createBoard(pieces: Piece[], turn = 0, timeline = 0): Board {
  return { pieces, turn, timeline };
}

function createMultiTimelineGameState(
  boards: { tlId: number; turn: number; pieces: Piece[]; parentTl?: number | null }[],
  currentPlayer: PieceColor = "white",
  currentTimeline = 0,
  currentTurn = 0,
): GameState {
  const timelines = new Map<number, Timeline>();
  for (const b of boards) {
    const board = createBoard(b.pieces, b.turn, b.tlId);
    const existing = timelines.get(b.tlId);
    if (existing) {
      existing.boards.set(b.turn, board);
    } else {
      timelines.set(b.tlId, {
        id: b.tlId,
        parentTimeline: b.parentTl ?? null,
        branchTurn: b.turn,
        boards: new Map([[b.turn, board]]),
        isActive: true,
      });
    }
  }
  return {
    timelines,
    currentTimeline,
    currentTurn,
    currentPlayer,
    moveHistory: [],
    gameStatus: "playing",
  };
}

describe("Time Travel Validation", () => {
  describe("isValidTimeTravel - Rook", () => {
    it("should allow rook to move along time axis only", () => {
      const rook = makePiece("rook", "white", 3, 3, 0, 0);
      const gs = createMultiTimelineGameState([
        { tlId: 0, turn: 0, pieces: [rook, makePiece("king", "white", 4, 0), makePiece("king", "black", 4, 7)] },
        { tlId: 0, turn: 1, pieces: [makePiece("king", "white", 4, 0, 0, 1), makePiece("king", "black", 4, 7, 0, 1)] },
        { tlId: 0, turn: 2, pieces: [makePiece("king", "white", 4, 0, 0, 2), makePiece("king", "black", 4, 7, 0, 2)] },
      ]);
      // Rook moves from (3,3,L0,T0) -> (3,3,L0,T2): pure time axis move
      expect(isValidTimeTravel(rook, { x: 3, y: 3, timeline: 0, turn: 2 }, gs)).toBe(true);
    });

    it("should allow rook to move along timeline axis only", () => {
      const rook = makePiece("rook", "white", 3, 3, 0, 0);
      const gs = createMultiTimelineGameState([
        { tlId: 0, turn: 0, pieces: [rook, makePiece("king", "white", 4, 0), makePiece("king", "black", 4, 7)] },
        { tlId: 1, turn: 0, pieces: [makePiece("king", "white", 4, 0, 1, 0), makePiece("king", "black", 4, 7, 1, 0)], parentTl: 0 },
      ]);
      // Rook moves from (3,3,L0,T0) -> (3,3,L1,T0): pure timeline axis move
      expect(isValidTimeTravel(rook, { x: 3, y: 3, timeline: 1, turn: 0 }, gs)).toBe(true);
    });

    it("should not allow rook to move diagonally across time dimensions", () => {
      const rook = makePiece("rook", "white", 3, 3, 0, 0);
      const gs = createMultiTimelineGameState([
        { tlId: 0, turn: 0, pieces: [rook, makePiece("king", "white", 4, 0), makePiece("king", "black", 4, 7)] },
        { tlId: 1, turn: 1, pieces: [makePiece("king", "white", 4, 0, 1, 1), makePiece("king", "black", 4, 7, 1, 1)], parentTl: 0 },
      ]);
      // Both timeline and turn change: not valid for rook
      expect(isValidTimeTravel(rook, { x: 3, y: 3, timeline: 1, turn: 1 }, gs)).toBe(false);
    });
  });

  describe("isValidTimeTravel - Bishop", () => {
    it("should allow bishop to move diagonally in time+timeline axes", () => {
      const bishop = makePiece("bishop", "white", 3, 3, 0, 0);
      const gs = createMultiTimelineGameState([
        { tlId: 0, turn: 0, pieces: [bishop, makePiece("king", "white", 4, 0), makePiece("king", "black", 4, 7)] },
        { tlId: 1, turn: 1, pieces: [makePiece("king", "white", 4, 0, 1, 1), makePiece("king", "black", 4, 7, 1, 1)], parentTl: 0 },
      ]);
      // Bishop moves from (3,3,L0,T0) -> (3,3,L1,T1): diagonal in tl+t
      expect(isValidTimeTravel(bishop, { x: 3, y: 3, timeline: 1, turn: 1 }, gs)).toBe(true);
    });

    it("should allow bishop to move diagonally in space+time axes", () => {
      const bishop = makePiece("bishop", "white", 3, 3, 0, 0);
      const gs = createMultiTimelineGameState([
        { tlId: 0, turn: 0, pieces: [bishop, makePiece("king", "white", 4, 0), makePiece("king", "black", 4, 7)] },
        { tlId: 0, turn: 2, pieces: [makePiece("king", "white", 4, 0, 0, 2), makePiece("king", "black", 4, 7, 0, 2)] },
      ]);
      // Bishop moves from (3,3,L0,T0) -> (5,3,L0,T2): dx=2, dt=2
      expect(isValidTimeTravel(bishop, { x: 5, y: 3, timeline: 0, turn: 2 }, gs)).toBe(true);
    });

    it("should not allow bishop to move along a single time axis", () => {
      const bishop = makePiece("bishop", "white", 3, 3, 0, 0);
      const gs = createMultiTimelineGameState([
        { tlId: 0, turn: 0, pieces: [bishop, makePiece("king", "white", 4, 0), makePiece("king", "black", 4, 7)] },
        { tlId: 0, turn: 2, pieces: [makePiece("king", "white", 4, 0, 0, 2), makePiece("king", "black", 4, 7, 0, 2)] },
      ]);
      // Pure time axis move (only dt changes): not valid for bishop
      expect(isValidTimeTravel(bishop, { x: 3, y: 3, timeline: 0, turn: 2 }, gs)).toBe(false);
    });
  });

  describe("isValidTimeTravel - Knight", () => {
    it("should allow knight L-shaped move across space and time", () => {
      const knight = makePiece("knight", "white", 3, 3, 0, 0);
      const gs = createMultiTimelineGameState([
        { tlId: 0, turn: 0, pieces: [knight, makePiece("king", "white", 4, 0), makePiece("king", "black", 4, 7)] },
        { tlId: 0, turn: 2, pieces: [makePiece("king", "white", 4, 0, 0, 2), makePiece("king", "black", 4, 7, 0, 2)] },
      ]);
      // Knight: dx=1, dt=2 (L-shape in x+t)
      expect(isValidTimeTravel(knight, { x: 4, y: 3, timeline: 0, turn: 2 }, gs)).toBe(true);
    });

    it("should allow knight L-shaped move across timeline and time", () => {
      const knight = makePiece("knight", "white", 3, 3, 0, 0);
      const gs = createMultiTimelineGameState([
        { tlId: 0, turn: 0, pieces: [knight, makePiece("king", "white", 4, 0), makePiece("king", "black", 4, 7)] },
        { tlId: 2, turn: 1, pieces: [makePiece("king", "white", 4, 0, 2, 1), makePiece("king", "black", 4, 7, 2, 1)], parentTl: 0 },
      ]);
      // Knight: dl=2, dt=1 (L-shape in l+t)
      expect(isValidTimeTravel(knight, { x: 3, y: 3, timeline: 2, turn: 1 }, gs)).toBe(true);
    });

    it("should not allow non-L-shaped time travel for knight", () => {
      const knight = makePiece("knight", "white", 3, 3, 0, 0);
      const gs = createMultiTimelineGameState([
        { tlId: 0, turn: 0, pieces: [knight, makePiece("king", "white", 4, 0), makePiece("king", "black", 4, 7)] },
        { tlId: 0, turn: 2, pieces: [makePiece("king", "white", 4, 0, 0, 2), makePiece("king", "black", 4, 7, 0, 2)] },
      ]);
      // dx=2, dt=2: not L-shaped
      expect(isValidTimeTravel(knight, { x: 5, y: 3, timeline: 0, turn: 2 }, gs)).toBe(false);
    });
  });

  describe("isValidTimeTravel - King", () => {
    it("should allow king to move one step across timelines", () => {
      const king = makePiece("king", "white", 4, 0, 0, 0);
      const gs = createMultiTimelineGameState([
        { tlId: 0, turn: 0, pieces: [king, makePiece("king", "black", 4, 7)] },
        { tlId: 1, turn: 0, pieces: [makePiece("king", "black", 4, 7, 1, 0)], parentTl: 0 },
      ]);
      // King moves 1 step in timeline axis
      expect(isValidTimeTravel(king, { x: 4, y: 0, timeline: 1, turn: 0 }, gs)).toBe(true);
    });

    it("should not allow king to move more than one step in time", () => {
      const king = makePiece("king", "white", 4, 0, 0, 0);
      const gs = createMultiTimelineGameState([
        { tlId: 0, turn: 0, pieces: [king, makePiece("king", "black", 4, 7)] },
        { tlId: 0, turn: 2, pieces: [makePiece("king", "black", 4, 7, 0, 2)] },
      ]);
      // dt=2: too far for king
      expect(isValidTimeTravel(king, { x: 4, y: 0, timeline: 0, turn: 2 }, gs)).toBe(false);
    });
  });

  describe("isValidTimeTravel - Pawn", () => {
    it("should allow pawn to move one step along timeline axis", () => {
      const pawn = makePiece("pawn", "white", 4, 4, 0, 0);
      const gs = createMultiTimelineGameState([
        { tlId: 0, turn: 0, pieces: [pawn, makePiece("king", "white", 4, 0), makePiece("king", "black", 4, 7)] },
        { tlId: 1, turn: 0, pieces: [makePiece("king", "white", 4, 0, 1, 0), makePiece("king", "black", 4, 7, 1, 0)], parentTl: 0 },
      ]);
      // Pawn moves to (4,4,L1,T0): same position, different timeline
      expect(isValidTimeTravel(pawn, { x: 4, y: 4, timeline: 1, turn: 0 }, gs)).toBe(true);
    });

    it("should not allow pawn to move to occupied square on timeline", () => {
      const pawn = makePiece("pawn", "white", 4, 4, 0, 0);
      const gs = createMultiTimelineGameState([
        { tlId: 0, turn: 0, pieces: [pawn, makePiece("king", "white", 4, 0), makePiece("king", "black", 4, 7)] },
        { tlId: 1, turn: 0, pieces: [makePiece("pawn", "black", 4, 4, 1, 0), makePiece("king", "white", 4, 0, 1, 0), makePiece("king", "black", 4, 7, 1, 0)], parentTl: 0 },
      ]);
      // Target position has an enemy piece (pawn can't capture going straight)
      expect(isValidTimeTravel(pawn, { x: 4, y: 4, timeline: 1, turn: 0 }, gs)).toBe(false);
    });

    it("should not allow pawn to move two time steps", () => {
      const pawn = makePiece("pawn", "white", 4, 4, 0, 0);
      const gs = createMultiTimelineGameState([
        { tlId: 0, turn: 0, pieces: [pawn, makePiece("king", "white", 4, 0), makePiece("king", "black", 4, 7)] },
        { tlId: 0, turn: 2, pieces: [makePiece("king", "white", 4, 0, 0, 2), makePiece("king", "black", 4, 7, 0, 2)] },
      ]);
      // dt=2: too far for pawn
      expect(isValidTimeTravel(pawn, { x: 4, y: 4, timeline: 0, turn: 2 }, gs)).toBe(false);
    });
  });

  describe("isValidTimeTravel - Queen", () => {
    it("should allow queen rook-like time travel (single axis)", () => {
      const queen = makePiece("queen", "white", 3, 3, 0, 0);
      const gs = createMultiTimelineGameState([
        { tlId: 0, turn: 0, pieces: [queen, makePiece("king", "white", 4, 0), makePiece("king", "black", 4, 7)] },
        { tlId: 0, turn: 3, pieces: [makePiece("king", "white", 4, 0, 0, 3), makePiece("king", "black", 4, 7, 0, 3)] },
      ]);
      // Pure time axis move
      expect(isValidTimeTravel(queen, { x: 3, y: 3, timeline: 0, turn: 3 }, gs)).toBe(true);
    });

    it("should allow queen bishop-like time travel (two axes diagonal)", () => {
      const queen = makePiece("queen", "white", 3, 3, 0, 0);
      const gs = createMultiTimelineGameState([
        { tlId: 0, turn: 0, pieces: [queen, makePiece("king", "white", 4, 0), makePiece("king", "black", 4, 7)] },
        { tlId: 2, turn: 2, pieces: [makePiece("king", "white", 4, 0, 2, 2), makePiece("king", "black", 4, 7, 2, 2)], parentTl: 0 },
      ]);
      // dl=2, dt=2: diagonal in tl+t
      expect(isValidTimeTravel(queen, { x: 3, y: 3, timeline: 2, turn: 2 }, gs)).toBe(true);
    });
  });

  describe("isValidTimeTravel - General", () => {
    it("should not allow moving to same position", () => {
      const rook = makePiece("rook", "white", 3, 3, 0, 0);
      const gs = createMultiTimelineGameState([
        { tlId: 0, turn: 0, pieces: [rook, makePiece("king", "white", 4, 0), makePiece("king", "black", 4, 7)] },
      ]);
      expect(isValidTimeTravel(rook, { x: 3, y: 3, timeline: 0, turn: 0 }, gs)).toBe(false);
    });

    it("should not allow capturing own piece via time travel", () => {
      const rook = makePiece("rook", "white", 3, 3, 0, 0);
      const gs = createMultiTimelineGameState([
        { tlId: 0, turn: 0, pieces: [rook, makePiece("king", "white", 4, 0), makePiece("king", "black", 4, 7)] },
        { tlId: 0, turn: 1, pieces: [makePiece("pawn", "white", 3, 3, 0, 1), makePiece("king", "white", 4, 0, 0, 1), makePiece("king", "black", 4, 7, 0, 1)] },
      ]);
      // Target position has a friendly pawn
      expect(isValidTimeTravel(rook, { x: 3, y: 3, timeline: 0, turn: 1 }, gs)).toBe(false);
    });

    it("should allow capturing enemy piece via time travel", () => {
      const rook = makePiece("rook", "white", 3, 3, 0, 0);
      const gs = createMultiTimelineGameState([
        { tlId: 0, turn: 0, pieces: [rook, makePiece("king", "white", 4, 0), makePiece("king", "black", 4, 7)] },
        { tlId: 0, turn: 1, pieces: [makePiece("pawn", "black", 3, 3, 0, 1), makePiece("king", "white", 4, 0, 0, 1), makePiece("king", "black", 4, 7, 0, 1)] },
      ]);
      // Target position has an enemy pawn -> can capture
      expect(isValidTimeTravel(rook, { x: 3, y: 3, timeline: 0, turn: 1 }, gs)).toBe(true);
    });

    it("should not allow time travel to non-existent timeline", () => {
      const rook = makePiece("rook", "white", 3, 3, 0, 0);
      const gs = createMultiTimelineGameState([
        { tlId: 0, turn: 0, pieces: [rook, makePiece("king", "white", 4, 0), makePiece("king", "black", 4, 7)] },
      ]);
      expect(isValidTimeTravel(rook, { x: 3, y: 3, timeline: 5, turn: 0 }, gs)).toBe(false);
    });

    it("should not allow time travel to non-existent turn", () => {
      const rook = makePiece("rook", "white", 3, 3, 0, 0);
      const gs = createMultiTimelineGameState([
        { tlId: 0, turn: 0, pieces: [rook, makePiece("king", "white", 4, 0), makePiece("king", "black", 4, 7)] },
      ]);
      expect(isValidTimeTravel(rook, { x: 3, y: 3, timeline: 0, turn: 5 }, gs)).toBe(false);
    });
  });

  describe("getTimeTravelMoves", () => {
    it("should return time travel moves for a rook with multiple timelines", () => {
      const rook = makePiece("rook", "white", 3, 3, 0, 0);
      const gs = createMultiTimelineGameState([
        { tlId: 0, turn: 0, pieces: [rook, makePiece("king", "white", 4, 0), makePiece("king", "black", 4, 7)] },
        { tlId: 1, turn: 0, pieces: [makePiece("king", "white", 4, 0, 1, 0), makePiece("king", "black", 4, 7, 1, 0)], parentTl: 0 },
      ]);
      const moves = getTimeTravelMoves(rook, gs);
      expect(moves.length).toBeGreaterThan(0);
      // All moves should be on timeline 1 (since only L1 is a different TL)
      const tlMoves = moves.filter(m => m.timeline === 1);
      expect(tlMoves.length).toBeGreaterThan(0);
    });

    it("should return empty for pawn with no adjacent timelines or turns", () => {
      const pawn = makePiece("pawn", "white", 4, 4, 0, 0);
      const gs = createMultiTimelineGameState([
        { tlId: 0, turn: 0, pieces: [pawn, makePiece("king", "white", 4, 0), makePiece("king", "black", 4, 7)] },
      ]);
      const moves = getTimeTravelMoves(pawn, gs);
      expect(moves.length).toBe(0); // Only one board, no other time to travel to
    });

    it("should not include same-timeline same-turn moves", () => {
      const rook = makePiece("rook", "white", 3, 3, 0, 0);
      const gs = createMultiTimelineGameState([
        { tlId: 0, turn: 0, pieces: [rook, makePiece("king", "white", 4, 0), makePiece("king", "black", 4, 7)] },
        { tlId: 0, turn: 1, pieces: [makePiece("king", "white", 4, 0, 0, 1), makePiece("king", "black", 4, 7, 0, 1)] },
      ]);
      const moves = getTimeTravelMoves(rook, gs);
      const sameTimeMoves = moves.filter(
        m => m.timeline === 0 && m.turn === 0,
      );
      expect(sameTimeMoves.length).toBe(0);
    });
  });
});
