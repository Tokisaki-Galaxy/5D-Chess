/**
 * Game Controls Component
 */

import type { GameState, Color, GameStatus } from '../types/chess.types'
import './GameControls.css'

interface GameControlsProps {
  gameState: GameState
  onNewGame: () => void
  onUndo: () => void
  onRedo: () => void
  onSave: () => void
  onLoad: () => void
}

export function GameControls({
  gameState,
  onNewGame,
  onUndo,
  onRedo,
  onSave,
  onLoad,
}: GameControlsProps) {
  const getStatusText = (status: GameStatus, currentPlayer: Color): string => {
    switch (status) {
      case 'playing':
        return `${currentPlayer === 'white' ? 'White' : 'Black'} to move`
      case 'check':
        return `${currentPlayer === 'white' ? 'White' : 'Black'} is in CHECK!`
      case 'checkmate':
        return `CHECKMATE! ${gameState.winner === 'white' ? 'White' : 'Black'} wins!`
      case 'stalemate':
        return 'STALEMATE! Game is a draw.'
      case 'draw':
        return 'Game is a DRAW.'
      default:
        return ''
    }
  }

  const getStatusClass = (status: GameStatus): string => {
    switch (status) {
      case 'check':
        return 'status-check'
      case 'checkmate':
        return 'status-checkmate'
      case 'stalemate':
      case 'draw':
        return 'status-draw'
      default:
        return ''
    }
  }

  return (
    <div className="game-controls">
      <div className="game-info">
        <h1 className="game-title">5D Chess</h1>
        <p className="game-subtitle">with Multiverse Time Travel</p>

        <div className={`game-status ${getStatusClass(gameState.status)}`}>
          {getStatusText(gameState.status, gameState.currentPlayer)}
        </div>

        <div className="game-stats">
          <div className="stat">
            <span className="stat-label">Turn</span>
            <span className="stat-value">{gameState.presentTurn + 1}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Timelines</span>
            <span className="stat-value">{gameState.timelines.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Moves</span>
            <span className="stat-value">{gameState.moveHistory.length}</span>
          </div>
        </div>

        <div className="current-player">
          <div className={`player-indicator ${gameState.currentPlayer}`} />
          <span>{gameState.currentPlayer === 'white' ? "White's Turn" : "Black's Turn"}</span>
        </div>
      </div>

      <div className="control-buttons">
        <button className="control-btn new-game" onClick={onNewGame}>
          🎮 New Game
        </button>

        <div className="undo-redo-group">
          <button
            className="control-btn"
            onClick={onUndo}
            disabled={gameState.moveHistory.length === 0}
            title="Undo (Ctrl+Z)"
          >
            ↶ Undo
          </button>
          <button
            className="control-btn"
            onClick={onRedo}
            disabled={gameState.redoStack.length === 0}
            title="Redo (Ctrl+Y)"
          >
            ↷ Redo
          </button>
        </div>

        <div className="save-load-group">
          <button className="control-btn" onClick={onSave} title="Save Game">
            💾 Save
          </button>
          <button className="control-btn" onClick={onLoad} title="Load Game">
            📂 Load
          </button>
        </div>
      </div>

      <div className="game-instructions">
        <h3>How to Play</h3>
        <ul>
          <li>Click a piece to select it</li>
          <li>Click a highlighted square to move</li>
          <li>Pieces can move through time and across timelines</li>
          <li>Moving to the past creates a new timeline</li>
          <li>Checkmate any king to win!</li>
        </ul>
      </div>
    </div>
  )
}
