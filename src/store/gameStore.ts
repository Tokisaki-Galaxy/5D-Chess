import { create } from "zustand";
import type {
  PieceColor,
  PieceType,
  GameMode,
  AIDifficulty,
  Move,
  Piece,
} from "../types/game.types";
import type { Board, Timeline } from "../types/timeline.types";
import {
  createInitialGameState,
  getPieceAt,
  type GameState,
} from "../game/engine/GameState";
import { getLegalMoves, isPromotionMove, isValidTimeTravel } from "../game/engine/MoveValidator";
import {
  isKingInCheck,
  isCheckmate,
  isStalemate,
  isDraw,
} from "../game/engine/WinCondition";
import { getAIMove } from "../game/ai/ChessAI";
import type { Position5D } from "../types/game.types";
import {
  createTimeline,
  getNextTimelineId,
  placePieceOnBoard,
} from "../game/engine/TimelineManager";

interface GameStore {
  // 游戏状态
  gameState: GameState;
  gameMode: GameMode;
  aiDifficulty: AIDifficulty;

  // 交互状态
  selectedPiece: Piece | null;
  legalMoves: Position5D[];
  pendingPromotion: { piece: Piece; to: Position5D } | null;
  gameMessage: string;

  // 动作
  startGame: (mode: GameMode, difficulty?: AIDifficulty) => void;
  selectPiece: (x: number, y: number) => void;
  movePiece: (to: Position5D) => void;
  promotePawn: (choice: PieceType) => void;
  makeAIMove: () => void;
  clearSelection: () => void;
  resetGame: () => void;
  navigateTimeline: (timelineId: number, turn: number) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: createInitialGameState(),
  gameMode: "local-pvp",
  aiDifficulty: "easy",
  selectedPiece: null,
  legalMoves: [],
  pendingPromotion: null,
  gameMessage: "",

  startGame: (mode, difficulty) => {
    set({
      gameState: createInitialGameState(),
      gameMode: mode,
      aiDifficulty: difficulty ?? "easy",
      selectedPiece: null,
      legalMoves: [],
      pendingPromotion: null,
      gameMessage: "",
    });
  },

  selectPiece: (x, y) => {
    const { gameState, pendingPromotion } = get();
    if (pendingPromotion) return;
    if (gameState.gameStatus !== "playing") return;

    const timeline = gameState.timelines.get(gameState.currentTimeline);
    if (!timeline) return;
    const board = timeline.boards.get(gameState.currentTurn);
    if (!board) return;

    const piece = getPieceAt(board, x, y);
    if (!piece || piece.color !== gameState.currentPlayer) {
      set({ selectedPiece: null, legalMoves: [] });
      return;
    }

    const moves = getLegalMoves(piece, board, gameState);
    set({ selectedPiece: piece, legalMoves: moves });
  },

  movePiece: (to) => {
    const { gameState, selectedPiece } = get();
    if (!selectedPiece) return;
    if (gameState.gameStatus !== "playing") return;

    const timeline = gameState.timelines.get(gameState.currentTimeline);
    if (!timeline) return;
    const board = timeline.boards.get(gameState.currentTurn);
    if (!board) return;

    // 检查是否是时间旅行移动
    const isTimeTravelMove =
      to.timeline !== gameState.currentTimeline ||
      to.turn !== gameState.currentTurn;

    if (isTimeTravelMove) {
      // 验证时间旅行移动
      if (!isValidTimeTravel(selectedPiece, to, gameState)) return;
      executeTimeTravelMove(selectedPiece, to, board, timeline, gameState, set, get);
      return;
    }

    // 检查是否为升变
    if (isPromotionMove(selectedPiece, to.y)) {
      set({
        pendingPromotion: { piece: selectedPiece, to },
        selectedPiece: null,
        legalMoves: [],
      });
      return;
    }

    executeMove(selectedPiece, to, board, timeline, gameState, set, get);
  },

  promotePawn: (choice) => {
    const { pendingPromotion, gameState } = get();
    if (!pendingPromotion) return;

    const timeline = gameState.timelines.get(gameState.currentTimeline);
    if (!timeline) return;
    const board = timeline.boards.get(gameState.currentTurn);
    if (!board) return;

    const { piece, to } = pendingPromotion;
    set({ pendingPromotion: null });
    executeMove(piece, to, board, timeline, gameState, set, get, choice);
  },

