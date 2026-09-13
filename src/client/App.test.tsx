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

  it('opens the join room form when entered with a room code', () => {
    window.history.replaceState(null, '', '/?room=ABC123')
    const { unmount } = render(<App />)

    expect(screen.getByRole('heading', { name: /get your card/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/room code/i)).toHaveValue('ABC123')
    expect(screen.getByRole('button', { name: /join room/i })).toBeInTheDocument()

    unmount()
    window.history.replaceState(null, '', '/')
  })

  it('labels the join action as rejoin for a room with a saved token', () => {
    window.history.replaceState(null, '', '/?room=ABC123')
    localStorage.setItem('bingo-token-ABC123', 'saved-token')

    const { unmount } = render(<App />)

    expect(screen.getByRole('button', { name: /rejoin room/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^join room$/i })).not.toBeInTheDocument()

    unmount()
    localStorage.removeItem('bingo-token-ABC123')
    window.history.replaceState(null, '', '/')
  })

  it('returns to the landing screen when the browser back button is used', async () => {
    window.history.replaceState(null, '', '/')
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /host a game/i }))
    expect(screen.getByRole('heading', { name: /gather your friends/i })).toBeInTheDocument()

    window.history.back()

    await waitFor(() => expect(screen.getByRole('button', { name: /host a game/i })).toBeInTheDocument())
  })

  it('does not ask for a game mode before creating a room', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /host a game/i }))

    expect(screen.getByLabelText(/players name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/room name/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/game mode/i)).not.toBeInTheDocument()
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
      players: [{ playerId: 'player-1', name: 'Alex', eliminated: false }],
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
    expect(screen.getByRole('img', { name: 'Winner: Welsh dragon' })).toHaveAttribute('src', '/welsh-dragon.svg')
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
      players: [
        { playerId: 'player-1', name: 'Alex', eliminated: false },
        { playerId: 'player-2', name: 'Sam', eliminated: false },
      ],
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
    expect(screen.getByText('ABC123', { selector: '.room-code' })).toHaveClass('room-code-distinct')

    const modeSelect = screen.getByLabelText(/new game mode/i)
    expect(modeSelect).toHaveValue('plus')
    const newGameControls = modeSelect.closest('.new-game-controls')
    expect(newGameControls).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start new game/i }).closest('.new-game-controls')).toBe(newGameControls)
    fireEvent.change(modeSelect, { target: { value: 'blackout' } })
    fireEvent.click(screen.getByRole('button', { name: /start new game/i }))

    expect(send).toHaveBeenCalledWith({ type: 'newGame', modeId: 'blackout' })

    rerender(<Room state={{ ...state, isHost: false, playerId: 'player-2' }} client={{ send } as unknown as GameClient} error="" />)

    expect(screen.getByText('Players')).toBeInTheDocument()
    expect(screen.getByText('ABC123', { selector: '.room-code' })).toBeInTheDocument()
    expect(screen.queryByText('Host controls')).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('img', { name: 'Join room ABC123' })).toBeInTheDocument())
    expect(screen.getByLabelText('Room link')).toHaveValue('http://localhost:3000/?room=ABC123')
  })

  it('offers a display name form below the player list', () => {
    const card: BingoCard = {
      columns: ['B', 'I', 'N', 'G', 'O'],
      cells: Array.from({ length: 25 }, (_, index) => ({ value: index + 1, marked: false, free: false })),
    }
    const send = vi.fn()
    const state: RoomStateEvent = {
      type: 'roomState',
      roomCode: 'ABC123',
      roomName: 'Friday Night Bingo',
      phase: 'playing',
      playerId: 'player-1',
      token: 'token-1',
      isHost: false,
      eliminated: false,
      card,
      players: [
        { playerId: 'player-1', name: 'Alex', eliminated: false },
        { playerId: 'player-2', name: 'Sam', eliminated: false },
      ],
      calledBalls: [],
      mode: {
        id: 'plus',
        name: 'Plus',
        description: 'Complete the center row and center column.',
        patterns: [[[0, 2], [1, 2], [2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [3, 2], [4, 2]]],
      },
    }

    render(<Room state={state} client={{ send } as unknown as GameClient} error="" />)

    expect(screen.getByRole('heading', { name: 'Players (2)' })).toBeInTheDocument()
    const playerList = screen.getByRole('heading', { name: /players/i }).nextElementSibling
    expect(playerList).toHaveTextContent('Sam')
    expect(playerList).not.toHaveTextContent('Alex')

    const nameInput = screen.getByLabelText(/display name/i)
    expect(nameInput).toHaveClass('display-name-input')
    expect(nameInput.nextElementSibling).toHaveClass('secondary-button')
    fireEvent.change(nameInput, { target: { value: 'New name' } })
    fireEvent.click(screen.getByRole('button', { name: /change name/i }))

    expect(nameInput.closest('.players')).toBeInTheDocument()
    expect(send).toHaveBeenCalledWith({ type: 'rename', name: 'New name' })
  })

  it('lets the host choose a lobby mode and sends the change', () => {
    const card: BingoCard = {
      columns: ['B', 'I', 'N', 'G', 'O'],
      cells: Array.from({ length: 25 }, (_, index) => ({ value: index + 1, marked: false, free: false })),
    }
    const send = vi.fn()
    const state: RoomStateEvent = {
      type: 'roomState',
      roomCode: 'ABC123',
      roomName: 'Friday Night Bingo',
      phase: 'lobby',
      playerId: 'player-1',
      token: 'token-1',
      isHost: true,
      eliminated: false,
      card,
      players: [{ playerId: 'player-1', name: 'Alex', eliminated: false }],
      calledBalls: [],
      mode: {
        id: 'standard',
        name: 'Standard',
        description: 'Complete any row, column, or diagonal.',
        patterns: [[[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]]],
      },
    }

    render(<Room state={state} client={{ send } as unknown as GameClient} error="" />)

    const modeSelect = screen.getByLabelText(/game mode/i)
    expect(modeSelect.closest('.host-controls')).toBeInTheDocument()
    fireEvent.change(modeSelect, { target: { value: 'blackout' } })

    expect(send).toHaveBeenCalledWith({ type: 'setMode', modeId: 'blackout' })
  })

  it('places the draw control in the game panel for the host', () => {
    const card: BingoCard = {
      columns: ['B', 'I', 'N', 'G', 'O'],
      cells: Array.from({ length: 25 }, (_, index) => ({ value: index + 1, marked: false, free: false })),
    }
    const send = vi.fn()
    const state: RoomStateEvent = {
      type: 'roomState',
      roomCode: 'ABC123',
      roomName: 'Friday Night Bingo',
      phase: 'playing',
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
    }

    render(<Room state={state} client={{ send } as unknown as GameClient} error="" />)

    const drawButton = screen.getByRole('button', { name: /draw next ball/i })
    expect(drawButton.closest('.game-panel')).toBeInTheDocument()
    const gamePanel = drawButton.closest('.game-panel') as HTMLElement
    const bingoCard = gamePanel.querySelector('.bingo-card')
    const calledPanel = gamePanel.querySelector('.called-panel')
    expect(bingoCard).toBeInTheDocument()
    expect(calledPanel).toBeInTheDocument()
    expect(bingoCard!.compareDocumentPosition(calledPanel!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    fireEvent.click(drawButton)
    expect(send).toHaveBeenCalledWith({ type: 'drawBall' })
  })

})