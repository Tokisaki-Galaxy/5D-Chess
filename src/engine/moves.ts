/**
 * Move generation and validation for 5D Chess
 */

import type {
  Board,
  Piece,
  Position2D,
  Position4D,
  Move,
  MoveType,
  MoveVector,
  GameState,
  Color,
  PieceType,
  MoveValidation,
} from '../types/chess.types'
import {
  PIECE_MOVES,
  SLIDING_PIECES,
  BOARD_SIZE,
} from './constants'
import {
  getPieceAt,
  getPieceAt4D,
  isValidPosition2D,
  isValidPosition4D,
  cloneBoard,
  getBoardAt,
  findKingPosition,
  findAllPieces,
  createTimeline,
  getTimelineById,
} from './board'

/**
 * Get all valid moves for a piece at a given 4D position
 */
export function getValidMoves(
  gameState: GameState,
  from: Position4D
): Position4D[] {
  const piece = getPieceAt4D(gameState, from)
  if (!piece) return []

  // Only allow moves for the current player
  if (piece.color !== gameState.currentPlayer) return []

  const candidateMoves = generateCandidateMoves(gameState, from, piece)

  // Filter out moves that would leave the king in check
  return candidateMoves.filter((to) => {
    const simulation = simulateMove(gameState, from, to)
    if (!simulation) return false
    return !isKingInCheck(simulation.state, piece.color)
  })
}

/**
 * Generate candidate moves (before check validation)
 */
function generateCandidateMoves(
  gameState: GameState,
  from: Position4D,
  piece: Piece
): Position4D[] {
  const moves: Position4D[] = []

  if (piece.type === 'pawn') {
    moves.push(...generatePawnMoves(gameState, from, piece))
  } else {
    const vectors = PIECE_MOVES[piece.type]
    const isSliding = SLIDING_PIECES.includes(piece.type)

    for (const vector of vectors) {
      if (isSliding) {
        moves.push(...generateSlidingMoves(gameState, from, vector, piece))
      } else {
        const target = addVector(from, vector)
        if (canMoveTo(gameState, target, piece.color)) {
          moves.push(target)
        }
      }
    }

    // Add castling moves for king
    if (piece.type === 'king') {
      moves.push(...generateCastlingMoves(gameState, from, piece))
    }
  }

  return moves
}

/**
 * Generate pawn moves (special handling)
 */
function generatePawnMoves(
  gameState: GameState,
  from: Position4D,
  piece: Piece
): Position4D[] {
  const moves: Position4D[] = []
  const direction = piece.color === 'white' ? 1 : -1
  const startRow = piece.color === 'white' ? 1 : 6

  // Forward move (1 square)
  const forward: Position4D = {
    ...from,
    y: from.y + direction,
  }

  if (
    isValidPosition4D(gameState, forward) &&
    getPieceAt4D(gameState, forward) === null
  ) {
    moves.push(forward)

    // Double move from starting position
    if (from.y === startRow) {
      const doubleForward: Position4D = {
        ...from,
        y: from.y + 2 * direction,
      }
      if (
        isValidPosition4D(gameState, doubleForward) &&
        getPieceAt4D(gameState, doubleForward) === null
      ) {
        moves.push(doubleForward)
      }
    }
  }

  // Diagonal captures (2D)
  for (const dx of [-1, 1]) {
    const capture: Position4D = {
      ...from,
      x: from.x + dx,
      y: from.y + direction,
    }

    if (isValidPosition4D(gameState, capture)) {
      const targetPiece = getPieceAt4D(gameState, capture)
      if (targetPiece && targetPiece.color !== piece.color) {
        moves.push(capture)
      }

      // En passant
      const board = getBoardAt(gameState, from)
      if (
        board?.enPassantTarget &&
        board.enPassantTarget.x === capture.x &&
        board.enPassantTarget.y === capture.y
      ) {
        moves.push(capture)
      }
    }
  }

  // Time travel moves for pawns (can move backward in time on the same file)
  for (const dt of [-1, -2]) {
    const timeTravel: Position4D = {
      ...from,
      t: from.t + dt,
    }

    if (canMoveTo(gameState, timeTravel, piece.color)) {
      moves.push(timeTravel)
    }
  }

  // Timeline travel moves for pawns
  for (const dl of [-1, 1]) {
    const timelineTravel: Position4D = {
      ...from,
      l: from.l + dl,
    }

    if (canMoveTo(gameState, timelineTravel, piece.color)) {
      moves.push(timelineTravel)
    }
  }

  return moves
}

/**
 * Generate sliding moves along a vector
 */
