/**
 * Multiverse View Component
 * Displays all timelines and their boards in a 2D grid
 */

import { useMemo } from 'react'
import type { GameState, Position2D, Position4D } from '../types/chess.types'
import { ChessBoard } from './ChessBoard'
import './MultiverseView.css'

interface MultiverseViewProps {
  gameState: GameState
  selectedPiece: Position4D | null
  validMoves: Position4D[]
  onSquareClick: (position: Position4D) => void
}

export function MultiverseView({
  gameState,
  selectedPiece,
  validMoves,
  onSquareClick,
}: MultiverseViewProps) {
  // Sort timelines by ID (negative, zero, positive)
  const sortedTimelines = useMemo(() => {
    return [...gameState.timelines].sort((a, b) => a.id - b.id)
  }, [gameState.timelines])

  // Calculate the maximum number of turns across all timelines
  const maxTurns = useMemo(() => {
    return Math.max(...gameState.timelines.map((t) => t.boards.length))
  }, [gameState.timelines])

  // Get selected square for a specific board
  const getSelectedSquare = (timelineId: number, turnIndex: number): Position2D | null => {
    if (!selectedPiece) return null
    if (selectedPiece.l === timelineId && selectedPiece.t === turnIndex) {
      return { x: selectedPiece.x, y: selectedPiece.y }
    }
    return null
  }

  // Check if a board is the latest in its timeline
  const isLatestBoard = (timeline: { boards: unknown[] }, turnIndex: number): boolean => {
    return turnIndex === timeline.boards.length - 1
  }

  return (
    <div className="multiverse-view">
      <div className="multiverse-header">
        <div className="time-axis-label">Time →</div>
        <div className="timeline-axis-label">↑ Timeline</div>
      </div>

      <div className="multiverse-grid">
        {/* Render timelines from top (positive) to bottom (negative) */}
        {sortedTimelines.reverse().map((timeline) => (
          <div key={timeline.id} className="timeline-row">
            <div className="timeline-info">
              <span className={`timeline-id ${timeline.id > 0 ? 'white' : timeline.id < 0 ? 'black' : 'main'}`}>
                L{timeline.id >= 0 ? '+' : ''}{timeline.id}
              </span>
              {timeline.parentTimelineId >= 0 && (
                <span className="branch-info">
                  (from L{timeline.parentTimelineId} T{timeline.originTurn})
                </span>
              )}
            </div>

            <div className="boards-container">
              {timeline.boards.map((board, turnIndex) => (
                <div
                  key={turnIndex}
                  className={`board-wrapper ${isLatestBoard(timeline, turnIndex) ? 'latest' : ''}`}
                >
                  <ChessBoard
                    board={board}
                    timelineId={timeline.id}
                    turnIndex={turnIndex}
                    isLatestBoard={isLatestBoard(timeline, turnIndex)}
                    selectedSquare={getSelectedSquare(timeline.id, turnIndex)}
                    validMoves={validMoves}
                    currentPlayer={gameState.currentPlayer}
                    onSquareClick={onSquareClick}
                  />
                </div>
              ))}

              {/* Placeholder for empty time slots */}
              {Array.from({ length: maxTurns - timeline.boards.length }, (_, i) => (
                <div key={`empty-${i}`} className="board-placeholder" />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Time axis labels */}
      <div className="time-axis">
        {Array.from({ length: maxTurns }, (_, i) => (
          <div key={i} className="time-marker">
            T{i}
          </div>
        ))}
      </div>
    </div>
  )
}
