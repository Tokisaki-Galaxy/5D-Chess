/** 位置坐标（5D） */
export interface Position5D {
  x: number; // 0-7 (a-h)
  y: number; // 0-7 (1-8)
  timeline: number; // 时间线ID
  turn: number; // 回合数
}

/** 棋子类型 */
export type PieceType =
  | "pawn"
  | "rook"
  | "knight"
  | "bishop"
  | "queen"
  | "king";

/** 棋子颜色 */
export type PieceColor = "white" | "black";

/** 棋子 */
export interface Piece {
  id: string;
  type: PieceType;
  color: PieceColor;
  position: Position5D;
  hasMoved: boolean;
  createdAt?: Position5D; // 该棋子首次出现的时空坐标
}

/** 移动 */
export interface Move {
  id: string;
  piece: Piece;
  from: Position5D;
  to: Position5D;
  capturedPiece?: Piece;
  createsTimeline?: number; // 是否创建新时间线
  timestamp: number;
  isPromotion?: boolean;
  promotionChoice?: PieceType;
}

/** 游戏状态枚举 */
export type GameStatus = "playing" | "checkmate" | "stalemate" | "draw";

/** 游戏模式 */
export type GameMode =
  | "local-pvp"
  | "local-ai"
  | "online";

/** AI 难度 */
export type AIDifficulty = "easy" | "medium" | "hard";

/** 游戏设置 */
export interface GameSettings {
  mode: GameMode;
  aiDifficulty?: AIDifficulty;
  timeLimit?: number; // 秒
  password?: string;
}