  makeAIMove: () => {
    const { gameState, aiDifficulty, gameMode } = get();
    if (gameState.gameStatus !== "playing") return;
    if (gameMode !== "local-ai") return;

    const aiMove = getAIMove(gameState, aiDifficulty);
    if (!aiMove) return;

    const timeline = gameState.timelines.get(gameState.currentTimeline);
    if (!timeline) return;
    const board = timeline.boards.get(gameState.currentTurn);
    if (!board) return;

    executeMove(
      aiMove.piece,
      aiMove.to,
      board,
      timeline,
      gameState,
      set,
      get,
      aiMove.promotionChoice,
    );
  },

  clearSelection: () => {
    set({ selectedPiece: null, legalMoves: [] });
  },

  resetGame: () => {
    set({
      gameState: createInitialGameState(),
      selectedPiece: null,
      legalMoves: [],
      pendingPromotion: null,
      gameMessage: "",
    });
  },

  navigateTimeline: (timelineId, turn) => {
    const { gameState } = get();
    const timeline = gameState.timelines.get(timelineId);
    if (!timeline) return;
    if (!timeline.boards.has(turn)) return;

    set({
      gameState: {
        ...gameState,
        currentTimeline: timelineId,
        currentTurn: turn,
      },
      selectedPiece: null,
      legalMoves: [],
    });
  },
}));

/** 执行移动的通用逻辑 */
function executeMove(
  piece: Piece,
  to: Position5D,
  board: Board,
  timeline: Timeline,
  gameState: GameState,
  set: (state: Partial<GameStore>) => void,
  get: () => GameStore,
  promotionChoice?: PieceType,
) {
  let capturedPiece = getPieceAt(board, to.x, to.y) ?? undefined;

  // 吃过路兵
  let enPassantCaptureId: string | undefined;
  if (
    piece.type === "pawn" &&
    Math.abs(to.x - piece.position.x) === 1 &&
    !capturedPiece
  ) {
    const epPawn = getPieceAt(board, to.x, piece.position.y);
    if (epPawn && epPawn.color !== piece.color) {
      capturedPiece = epPawn;
      enPassantCaptureId = epPawn.id;
    }
  }

  const move: Move = {
    id: `move-${Date.now()}`,
    piece,
    from: piece.position,
    to,
    capturedPiece,
    timestamp: Date.now(),
    isPromotion: !!promotionChoice || undefined,
    promotionChoice,
  };

  // 更新棋盘
  let newPieces = board.pieces
    .filter(
      (p: Piece) =>
        p.id !== piece.id &&
        p.id !== capturedPiece?.id &&
        p.id !== enPassantCaptureId,
    )
    .concat({
      ...piece,
      type: promotionChoice ?? piece.type,
      position: to,
      hasMoved: true,
    });

  // 王车易位：移动车
  if (piece.type === "king" && Math.abs(to.x - piece.position.x) === 2) {
    const rookFromX = to.x > piece.position.x ? 7 : 0;
    const rookToX = to.x > piece.position.x ? to.x - 1 : to.x + 1;
    newPieces = newPieces.map((p: Piece) =>
      p.position.x === rookFromX &&
      p.position.y === piece.position.y &&
      p.type === "rook" &&
      p.color === piece.color
        ? { ...p, position: { ...p.position, x: rookToX }, hasMoved: true }
        : p,
    );
  }

  const newBoard: Board = { ...board, pieces: newPieces, lastMove: move };
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

  // 检测游戏状态
  const newGameState: GameState = {
    ...gameState,
    timelines: newTimelines,
    currentPlayer: nextPlayer,
    moveHistory: [...gameState.moveHistory, move],
  };

  let gameMessage = "";
  let gameStatus = gameState.gameStatus;
  let winner = gameState.winner;

  if (isCheckmate(nextPlayer, newGameState)) {
    gameStatus = "checkmate";
    winner = gameState.currentPlayer;
    gameMessage = `将死！${winner === "white" ? "白方" : "黑方"}获胜！`;
  } else if (isStalemate(newGameState)) {
    gameStatus = "stalemate";
    gameMessage = "和棋！（僵局）";
  } else if (isDraw(newGameState)) {
    gameStatus = "draw";
    gameMessage = "和棋！（材料不足）";
  } else if (isKingInCheck(nextPlayer, newBoard)) {
    gameMessage = "将军！";
  }

  newGameState.gameStatus = gameStatus;
  newGameState.winner = winner;

  set({
    gameState: newGameState,
    selectedPiece: null,
    legalMoves: [],
    gameMessage,
  });

  // AI自动走棋
  if (
    get().gameMode === "local-ai" &&
    nextPlayer === "black" &&
    gameStatus === "playing"
  ) {
    setTimeout(() => {
      get().makeAIMove();
    }, 400);
  }
}