function generateSlidingMoves(
  gameState: GameState,
  from: Position4D,
  vector: MoveVector,
  piece: Piece
): Position4D[] {
  const moves: Position4D[] = []

  for (let step = 1; step < Math.max(BOARD_SIZE, 100); step++) {
    const target = addVector(from, {
      dx: vector.dx * step,
      dy: vector.dy * step,
      dt: vector.dt * step,
      dl: vector.dl * step,
    })

    // Check if position exists
    if (!isValidPosition4D(gameState, target)) break

    const targetPiece = getPieceAt4D(gameState, target)

    if (targetPiece === null) {
      moves.push(target)
    } else if (targetPiece.color !== piece.color) {
      moves.push(target) // Can capture
      break
    } else {
      break // Blocked by own piece
    }
  }

  return moves
}

/**
 * Generate castling moves
 */
function generateCastlingMoves(
  gameState: GameState,
  from: Position4D,
  piece: Piece
): Position4D[] {
  const moves: Position4D[] = []
  const board = getBoardAt(gameState, from)
  if (!board) return moves

  const color = piece.color
  const row = color === 'white' ? 0 : 7

  // Can't castle if not on starting square
  if (from.x !== 4 || from.y !== row) return moves

  // Kingside castling
  if (
    (color === 'white' ? board.canCastleKingside.white : board.canCastleKingside.black) &&
    !isSquareAttacked(gameState, from, color) &&
    !getPieceAt(board, { x: 5, y: row }) &&
    !getPieceAt(board, { x: 6, y: row }) &&
    !isSquareAttacked(gameState, { ...from, x: 5 }, color) &&
    !isSquareAttacked(gameState, { ...from, x: 6 }, color)
  ) {
    moves.push({ ...from, x: 6 })
  }

  // Queenside castling
  if (
    (color === 'white' ? board.canCastleQueenside.white : board.canCastleQueenside.black) &&
    !isSquareAttacked(gameState, from, color) &&
    !getPieceAt(board, { x: 3, y: row }) &&
    !getPieceAt(board, { x: 2, y: row }) &&
    !getPieceAt(board, { x: 1, y: row }) &&
    !isSquareAttacked(gameState, { ...from, x: 3 }, color) &&
    !isSquareAttacked(gameState, { ...from, x: 2 }, color)
  ) {
    moves.push({ ...from, x: 2 })
  }

  return moves
}

/**
 * Add a vector to a position
 */
function addVector(pos: Position4D, vector: MoveVector): Position4D {
  return {
    x: pos.x + vector.dx,
    y: pos.y + vector.dy,
    t: pos.t + vector.dt,
    l: pos.l + vector.dl,
  }
}

/**
 * Check if a piece can move to a target position
 */
function canMoveTo(
  gameState: GameState,
  target: Position4D,
  pieceColor: Color
): boolean {
  if (!isValidPosition4D(gameState, target)) return false

  const targetPiece = getPieceAt4D(gameState, target)
  if (targetPiece && targetPiece.color === pieceColor) return false

  return true
}

/**
 * Check if a square is attacked by the opponent
 */
export function isSquareAttacked(
  gameState: GameState,
  pos: Position4D,
  defendingColor: Color
): boolean {
  const attackingColor = defendingColor === 'white' ? 'black' : 'white'

  // Get all pieces of the attacking color on all boards
  for (const timeline of gameState.timelines) {
    for (let t = 0; t < timeline.boards.length; t++) {
      const board = timeline.boards[t]
      const pieces = findAllPieces(board, attackingColor)

      for (const { position, piece } of pieces) {
        const fromPos: Position4D = { x: position.x, y: position.y, t, l: timeline.id }
        const attacks = getAttackingSquares(gameState, fromPos, piece)

        if (attacks.some((a) => a.x === pos.x && a.y === pos.y && a.t === pos.t && a.l === pos.l)) {
          return true
        }
      }
    }
  }

  return false
}

/**
 * Get squares that a piece can attack (for check detection)
 */
function getAttackingSquares(
  gameState: GameState,
  from: Position4D,
  piece: Piece
): Position4D[] {
  const squares: Position4D[] = []

  if (piece.type === 'pawn') {
    // Pawns attack diagonally
    const direction = piece.color === 'white' ? 1 : -1
    for (const dx of [-1, 1]) {
      squares.push({
        x: from.x + dx,
        y: from.y + direction,
        t: from.t,
        l: from.l,
      })
    }

    // Pawns can also attack through time/timeline
    for (const dt of [-1, 1]) {
      squares.push({ ...from, t: from.t + dt })
    }
    for (const dl of [-1, 1]) {
      squares.push({ ...from, l: from.l + dl })
    }
  } else {
    const vectors = PIECE_MOVES[piece.type]
    const isSliding = SLIDING_PIECES.includes(piece.type)

    for (const vector of vectors) {
      if (isSliding) {
        squares.push(...generateSlidingAttacks(gameState, from, vector))
      } else {
        squares.push(addVector(from, vector))
      }
    }
  }

  return squares.filter((s) => isValidPosition4D(gameState, s))
}

