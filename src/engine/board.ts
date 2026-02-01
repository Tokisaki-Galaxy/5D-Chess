/**
 * Board utility functions for 5D Chess
 */

import type {
  Board,
  Piece,
  Position2D,
  Position4D,
  Timeline,
  GameState,
} from '../types/chess.types'
import { BOARD_SIZE, INITIAL_PIECE_POSITIONS } from './constants'

/**
 * Create an empty board
 */
export function createEmptyBoard(): Board {
  const squares: (Piece | null)[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null)
  )

  return {
    squares,
    canCastleKingside: { white: true, black: true },
    canCastleQueenside: { white: true, black: true },
    enPassantTarget: null,
  }
}

/**
 * Create the initial board setup
 */
export function createInitialBoard(): Board {
  const board = createEmptyBoard()

  for (const { position, piece } of INITIAL_PIECE_POSITIONS) {
    const [x, y] = position
    board.squares[y][x] = piece
  }

  return board
}

/**
 * Deep clone a board
 */
export function cloneBoard(board: Board): Board {
  return {
    squares: board.squares.map((row) =>
      row.map((piece) => (piece ? { ...piece } : null))
    ),
    canCastleKingside: { ...board.canCastleKingside },
    canCastleQueenside: { ...board.canCastleQueenside },
    enPassantTarget: board.enPassantTarget
      ? { ...board.enPassantTarget }
      : null,
  }
}

/**
 * Get piece at a position on a board
 */
export function getPieceAt(board: Board, pos: Position2D): Piece | null {
  if (!isValidPosition2D(pos)) return null
  return board.squares[pos.y][pos.x]
}

/**
 * Set piece at a position on a board (mutates the board)
 */
export function setPieceAt(
  board: Board,
  pos: Position2D,
  piece: Piece | null
): void {
  if (!isValidPosition2D(pos)) return
  board.squares[pos.y][pos.x] = piece
}

/**
 * Check if a 2D position is valid (within board bounds)
 */
export function isValidPosition2D(pos: Position2D): boolean {
  return (
    pos.x >= 0 && pos.x < BOARD_SIZE && pos.y >= 0 && pos.y < BOARD_SIZE
  )
}

/**
 * Check if a 4D position is valid within the game state
 */
export function isValidPosition4D(
  gameState: GameState,
  pos: Position4D
): boolean {
  if (!isValidPosition2D(pos)) return false

  const timeline = gameState.timelines.find((t) => t.id === pos.l)
  if (!timeline) return false

  return pos.t >= 0 && pos.t < timeline.boards.length
}

/**
 * Get the board at a 4D position
 */
export function getBoardAt(
  gameState: GameState,
  pos: Position4D
): Board | null {
  const timeline = gameState.timelines.find((t) => t.id === pos.l)
  if (!timeline) return null

  if (pos.t < 0 || pos.t >= timeline.boards.length) return null

  return timeline.boards[pos.t]
}

/**
 * Get piece at a 4D position
 */
export function getPieceAt4D(
  gameState: GameState,
  pos: Position4D
): Piece | null {
  const board = getBoardAt(gameState, pos)
  if (!board) return null
  return getPieceAt(board, pos)
}

/**
 * Create a new timeline as a branch from another
 */
export function createTimeline(
  parentTimeline: Timeline,
  branchTurn: number,
  gameState: GameState
): Timeline {
  // Copy boards up to and including the branch point
  const boards = parentTimeline.boards
    .slice(0, branchTurn + 1)
    .map((b) => cloneBoard(b))

  const newId = getNextTimelineId(gameState)

  return {
    id: newId,
    boards,
    originTurn: branchTurn,
    parentTimelineId: parentTimeline.id,
    isActive: true,
  }
}

/**
 * Get the next available timeline ID
 */
export function getNextTimelineId(gameState: GameState): number {
  const maxId = Math.max(0, ...gameState.timelines.map((t) => Math.abs(t.id)))
  // Alternate between positive and negative IDs
  // Original timeline is 0
  // White creates positive timelines, black creates negative
  return maxId + 1
}

/**
 * Get a timeline by ID
 */
export function getTimelineById(
  gameState: GameState,
  id: number
): Timeline | undefined {
  return gameState.timelines.find((t) => t.id === id)
}

/**
 * Find all active timelines (timelines that need moves at the present)
 */
export function getActiveTimelines(gameState: GameState): Timeline[] {
  return gameState.timelines.filter((t) => t.isActive)
}

/**
 * Check if a timeline is at the present turn
 */
export function isTimelineAtPresent(
  timeline: Timeline,
  presentTurn: number
): boolean {
  return timeline.boards.length > presentTurn
}

/**
 * Find the king position on a board
 */
export function findKingPosition(
  board: Board,
  color: 'white' | 'black'
): Position2D | null {
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const piece = board.squares[y][x]
      if (piece && piece.type === 'king' && piece.color === color) {
        return { x, y }
      }
    }
  }
  return null
}

/**
 * Find all pieces of a color on a board
 */
export function findAllPieces(
  board: Board,
  color: 'white' | 'black'
): { position: Position2D; piece: Piece }[] {
  const pieces: { position: Position2D; piece: Piece }[] = []

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const piece = board.squares[y][x]
      if (piece && piece.color === color) {
        pieces.push({ position: { x, y }, piece })
      }
    }
  }

  return pieces
}

/**
 * Convert 2D position to algebraic notation
 */
export function positionToAlgebraic(pos: Position2D): string {
  const col = String.fromCharCode('a'.charCodeAt(0) + pos.x)
  const row = (pos.y + 1).toString()
  return col + row
}

/**
 * Convert algebraic notation to 2D position
 */
export function algebraicToPosition(notation: string): Position2D | null {
  if (notation.length !== 2) return null

  const col = notation.charCodeAt(0) - 'a'.charCodeAt(0)
  const row = parseInt(notation[1], 10) - 1

  if (col < 0 || col >= BOARD_SIZE || row < 0 || row >= BOARD_SIZE) {
    return null
  }

  return { x: col, y: row }
}

/**
 * Convert 4D position to notation
 */
export function position4DToNotation(pos: Position4D): string {
  const algebraic = positionToAlgebraic(pos)
  return `(L${pos.l}T${pos.t})${algebraic}`
}
