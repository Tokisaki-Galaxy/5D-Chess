/**
 * Chess Board Component
 * Renders a single 8x8 chess board
 */

import React from 'react'
import type { Board, Position2D, Position4D, Piece, Color } from '../types/chess.types'
import { PIECE_SYMBOLS, BOARD_SIZE } from '../engine'
import './ChessBoard.css'

interface ChessBoardProps {
  board: Board
  timelineId: number
  turnIndex: number
  isLatestBoard: boolean
  selectedSquare: Position2D | null
  validMoves: Position4D[]
  currentPlayer: Color
  onSquareClick: (position: Position4D) => void
  flipped?: boolean
}

export function ChessBoard({
  board,
  timelineId,
  turnIndex,
  isLatestBoard,
  selectedSquare,
  validMoves,
  currentPlayer,
  onSquareClick,
  flipped = false,
}: ChessBoardProps) {
  const isSquareSelected = (x: number, y: number): boolean => {
    return selectedSquare?.x === x && selectedSquare?.y === y
  }

  const isValidMoveTarget = (x: number, y: number): boolean => {
    return validMoves.some(
      (m) => m.x === x && m.y === y && m.t === turnIndex && m.l === timelineId
    )
  }

  const renderPiece = (piece: Piece | null): React.ReactNode => {
    if (!piece) return null
    return (
      <span className={`piece piece-${piece.color}`}>
        {PIECE_SYMBOLS[piece.color][piece.type]}
      </span>
    )
  }

  const renderSquare = (x: number, y: number): React.ReactNode => {
    const piece = board.squares[y][x]
    const isLight = (x + y) % 2 === 1
    const isSelected = isSquareSelected(x, y)
    const isValidTarget = isValidMoveTarget(x, y)
    const hasPiece = piece !== null
    const isPieceOfCurrentPlayer = piece?.color === currentPlayer

    const squareClasses = [
      'square',
      isLight ? 'light' : 'dark',
      isSelected ? 'selected' : '',
      isValidTarget ? (hasPiece ? 'valid-capture' : 'valid-move') : '',
      isPieceOfCurrentPlayer && isLatestBoard ? 'clickable' : '',
    ]
      .filter(Boolean)
      .join(' ')

    const handleClick = () => {
      onSquareClick({ x, y, t: turnIndex, l: timelineId })
    }

    return (
      <div
        key={`${x}-${y}`}
        className={squareClasses}
        onClick={handleClick}
        data-x={x}
        data-y={y}
      >
        {renderPiece(piece)}
        {isValidTarget && !hasPiece && <div className="move-indicator" />}
      </div>
    )
  }

  const renderRow = (y: number): React.ReactNode => {
    const displayY = flipped ? y : BOARD_SIZE - 1 - y
    const squares = []

    for (let x = 0; x < BOARD_SIZE; x++) {
      const displayX = flipped ? BOARD_SIZE - 1 - x : x
      squares.push(renderSquare(displayX, displayY))
    }

    return (
      <div key={displayY} className="row">
        <div className="row-label">{displayY + 1}</div>
        {squares}
      </div>
    )
  }

  const renderColumnLabels = (): React.ReactNode => {
    const labels = []
    for (let x = 0; x < BOARD_SIZE; x++) {
      const displayX = flipped ? BOARD_SIZE - 1 - x : x
      labels.push(
        <div key={x} className="col-label">
          {String.fromCharCode('a'.charCodeAt(0) + displayX)}
        </div>
      )
    }
    return <div className="col-labels">{labels}</div>
  }

  return (
    <div className={`chess-board ${isLatestBoard ? 'active' : 'historical'}`}>
      <div className="board-header">
        <span className="timeline-label">L{timelineId}</span>
        <span className="turn-label">T{turnIndex}</span>
      </div>
      <div className="board-grid">
        {Array.from({ length: BOARD_SIZE }, (_, i) => renderRow(i))}
        {renderColumnLabels()}
      </div>
    </div>
  )
}
