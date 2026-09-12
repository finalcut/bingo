import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { BingoCard } from '../domain/bingo75'
import type { RoomStateEvent } from '../shared/protocol'
import App, { Card, Room } from './App'
import type { GameClient } from './gameClient'

describe('Bingo app entry', () => {
  it('offers host and player modes', () => {
    render(<App />)

    expect(screen.getByRole('button', { name: /host a game/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /join a game/i })).toBeInTheDocument()
  })

  it('does not highlight a called number until the player marks it', () => {
    const card: BingoCard = {
      columns: ['B', 'I', 'N', 'G', 'O'],
      cells: Array.from({ length: 25 }, (_, index) => ({ value: index + 1, marked: false, free: false })),
    }

    render(<Card card={card} called={[1]} onMark={() => undefined} />)

    expect(screen.getByRole('button', { name: '1' })).not.toHaveClass('marked')
  })

  it('shows the first valid winner to every player', () => {
    const card: BingoCard = {
      columns: ['B', 'I', 'N', 'G', 'O'],
      cells: Array.from({ length: 25 }, (_, index) => ({ value: index + 1, marked: false, free: false })),
    }
    const state: RoomStateEvent = {
      type: 'roomState',
      roomCode: 'ABC123',
      phase: 'finished',
      playerId: 'player-2',
      token: 'token-2',
      isHost: false,
      eliminated: false,
      card,
      players: [
        { playerId: 'player-1', name: 'Alex', eliminated: false },
        { playerId: 'player-2', name: 'Sam', eliminated: false },
      ],
      calledBalls: [1, 2, 3],
      winnerId: 'player-1',
    }

    render(<Room state={state} client={{ send: vi.fn() } as unknown as GameClient} error="" />)

    expect(screen.getByRole('status')).toHaveTextContent('Alex won the game')
  })
})