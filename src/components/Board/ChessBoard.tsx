import { useGameStore } from "../../store/gameStore";
import { PIECE_SYMBOLS } from "../../game/engine/GameState";
import { isKingInCheck } from "../../game/engine/WinCondition";
import type { Piece, PieceType, Position5D } from "../../types/game.types";

const PROMOTION_PIECES: PieceType[] = ["queen", "rook", "bishop", "knight"];
const PROMOTION_LABELS: Record<string, string> = {
  queen: "后",
  rook: "车",
  bishop: "象",
  knight: "马",
};

export function ChessBoard() {
  const gameState = useGameStore((s) => s.gameState);
  const selectedPiece = useGameStore((s) => s.selectedPiece);
  const legalMoves = useGameStore((s) => s.legalMoves);
  const selectPiece = useGameStore((s) => s.selectPiece);
  const movePiece = useGameStore((s) => s.movePiece);
  const clearSelection = useGameStore((s) => s.clearSelection);
  const pendingPromotion = useGameStore((s) => s.pendingPromotion);
  const promotePawn = useGameStore((s) => s.promotePawn);
  const gameMessage = useGameStore((s) => s.gameMessage);
  const resetGame = useGameStore((s) => s.resetGame);

  const timeline = gameState.timelines.get(gameState.currentTimeline);
  const board = timeline?.boards.get(gameState.currentTurn);

  if (!board) return <div>棋盘加载失败</div>;

  // 检查当前玩家是否被将军
  const currentInCheck =
    gameState.gameStatus === "playing" &&
    isKingInCheck(gameState.currentPlayer, board);

  const checkedKing = currentInCheck
    ? board.pieces.find(
        (p: Piece) =>
          p.type === "king" && p.color === gameState.currentPlayer,
      )
    : null;

  const isLegalTarget = (x: number, y: number) =>
    legalMoves.some(
      (m) =>
        m.x === x &&
        m.y === y &&
        m.timeline === gameState.currentTimeline &&
        m.turn === gameState.currentTurn,
    );

  // 计算时间旅行合法移动数量
  const timeTravelMoveCount = legalMoves.filter(
    (m) =>
      m.timeline !== gameState.currentTimeline ||
      m.turn !== gameState.currentTurn,
  ).length;

  const handleSquareClick = (x: number, y: number) => {
    if (pendingPromotion) return;
    if (gameState.gameStatus !== "playing") return;

    if (selectedPiece && isLegalTarget(x, y)) {
      const to: Position5D = {
        x,
        y,
        timeline: gameState.currentTimeline,
        turn: gameState.currentTurn,
      };
      movePiece(to);
    } else {
      const piece = board.pieces.find(
        (p: Piece) => p.position.x === x && p.position.y === y,
      );
      if (piece && piece.color === gameState.currentPlayer) {
        selectPiece(x, y);
      } else {
        clearSelection();
      }
    }
  };

  // 渲染 8x8 棋盘（从白方视角: y=7 在上，y=0 在下）
  const rows = [];
  for (let y = 7; y >= 0; y--) {
    const cells = [];
    for (let x = 0; x < 8; x++) {
      const isLight = (x + y) % 2 === 1;
      const piece = board.pieces.find(
        (p: Piece) => p.position.x === x && p.position.y === y,
      );
      const isSelected =
        selectedPiece?.position.x === x && selectedPiece?.position.y === y;
      const isLegal = isLegalTarget(x, y);
      const hasPiece = !!piece;
      const isCheckedKing =
        checkedKing?.position.x === x && checkedKing?.position.y === y;

      let bgColor = isLight
        ? "bg-[var(--board-light)]"
        : "bg-[var(--board-dark)]";
      if (isSelected) bgColor = "bg-[var(--board-highlight)]";
      if (isCheckedKing) bgColor = "bg-red-600/70";

      cells.push(
        <div
          key={`${x}-${y}`}
          className={`relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center cursor-pointer select-none ${bgColor} transition-colors`}
          onClick={() => handleSquareClick(x, y)}
          data-testid={`square-${x}-${y}`}
        >
          {/* 棋子 */}
          {piece && (
            <span
              className={`text-2xl sm:text-3xl md:text-4xl drop-shadow-md ${piece.color === "white" ? "text-white" : "text-gray-900"}`}
              data-testid={`piece-${piece.color}-${piece.type}`}
            >
              {PIECE_SYMBOLS[piece.type][piece.color]}
            </span>
          )}
          {/* 合法移动提示 */}
          {isLegal && !hasPiece && (
            <div className="absolute w-3 h-3 rounded-full bg-[var(--success)] opacity-60" />
          )}
          {isLegal && hasPiece && (
            <div className="absolute inset-0 border-3 border-[var(--danger)] rounded-sm opacity-70" />
          )}
        </div>,
      );
    }
    rows.push(
      <div key={y} className="flex">
        {/* 行号 */}
        <div className="w-6 flex items-center justify-center text-xs text-slate-500">
          {y + 1}
        </div>
        {cells}
      </div>,
    );
  }

  const isGameOver = gameState.gameStatus !== "playing";

  return (
    <div data-testid="chess-board" className="inline-block relative">
      <div className="border-2 border-slate-600 rounded-lg overflow-hidden shadow-2xl">
        {rows}
        {/* 列标 */}
        <div className="flex ml-6">
          {["a", "b", "c", "d", "e", "f", "g", "h"].map((col) => (
            <div
              key={col}
              className="w-12 sm:w-14 md:w-16 text-center text-xs text-slate-500"
            >
              {col}
            </div>
          ))}
        </div>
      </div>

      {/* 游戏消息 */}
      {gameMessage && !isGameOver && (
        <div
          className="mt-2 text-center text-yellow-400 font-bold text-lg animate-pulse"
          data-testid="game-message"
        >
          {gameMessage}
        </div>
      )}

      {/* 当前回合指示 */}
      <div className="mt-3 text-center" data-testid="turn-indicator">
        <span
          className={`inline-block w-3 h-3 rounded-full mr-2 ${gameState.currentPlayer === "white" ? "bg-white" : "bg-gray-900 border border-slate-500"}`}
        />
        <span className="text-sm text-slate-300">
          {gameState.currentPlayer === "white" ? "白方" : "黑方"}回合
        </span>
        <span className="text-sm text-slate-500 ml-3">
          时间线 {gameState.currentTimeline} · 回合{" "}
          {gameState.currentTurn}
        </span>
      </div>

      {/* 时间旅行提示 */}
      {selectedPiece && timeTravelMoveCount > 0 && (
        <div
          className="mt-1 text-center text-purple-400 text-xs animate-pulse"
          data-testid="time-travel-hint"
        >
          ⏳ 可进行 {timeTravelMoveCount} 个时间旅行移动
        </div>
      )}

      {/* 时间线数量指示 */}
      {gameState.timelines.size > 1 && (
        <div className="mt-1 text-center text-xs text-slate-500" data-testid="timeline-count">
          🌌 {gameState.timelines.size} 条平行时间线
        </div>
      )}

      {/* 升变选择 */}
      {pendingPromotion && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg z-10"
          data-testid="promotion-dialog"
        >
          <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 shadow-2xl">
            <p className="text-center text-slate-200 mb-4 font-medium">
              选择升变棋子
            </p>
            <div className="flex gap-3">
              {PROMOTION_PIECES.map((pt) => (
                <button
                  key={pt}
                  className="flex flex-col items-center gap-1 px-4 py-3 rounded-lg bg-slate-700 hover:bg-blue-600 transition-colors"
                  onClick={() => promotePawn(pt)}
                  data-testid={`promote-${pt}`}
                >
                  <span className="text-3xl">
                    {PIECE_SYMBOLS[pt][pendingPromotion.piece.color]}
                  </span>
                  <span className="text-xs text-slate-300">
                    {PROMOTION_LABELS[pt]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 游戏结束覆盖层 */}
      {isGameOver && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-lg z-10"
          data-testid="game-over-overlay"
        >
          <div className="bg-slate-800 border border-slate-600 rounded-xl p-8 shadow-2xl text-center">
            <p className="text-2xl font-bold text-yellow-400 mb-2">
              {gameState.gameStatus === "checkmate" && "将死！"}
              {gameState.gameStatus === "stalemate" && "僵局！"}
              {gameState.gameStatus === "draw" && "和棋！"}
            </p>
            <p className="text-slate-300 mb-6">
              {gameState.gameStatus === "checkmate" &&
                `${gameState.winner === "white" ? "白方" : "黑方"}获胜`}
              {gameState.gameStatus === "stalemate" && "双方无合法移动"}
              {gameState.gameStatus === "draw" && "材料不足"}
            </p>
            <button
              className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors font-medium"
              onClick={resetGame}
              data-testid="game-over-reset"
            >
              重新开始
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
