/**
 * Unit tests for 5D Chess Engine
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  createNewGame,
  makeMove,
  getValidMoves,
  isKingInCheck,
  createInitialBoard,
  getPieceAt,
  BOARD_SIZE,
} from '../engine'
import type { GameState, Position4D } from '../types/chess.types'

describe('5D Chess Engine', () => {
  describe('createNewGame', () => {
    it('should create a new game with initial setup', () => {
      const game = createNewGame()

      expect(game.currentPlayer).toBe('white')
      expect(game.timelines.length).toBe(1)
      expect(game.timelines[0].id).toBe(0)
      expect(game.timelines[0].boards.length).toBe(1)
      expect(game.status).toBe('playing')
      expect(game.moveHistory.length).toBe(0)
    })

    it('should set up pieces correctly', () => {
      const game = createNewGame()
      const board = game.timelines[0].boards[0]

      // Check white pieces
      expect(getPieceAt(board, { x: 4, y: 0 })).toEqual({ type: 'king', color: 'white' })
      expect(getPieceAt(board, { x: 3, y: 0 })).toEqual({ type: 'queen', color: 'white' })
      expect(getPieceAt(board, { x: 0, y: 0 })).toEqual({ type: 'rook', color: 'white' })

      // Check black pieces
      expect(getPieceAt(board, { x: 4, y: 7 })).toEqual({ type: 'king', color: 'black' })
      expect(getPieceAt(board, { x: 3, y: 7 })).toEqual({ type: 'queen', color: 'black' })
      expect(getPieceAt(board, { x: 0, y: 7 })).toEqual({ type: 'rook', color: 'black' })

      // Check pawns
      for (let x = 0; x < BOARD_SIZE; x++) {
        expect(getPieceAt(board, { x, y: 1 })).toEqual({ type: 'pawn', color: 'white' })
        expect(getPieceAt(board, { x, y: 6 })).toEqual({ type: 'pawn', color: 'black' })
      }

      // Check empty squares
      expect(getPieceAt(board, { x: 4, y: 4 })).toBeNull()
    })
  })

  describe('createInitialBoard', () => {
    it('should create board with correct castling rights', () => {
      const board = createInitialBoard()

      expect(board.canCastleKingside.white).toBe(true)
      expect(board.canCastleKingside.black).toBe(true)
      expect(board.canCastleQueenside.white).toBe(true)
      expect(board.canCastleQueenside.black).toBe(true)
    })

    it('should have no en passant target initially', () => {
      const board = createInitialBoard()
      expect(board.enPassantTarget).toBeNull()
    })
  })

  describe('getValidMoves', () => {
    let game: GameState

    beforeEach(() => {
      game = createNewGame()
    })

    it('should return valid pawn moves from starting position', () => {
      const from: Position4D = { x: 4, y: 1, t: 0, l: 0 } // e2 pawn
      const moves = getValidMoves(game, from)

      // Pawn should be able to move 1 or 2 squares forward
      expect(moves.length).toBeGreaterThanOrEqual(2)
      expect(moves.some(m => m.x === 4 && m.y === 2)).toBe(true) // e3
      expect(moves.some(m => m.x === 4 && m.y === 3)).toBe(true) // e4
    })

    it('should return valid knight moves', () => {
      const from: Position4D = { x: 1, y: 0, t: 0, l: 0 } // b1 knight
      const moves = getValidMoves(game, from)

      // Knight on b1 can move to a3 or c3
      expect(moves.some(m => m.x === 0 && m.y === 2 && m.t === 0 && m.l === 0)).toBe(true) // a3
      expect(moves.some(m => m.x === 2 && m.y === 2 && m.t === 0 && m.l === 0)).toBe(true) // c3
    })

    it('should not return moves for wrong player', () => {
      const from: Position4D = { x: 4, y: 6, t: 0, l: 0 } // e7 black pawn
      const moves = getValidMoves(game, from)

      expect(moves.length).toBe(0) // Can't move black pieces when it's white's turn
    })

    it('should return no moves for empty square', () => {
      const from: Position4D = { x: 4, y: 4, t: 0, l: 0 } // Empty square
      const moves = getValidMoves(game, from)

      expect(moves.length).toBe(0)
    })
  })

  describe('makeMove', () => {
    let game: GameState

    beforeEach(() => {
      game = createNewGame()
    })

    it('should execute a valid pawn move', () => {
      const from: Position4D = { x: 4, y: 1, t: 0, l: 0 } // e2
      const to: Position4D = { x: 4, y: 3, t: 0, l: 0 } // e4

      const result = makeMove(game, from, to)

      expect(result.success).toBe(true)
      expect(result.move?.piece.type).toBe('pawn')
      expect(result.newState.currentPlayer).toBe('black')
      expect(result.newState.moveHistory.length).toBe(1)
    })

    it('should reject invalid move', () => {
      const from: Position4D = { x: 4, y: 1, t: 0, l: 0 } // e2
      const to: Position4D = { x: 4, y: 5, t: 0, l: 0 } // e6 - too far

      const result = makeMove(game, from, to)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should reject move from empty square', () => {
      const from: Position4D = { x: 4, y: 4, t: 0, l: 0 } // Empty
      const to: Position4D = { x: 4, y: 5, t: 0, l: 0 }

      const result = makeMove(game, from, to)

      expect(result.success).toBe(false)
    })

    it('should handle capture correctly', () => {
      // Setup: Move pawns to enable capture
      let state = game

      // 1. e4 - White moves e2 to e4
      let result = makeMove(state, { x: 4, y: 1, t: 0, l: 0 }, { x: 4, y: 3, t: 0, l: 0 })
      expect(result.success).toBe(true)
      state = result.newState

      // After white's move, the new board is at index 1
      // Black's pawn is at d7 (x:3, y:6), move to d5
      // In 5D chess, we need to reference the latest board state
      const latestBoardIndex = state.timelines[0].boards.length - 1

      // 2. d5 - Black moves d7 to d5
      result = makeMove(state, { x: 3, y: 6, t: latestBoardIndex, l: 0 }, { x: 3, y: 4, t: latestBoardIndex, l: 0 })
      expect(result.success).toBe(true)
      state = result.newState

      // Get the new latest board index
      const newLatestBoardIndex = state.timelines[0].boards.length - 1

      // 3. exd5 (capture) - White pawn captures on d5
      result = makeMove(state, { x: 4, y: 3, t: newLatestBoardIndex, l: 0 }, { x: 3, y: 4, t: newLatestBoardIndex, l: 0 })
      expect(result.success).toBe(true)
      expect(result.move?.moveType).toBe('capture')
      expect(result.move?.capturedPiece?.type).toBe('pawn')
    })
  })

  describe('isKingInCheck', () => {
    it('should return false for initial position', () => {
      const game = createNewGame()

      expect(isKingInCheck(game, 'white')).toBe(false)
      expect(isKingInCheck(game, 'black')).toBe(false)
    })
  })

  describe('Turn switching', () => {
    it('should switch turns after each move', () => {
      const game = createNewGame()

      expect(game.currentPlayer).toBe('white')

      // White's move
      const result1 = makeMove(game, { x: 4, y: 1, t: 0, l: 0 }, { x: 4, y: 3, t: 0, l: 0 })
      expect(result1.success).toBe(true)
      expect(result1.newState.currentPlayer).toBe('black')

      // Black's move - need to use the latest board index
      const latestBoardIndex = result1.newState.timelines[0].boards.length - 1
      const result2 = makeMove(result1.newState, { x: 4, y: 6, t: latestBoardIndex, l: 0 }, { x: 4, y: 4, t: latestBoardIndex, l: 0 })
      expect(result2.success).toBe(true)
      expect(result2.newState.currentPlayer).toBe('white')
    })
  })

  describe('Board state', () => {
    it('should update board state after move', () => {
      const game = createNewGame()

      const result = makeMove(game, { x: 4, y: 1, t: 0, l: 0 }, { x: 4, y: 3, t: 0, l: 0 })
      expect(result.success).toBe(true)

      // The new state should have a new board added to the timeline
      expect(result.newState.timelines[0].boards.length).toBe(2)

      // The original board (index 0) remains unchanged (historical snapshot)
      const originalBoard = result.newState.timelines[0].boards[0]
      expect(getPieceAt(originalBoard, { x: 4, y: 1 })).toEqual({ type: 'pawn', color: 'white' })

      // The new board (index 1) should have the pawn at the new position
      const newBoard = result.newState.timelines[0].boards[1]
      expect(getPieceAt(newBoard, { x: 4, y: 3 })).toEqual({ type: 'pawn', color: 'white' })
      // And the original square should be empty in the new board
      expect(getPieceAt(newBoard, { x: 4, y: 1 })).toBeNull()
    })
  })

  describe('Timeline mechanics', () => {
    it('should add new boards to timeline after each move', () => {
      const state = createNewGame()
      expect(state.timelines[0].boards.length).toBe(1)

      // First move
      const result1 = makeMove(state, { x: 4, y: 1, t: 0, l: 0 }, { x: 4, y: 3, t: 0, l: 0 })
      expect(result1.success).toBe(true)
      expect(result1.newState.timelines[0].boards.length).toBe(2)

      // Second move
      const latestIndex = result1.newState.timelines[0].boards.length - 1
      const result2 = makeMove(result1.newState, { x: 4, y: 6, t: latestIndex, l: 0 }, { x: 4, y: 4, t: latestIndex, l: 0 })
      expect(result2.success).toBe(true)
      expect(result2.newState.timelines[0].boards.length).toBe(3)
    })
  })
})
