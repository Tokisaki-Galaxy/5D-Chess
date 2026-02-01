/**
 * 5D Chess Game Engine
 *
 * This is the main game engine that orchestrates the game mechanics.
 * It handles game state management, move execution, and game status checks.
 */

import type {
  GameState,
  Move,
  Position4D,
  Color,
  Timeline,
  Board,
  PieceType,
} from '../types/chess.types'
import {
  createInitialBoard,
  findAllPieces,
  getTimelineById,
  getActiveTimelines,
} from './board'
import {
  getValidMoves,
  simulateMove,
  isKingInCheck,
  cloneGameState,
  validateMove,
} from './moves'

/**
 * Create a new game state
 */
export function createNewGame(): GameState {
  const initialBoard = createInitialBoard()

  const initialTimeline: Timeline = {
    id: 0,
    boards: [initialBoard],
    originTurn: 0,
    parentTimelineId: -1,
    isActive: true,
  }

  return {
    timelines: [initialTimeline],
    currentPlayer: 'white',
    presentTurn: 0,
    moveHistory: [],
    redoStack: [],
    status: 'playing',
    winner: undefined,
    whiteTimelineCount: 0,
    blackTimelineCount: 0,
  }
}

/**
 * Execute a move on the game state
 */
export function makeMove(
  gameState: GameState,
  from: Position4D,
  to: Position4D,
  promotionPiece?: PieceType
): { success: boolean; newState: GameState; move?: Move; error?: string } {
  // Validate the move
  const validation = validateMove(gameState, from, to)
  if (!validation.valid) {
    return { success: false, newState: gameState, error: validation.reason }
  }

  // Simulate the move
  const result = simulateMove(gameState, from, to)
  if (!result) {
    return { success: false, newState: gameState, error: 'Failed to execute move' }
  }

  let { state: newState } = result
  const { move } = result

  // Handle pawn promotion with specified piece
  if (move.moveType === 'promotion' && promotionPiece) {
    const targetTimeline = getTimelineById(newState, to.l)
    if (targetTimeline) {
      const board = targetTimeline.boards[to.t]
      if (board) {
        board.squares[to.y][to.x] = {
          type: promotionPiece,
          color: move.piece.color,
        }
        move.promotionPiece = promotionPiece
      }
    }
  }

  // Add move to history
  newState.moveHistory.push(move)
  newState.redoStack = [] // Clear redo stack on new move

  // Check if turn is complete (all active timelines have moves at present)
  const turnComplete = checkTurnComplete(newState)

  if (turnComplete) {
    // Switch player
    newState.currentPlayer = newState.currentPlayer === 'white' ? 'black' : 'white'

    // Update present turn
    newState.presentTurn++

    // Update game status
    newState = updateGameStatus(newState)
  }

  return { success: true, newState, move }
}

/**
 * Check if the current turn is complete
 * In 5D Chess, a player must make a move on all active timelines at the present
 */
function checkTurnComplete(gameState: GameState): boolean {
  const activeTimelines = getActiveTimelines(gameState)

  for (const timeline of activeTimelines) {
    // Check if this timeline has a board at the present turn + 1
    // (meaning a move was made this turn)
    if (timeline.boards.length <= gameState.presentTurn + 1) {
      // Check if any moves were made TO this timeline this turn
      const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1]
      if (!lastMove || lastMove.to.l !== timeline.id) {
        // No move made on this timeline yet
        // For simplicity, we'll consider the turn complete after one move
        // In a full implementation, you'd track which timelines need moves
      }
    }
  }

  // For simplified implementation, turn completes after each move
  return true
}

/**
 * Update the game status (check, checkmate, stalemate)
 */
function updateGameStatus(gameState: GameState): GameState {
  const opponent = gameState.currentPlayer
  const inCheck = isKingInCheck(gameState, opponent)

  // Check if opponent has any legal moves
  const hasLegalMoves = playerHasLegalMoves(gameState, opponent)

  if (inCheck && !hasLegalMoves) {
    gameState.status = 'checkmate'
    gameState.winner = opponent === 'white' ? 'black' : 'white'
  } else if (!inCheck && !hasLegalMoves) {
    gameState.status = 'stalemate'
  } else if (inCheck) {
    gameState.status = 'check'
  } else {
    gameState.status = 'playing'
  }

  return gameState
}

/**
 * Check if a player has any legal moves
 */
