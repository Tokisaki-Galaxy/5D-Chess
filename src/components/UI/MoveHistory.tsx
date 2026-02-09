import type { Move } from "../../types/game.types";
import { PIECE_SYMBOLS } from "../../game/engine/GameState";

interface MoveHistoryProps {
  moves: Move[];
}

const COL_NAMES = ["a", "b", "c", "d", "e", "f", "g", "h"];

function formatPosition(x: number, y: number): string {
  return `${COL_NAMES[x]}${y + 1}`;
}

export function MoveHistory({ moves }: MoveHistoryProps) {
  return (
    <div data-testid="move-history">
      <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-4">
        移动历史
      </h2>

      {moves.length === 0 ? (
        <p className="text-sm text-slate-500">尚无移动记录</p>
      ) : (
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {moves.map((move, i) => (
            <div
              key={move.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded text-sm bg-slate-700/30 hover:bg-slate-700/50"
            >
              <span className="text-slate-500 w-6">{i + 1}.</span>
              <span>
                {PIECE_SYMBOLS[move.piece.type][move.piece.color]}
              </span>
              <span className="text-slate-400">
                {formatPosition(move.from.x, move.from.y)}
              </span>
              <span className="text-slate-500">→</span>
              <span className="text-slate-300">
                {formatPosition(move.to.x, move.to.y)}
              </span>
              {move.capturedPiece && (
                <span className="text-red-400 text-xs">
                  ×{PIECE_SYMBOLS[move.capturedPiece.type][move.capturedPiece.color]}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
