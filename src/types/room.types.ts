/** 房间状态 */
export type RoomStatus = "waiting" | "playing" | "finished";

/** 房间信息 */
export interface Room {
  id: string;
  roomCode: string;
  passwordHash: string | null;
  createdAt: string;
  expiresAt: string;
  status: RoomStatus;
  whitePlayerId: string | null;
  blackPlayerId: string | null;
  gameSettings: Record<string, unknown>;
}

/** 玩家会话 */
export interface PlayerSession {
  id: string;
  sessionToken: string;
  roomId: string;
  playerColor: "white" | "black" | null;
  lastHeartbeat: string;
}
