import type {
  Piece,
  PieceColor,
  PieceType,
  Move,
  GameStatus,
} from "../../types/game.types";
import type { Board, Timeline } from "../../types/timeline.types";

/** 游戏状态 */
export interface GameState {
  timelines: Map<number, Timeline>;
  currentTimeline: number;
  currentTurn: number;
  currentPlayer: PieceColor;
  moveHistory: Move[];
  gameStatus: GameStatus;
  winner?: PieceColor;
}

/** 创建初始棋盘 */
export function createInitialBoard(
  timeline: number,
  turn: number,
): Board {
  const pieces: Piece[] = [];
  let id = 0;

  const addPiece = (
    type: PieceType,
    color: PieceColor,
    x: number,
    y: number,
  ) => {
    pieces.push({
      id: `${color}-${type}-${id++}`,
      type,
      color,
      position: { x, y, timeline, turn },
      hasMoved: false,
    });
  };

  // 白方棋子 (y=0, y=1)
  const backRow: PieceType[] = [
    "rook",
    "knight",
    "bishop",
    "queen",
    "king",
    "bishop",
    "knight",
    "rook",
  ];
  for (let x = 0; x < 8; x++) {
    addPiece(backRow[x], "white", x, 0);
    addPiece("pawn", "white", x, 1);
    addPiece("pawn", "black", x, 6);
    addPiece(backRow[x], "black", x, 7);
  }

  return { pieces, turn, timeline };
}

/** 创建初始游戏状态 */
export function createInitialGameState(): GameState {
  const initialBoard = createInitialBoard(0, 0);
  const timeline: Timeline = {
    id: 0,
    parentTimeline: null,
    branchTurn: 0,
    boards: new Map([[0, initialBoard]]),
    isActive: true,
  };

  return {
    timelines: new Map([[0, timeline]]),
    currentTimeline: 0,
    currentTurn: 0,
    currentPlayer: "white",
    moveHistory: [],
    gameStatus: "playing",
  };
}

/** 获取棋盘上指定位置的棋子 */
export function getPieceAt(
  board: Board,
  x: number,
  y: number,
): Piece | undefined {
  return board.pieces.find((p: Piece) => p.position.x === x && p.position.y === y);
}

/** 获取指定颜色的所有棋子 */
export function getPiecesByColor(board: Board, color: PieceColor): Piece[] {
  return board.pieces.filter((p: Piece) => p.color === color);
}

/** 棋子符号映射 */
export const PIECE_SYMBOLS: Record<PieceType, { white: string; black: string }> = {
  king: { white: "♔", black: "♚" },
  queen: { white: "♕", black: "♛" },
  rook: { white: "♖", black: "♜" },
  bishop: { white: "♗", black: "♝" },
  knight: { white: "♘", black: "♞" },
  pawn: { white: "♙", black: "♟" },
};
