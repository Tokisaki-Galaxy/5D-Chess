import { useGameStore } from "../../store/gameStore";
import { PIECE_SYMBOLS } from "../../game/engine/GameState";
import type { Piece } from "../../types/game.types";
import type { Board, Timeline } from "../../types/timeline.types";

/** 迷你棋盘组件 - 显示某个时间线某回合的棋盘缩略图 */
function MiniBoard({
  board,
  timelineId,
  turn,
  isActive,
  onClick,
}: {
  board: Board;
  timelineId: number;
  turn: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={`cursor-pointer border-2 rounded-lg p-0.5 transition-all hover:scale-105 ${
        isActive
          ? "border-blue-500 shadow-lg shadow-blue-500/30"
          : "border-slate-600 hover:border-slate-400"
      }`}
      onClick={onClick}
      data-testid={`mini-board-${timelineId}-${turn}`}
      title={`时间线 ${timelineId} · 回合 ${turn}`}
    >
      {/* 8x8 迷你棋盘 */}
      <div className="grid grid-cols-8 w-24 h-24 sm:w-28 sm:h-28">
        {Array.from({ length: 8 }, (_, row) =>
          Array.from({ length: 8 }, (_, col) => {
            const y = 7 - row;
            const x = col;
            const isLight = (x + y) % 2 === 1;
            const piece = board.pieces.find(
              (p: Piece) => p.position.x === x && p.position.y === y,
            );
            return (
              <div
                key={`${x}-${y}`}
                className={`flex items-center justify-center text-[6px] sm:text-[8px] ${
                  isLight ? "bg-[var(--board-light)]" : "bg-[var(--board-dark)]"
                }`}
              >
                {piece && (
                  <span
                    className={
                      piece.color === "white"
                        ? "text-white drop-shadow-sm"
                        : "text-gray-900"
                    }
                  >
                    {PIECE_SYMBOLS[piece.type][piece.color]}
                  </span>
                )}
              </div>
            );
          }),
        )}
      </div>
      {/* 标签 */}
      <div className="text-center text-[10px] text-slate-400 mt-0.5">
        L{timelineId} · T{turn}
      </div>
    </div>
  );
}

/** 时间线视图 - 显示所有时间线和棋盘 */
export function TimelineView() {
  const gameState = useGameStore((s) => s.gameState);
  const navigateTimeline = useGameStore((s) => s.navigateTimeline);

  const timelines = Array.from(gameState.timelines.entries()).sort(
    (a, b) => a[0] - b[0],
  );

  if (timelines.length <= 1) {
    return null; // 单时间线时不显示
  }

  return (
    <div
      className="w-full overflow-x-auto"
      data-testid="timeline-view"
    >
      <div className="flex flex-col gap-3 min-w-max p-2">
        {/* 回合号标题行 */}
        <div className="flex items-center gap-2 ml-20">
          {getUniqueTurns(timelines.map((t) => t[1])).map((turn) => (
            <div
              key={turn}
              className="w-24 sm:w-28 text-center text-xs text-slate-500 font-medium"
            >
              回合 {turn}
            </div>
          ))}
        </div>

        {/* 每条时间线 */}
        {timelines.map(([id, timeline]) => (
          <TimelineRow
            key={id}
            timeline={timeline}
            currentTimeline={gameState.currentTimeline}
            currentTurn={gameState.currentTurn}
            allTurns={getUniqueTurns(timelines.map((t) => t[1]))}
            onNavigate={navigateTimeline}
          />
        ))}
      </div>

      {/* 时间线信息 */}
      <div className="mt-3 px-2 text-xs text-slate-500" data-testid="timeline-info">
        <span className="inline-block w-3 h-3 border-2 border-blue-500 rounded-sm mr-1 align-middle" />
        当前视图 ·
        <span className="text-purple-400 ml-1">
          {gameState.timelines.size} 条时间线
        </span>
      </div>
    </div>
  );
}

/** 时间线行组件 */
function TimelineRow({
  timeline,
  currentTimeline,
  currentTurn,
  allTurns,
  onNavigate,
}: {
  timeline: Timeline;
  currentTimeline: number;
  currentTurn: number;
  allTurns: number[];
  onNavigate: (timelineId: number, turn: number) => void;
}) {
  const isCurrentTimeline = timeline.id === currentTimeline;

  return (
    <div className="flex items-center gap-2" data-testid={`timeline-row-${timeline.id}`}>
      {/* 时间线标签 */}
      <div
        className={`w-16 text-right text-xs font-bold pr-2 ${
          isCurrentTimeline ? "text-blue-400" : "text-slate-500"
        }`}
      >
        <div>L{timeline.id}</div>
        {timeline.parentTimeline !== null && (
          <div className="text-[10px] text-purple-400">
            ← L{timeline.parentTimeline}
          </div>
        )}
      </div>

      {/* 棋盘格子 */}
      <div className="flex items-center gap-2">
        {allTurns.map((turn) => {
          const board = timeline.boards.get(turn);
          if (!board) {
            return (
              <div
                key={turn}
                className="w-24 h-24 sm:w-28 sm:h-28 border-2 border-dashed border-slate-700 rounded-lg flex items-center justify-center"
              >
                <span className="text-slate-700 text-xs">—</span>
              </div>
            );
          }
          return (
            <MiniBoard
              key={turn}
              board={board}
              timelineId={timeline.id}
              turn={turn}
              isActive={
                isCurrentTimeline && turn === currentTurn
              }
              onClick={() => onNavigate(timeline.id, turn)}
            />
          );
        })}
      </div>
    </div>
  );
}

/** 获取所有时间线中存在的唯一回合号（排序） */
function getUniqueTurns(timelines: Timeline[]): number[] {
  const turns = new Set<number>();
  for (const tl of timelines) {
    for (const turn of tl.boards.keys()) {
      turns.add(turn);
    }
  }
  return Array.from(turns).sort((a, b) => a - b);
}
