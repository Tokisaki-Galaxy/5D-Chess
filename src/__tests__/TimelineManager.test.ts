import { describe, it, expect } from "vitest";
import {
  createTimeline,
  willCreateTimeline,
  getNextTimelineId,
  getLatestTurn,
  getActiveTimelines,
  getBoardAtTurn,
  placePieceOnBoard,
  checkParadox,
} from "../game/engine/TimelineManager";
import type { Piece, PieceColor, PieceType } from "../types/game.types";
import type { Board, Timeline } from "../types/timeline.types";

function makePiece(
  type: PieceType,
  color: PieceColor,
  x: number,
  y: number,
): Piece {
  return {
    id: `${color}-${type}-${x}-${y}`,
    type,
    color,
    position: { x, y, timeline: 0, turn: 0 },
    hasMoved: false,
  };
}

function createCustomBoard(pieces: Piece[], turn = 0, timeline = 0): Board {
  return { pieces, turn, timeline };
}

function makeTimeline(id: number, boards: Map<number, Board>, parentTimeline: number | null = null, branchTurn = 0): Timeline {
  return { id, parentTimeline, branchTurn, boards, isActive: true };
}

describe("TimelineManager", () => {
  describe("createTimeline", () => {
    it("should create a timeline with correct properties", () => {
      const board = createCustomBoard([makePiece("king", "white", 4, 0)]);
      const tl = createTimeline(0, 3, board, 1);
      expect(tl.id).toBe(1);
      expect(tl.parentTimeline).toBe(0);
      expect(tl.branchTurn).toBe(3);
      expect(tl.isActive).toBe(true);
      expect(tl.boards.get(3)).toBe(board);
    });
  });

  describe("willCreateTimeline", () => {
    it("should return true when target timeline does not exist", () => {
      const timelines = new Map<number, Timeline>();
      expect(willCreateTimeline(0, 0, timelines)).toBe(true);
    });

    it("should return true when moving to a past turn on existing timeline", () => {
      const board0 = createCustomBoard([makePiece("king", "white", 4, 0)], 0);
      const board1 = createCustomBoard([makePiece("king", "white", 4, 0)], 1);
      const tl = makeTimeline(0, new Map([[0, board0], [1, board1]]));
      const timelines = new Map([[0, tl]]);
      // Moving to turn 0 which already exists -> should create branch
      expect(willCreateTimeline(0, 0, timelines)).toBe(true);
    });

    it("should return true when target turn does not exist", () => {
      const board0 = createCustomBoard([makePiece("king", "white", 4, 0)], 0);
      const tl = makeTimeline(0, new Map([[0, board0]]));
      const timelines = new Map([[0, tl]]);
      expect(willCreateTimeline(0, 5, timelines)).toBe(true);
    });
  });

  describe("getNextTimelineId", () => {
    it("should return 1 for single initial timeline", () => {
      const board = createCustomBoard([]);
      const tl = makeTimeline(0, new Map([[0, board]]));
      const timelines = new Map([[0, tl]]);
      const nextId = getNextTimelineId(timelines);
      expect(Math.abs(nextId)).toBe(1);
    });

    it("should increment based on existing timelines", () => {
      const board = createCustomBoard([]);
      const tl0 = makeTimeline(0, new Map([[0, board]]));
      const tl1 = makeTimeline(1, new Map([[0, board]]), 0);
      const timelines = new Map([[0, tl0], [1, tl1]]);
      const nextId = getNextTimelineId(timelines);
      expect(Math.abs(nextId)).toBe(2);
    });
  });

  describe("getLatestTurn", () => {
    it("should return the highest turn number", () => {
      const board = createCustomBoard([]);
      const tl = makeTimeline(0, new Map([[0, board], [3, board], [1, board]]));
      expect(getLatestTurn(tl)).toBe(3);
    });

    it("should return branchTurn if no boards", () => {
      const tl: Timeline = { id: 0, parentTimeline: null, branchTurn: 5, boards: new Map(), isActive: true };
      expect(getLatestTurn(tl)).toBe(5);
    });
  });

  describe("getActiveTimelines", () => {
    it("should filter out inactive timelines", () => {
      const board = createCustomBoard([]);
      const tl0: Timeline = { id: 0, parentTimeline: null, branchTurn: 0, boards: new Map([[0, board]]), isActive: true };
      const tl1: Timeline = { id: 1, parentTimeline: 0, branchTurn: 0, boards: new Map([[0, board]]), isActive: false };
      const tl2: Timeline = { id: 2, parentTimeline: 0, branchTurn: 0, boards: new Map([[0, board]]), isActive: true };
      const timelines = new Map([[0, tl0], [1, tl1], [2, tl2]]);
      const active = getActiveTimelines(timelines);
      expect(active.length).toBe(2);
      expect(active.map(t => t.id).sort()).toEqual([0, 2]);
    });
  });

  describe("getBoardAtTurn", () => {
    it("should return exact board when turn exists", () => {
      const board0 = createCustomBoard([makePiece("king", "white", 4, 0)], 0);
      const board2 = createCustomBoard([makePiece("king", "white", 3, 0)], 2);
      const tl = makeTimeline(0, new Map([[0, board0], [2, board2]]));
      expect(getBoardAtTurn(tl, 0)).toBe(board0);
      expect(getBoardAtTurn(tl, 2)).toBe(board2);
    });

    it("should return closest board when turn does not exist", () => {
      const board0 = createCustomBoard([makePiece("king", "white", 4, 0)], 0);
      const board4 = createCustomBoard([makePiece("king", "white", 3, 0)], 4);
      const tl = makeTimeline(0, new Map([[0, board0], [4, board4]]));
      // Turn 1 is closer to 0 than 4
      expect(getBoardAtTurn(tl, 1)).toBe(board0);
      // Turn 3 is closer to 4 than 0
      expect(getBoardAtTurn(tl, 3)).toBe(board4);
    });
  });

  describe("placePieceOnBoard", () => {
    it("should add piece to board at specified position", () => {
      const existingPiece = makePiece("king", "white", 4, 0);
      const board = createCustomBoard([existingPiece]);
      const newPiece = makePiece("rook", "black", 0, 0);

      const newBoard = placePieceOnBoard(board, newPiece, 2, 3, 1, 0);
      expect(newBoard.pieces.length).toBe(2);
      const placed = newBoard.pieces.find(p => p.type === "rook");
      expect(placed).toBeDefined();
      expect(placed!.position.x).toBe(2);
      expect(placed!.position.y).toBe(3);
      expect(placed!.hasMoved).toBe(true);
    });

    it("should capture piece at target position", () => {
      const king = makePiece("king", "white", 4, 0);
      const target = makePiece("pawn", "black", 2, 3);
      const board = createCustomBoard([king, target]);
      const attacker = makePiece("rook", "white", 0, 0);

      const newBoard = placePieceOnBoard(board, attacker, 2, 3, 0, 0);
      // Target pawn should be replaced
      expect(newBoard.pieces.find(p => p.type === "pawn")).toBeUndefined();
      expect(newBoard.pieces.find(p => p.type === "rook")).toBeDefined();
    });
  });

  describe("checkParadox", () => {
    it("should return false for normal number of timelines", () => {
      const board = createCustomBoard([]);
      const timelines = new Map<number, Timeline>();
      for (let i = 0; i < 10; i++) {
        timelines.set(i, makeTimeline(i, new Map([[0, board]])));
      }
      expect(checkParadox(timelines)).toBe(false);
    });

    it("should return true when too many timelines exist", () => {
      const board = createCustomBoard([]);
      const timelines = new Map<number, Timeline>();
      for (let i = 0; i < 51; i++) {
        timelines.set(i, makeTimeline(i, new Map([[0, board]])));
      }
      expect(checkParadox(timelines)).toBe(true);
    });
  });
});
