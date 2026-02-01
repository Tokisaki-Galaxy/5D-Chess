/**
 * 5D Chess Core Types
 *
 * In 5D Chess With Multiverse Time Travel:
 * - X axis: columns (a-h, or 0-7)
 * - Y axis: rows (1-8, or 0-7)
 * - T axis: time (turn number within a timeline)
 * - L axis: timeline (multiverse dimension)
 *
 * The game has two key concepts:
 * 1. Time travel: Moving to a previous turn in the same timeline creates a new branch
 * 2. Multiverse: Multiple parallel timelines that can interact
 */

/** Chess piece types */
export type PieceType =
  | 'king'
  | 'queen'
  | 'rook'
  | 'bishop'
  | 'knight'
  | 'pawn'
  | 'unicorn'
  | 'dragon'

/** Player color */
export type Color = 'white' | 'black'

/** A chess piece */
export interface Piece {
  type: PieceType
  color: Color
}

/** 2D position on a single board */
export interface Position2D {
  x: number // 0-7 (column a-h)
  y: number // 0-7 (row 1-8)
}

/** 4D position including time and timeline */
export interface Position4D extends Position2D {
  t: number // Time (turn number)
  l: number // Timeline index
}

/** Full 5D position (used for complete move specification) - same as Position4D */
export type Position5D = Position4D

/** A single 8x8 chess board state */
export interface Board {
  squares: (Piece | null)[][] // 8x8 grid, [y][x] indexing
  /** Which side can castle kingside */
  canCastleKingside: { white: boolean; black: boolean }
  /** Which side can castle queenside */
  canCastleQueenside: { white: boolean; black: boolean }
  /** En passant target square (if pawn just moved 2 squares) */
  enPassantTarget: Position2D | null
}

/** A timeline is a sequence of boards through time */
export interface Timeline {
  id: number // Unique timeline identifier
  boards: Board[] // Boards indexed by turn number
  /** The turn at which this timeline was created (branched from another) */
  originTurn: number
  /** The timeline this was branched from (-1 for the original timeline) */
  parentTimelineId: number
  /** Whether this timeline is "active" (has reached the present) */
  isActive: boolean
}

/** Move types in 5D Chess */
export type MoveType =
  | 'normal' // Standard piece movement
  | 'capture' // Capturing a piece
  | 'castle-kingside' // Kingside castling
  | 'castle-queenside' // Queenside castling
  | 'en-passant' // En passant capture
  | 'promotion' // Pawn promotion
  | 'time-travel' // Moving through time
  | 'timeline-travel' // Moving across timelines

/** A move in the game */
export interface Move {
  from: Position4D
  to: Position4D
  piece: Piece
  capturedPiece?: Piece
  moveType: MoveType
  /** For pawn promotion */
  promotionPiece?: PieceType
  /** Whether this move creates a new timeline */
  createsNewTimeline: boolean
  /** The new timeline ID if created */
  newTimelineId?: number
}

/** Game state */
export interface GameState {
  timelines: Timeline[]
  /** Current player's turn */
  currentPlayer: Color
  /** The "present" turn number - all active timelines must be played up to this */
  presentTurn: number
  /** Move history for undo/redo */
  moveHistory: Move[]
  /** Moves that were undone (for redo) */
  redoStack: Move[]
  /** Game status */
  status: GameStatus
  /** The winner (if game is over) */
  winner?: Color
  /** Number of timelines created by white */
  whiteTimelineCount: number
  /** Number of timelines created by black */
  blackTimelineCount: number
}

/** Game status */
export type GameStatus =
  | 'playing'
  | 'check'
  | 'checkmate'
  | 'stalemate'
  | 'draw'

/** Direction vectors for piece movement in 5D */
export interface MoveVector {
  dx: number // X direction
  dy: number // Y direction
  dt: number // Time direction
  dl: number // Timeline direction
}

/** Result of validating a move */
export interface MoveValidation {
  valid: boolean
  reason?: string
  createsTimeline?: boolean
  newTimelineId?: number
}

/** Possible moves for a piece */
export interface PossibleMoves {
  piece: Piece
  from: Position4D
  moves: Position4D[]
}
