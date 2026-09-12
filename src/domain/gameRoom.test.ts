import { describe, expect, it } from 'vitest'
import { GameRoom } from './gameRoom'

describe('GameRoom', () => {
  it('creates a host and lets a player reconnect to the same card', () => {
    const room = GameRoom.create('Host')
    const joined = room.join('Player')
    const reconnected = room.join('Player', joined.token)

    expect(room.phase).toBe('lobby')
    expect(room.players).toHaveLength(2)
    expect(reconnected.playerId).toBe(joined.playerId)
    expect(reconnected.card).toEqual(joined.card)
  })

  it('allows only the host to start and draw balls', () => {
    const room = GameRoom.create('Host')
    const player = room.join('Player')

    expect(() => room.start(player.playerId)).toThrow('Only the host')
    room.start(room.hostId)
    expect(room.phase).toBe('playing')
    expect(() => room.draw(player.playerId)).toThrow('Only the host')
    expect(room.draw(room.hostId)).toBeGreaterThanOrEqual(1)
  })

  it('accepts a Bingo claim only when a player has a called winning line', () => {
    const room = GameRoom.create('Host')
    const player = room.join('Player')
    room.start(room.hostId)

    for (let index = 0; index < 75; index += 1) room.draw(room.hostId)
    for (let column = 0; column < 5; column += 1) room.mark(player.playerId, 0, column)

    expect(room.claimBingo(player.playerId)).toEqual({ accepted: true, playerId: player.playerId })
  })

  it('eliminates a player after an invalid Bingo claim', () => {
    const room = GameRoom.create('Host')
    const player = room.join('Player')
    room.start(room.hostId)

    expect(() => room.mark(player.playerId, 0, 0)).not.toThrow()
    expect(room.claimBingo(player.playerId)).toEqual({
      accepted: false,
      eliminated: true,
      message: 'Bingo claim rejected. You are out of the game.',
    })
    expect(room.players.find((candidate) => candidate.playerId === player.playerId)?.eliminated).toBe(true)
    expect(() => room.mark(player.playerId, 0, 0)).toThrow('Player is out of the game')
  })

  it('validates claims against the room mode', () => {
    const room = GameRoom.create('Host', 'four-corners')
    const player = room.join('Player')
    room.start(room.hostId)

    for (let index = 0; index < 75; index += 1) room.draw(room.hostId)
    for (const [row, column] of [[0, 0], [0, 4], [4, 0], [4, 4]] as const) room.mark(player.playerId, row, column)

    expect(room.mode.id).toBe('four-corners')
    expect(room.claimBingo(player.playerId)).toEqual({ accepted: true, playerId: player.playerId })
  })
})