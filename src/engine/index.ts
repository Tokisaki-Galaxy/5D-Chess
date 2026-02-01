/**
 * 5D Chess Engine - Main Export
 */

// Types
export type {
  PieceType,
  Color,
  Piece,
  Position2D,
  Position4D,
  Position5D,
  Board,
  Timeline,
  MoveType,
  Move,
  GameState,
  GameStatus,
  MoveVector,
  MoveValidation,
  PossibleMoves,
} from '../types/chess.types'

// Game Engine
export {
  createNewGame,
  makeMove,
  undoMove,
  redoMove,
  getAllPossibleMoves,
  getCurrentBoard,
  getSortedTimelines,
  canPieceMove,
  serializeGameState,
  deserializeGameState,
  getValidMoves,
  validateMove,
  isKingInCheck,
  createInitialBoard,
  cloneBoard,
  getPieceAt,
  getPieceAt4D,
  findKingPosition,
  findAllPieces,
  positionToAlgebraic,
  position4DToNotation,
  PIECE_SYMBOLS,
  COLUMN_NAMES,
  BOARD_SIZE,
} from './game'

// Board utilities
export {
  createEmptyBoard,
  setPieceAt,
  isValidPosition2D,
  isValidPosition4D,
  getBoardAt,
  getTimelineById,
  getActiveTimelines,
  algebraicToPosition,
} from './board'

// Constants
export { PIECE_MOVES, SLIDING_PIECES, JUMPING_PIECES, INITIAL_PIECE_POSITIONS } from './constants'
