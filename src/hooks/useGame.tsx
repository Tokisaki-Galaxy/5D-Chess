/* eslint-disable react-refresh/only-export-components */
/**
 * Game Context for 5D Chess
 * Provides global game state management using React Context
 */

import React, { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react'
import type { GameState, Position4D, PieceType } from '../types/chess.types'
import {
  createNewGame,
  makeMove as engineMakeMove,
  undoMove as engineUndoMove,
  redoMove as engineRedoMove,
  serializeGameState,
  deserializeGameState,
} from '../engine'

/** Game mode */
export type GameMode = 'local' | 'online-host' | 'online-join'

/** Extended game state for UI */
export interface UIGameState {
  gameState: GameState
  selectedPiece: Position4D | null
  validMoves: Position4D[]
  gameMode: GameMode
  isLoading: boolean
  error: string | null
}

/** Game actions */
type GameAction =
  | { type: 'NEW_GAME' }
  | { type: 'SELECT_PIECE'; position: Position4D }
  | { type: 'DESELECT_PIECE' }
  | { type: 'SET_VALID_MOVES'; moves: Position4D[] }
  | { type: 'MAKE_MOVE'; from: Position4D; to: Position4D; promotion?: PieceType }
  | { type: 'MOVE_SUCCESS'; newState: GameState }
  | { type: 'MOVE_FAILED'; error: string }
  | { type: 'UNDO_MOVE' }
  | { type: 'REDO_MOVE' }
  | { type: 'LOAD_GAME'; state: GameState }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_MODE'; mode: GameMode }

/** Game context type */
interface GameContextType {
  state: UIGameState
  dispatch: React.Dispatch<GameAction>
  actions: {
    newGame: () => void
    selectPiece: (position: Position4D) => void
    deselectPiece: () => void
    makeMove: (from: Position4D, to: Position4D, promotion?: PieceType) => void
    undoMove: () => void
    redoMove: () => void
    saveGame: () => string
    loadGame: (data: string) => void
    setGameMode: (mode: GameMode) => void
  }
}

/** Initial UI state */
function createInitialUIState(): UIGameState {
  return {
    gameState: createNewGame(),
    selectedPiece: null,
    validMoves: [],
    gameMode: 'local',
    isLoading: false,
    error: null,
  }
}

/** Game reducer */
function gameReducer(state: UIGameState, action: GameAction): UIGameState {
  switch (action.type) {
    case 'NEW_GAME':
      return {
        ...createInitialUIState(),
        gameMode: state.gameMode,
      }

    case 'SELECT_PIECE':
      return {
        ...state,
        selectedPiece: action.position,
      }

    case 'DESELECT_PIECE':
      return {
        ...state,
        selectedPiece: null,
        validMoves: [],
      }

    case 'SET_VALID_MOVES':
      return {
        ...state,
        validMoves: action.moves,
      }

    case 'MAKE_MOVE': {
      const result = engineMakeMove(
        state.gameState,
        action.from,
        action.to,
        action.promotion
      )

      if (result.success) {
        return {
          ...state,
          gameState: result.newState,
          selectedPiece: null,
          validMoves: [],
          error: null,
        }
      } else {
        return {
          ...state,
          error: result.error || 'Invalid move',
        }
      }
    }

    case 'MOVE_SUCCESS':
      return {
        ...state,
        gameState: action.newState,
        selectedPiece: null,
        validMoves: [],
        error: null,
      }

    case 'MOVE_FAILED':
      return {
        ...state,
        error: action.error,
      }

    case 'UNDO_MOVE': {
      const result = engineUndoMove(state.gameState)
      if (result.success) {
        return {
          ...state,
          gameState: result.newState,
          selectedPiece: null,
          validMoves: [],
        }
      }
      return state
    }

    case 'REDO_MOVE': {
      const result = engineRedoMove(state.gameState)
      if (result.success) {
        return {
          ...state,
          gameState: result.newState,
          selectedPiece: null,
          validMoves: [],
        }
      }
      return state
    }

    case 'LOAD_GAME':
      return {
        ...state,
        gameState: action.state,
        selectedPiece: null,
        validMoves: [],
        error: null,
      }

    case 'SET_ERROR':
      return {
        ...state,
        error: action.error,
      }

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      }

    case 'SET_MODE':
      return {
        ...state,
        gameMode: action.mode,
      }

    default:
      return state
  }
}

/** Create the context */
const GameContext = createContext<GameContextType | null>(null)

/** Game Provider Component */
export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, null, createInitialUIState)

  const actions = {
    newGame: useCallback(() => {
      dispatch({ type: 'NEW_GAME' })
    }, []),

    selectPiece: useCallback((position: Position4D) => {
      dispatch({ type: 'SELECT_PIECE', position })
    }, []),

    deselectPiece: useCallback(() => {
      dispatch({ type: 'DESELECT_PIECE' })
    }, []),

    makeMove: useCallback((from: Position4D, to: Position4D, promotion?: PieceType) => {
      dispatch({ type: 'MAKE_MOVE', from, to, promotion })
    }, []),

    undoMove: useCallback(() => {
      dispatch({ type: 'UNDO_MOVE' })
    }, []),

    redoMove: useCallback(() => {
      dispatch({ type: 'REDO_MOVE' })
    }, []),

    saveGame: useCallback((): string => {
      return serializeGameState(state.gameState)
    }, [state.gameState]),

    loadGame: useCallback((data: string) => {
      const loadedState = deserializeGameState(data)
      if (loadedState) {
        dispatch({ type: 'LOAD_GAME', state: loadedState })
      } else {
        dispatch({ type: 'SET_ERROR', error: 'Failed to load game' })
      }
    }, []),

    setGameMode: useCallback((mode: GameMode) => {
      dispatch({ type: 'SET_MODE', mode })
    }, []),
  }

  return (
    <GameContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </GameContext.Provider>
  )
}

/** Hook to use the game context */
export function useGame(): GameContextType {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}