function playerHasLegalMoves(gameState: GameState, color: Color): boolean {
  // Temporarily switch current player to check their moves
  const tempState = cloneGameState(gameState)
  tempState.currentPlayer = color

  for (const timeline of tempState.timelines) {
    const latestBoardIndex = timeline.boards.length - 1
    if (latestBoardIndex < 0) continue

    const board = timeline.boards[latestBoardIndex]
    const pieces = findAllPieces(board, color)

    for (const { position } of pieces) {
      const from: Position4D = {
        x: position.x,
        y: position.y,
        t: latestBoardIndex,
        l: timeline.id,
      }

      const validMoves = getValidMoves(tempState, from)
      if (validMoves.length > 0) {
        return true
      }
    }
  }

  return false
}

/**
 * Undo the last move
 */
export function undoMove(
  gameState: GameState
): { success: boolean; newState: GameState } {
  if (gameState.moveHistory.length === 0) {
    return { success: false, newState: gameState }
  }

  // For proper undo, we need to rebuild the game state from scratch
  // This is the safest approach to handle the complex timeline mechanics
  const newState = createNewGame()
  const movesToReplay = gameState.moveHistory.slice(0, -1)
  const undoneMove = gameState.moveHistory[gameState.moveHistory.length - 1]

  let currentState = newState
  for (const move of movesToReplay) {
    const result = makeMove(currentState, move.from, move.to, move.promotionPiece)
    if (result.success) {
      currentState = result.newState
    }
  }

  currentState.redoStack = [undoneMove, ...gameState.redoStack]

  return { success: true, newState: currentState }
}

/**
 * Redo a previously undone move
 */
export function redoMove(
  gameState: GameState
): { success: boolean; newState: GameState } {
  if (gameState.redoStack.length === 0) {
    return { success: false, newState: gameState }
  }

  const moveToRedo = gameState.redoStack[0]
  const result = makeMove(
    gameState,
    moveToRedo.from,
    moveToRedo.to,
    moveToRedo.promotionPiece
  )

  if (result.success) {
    result.newState.redoStack = gameState.redoStack.slice(1)
  }

  return result.success
    ? { success: true, newState: result.newState }
    : { success: false, newState: gameState }
}

/**
 * Get all possible moves for the current player
 */
export function getAllPossibleMoves(
  gameState: GameState
): { from: Position4D; moves: Position4D[] }[] {
  const allMoves: { from: Position4D; moves: Position4D[] }[] = []

  for (const timeline of gameState.timelines) {
    const latestBoardIndex = timeline.boards.length - 1
    if (latestBoardIndex < 0) continue

    const board = timeline.boards[latestBoardIndex]
    const pieces = findAllPieces(board, gameState.currentPlayer)

    for (const { position } of pieces) {
      const from: Position4D = {
        x: position.x,
        y: position.y,
        t: latestBoardIndex,
        l: timeline.id,
      }

      const moves = getValidMoves(gameState, from)
      if (moves.length > 0) {
        allMoves.push({ from, moves })
      }
    }
  }

  return allMoves
}

/**
 * Get the current board state for a timeline
 */
export function getCurrentBoard(
  gameState: GameState,
  timelineId: number
): Board | null {
  const timeline = getTimelineById(gameState, timelineId)
  if (!timeline || timeline.boards.length === 0) return null

  return timeline.boards[timeline.boards.length - 1]
}

/**
 * Get all timelines sorted by ID
 */
export function getSortedTimelines(gameState: GameState): Timeline[] {
  return [...gameState.timelines].sort((a, b) => a.id - b.id)
}

/**
 * Check if a specific piece at a position can move
 */
export function canPieceMove(
  gameState: GameState,
  position: Position4D
): boolean {
  const moves = getValidMoves(gameState, position)
  return moves.length > 0
}

/**
 * Serialize game state for saving
 */
export function serializeGameState(gameState: GameState): string {
  return JSON.stringify(gameState)
}

/**
 * Deserialize game state from saved data
 */
export function deserializeGameState(data: string): GameState | null {
  try {
    return JSON.parse(data) as GameState
  } catch {
    return null
  }
}

// Re-export commonly used functions
export { getValidMoves, validateMove, isKingInCheck } from './moves'
export {
  createInitialBoard,
  cloneBoard,
  getPieceAt,
  getPieceAt4D,
  findKingPosition,
  findAllPieces,
  positionToAlgebraic,
  position4DToNotation,
} from './board'
export { PIECE_SYMBOLS, COLUMN_NAMES, BOARD_SIZE } from './constants'
