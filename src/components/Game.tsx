/**
 * Main Game Component
 * Orchestrates all game UI components
 */

import React, { useCallback, useEffect, useRef } from 'react'
import { useGame } from '../hooks/useGame'
import { MultiverseView } from './MultiverseView'
import { GameControls } from './GameControls'
import { getValidMoves } from '../engine'
import type { Position4D } from '../types/chess.types'
import './Game.css'

export function Game() {
  const { state, dispatch, actions } = useGame()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSquareClick = useCallback(
    (position: Position4D) => {
      const { gameState, selectedPiece, validMoves } = state

      // If a piece is already selected
      if (selectedPiece) {
        // Check if clicking on a valid move target
        const isValidTarget = validMoves.some(
          (m) =>
            m.x === position.x &&
            m.y === position.y &&
            m.t === position.t &&
            m.l === position.l
        )

        if (isValidTarget) {
          // Make the move
          actions.makeMove(selectedPiece, position)
          return
        }

        // Check if clicking on another piece of the same color
        const timeline = gameState.timelines.find((t) => t.id === position.l)
        if (timeline) {
          const board = timeline.boards[position.t]
          if (board) {
            const piece = board.squares[position.y][position.x]
            if (piece && piece.color === gameState.currentPlayer) {
              // Select the new piece
              actions.selectPiece(position)
              const moves = getValidMoves(gameState, position)
              dispatch({ type: 'SET_VALID_MOVES', moves })
              return
            }
          }
        }

        // Deselect if clicking elsewhere
        actions.deselectPiece()
        return
      }

      // No piece selected, try to select one
      const timeline = gameState.timelines.find((t) => t.id === position.l)
      if (!timeline) return

      const board = timeline.boards[position.t]
      if (!board) return

      const piece = board.squares[position.y][position.x]
      if (piece && piece.color === gameState.currentPlayer) {
        // Only allow selecting from the latest board
        const isLatestBoard = position.t === timeline.boards.length - 1
        if (isLatestBoard) {
          actions.selectPiece(position)
          const moves = getValidMoves(gameState, position)
          dispatch({ type: 'SET_VALID_MOVES', moves })
        }
      }
    },
    [state, actions, dispatch]
  )

  const handleSave = useCallback(() => {
    const saveData = actions.saveGame()
    const blob = new Blob([saveData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `5d-chess-save-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [actions])

  const handleLoad = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const content = e.target?.result as string
          actions.loadGame(content)
        }
        reader.readAsText(file)
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [actions]
  )

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        actions.undoMove()
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault()
        actions.redoMove()
      } else if (e.key === 'Escape') {
        actions.deselectPiece()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [actions])

  return (
    <div className="game-container">
      <aside className="game-sidebar">
        <GameControls
          gameState={state.gameState}
          onNewGame={actions.newGame}
          onUndo={actions.undoMove}
          onRedo={actions.redoMove}
          onSave={handleSave}
          onLoad={handleLoad}
        />
      </aside>

      <main className="game-main">
        <MultiverseView
          gameState={state.gameState}
          selectedPiece={state.selectedPiece}
          validMoves={state.validMoves}
          onSquareClick={handleSquareClick}
        />
      </main>

      {/* Hidden file input for loading games */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Error display */}
      {state.error && (
        <div className="error-toast">
          <span>{state.error}</span>
          <button onClick={() => dispatch({ type: 'CLEAR_ERROR' })}>×</button>
        </div>
      )}
    </div>
  )
}
