import type { BingoCard } from '../domain/bingo75'
import type { Bingo75Mode, Bingo75ModeId } from '../domain/bingo75Modes'
import type { RoomPhase } from '../domain/gameRoom'

export type ClientCommand =
  | { type: 'createRoom'; name: string; modeId: Bingo75ModeId }
  | { type: 'joinRoom'; roomCode: string; name: string; token?: string }
  | { type: 'startGame' }
  | { type: 'drawBall' }
  | { type: 'markCell'; row: number; column: number }
  | { type: 'claimBingo' }

export type RoomStateEvent = {
  type: 'roomState'
  roomCode: string
  phase: RoomPhase
  playerId: string
  token: string
  isHost: boolean
  eliminated: boolean
  card: BingoCard
  players: Array<{ playerId: string; name: string; eliminated: boolean }>
  calledBalls: number[]
  mode: Bingo75Mode
  winnerId?: string
}

export type ServerEvent = RoomStateEvent | { type: 'error'; message: string }