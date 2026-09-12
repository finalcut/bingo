import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { BingoCard } from '../domain/bingo75'
import type { RoomStateEvent } from '../shared/protocol'
import App, { Card, Room } from './App'
import type { GameClient } from './gameClient'

afterEach(cleanup)

describe('Bingo app entry', () => {
  it('offers host and player modes', () => {
    render(<App />)

    expect(screen.getByRole('button', { name: /host a game/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /join a game/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /host a game/i }).parentElement).toHaveClass('mode-actions')
  })

  it('offers game mode selection when hosting', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /host a game/i }))

    expect(screen.getByLabelText(/players name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/room name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/game mode/i)).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Blackout' })).toBeInTheDocument()
    expect(screen.getByLabelText(/players name/i).closest('form')).toHaveClass('join-form')
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
      roomName: 'Friday Night Bingo',
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
      calledBalls: [30, 2, 45, 1, 16],
      mode: {
        id: 'plus',
        name: 'Plus',
        description: 'Complete the center row and center column.',
        patterns: [[[0, 2], [1, 2], [2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [3, 2], [4, 2]]],
      },
      winnerId: 'player-1',
    }

    render(<Room state={state} client={{ send: vi.fn() } as unknown as GameClient} error="" />)

    expect(screen.getByRole('status')).toHaveTextContent('Alex won the game')
    expect(within(screen.getByLabelText('B column')).getAllByText(/^\d+$/).map((ball) => ball.textContent)).toEqual(['1', '2'])
    expect(within(screen.getByLabelText('I column')).getAllByText(/^\d+$/).map((ball) => ball.textContent)).toEqual(['16', '30'])
    expect(within(screen.getByLabelText('N column')).getAllByText(/^\d+$/).map((ball) => ball.textContent)).toEqual(['45'])
  })

  it('shows the room name and code for the host', async () => {
    const card: BingoCard = {
      columns: ['B', 'I', 'N', 'G', 'O'],
      cells: Array.from({ length: 25 }, (_, index) => ({ value: index + 1, marked: false, free: false })),
    }
    const send = vi.fn()
    const state: RoomStateEvent = {
      type: 'roomState',
      roomCode: 'ABC123',
      roomName: 'Friday Night Bingo',
      phase: 'finished',
      playerId: 'player-1',
      token: 'token-1',
      isHost: true,
      eliminated: false,
      card,
      players: [{ playerId: 'player-1', name: 'Alex', eliminated: false }],
      calledBalls: [1, 2, 3],
      mode: {
        id: 'plus',
        name: 'Plus',
        description: 'Complete the center row and center column.',
        patterns: [[[0, 2], [1, 2], [2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [3, 2], [4, 2]]],
      },
      winnerId: 'player-1',
    }

    const { rerender } = render(<Room state={state} client={{ send } as unknown as GameClient} error="" />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Friday Night Bingo')
    expect(screen.queryByText('Your game room')).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('ABC123', { selector: '.room-code' })).toBeInTheDocument())

    const modeSelect = screen.getByLabelText(/new game mode/i)
    expect(modeSelect).toHaveValue('plus')
    fireEvent.change(modeSelect, { target: { value: 'blackout' } })
    fireEvent.click(screen.getByRole('button', { name: /start new game/i }))

    expect(send).toHaveBeenCalledWith({ type: 'newGame', modeId: 'blackout' })

    rerender(<Room state={{ ...state, isHost: false, playerId: 'player-2' }} client={{ send } as unknown as GameClient} error="" />)

    expect(screen.getByText('Players')).toBeInTheDocument()
    expect(screen.getByText('ABC123', { selector: '.room-code' })).toBeInTheDocument()
    expect(screen.queryByText('Host controls')).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('img', { name: 'Join room ABC123' })).toBeInTheDocument())
  })

})