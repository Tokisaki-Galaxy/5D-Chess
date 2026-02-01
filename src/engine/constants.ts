/**
 * Constants for 5D Chess engine
 */

import type { Piece, PieceType, Color, MoveVector } from '../types/chess.types'

export const BOARD_SIZE = 8

/**
 * Standard piece movement vectors for 2D chess
 * Extended to 4D (dx, dy, dt, dl)
 */
export const PIECE_MOVES: Record<PieceType, MoveVector[]> = {
  king: [
    // Standard 2D moves
    { dx: 1, dy: 0, dt: 0, dl: 0 },
    { dx: -1, dy: 0, dt: 0, dl: 0 },
    { dx: 0, dy: 1, dt: 0, dl: 0 },
    { dx: 0, dy: -1, dt: 0, dl: 0 },
    { dx: 1, dy: 1, dt: 0, dl: 0 },
    { dx: 1, dy: -1, dt: 0, dl: 0 },
    { dx: -1, dy: 1, dt: 0, dl: 0 },
    { dx: -1, dy: -1, dt: 0, dl: 0 },
    // Time travel moves (can move 1 step in time)
    { dx: 0, dy: 0, dt: 1, dl: 0 },
    { dx: 0, dy: 0, dt: -1, dl: 0 },
    // Timeline travel moves (can move 1 step across timelines)
    { dx: 0, dy: 0, dt: 0, dl: 1 },
    { dx: 0, dy: 0, dt: 0, dl: -1 },
  ],

  queen: [
    // Sliding pieces - vectors indicate direction, not single moves
    // 2D diagonal and orthogonal
    { dx: 1, dy: 0, dt: 0, dl: 0 },
    { dx: -1, dy: 0, dt: 0, dl: 0 },
    { dx: 0, dy: 1, dt: 0, dl: 0 },
    { dx: 0, dy: -1, dt: 0, dl: 0 },
    { dx: 1, dy: 1, dt: 0, dl: 0 },
    { dx: 1, dy: -1, dt: 0, dl: 0 },
    { dx: -1, dy: 1, dt: 0, dl: 0 },
    { dx: -1, dy: -1, dt: 0, dl: 0 },
    // Time travel (can slide through time)
    { dx: 0, dy: 0, dt: 1, dl: 0 },
    { dx: 0, dy: 0, dt: -1, dl: 0 },
    // Timeline travel (can slide through timelines)
    { dx: 0, dy: 0, dt: 0, dl: 1 },
    { dx: 0, dy: 0, dt: 0, dl: -1 },
    // Diagonal in time-space
    { dx: 1, dy: 0, dt: 1, dl: 0 },
    { dx: -1, dy: 0, dt: 1, dl: 0 },
    { dx: 0, dy: 1, dt: 1, dl: 0 },
    { dx: 0, dy: -1, dt: 1, dl: 0 },
    { dx: 1, dy: 0, dt: -1, dl: 0 },
    { dx: -1, dy: 0, dt: -1, dl: 0 },
    { dx: 0, dy: 1, dt: -1, dl: 0 },
    { dx: 0, dy: -1, dt: -1, dl: 0 },
    // Diagonal in timeline-space
    { dx: 1, dy: 0, dt: 0, dl: 1 },
    { dx: -1, dy: 0, dt: 0, dl: 1 },
    { dx: 0, dy: 1, dt: 0, dl: 1 },
    { dx: 0, dy: -1, dt: 0, dl: 1 },
    { dx: 1, dy: 0, dt: 0, dl: -1 },
    { dx: -1, dy: 0, dt: 0, dl: -1 },
    { dx: 0, dy: 1, dt: 0, dl: -1 },
    { dx: 0, dy: -1, dt: 0, dl: -1 },
  ],

  rook: [
    // 2D orthogonal
    { dx: 1, dy: 0, dt: 0, dl: 0 },
    { dx: -1, dy: 0, dt: 0, dl: 0 },
    { dx: 0, dy: 1, dt: 0, dl: 0 },
    { dx: 0, dy: -1, dt: 0, dl: 0 },
    // Time travel
    { dx: 0, dy: 0, dt: 1, dl: 0 },
    { dx: 0, dy: 0, dt: -1, dl: 0 },
    // Timeline travel
    { dx: 0, dy: 0, dt: 0, dl: 1 },
    { dx: 0, dy: 0, dt: 0, dl: -1 },
  ],

  bishop: [
    // 2D diagonal
    { dx: 1, dy: 1, dt: 0, dl: 0 },
    { dx: 1, dy: -1, dt: 0, dl: 0 },
    { dx: -1, dy: 1, dt: 0, dl: 0 },
    { dx: -1, dy: -1, dt: 0, dl: 0 },
    // Diagonal in time-space (x/y + time)
    { dx: 1, dy: 0, dt: 1, dl: 0 },
    { dx: -1, dy: 0, dt: 1, dl: 0 },
    { dx: 0, dy: 1, dt: 1, dl: 0 },
    { dx: 0, dy: -1, dt: 1, dl: 0 },
    { dx: 1, dy: 0, dt: -1, dl: 0 },
    { dx: -1, dy: 0, dt: -1, dl: 0 },
    { dx: 0, dy: 1, dt: -1, dl: 0 },
    { dx: 0, dy: -1, dt: -1, dl: 0 },
    // Diagonal in timeline-space (x/y + timeline)
    { dx: 1, dy: 0, dt: 0, dl: 1 },
    { dx: -1, dy: 0, dt: 0, dl: 1 },
    { dx: 0, dy: 1, dt: 0, dl: 1 },
    { dx: 0, dy: -1, dt: 0, dl: 1 },
    { dx: 1, dy: 0, dt: 0, dl: -1 },
    { dx: -1, dy: 0, dt: 0, dl: -1 },
    { dx: 0, dy: 1, dt: 0, dl: -1 },
    { dx: 0, dy: -1, dt: 0, dl: -1 },
  ],

  knight: [
    // Standard 2D L-shaped moves
    { dx: 2, dy: 1, dt: 0, dl: 0 },
    { dx: 2, dy: -1, dt: 0, dl: 0 },
    { dx: -2, dy: 1, dt: 0, dl: 0 },
    { dx: -2, dy: -1, dt: 0, dl: 0 },
    { dx: 1, dy: 2, dt: 0, dl: 0 },
    { dx: 1, dy: -2, dt: 0, dl: 0 },
    { dx: -1, dy: 2, dt: 0, dl: 0 },
    { dx: -1, dy: -2, dt: 0, dl: 0 },
    // L-shaped moves in time (2 time + 1 space)
    { dx: 1, dy: 0, dt: 2, dl: 0 },
    { dx: -1, dy: 0, dt: 2, dl: 0 },
    { dx: 0, dy: 1, dt: 2, dl: 0 },
    { dx: 0, dy: -1, dt: 2, dl: 0 },
    { dx: 1, dy: 0, dt: -2, dl: 0 },
    { dx: -1, dy: 0, dt: -2, dl: 0 },
    { dx: 0, dy: 1, dt: -2, dl: 0 },
    { dx: 0, dy: -1, dt: -2, dl: 0 },
    { dx: 2, dy: 0, dt: 1, dl: 0 },
    { dx: -2, dy: 0, dt: 1, dl: 0 },
    { dx: 0, dy: 2, dt: 1, dl: 0 },
    { dx: 0, dy: -2, dt: 1, dl: 0 },
    { dx: 2, dy: 0, dt: -1, dl: 0 },
    { dx: -2, dy: 0, dt: -1, dl: 0 },
    { dx: 0, dy: 2, dt: -1, dl: 0 },
    { dx: 0, dy: -2, dt: -1, dl: 0 },
    // L-shaped moves in timeline
    { dx: 1, dy: 0, dt: 0, dl: 2 },
    { dx: -1, dy: 0, dt: 0, dl: 2 },
    { dx: 0, dy: 1, dt: 0, dl: 2 },
    { dx: 0, dy: -1, dt: 0, dl: 2 },
    { dx: 1, dy: 0, dt: 0, dl: -2 },
    { dx: -1, dy: 0, dt: 0, dl: -2 },
    { dx: 0, dy: 1, dt: 0, dl: -2 },
    { dx: 0, dy: -1, dt: 0, dl: -2 },
    { dx: 2, dy: 0, dt: 0, dl: 1 },
    { dx: -2, dy: 0, dt: 0, dl: 1 },
    { dx: 0, dy: 2, dt: 0, dl: 1 },
    { dx: 0, dy: -2, dt: 0, dl: 1 },
    { dx: 2, dy: 0, dt: 0, dl: -1 },
    { dx: -2, dy: 0, dt: 0, dl: -1 },
    { dx: 0, dy: 2, dt: 0, dl: -1 },
    { dx: 0, dy: -2, dt: 0, dl: -1 },
  ],

  pawn: [], // Pawns have special movement rules handled separately

  // Special 5D pieces
  unicorn: [
    // The unicorn moves like a 3D bishop - diagonal across all three spatial axes
    // In 5D chess, it can move diagonally in time-timeline space
    { dx: 0, dy: 0, dt: 1, dl: 1 },
    { dx: 0, dy: 0, dt: 1, dl: -1 },
    { dx: 0, dy: 0, dt: -1, dl: 1 },
    { dx: 0, dy: 0, dt: -1, dl: -1 },
    // Plus the normal 2D diagonal moves
    { dx: 1, dy: 1, dt: 0, dl: 0 },
    { dx: 1, dy: -1, dt: 0, dl: 0 },
    { dx: -1, dy: 1, dt: 0, dl: 0 },
    { dx: -1, dy: -1, dt: 0, dl: 0 },
  ],

  dragon: [
    // The dragon combines rook and unicorn
    // 2D orthogonal
    { dx: 1, dy: 0, dt: 0, dl: 0 },
    { dx: -1, dy: 0, dt: 0, dl: 0 },
    { dx: 0, dy: 1, dt: 0, dl: 0 },
    { dx: 0, dy: -1, dt: 0, dl: 0 },
    // Time travel
    { dx: 0, dy: 0, dt: 1, dl: 0 },
    { dx: 0, dy: 0, dt: -1, dl: 0 },
    // Timeline travel
    { dx: 0, dy: 0, dt: 0, dl: 1 },
    { dx: 0, dy: 0, dt: 0, dl: -1 },
    // Diagonal in time-timeline
    { dx: 0, dy: 0, dt: 1, dl: 1 },
    { dx: 0, dy: 0, dt: 1, dl: -1 },
    { dx: 0, dy: 0, dt: -1, dl: 1 },
    { dx: 0, dy: 0, dt: -1, dl: -1 },
  ],
}

