import { createCard, createDrawBag, isWinningSelection, markCell, type BingoCard } from './bingo75'

export type RoomPhase = 'lobby' | 'playing' | 'finished'

export type RoomPlayer = {
  playerId: string
  name: string
  token: string
  card: BingoCard
  eliminated: boolean
}

export type BingoClaim =
  | { accepted: true; playerId: string }
  | { accepted: false; eliminated: true; message: string }

function id(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export class GameRoom {
  readonly hostId: string
  private readonly playerMap = new Map<string, RoomPlayer>()
  private drawBag: number[]
  private readonly called = new Set<number>()
  private currentPhase: RoomPhase = 'lobby'
  private winningPlayerId: string | undefined

  private constructor(host: RoomPlayer) {
    this.hostId = host.playerId
    this.playerMap.set(host.playerId, host)
    this.drawBag = createDrawBag()
  }

  static create(hostName: string): GameRoom {
    return new GameRoom({
      playerId: id('player'),
      name: hostName.trim(),
      token: id('token'),
      card: createCard(),
      eliminated: false,
    })
  }

  get phase(): RoomPhase {
    return this.currentPhase
  }

  get players(): RoomPlayer[] {
    return [...this.playerMap.values()]
  }

  get calledBalls(): number[] {
    return [...this.called]
  }

  get winnerId(): string | undefined {
    return this.winningPlayerId
  }

  join(name: string, token?: string): RoomPlayer {
    if (this.currentPhase !== 'lobby') throw new Error('Game has already started')
    const existing = token ? this.players.find((player) => player.token === token) : undefined
    if (existing) return existing

    const player: RoomPlayer = {
      playerId: id('player'),
      name: name.trim(),
      token: id('token'),
      card: createCard(),
      eliminated: false,
    }
    this.playerMap.set(player.playerId, player)
    return player
  }

  start(actorId: string): void {
    this.requireHost(actorId)
    if (this.currentPhase !== 'lobby') throw new Error('Game has already started')
    this.currentPhase = 'playing'
  }

  draw(actorId: string): number {
    this.requireHost(actorId)
    if (this.currentPhase !== 'playing') throw new Error('Game is not in progress')
    const ball = this.drawBag.shift()
    if (ball === undefined) throw new Error('No balls remain')
    this.called.add(ball)
    return ball
  }

  mark(playerId: string, row: number, column: number): BingoCard {
    if (this.currentPhase !== 'playing') throw new Error('Game is not in progress')
    const player = this.requirePlayer(playerId)
    this.requireActive(player)
    player.card = markCell(player.card, row, column)
    return player.card
  }

  claimBingo(playerId: string): BingoClaim {
    if (this.currentPhase !== 'playing') return { accepted: false, eliminated: true, message: 'Game is not in progress.' }
    const player = this.requirePlayer(playerId)
    this.requireActive(player)
    if (!isWinningSelection(player.card, this.called)) {
      player.eliminated = true
      return { accepted: false, eliminated: true, message: 'Bingo claim rejected. You are out of the game.' }
    }
    this.currentPhase = 'finished'
    this.winningPlayerId = playerId
    return { accepted: true, playerId }
  }

  private requireHost(actorId: string): void {
    if (actorId !== this.hostId) throw new Error('Only the host can perform this action')
  }

  private requirePlayer(playerId: string): RoomPlayer {
    const player = this.playerMap.get(playerId)
    if (!player) throw new Error('Player not found')
    return player
  }

  private requireActive(player: RoomPlayer): void {
    if (player.eliminated) throw new Error('Player is out of the game')
  }
}