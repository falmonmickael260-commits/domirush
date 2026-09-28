import type { PlayerCount, RedactedGameState, Side, TargetScore } from "@/game-engine";
import type { RoomSummary } from "@/server/types";

export interface ClientToServerEvents {
  "room:create": (
    payload: {
      deviceId: string;
      name: string;
      avatar: string;
      playerCount: PlayerCount;
      targetScore: TargetScore;
    },
    ack: (res: { ok: true; code: string } | { ok: false; error: string }) => void
  ) => void;
  "room:join": (
    payload: { deviceId: string; code: string; name: string; avatar: string },
    ack: (res: { ok: true } | { ok: false; error: string }) => void
  ) => void;
  "room:leave": (payload: { deviceId: string; code: string }) => void;
  "game:start": (payload: { code: string }) => void;
  "game:play_tile": (payload: { code: string; tileId: string; side: Side }) => void;
  "game:draw": (payload: { code: string }) => void;
  "game:pass": (payload: { code: string }) => void;
  "game:continue": (payload: { code: string }) => void;
  "game:rematch": (payload: { code: string }) => void;
}

export interface ServerToClientEvents {
  "room:update": (summary: RoomSummary) => void;
  "room:closed": (payload: { reason: string }) => void;
  "game:state": (state: RedactedGameState) => void;
  "game:error": (payload: { code: string; message: string }) => void;
  "player:joined": (payload: { name: string }) => void;
  "player:left": (payload: { name: string }) => void;
  "player:reconnected": (payload: { name: string }) => void;
}
