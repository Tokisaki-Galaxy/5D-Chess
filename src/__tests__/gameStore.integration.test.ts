import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "../store/gameStore";

describe("gameStore integration", () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
  });

  describe("startGame", () => {
    it("should initialize a local PvP game with correct state", () => {
      useGameStore.getState().startGame("local-pvp");
      const state = useGameStore.getState();
      expect(state.gameMode).toBe("local-pvp");
      expect(state.gameState.currentPlayer).toBe("white");
      expect(state.gameState.gameStatus).toBe("playing");
      expect(state.gameState.moveHistory.length).toBe(0);
      expect(state.selectedPiece).toBeNull();
      expect(state.legalMoves.length).toBe(0);
      expect(state.pendingPromotion).toBeNull();
      expect(state.gameMessage).toBe("");
    });

    it("should initialize an AI game with correct mode and difficulty", () => {
      useGameStore.getState().startGame("local-ai", "hard");
      const state = useGameStore.getState();
      expect(state.gameMode).toBe("local-ai");
      expect(state.aiDifficulty).toBe("hard");
    });

    it("should default AI difficulty to easy if not provided", () => {
      useGameStore.getState().startGame("local-ai");
      const state = useGameStore.getState();
      expect(state.aiDifficulty).toBe("easy");
    });
  });

  describe("selectPiece", () => {
    it("should select a piece and set legal moves", () => {
      useGameStore.getState().startGame("local-pvp");
      // Select white pawn at e2 (x=4, y=1)
      useGameStore.getState().selectPiece(4, 1);
      const state = useGameStore.getState();
      expect(state.selectedPiece).not.toBeNull();
      expect(state.selectedPiece!.type).toBe("pawn");
      expect(state.selectedPiece!.color).toBe("white");
      expect(state.legalMoves.length).toBe(2); // e3, e4
    });

    it("should not select opponent's piece on wrong turn", () => {
      useGameStore.getState().startGame("local-pvp");
      // Try to select black pawn at e7 (x=4, y=6) when it's white's turn
      useGameStore.getState().selectPiece(4, 6);
      const state = useGameStore.getState();
      expect(state.selectedPiece).toBeNull();
      expect(state.legalMoves.length).toBe(0);
    });

    it("should clear selection when clicking empty square", () => {
      useGameStore.getState().startGame("local-pvp");
      useGameStore.getState().selectPiece(4, 1);
      // Click empty square
      useGameStore.getState().selectPiece(4, 4);
      const state = useGameStore.getState();
      expect(state.selectedPiece).toBeNull();
    });
  });

  describe("movePiece", () => {
    it("should move a piece and switch turns", () => {
      useGameStore.getState().startGame("local-pvp");
      // Select and move white pawn e2->e4
      useGameStore.getState().selectPiece(4, 1);
      useGameStore.getState().movePiece({
        x: 4,
        y: 3,
        timeline: 0,
        turn: 0,
      });
      const state = useGameStore.getState();
      expect(state.gameState.currentPlayer).toBe("black");
      expect(state.gameState.moveHistory.length).toBe(1);
      expect(state.selectedPiece).toBeNull();
      expect(state.legalMoves.length).toBe(0);
    });

    it("should update the board after a move", () => {
      useGameStore.getState().startGame("local-pvp");
      useGameStore.getState().selectPiece(4, 1);
      useGameStore.getState().movePiece({
        x: 4,
        y: 3,
        timeline: 0,
        turn: 0,
      });
      const state = useGameStore.getState();
      const board = state.gameState.timelines
        .get(0)!
        .boards.get(0)!;
      // Pawn should be at e4 now
      const pawnAtE4 = board.pieces.find(
        (p) => p.position.x === 4 && p.position.y === 3 && p.type === "pawn",
      );
      expect(pawnAtE4).toBeDefined();
      // No pawn at e2 anymore
      const pawnAtE2 = board.pieces.find(
        (p) => p.position.x === 4 && p.position.y === 1 && p.type === "pawn",
      );
      expect(pawnAtE2).toBeUndefined();
    });

    it("should keep game status as playing during normal moves", () => {
      useGameStore.getState().startGame("local-pvp");
      // e4
      useGameStore.getState().selectPiece(4, 1);
      useGameStore.getState().movePiece({
        x: 4,
        y: 3,
        timeline: 0,
        turn: 0,
      });
      expect(useGameStore.getState().gameState.gameStatus).toBe("playing");
      // e5
      useGameStore.getState().selectPiece(4, 6);
      useGameStore.getState().movePiece({
        x: 4,
        y: 4,
        timeline: 0,
        turn: 0,
      });
      expect(useGameStore.getState().gameState.gameStatus).toBe("playing");
    });

    it("should not move without selecting a piece first", () => {
      useGameStore.getState().startGame("local-pvp");
      const before = useGameStore.getState().gameState.moveHistory.length;
      useGameStore.getState().movePiece({
        x: 4,
        y: 3,
        timeline: 0,
        turn: 0,
      });
      expect(useGameStore.getState().gameState.moveHistory.length).toBe(before);
    });
  });

  describe("pawn promotion flow", () => {
    it("should set pendingPromotion when pawn reaches last rank", () => {
      useGameStore.getState().startGame("local-pvp");
      // Set up a board with a white pawn about to promote
      const gs = useGameStore.getState().gameState;
      const timeline = gs.timelines.get(0)!;
      const board = timeline.boards.get(0)!;

      const promotionBoard = {
        ...board,
        pieces: [
          {
            id: "white-pawn-promote",
            type: "pawn" as const,
            color: "white" as const,
            position: { x: 0, y: 6, timeline: 0, turn: 0 },
            hasMoved: true,
          },
          {
            id: "white-king",
            type: "king" as const,
            color: "white" as const,
            position: { x: 4, y: 0, timeline: 0, turn: 0 },
            hasMoved: false,
          },
          {
            id: "black-king",
            type: "king" as const,
            color: "black" as const,
            position: { x: 4, y: 7, timeline: 0, turn: 0 },
            hasMoved: false,
          },
        ],
      };

      const newTimeline = {
        ...timeline,
        boards: new Map([[0, promotionBoard]]),
      };
      useGameStore.setState({
        gameState: {
          ...gs,
          timelines: new Map([[0, newTimeline]]),
        },
      });

      // Select pawn and move to promotion rank
      useGameStore.getState().selectPiece(0, 6);
      useGameStore.getState().movePiece({
        x: 0,
        y: 7,
        timeline: 0,
        turn: 0,
      });

      const state = useGameStore.getState();
      expect(state.pendingPromotion).not.toBeNull();
      expect(state.pendingPromotion!.to.y).toBe(7);
    });

    it("should complete promotion with promotePawn", () => {
      useGameStore.getState().startGame("local-pvp");
      const gs = useGameStore.getState().gameState;
      const timeline = gs.timelines.get(0)!;
      const board = timeline.boards.get(0)!;

      const promotionBoard = {
        ...board,
        pieces: [
          {
            id: "white-pawn-promote",
            type: "pawn" as const,
            color: "white" as const,
            position: { x: 0, y: 6, timeline: 0, turn: 0 },
            hasMoved: true,
          },
          {
            id: "white-king",
            type: "king" as const,
            color: "white" as const,
            position: { x: 4, y: 0, timeline: 0, turn: 0 },
            hasMoved: false,
          },
          {
            id: "black-king",
            type: "king" as const,
            color: "black" as const,
            position: { x: 4, y: 7, timeline: 0, turn: 0 },
            hasMoved: false,
          },
        ],
      };

      const newTimeline = {
        ...timeline,
        boards: new Map([[0, promotionBoard]]),
      };
      useGameStore.setState({
        gameState: {
          ...gs,
          timelines: new Map([[0, newTimeline]]),
        },
      });

      useGameStore.getState().selectPiece(0, 6);
      useGameStore.getState().movePiece({
        x: 0,
        y: 7,
        timeline: 0,
        turn: 0,
      });

      // Now promote to queen
      useGameStore.getState().promotePawn("queen");

      const state = useGameStore.getState();
      expect(state.pendingPromotion).toBeNull();
      expect(state.gameState.currentPlayer).toBe("black");
      // Check the promoted piece is a queen
      const finalBoard = state.gameState.timelines.get(0)!.boards.get(0)!;
      const queen = finalBoard.pieces.find(
        (p) => p.position.x === 0 && p.position.y === 7 && p.color === "white",
      );
      expect(queen).toBeDefined();
      expect(queen!.type).toBe("queen");
    });
  });

  describe("resetGame", () => {
    it("should return to initial state", () => {
      useGameStore.getState().startGame("local-pvp");
      // Make a move first
      useGameStore.getState().selectPiece(4, 1);
      useGameStore.getState().movePiece({
        x: 4,
        y: 3,
        timeline: 0,
        turn: 0,
      });
      // Reset
      useGameStore.getState().resetGame();
      const state = useGameStore.getState();
      expect(state.gameState.currentPlayer).toBe("white");
      expect(state.gameState.moveHistory.length).toBe(0);
      expect(state.gameState.gameStatus).toBe("playing");
      expect(state.selectedPiece).toBeNull();
      expect(state.legalMoves.length).toBe(0);
      expect(state.pendingPromotion).toBeNull();
      expect(state.gameMessage).toBe("");
      // Board should have 32 pieces again
      const board = state.gameState.timelines.get(0)!.boards.get(0)!;
      expect(board.pieces.length).toBe(32);
    });
  });

  describe("clearSelection", () => {
    it("should clear selected piece and legal moves", () => {
      useGameStore.getState().startGame("local-pvp");
      useGameStore.getState().selectPiece(4, 1);
      expect(useGameStore.getState().selectedPiece).not.toBeNull();
      useGameStore.getState().clearSelection();
      const state = useGameStore.getState();
      expect(state.selectedPiece).toBeNull();
      expect(state.legalMoves.length).toBe(0);
    });
  });
});
