import { useState } from "react";
import type { GameMode, AIDifficulty } from "../../types/game.types";

interface GameMenuProps {
  onStartGame: (mode: GameMode, difficulty?: AIDifficulty) => void;
}

export function GameMenu({ onStartGame }: GameMenuProps) {
  const [showAIDifficulty, setShowAIDifficulty] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* 标题 */}
      <div className="text-center mb-12">
        <h1
          className="text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"
          data-testid="game-title"
        >
          5D Chess
        </h1>
        <p className="text-slate-400 text-lg">
          with Multiverse Time Travel
        </p>
      </div>

      {/* 模式选择 */}
      <div className="w-full max-w-md space-y-4" data-testid="game-menu">
        {!showAIDifficulty ? (
          <>
            <MenuButton
              label="🎮 本地双人对战"
              description="在同一设备上与朋友对弈"
              onClick={() => onStartGame("local-pvp")}
              testId="mode-local-pvp"
            />
            <MenuButton
              label="🤖 人机对战"
              description="与AI对弈，选择难度级别"
              onClick={() => setShowAIDifficulty(true)}
              testId="mode-local-ai"
            />
            <MenuButton
              label="🌐 在线对战"
              description="创建或加入房间与他人对战"
              onClick={() => onStartGame("online")}
              testId="mode-online"
              disabled
            />
          </>
        ) : (
          <>
            <p className="text-center text-slate-300 mb-2">选择AI难度</p>
            <MenuButton
              label="😊 简单"
              description="只考虑当前时间线"
              onClick={() => onStartGame("local-ai", "easy")}
              testId="ai-easy"
            />
            <MenuButton
              label="🤔 中等"
              description="考虑2-3条时间线"
              onClick={() => onStartGame("local-ai", "medium")}
              testId="ai-medium"
            />
            <MenuButton
              label="😈 困难"
              description="完整的多时间线策略"
              onClick={() => onStartGame("local-ai", "hard")}
              testId="ai-hard"
            />
            <button
              className="w-full text-sm text-slate-400 hover:text-slate-200 mt-2"
              onClick={() => setShowAIDifficulty(false)}
              data-testid="ai-back"
            >
              ← 返回
            </button>
          </>
        )}
      </div>

      {/* 底部信息 */}
      <footer className="mt-16 text-sm text-slate-500">
        <p>基于 Steam 游戏《5D Chess with Multiverse Time Travel》</p>
      </footer>
    </div>
  );
}

function MenuButton({
  label,
  description,
  onClick,
  testId,
  disabled,
}: {
  label: string;
  description: string;
  onClick: () => void;
  testId: string;
  disabled?: boolean;
}) {
  return (
    <button
      className="w-full text-left px-6 py-4 rounded-xl bg-slate-800 border border-slate-700 hover:border-blue-500 hover:bg-slate-750 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      onClick={onClick}
      data-testid={testId}
      disabled={disabled}
    >
      <span className="block text-lg font-semibold">{label}</span>
      <span className="block text-sm text-slate-400 mt-1">{description}</span>
    </button>
  );
}