/** 执行时间旅行移动 */
function executeTimeTravelMove(
  piece: Piece,
  to: Position5D,
  sourceBoard: Board,
  sourceTimeline: Timeline,
  gameState: GameState,
  set: (state: Partial<GameStore>) => void,
  get: () => GameStore,
) {
  const targetTimeline = gameState.timelines.get(to.timeline);
  if (!targetTimeline) return;
  const targetBoard = targetTimeline.boards.get(to.turn);
  if (!targetBoard) return;

  const capturedPiece = getPieceAt(targetBoard, to.x, to.y) || undefined;

  const move: Move = {
    id: `move-${Date.now()}`,
    piece,
    from: piece.position,
    to,
    capturedPiece,
    timestamp: Date.now(),
    createsTimeline: undefined,
  };

  // 从源棋盘移除该棋子
  const newSourcePieces = sourceBoard.pieces.filter(
    (p: Piece) => p.id !== piece.id,
  );
  const newSourceBoard: Board = { ...sourceBoard, pieces: newSourcePieces, lastMove: move };

  // 创建新时间线分支
  const nextId = getNextTimelineId(gameState.timelines);
  const newTargetBoard = placePieceOnBoard(
    targetBoard,
    piece,
    to.x,
    to.y,
    nextId,
    to.turn,
  );
  const newBranch = createTimeline(
    to.timeline,
    to.turn,
    newTargetBoard,
    nextId,
  );

  move.createsTimeline = nextId;

  // 更新时间线
  const newTimelines = new Map(gameState.timelines);
  // 更新源时间线
  const updatedSourceTimeline = {
    ...sourceTimeline,
    boards: new Map(sourceTimeline.boards).set(gameState.currentTurn, newSourceBoard),
  };
  newTimelines.set(gameState.currentTimeline, updatedSourceTimeline);
  // 添加新分支时间线
  newTimelines.set(nextId, newBranch);

  const nextPlayer: PieceColor =
    gameState.currentPlayer === "white" ? "black" : "white";

  const newGameState: GameState = {
    ...gameState,
    timelines: newTimelines,
    currentPlayer: nextPlayer,
    moveHistory: [...gameState.moveHistory, move],
  };

  let gameMessage = `时间旅行！创建新时间线 ${nextId}`;
  let gameStatus = gameState.gameStatus;
  let winner = gameState.winner;

  if (isCheckmate(nextPlayer, newGameState)) {
    gameStatus = "checkmate";
    winner = gameState.currentPlayer;
    gameMessage = `将死！${winner === "white" ? "白方" : "黑方"}获胜！`;
  } else if (isStalemate(newGameState)) {
    gameStatus = "stalemate";
    gameMessage = "和棋！（僵局）";
  } else if (isDraw(newGameState)) {
    gameStatus = "draw";
    gameMessage = "和棋！（材料不足）";
  }

  newGameState.gameStatus = gameStatus;
  newGameState.winner = winner;

  set({
    gameState: newGameState,
    selectedPiece: null,
    legalMoves: [],
    gameMessage,
  });

  // AI自动走棋
  if (
    get().gameMode === "local-ai" &&
    nextPlayer === "black" &&
    gameStatus === "playing"
  ) {
    setTimeout(() => {
      get().makeAIMove();
    }, 400);
  }
}
