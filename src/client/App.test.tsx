import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { BingoCard } from '../domain/bingo75'
import { bingo75Modes } from '../domain/bingo75Modes'
import type { RoomStateEvent } from '../shared/protocol'
import App, { Card, Room } from './App'
import type { GameClient } from './gameClient'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

function stubRoomCheck(valid: boolean): void {
  class MockWebSocket {
    static readonly OPEN = 1
    readonly readyState = MockWebSocket.OPEN
    onopen?: () => void
    onerror?: () => void
    onmessage?: (event: { data: string }) => void

    constructor() {
      queueMicrotask(() => this.onopen?.())
    }

    send(rawCommand: string): void {
      const command = JSON.parse(rawCommand) as { type: string; roomCode?: string }
      if (command.type === 'checkRoom') queueMicrotask(() => this.onmessage?.({ data: JSON.stringify(valid ? { type: 'roomCheck', valid: true } : { type: 'roomCheck', valid: false, message: `The room code: ${command.roomCode} is no longer valid. Enter a new code or go to the home page.` }) }))
    }
  }

  vi.stubGlobal('WebSocket', MockWebSocket)
}

describe('Bingo app entry', () => {
  it('offers host and player modes', () => {
    render(<App />)

    expect(screen.getByRole('button', { name: /host a game/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /join a game/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /host a game/i }).parentElement).toHaveClass('mode-actions')
  })

  it('opens the join room form when entered with a room code', () => {
    stubRoomCheck(true)
    window.history.replaceState(null, '', '/?room=ABC123')
    const { unmount } = render(<App />)

    expect(screen.getByRole('heading', { name: /get your card/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/room code/i)).toHaveValue('ABC123')
    expect(screen.getByRole('button', { name: /join room/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /home page/i })).toBeInTheDocument()

    unmount()
    window.history.replaceState(null, '', '/')
  })

  it('labels the join action as rejoin for a room with a saved token', () => {
    stubRoomCheck(true)
    window.history.replaceState(null, '', '/?room=ABC123')
    localStorage.setItem('bingo-token-ABC123', 'saved-token')

    const { unmount } = render(<App />)

    expect(screen.getByRole('button', { name: /rejoin room/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^join room$/i })).not.toBeInTheDocument()

    unmount()
    localStorage.removeItem('bingo-token-ABC123')
    window.history.replaceState(null, '', '/')
  })

  it('warns before joining when a URL room code is no longer valid', async () => {
    stubRoomCheck(false)
    window.history.replaceState(null, '', '/?room=EXPIRED')

    render(<App />)

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('The room code: EXPIRED is no longer valid. Enter a new code or go to the home page.'))
    expect(screen.getByLabelText(/room code/i)).toHaveValue('')
    expect(screen.getByRole('button', { name: /^join room$/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /rejoin room/i })).not.toBeInTheDocument()
    const alert = screen.getByRole('alert')
    const playerNameLabel = screen.getByLabelText(/players name/i).closest('label')
    expect(alert.compareDocumentPosition(playerNameLabel!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)

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

  it('returns to the actual home page from the join form', () => {
    stubRoomCheck(true)
    window.history.replaceState(null, '', '/?room=EXPIRED')
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /home page/i }))

    expect(screen.getByRole('button', { name: /host a game/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /join a game/i })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/')
    expect(window.location.search).toBe('')
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

    const winnerAnnouncement = screen.getByRole('status')
    expect(winnerAnnouncement).toHaveTextContent('Alex won the game')
    expect(winnerAnnouncement).toHaveClass('winner-overlay')
    expect(winnerAnnouncement.closest('.game-panel')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Winner: Welsh dragon' })).toHaveAttribute('src', '/welsh-dragon.svg')
    const recentBalls = within(screen.getByLabelText('Last three calls')).getAllByRole('listitem')
    expect(recentBalls.map((ball) => ball.textContent)).toEqual(['B1', 'N45', 'B2'])
    expect(recentBalls[0].firstElementChild).toHaveClass('recent-ball-newest')
    expect(recentBalls[1].firstElementChild).toHaveClass('recent-ball-middle')
    expect(recentBalls[2].firstElementChild).toHaveClass('recent-ball-oldest')
    expect(within(screen.getByLabelText('B column')).getAllByText(/^\d+$/).map((ball) => ball.textContent)).toEqual(['1', '2'])
    expect(within(screen.getByLabelText('I column')).getAllByText(/^\d+$/).map((ball) => ball.textContent)).toEqual(['16', '30'])
    expect(within(screen.getByLabelText('N column')).getAllByText(/^\d+$/).map((ball) => ball.textContent)).toEqual(['45'])
  })

  it('hides an invalid claim message after five seconds', () => {
    vi.useFakeTimers()
    const card: BingoCard = {
      columns: ['B', 'I', 'N', 'G', 'O'],
      cells: Array.from({ length: 25 }, (_, index) => ({ value: index + 1, marked: false, free: false })),
    }
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
      players: [{ playerId: 'player-1', name: 'Alex', eliminated: false }],
      calledBalls: [],
      mode: bingo75Modes.standard,
    }

    const { rerender } = render(<Room state={state} client={{ send: vi.fn() } as unknown as GameClient} error="You have not matched the required pattern with your selected numbers. Please re-check the target pattern." />)

    const warning = screen.getByRole('alert')
    expect(warning).toHaveTextContent('re-check the target pattern')
    expect(warning.closest('.board-wrap')).toBeInTheDocument()
    expect(within(warning).getByLabelText('Standard winning pattern')).toBeInTheDocument()
    expect(screen.getByText('Standard', { selector: '.target-pattern-title' })).toBeInTheDocument()
    const claimButton = screen.getByRole('button', { name: 'Bingo!' })
    expect(claimButton).toBeDisabled()
    fireEvent.click(warning)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(claimButton).toBeEnabled()

    rerender(<Room state={state} client={{ send: vi.fn() } as unknown as GameClient} error="You have not matched the required pattern with your selected numbers. Please re-check the target pattern." errorSequence={1} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(4999))
    expect(screen.getByRole('alert')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(1))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(claimButton).toBeEnabled()
    rerender(<Room state={{ ...state, mode: bingo75Modes['letter-u'] }} client={{ send: vi.fn() } as unknown as GameClient} error="" />)
    expect(screen.getByText('Letter U', { selector: '.target-pattern-title' })).toBeInTheDocument()
  })

  it('allows the same invalid claim warning to be shown again', () => {
    vi.useFakeTimers()
    const card: BingoCard = {
      columns: ['B', 'I', 'N', 'G', 'O'],
      cells: Array.from({ length: 25 }, (_, index) => ({ value: index + 1, marked: false, free: false })),
    }
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
      players: [{ playerId: 'player-1', name: 'Alex', eliminated: false }],
      calledBalls: [],
      mode: bingo75Modes.standard,
    }
    const warningMessage = 'You have not matched the required pattern with your selected numbers. Please re-check the target pattern.'
    const { rerender } = render(<Room state={state} client={{ send: vi.fn() } as unknown as GameClient} error={warningMessage} errorSequence={0} />)

    act(() => vi.advanceTimersByTime(5000))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    rerender(<Room state={state} client={{ send: vi.fn() } as unknown as GameClient} error={warningMessage} errorSequence={1} />)
    expect(screen.getByRole('alert')).toHaveTextContent('re-check the target pattern')
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

    expect(screen.getByRole('heading', { name: 'Friday Night Bingo' })).toBeInTheDocument()
    expect(screen.queryByText('Your game room')).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('ABC123', { selector: '.room-code' })).toBeInTheDocument())
    expect(screen.getByText('ABC123', { selector: '.room-code' })).toHaveClass('room-code-distinct')

    const modeSelect = screen.getByLabelText(/game mode/i)
    expect(modeSelect).toHaveValue('plus')
    const hostControls = modeSelect.closest('.host-controls')
    expect(hostControls).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^start!$/i }).closest('.host-controls')).toBe(hostControls)
    fireEvent.change(modeSelect, { target: { value: 'blackout' } })
    expect(send).toHaveBeenCalledWith({ type: 'setMode', modeId: 'blackout' })
    expect(screen.getByRole('heading', { name: 'Blackout' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^start!$/i }))

    expect(send).toHaveBeenCalledWith({ type: 'newGame', modeId: 'blackout' })

    rerender(<Room state={{ ...state, isHost: false, playerId: 'player-2', mode: bingo75Modes.blackout }} client={{ send } as unknown as GameClient} error="" />)

    expect(screen.getByRole('heading', { name: /players \(2\)/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Blackout' })).toBeInTheDocument()
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

    const nameInput = screen.getByLabelText(/current players name/i)
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
    expect(gamePanel.querySelector('.ball-letter')).toHaveTextContent('B')
    expect(gamePanel.querySelector('.ball-number')).toHaveTextContent('3')
    fireEvent.click(drawButton)
    expect(send).toHaveBeenCalledWith({ type: 'drawBall' })
  })

})