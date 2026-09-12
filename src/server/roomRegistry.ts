import { GameRoom } from '../domain/gameRoom'

export type RoomConnection = { code: string; room: GameRoom }

export class RoomRegistry {
  private readonly rooms = new Map<string, GameRoom>()

  create(hostName: string): RoomConnection {
    let code = ''
    do code = Math.random().toString(36).slice(2, 8).toUpperCase()
    while (this.rooms.has(code))
    const room = GameRoom.create(hostName)
    this.rooms.set(code, room)
    return { code, room }
  }

  get(code: string): RoomConnection | undefined {
    const room = this.rooms.get(code.toUpperCase())
    return room ? { code: code.toUpperCase(), room } : undefined
  }
}