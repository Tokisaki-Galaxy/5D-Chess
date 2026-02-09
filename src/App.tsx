import { useState } from "react";
import { GameMenu } from "./components/UI/GameMenu";
import { ChessBoard } from "./components/Board/ChessBoard";
import { PlayerInfo } from "./components/UI/PlayerInfo";
import { MoveHistory } from "./components/UI/MoveHistory";
import { useGameStore } from "./store/gameStore";
import type { GameMode, AIDifficulty } from "./types/game.types";

type View = "menu" | "game";

export default function App() {
  const [view, setView] = useState<View>("menu");
  const startGame = useGameStore((s) => s.startGame);

  const handleStartGame = (mode: GameMode, difficulty?: AIDifficulty) => {
    startGame(mode, difficulty);
    setView("game");
  };

  const handleBackToMenu = () => {
    setView("menu");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {view === "menu" && <GameMenu onStartGame={handleStartGame} />}
      {view === "game" && (
        <GameView onBack={handleBackToMenu} />
      )}
    </div>
  );
}

function GameView({ onBack }: { onBack: () => void }) {
  const gameState = useGameStore((s) => s.gameState);
  const resetGame = useGameStore((s) => s.resetGame);

  return (
    <div className="flex flex-col min-h-screen">
      {/* 顶栏 */}
      <header className="flex items-center justify-between px-6 py-3 bg-slate-800 border-b border-slate-700">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
          data-testid="back-btn"
        >
          ← 返回菜单
        </button>
        <h1 className="text-lg font-bold text-blue-400">5D Chess</h1>
        <button
          onClick={resetGame}
          className="px-4 py-2 text-sm rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
          data-testid="reset-btn"
        >
          重置游戏
        </button>
      </header>

      {/* 主体 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧：玩家信息 */}
        <aside className="w-60 p-4 bg-slate-800 border-r border-slate-700 hidden lg:block">
          <PlayerInfo />
        </aside>

        {/* 中间：棋盘 */}
        <main className="flex-1 flex items-center justify-center p-4">
          <ChessBoard />
        </main>

        {/* 右侧：移动历史 */}
        <aside className="w-72 p-4 bg-slate-800 border-l border-slate-700 hidden lg:block">
          <MoveHistory moves={gameState.moveHistory} />
        </aside>
      </div>
    </div>
  );
}