/**
 * Generate sliding attack squares
 */
function generateSlidingAttacks(
  gameState: GameState,
  from: Position4D,
  vector: MoveVector
): Position4D[] {
  const squares: Position4D[] = []

  for (let step = 1; step < Math.max(BOARD_SIZE, 100); step++) {
    const target = addVector(from, {
      dx: vector.dx * step,
      dy: vector.dy * step,
      dt: vector.dt * step,
      dl: vector.dl * step,
    })

    if (!isValidPosition4D(gameState, target)) break

    squares.push(target)

    const targetPiece = getPieceAt4D(gameState, target)
    if (targetPiece !== null) break
  }

  return squares
}

/**
 * Check if the king of a given color is in check
 */
export function isKingInCheck(gameState: GameState, color: Color): boolean {
  // Find all kings of this color across all boards
  for (const timeline of gameState.timelines) {
    const latestBoardIndex = timeline.boards.length - 1
    if (latestBoardIndex < 0) continue

    const board = timeline.boards[latestBoardIndex]
    const kingPos = findKingPosition(board, color)

    if (kingPos) {
      const pos4D: Position4D = {
        x: kingPos.x,
        y: kingPos.y,
        t: latestBoardIndex,
        l: timeline.id,
      }

      if (isSquareAttacked(gameState, pos4D, color)) {
        return true
      }
    }
  }

  return false
}

/**
 * Simulate a move and return the resulting game state
 *
 * In 5D Chess:
 * - A spatial move (same time, same timeline) creates a new board at time t+1
 * - A time travel move (to the past) creates a new timeline branching from that point
 * - A timeline travel move places the piece on another timeline
 */
