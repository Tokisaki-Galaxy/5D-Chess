import { create } from "zustand";
import type { PieceColor, GameMode, AIDifficulty, Move, Piece } from "../types/game.types";
import type { Board } from "../types/timeline.types";
import {
  createInitialGameState,
  getPieceAt,
  type GameState,
} from "../game/engine/GameState";
import { getLegalMoves } from "../game/engine/MoveValidator";
import type { Position5D } from "../types/game.types";

interface GameStore {
  // 游戏状态
  gameState: GameState;
  gameMode: GameMode;
  aiDifficulty: AIDifficulty;

  // 交互状态
  selectedPiece: Piece | null;
  legalMoves: Position5D[];

  // 动作
  startGame: (mode: GameMode, difficulty?: AIDifficulty) => void;
  selectPiece: (x: number, y: number) => void;
  movePiece: (to: Position5D) => void;
  clearSelection: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: createInitialGameState(),
  gameMode: "local-pvp",
  aiDifficulty: "easy",
  selectedPiece: null,
  legalMoves: [],

  startGame: (mode, difficulty) => {
    set({
      gameState: createInitialGameState(),
      gameMode: mode,
      aiDifficulty: difficulty ?? "easy",
      selectedPiece: null,
      legalMoves: [],
    });
  },

  selectPiece: (x, y) => {
    const { gameState } = get();
    const timeline = gameState.timelines.get(gameState.currentTimeline);
    if (!timeline) return;
    const board = timeline.boards.get(gameState.currentTurn);
    if (!board) return;

    const piece = getPieceAt(board, x, y);
    if (!piece || piece.color !== gameState.currentPlayer) {
      set({ selectedPiece: null, legalMoves: [] });
      return;
    }

    const moves = getLegalMoves(piece, board);
    set({ selectedPiece: piece, legalMoves: moves });
  },

  movePiece: (to) => {
    const { gameState, selectedPiece } = get();
    if (!selectedPiece) return;

    const timeline = gameState.timelines.get(gameState.currentTimeline);
    if (!timeline) return;
    const board = timeline.boards.get(gameState.currentTurn);
    if (!board) return;

    // 执行移动
    const capturedPiece = getPieceAt(board, to.x, to.y);
    const move: Move = {
      id: `move-${Date.now()}`,
      piece: selectedPiece,
      from: selectedPiece.position,
      to,
      capturedPiece: capturedPiece ?? undefined,
      timestamp: Date.now(),
    };

    // 更新棋盘
    const newPieces = board.pieces
      .filter((p: Piece) => p.id !== selectedPiece.id && p.id !== capturedPiece?.id)
      .concat({
        ...selectedPiece,
        position: to,
        hasMoved: true,
      });

    const newBoard: Board = { ...board, pieces: newPieces };
    const newTimeline = {
      ...timeline,
      boards: new Map(timeline.boards).set(gameState.currentTurn, newBoard),
    };
    const nextPlayer: PieceColor =
      gameState.currentPlayer === "white" ? "black" : "white";

    const newTimelines = new Map(gameState.timelines).set(
      gameState.currentTimeline,
      newTimeline,
    );

    set({
      gameState: {
        ...gameState,
        timelines: newTimelines,
        currentPlayer: nextPlayer,
        moveHistory: [...gameState.moveHistory, move],
      },
      selectedPiece: null,
      legalMoves: [],
    });
  },

  clearSelection: () => {
    set({ selectedPiece: null, legalMoves: [] });
  },

  resetGame: () => {
    set({
      gameState: createInitialGameState(),
      selectedPiece: null,
      legalMoves: [],
    });
  },
}));
