import { useGameStore } from "../../store/gameStore";

const STATUS_LABELS: Record<string, string> = {
  playing: "进行中",
  checkmate: "将死",
  stalemate: "僵局",
  draw: "和棋",
};

export function PlayerInfo() {
  const gameState = useGameStore((s) => s.gameState);
  const gameMode = useGameStore((s) => s.gameMode);
  const gameMessage = useGameStore((s) => s.gameMessage);

  const modeLabels: Record<string, string> = {
    "local-pvp": "本地双人",
    "local-ai": "人机对战",
    online: "在线对战",
  };

  return (
    <div data-testid="player-info">
      <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-4">
        游戏信息
      </h2>

      <div className="space-y-4">
        {/* 游戏模式 */}
        <div className="px-3 py-2 rounded-lg bg-slate-700/50">
          <span className="text-xs text-slate-400">模式</span>
          <p className="font-medium">{modeLabels[gameMode]}</p>
        </div>

        {/* 白方 */}
        <div
          className={`px-3 py-2 rounded-lg ${gameState.currentPlayer === "white" ? "bg-blue-900/40 border border-blue-500/50" : "bg-slate-700/50"}`}
          data-testid="player-white"
        >
          <span className="text-xs text-slate-400">白方 ♔</span>
          <p className="font-medium">玩家 1</p>
        </div>

        {/* 黑方 */}
        <div
          className={`px-3 py-2 rounded-lg ${gameState.currentPlayer === "black" ? "bg-blue-900/40 border border-blue-500/50" : "bg-slate-700/50"}`}
          data-testid="player-black"
        >
          <span className="text-xs text-slate-400">黑方 ♚</span>
          <p className="font-medium">
            {gameMode === "local-ai" ? "AI" : "玩家 2"}
          </p>
        </div>

        {/* 游戏状态 */}
        <div className="px-3 py-2 rounded-lg bg-slate-700/50">
          <span className="text-xs text-slate-400">状态</span>
          <p className="font-medium">
            {STATUS_LABELS[gameState.gameStatus] ?? gameState.gameStatus}
          </p>
          {gameState.gameStatus === "checkmate" && gameState.winner && (
            <p className="text-xs text-yellow-400 mt-1">
              {gameState.winner === "white" ? "白方" : "黑方"}获胜
            </p>
          )}
        </div>

        {/* 游戏消息 */}
        {gameMessage && (
          <div
            className="px-3 py-2 rounded-lg bg-yellow-900/30 border border-yellow-600/50"
            data-testid="game-status-message"
          >
            <span className="text-xs text-yellow-400">提示</span>
            <p className="font-medium text-yellow-300">{gameMessage}</p>
          </div>
        )}

        {/* 时间线数 */}
        <div className="px-3 py-2 rounded-lg bg-slate-700/50">
          <span className="text-xs text-slate-400">时间线数</span>
          <p className="font-medium">{gameState.timelines.size}</p>
        </div>
      </div>
    </div>
  );
}