/** Pieces that slide (can move multiple squares in one direction) */
export const SLIDING_PIECES: PieceType[] = [
  'queen',
  'rook',
  'bishop',
  'unicorn',
  'dragon',
]

/** Pieces that jump (move exactly to the vector position, no sliding) */
export const JUMPING_PIECES: PieceType[] = ['knight', 'king']

/** Initial piece setup for standard chess */
export const INITIAL_PIECE_POSITIONS: { position: [number, number]; piece: Piece }[] =
  [
    // White pieces (row 0 and 1)
    { position: [0, 0], piece: { type: 'rook', color: 'white' } },
    { position: [1, 0], piece: { type: 'knight', color: 'white' } },
    { position: [2, 0], piece: { type: 'bishop', color: 'white' } },
    { position: [3, 0], piece: { type: 'queen', color: 'white' } },
    { position: [4, 0], piece: { type: 'king', color: 'white' } },
    { position: [5, 0], piece: { type: 'bishop', color: 'white' } },
    { position: [6, 0], piece: { type: 'knight', color: 'white' } },
    { position: [7, 0], piece: { type: 'rook', color: 'white' } },
    { position: [0, 1], piece: { type: 'pawn', color: 'white' } },
    { position: [1, 1], piece: { type: 'pawn', color: 'white' } },
    { position: [2, 1], piece: { type: 'pawn', color: 'white' } },
    { position: [3, 1], piece: { type: 'pawn', color: 'white' } },
    { position: [4, 1], piece: { type: 'pawn', color: 'white' } },
    { position: [5, 1], piece: { type: 'pawn', color: 'white' } },
    { position: [6, 1], piece: { type: 'pawn', color: 'white' } },
    { position: [7, 1], piece: { type: 'pawn', color: 'white' } },
    // Black pieces (row 6 and 7)
    { position: [0, 7], piece: { type: 'rook', color: 'black' } },
    { position: [1, 7], piece: { type: 'knight', color: 'black' } },
    { position: [2, 7], piece: { type: 'bishop', color: 'black' } },
    { position: [3, 7], piece: { type: 'queen', color: 'black' } },
    { position: [4, 7], piece: { type: 'king', color: 'black' } },
    { position: [5, 7], piece: { type: 'bishop', color: 'black' } },
    { position: [6, 7], piece: { type: 'knight', color: 'black' } },
    { position: [7, 7], piece: { type: 'rook', color: 'black' } },
    { position: [0, 6], piece: { type: 'pawn', color: 'black' } },
    { position: [1, 6], piece: { type: 'pawn', color: 'black' } },
    { position: [2, 6], piece: { type: 'pawn', color: 'black' } },
    { position: [3, 6], piece: { type: 'pawn', color: 'black' } },
    { position: [4, 6], piece: { type: 'pawn', color: 'black' } },
    { position: [5, 6], piece: { type: 'pawn', color: 'black' } },
    { position: [6, 6], piece: { type: 'pawn', color: 'black' } },
    { position: [7, 6], piece: { type: 'pawn', color: 'black' } },
  ]

/** Piece symbols for display */
export const PIECE_SYMBOLS: Record<Color, Record<PieceType, string>> = {
  white: {
    king: '♔',
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙',
    unicorn: '🦄',
    dragon: '🐉',
  },
  black: {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟',
    unicorn: '🦄',
    dragon: '🐉',
  },
}

/** Column names */
export const COLUMN_NAMES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