export function simulateMove(
  gameState: GameState,
  from: Position4D,
  to: Position4D
): { state: GameState; move: Move } | null {
  const piece = getPieceAt4D(gameState, from)
  if (!piece) return null

  // Deep clone the game state
  const newState = cloneGameState(gameState)

  const sourceTimeline = getTimelineById(newState, from.l)
  if (!sourceTimeline) return null

  const sourceBoard = sourceTimeline.boards[from.t]
  if (!sourceBoard) return null

  // Determine move type and handle accordingly
  const isTimeTravel = to.t < from.t
  const isTimelineTravel = to.l !== from.l
  const isSpatialMove = !isTimeTravel && !isTimelineTravel && to.t === from.t
  
  let createsNewTimeline = false
  let targetTimeline = getTimelineById(newState, to.l)

  // If moving to the past within the same timeline, create a new timeline
  if (isTimeTravel && to.l === from.l) {
    createsNewTimeline = true
    const newTimeline = createTimeline(sourceTimeline, to.t, newState)
    newTimeline.id =
      piece.color === 'white'
        ? newState.whiteTimelineCount + 1
        : -(newState.blackTimelineCount + 1)

    if (piece.color === 'white') {
      newState.whiteTimelineCount++
    } else {
      newState.blackTimelineCount++
    }

    newState.timelines.push(newTimeline)
    targetTimeline = newTimeline
  }

  if (!targetTimeline) return null

  // Get the board to modify based on move type
  let targetBoard: Board
  if (isSpatialMove) {
    // For spatial moves, we clone the current board and will add it as a new turn
    targetBoard = cloneBoard(sourceBoard)
  } else if (isTimelineTravel) {
    // For timeline travel, get the latest board from target timeline
    const latestIdx = targetTimeline.boards.length - 1
    targetBoard = cloneBoard(targetTimeline.boards[latestIdx])
  } else {
    // For time travel (to new timeline), get the board at the target turn
    targetBoard = cloneBoard(targetTimeline.boards[to.t])
  }

  const capturedPiece = getPieceAt(targetBoard, to)

  // Determine move type
  let moveType: MoveType = capturedPiece ? 'capture' : 'normal'

  // Handle special moves
  if (piece.type === 'king' && Math.abs(to.x - from.x) === 2 && isSpatialMove) {
    // Castling
    moveType = to.x > from.x ? 'castle-kingside' : 'castle-queenside'
    const rookFromX = to.x > from.x ? 7 : 0
    const rookToX = to.x > from.x ? 5 : 3
    const rook = getPieceAt(targetBoard, { x: rookFromX, y: from.y })

    if (rook) {
      setPieceAt(targetBoard, { x: rookFromX, y: from.y }, null)
      setPieceAt(targetBoard, { x: rookToX, y: from.y }, rook)
    }
  }

  // Handle en passant
  if (
    piece.type === 'pawn' &&
    sourceBoard.enPassantTarget &&
    to.x === sourceBoard.enPassantTarget.x &&
    to.y === sourceBoard.enPassantTarget.y &&
    isSpatialMove
  ) {
    moveType = 'en-passant'
    const capturedPawnY = piece.color === 'white' ? to.y - 1 : to.y + 1
    setPieceAt(targetBoard, { x: to.x, y: capturedPawnY }, null)
  }

  // Update move type for time/timeline travel
  if (isTimelineTravel) {
    moveType = 'timeline-travel'
  } else if (isTimeTravel) {
    moveType = 'time-travel'
  }

  // Remove piece from source
  if (isSpatialMove) {
    // For spatial moves, remove from the same board we're modifying
    setPieceAt(targetBoard, from, null)
  } else {
    // For time/timeline travel, update the source board
    const sourceBoardClone = cloneBoard(sourceBoard)
    setPieceAt(sourceBoardClone, from, null)
    sourceTimeline.boards[from.t] = sourceBoardClone
  }

  // Place piece on target
  setPieceAt(targetBoard, to, piece)

  // Handle pawn promotion
  let promotionPiece: PieceType | undefined
  if (
    piece.type === 'pawn' &&
    (to.y === 7 || to.y === 0) &&
    isSpatialMove
  ) {
    moveType = 'promotion'
    promotionPiece = 'queen' // Default to queen promotion
    setPieceAt(targetBoard, to, { type: 'queen', color: piece.color })
  }

  // Update castling rights
  if (piece.type === 'king') {
    targetBoard.canCastleKingside[piece.color] = false
    targetBoard.canCastleQueenside[piece.color] = false
  }
  if (piece.type === 'rook') {
    if (from.x === 0) {
      targetBoard.canCastleQueenside[piece.color] = false
    } else if (from.x === 7) {
      targetBoard.canCastleKingside[piece.color] = false
    }
  }

  // Update en passant target
  targetBoard.enPassantTarget = null
  if (
    piece.type === 'pawn' &&
    Math.abs(to.y - from.y) === 2 &&
    isSpatialMove
  ) {
    targetBoard.enPassantTarget = {
      x: from.x,
      y: (from.y + to.y) / 2,
    }
  }

  // Add the new board to the timeline
  if (isSpatialMove) {
    // Add as a new turn in the same timeline
    sourceTimeline.boards.push(targetBoard)
  } else if (isTimelineTravel) {
    // Add as a new turn in the target timeline
    targetTimeline.boards.push(targetBoard)
  } else if (isTimeTravel) {
    // For time travel, the board at the target turn becomes the "current" in the new timeline
    // and we add this modified board as the next turn
    targetTimeline.boards.push(targetBoard)
  }

  const move: Move = {
    from,
    to,
    piece,
    capturedPiece: capturedPiece || undefined,
    moveType,
    promotionPiece,
    createsNewTimeline,
    newTimelineId: createsNewTimeline ? targetTimeline.id : undefined,
  }

  return { state: newState, move }
}

/**
 * Deep clone a game state
 */
export function cloneGameState(state: GameState): GameState {
  return {
    timelines: state.timelines.map((t) => ({
      ...t,
      boards: t.boards.map((b) => cloneBoard(b)),
    })),
    currentPlayer: state.currentPlayer,
    presentTurn: state.presentTurn,
    moveHistory: [...state.moveHistory],
    redoStack: [...state.redoStack],
    status: state.status,
    winner: state.winner,
    whiteTimelineCount: state.whiteTimelineCount,
    blackTimelineCount: state.blackTimelineCount,
  }
}

/**
 * Validate a move
 */
export function validateMove(
  gameState: GameState,
  from: Position4D,
  to: Position4D
): MoveValidation {
  const piece = getPieceAt4D(gameState, from)

  if (!piece) {
    return { valid: false, reason: 'No piece at source position' }
  }

  if (piece.color !== gameState.currentPlayer) {
    return { valid: false, reason: 'Not your turn' }
  }

  const validMoves = getValidMoves(gameState, from)
  const isValid = validMoves.some(
    (m) => m.x === to.x && m.y === to.y && m.t === to.t && m.l === to.l
  )

  if (!isValid) {
    return { valid: false, reason: 'Invalid move' }
  }

  const createsTimeline = to.t < from.t || (to.l !== from.l && !getTimelineById(gameState, to.l))

  return { valid: true, createsTimeline }
}

// Helper function - import from board.ts
function setPieceAt(board: Board, pos: Position2D, piece: Piece | null): void {
  if (!isValidPosition2D(pos)) return
  board.squares[pos.y][pos.x] = piece
}
