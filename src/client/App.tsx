import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import type { BingoCard } from '../domain/bingo75'
import { bingo75Modes, type Bingo75ModeId } from '../domain/bingo75Modes'
import type { RoomStateEvent, ServerEvent } from '../shared/protocol'
import { GameClient } from './gameClient'
import './styles.css'

type Mode = 'host' | 'player'
type AppHistoryState = { view: 'landing' | 'form' | 'room'; mode?: Mode }

export function Card({ card, called: _called, eliminated = false, onMark }: { card: BingoCard; called: number[]; eliminated?: boolean; onMark: (row: number, column: number) => void }) {
  return <div className="bingo-card" aria-label="Bingo card">
    {card.columns.map((column) => <div className="card-heading" key={column}>{column}</div>)}
    {card.cells.map((cell, index) => {
      const row = Math.floor(index / 5)
      const column = index % 5
      const isMarked = cell.marked
      return <button className={`card-cell${isMarked ? ' marked' : ''}`} disabled={cell.free || eliminated} key={`${row}-${column}`} onClick={() => onMark(row, column)}>
        {cell.free ? 'FREE' : cell.value}
      </button>
    })}
  </div>
}

function ModePreview({ mode }: { mode: RoomStateEvent['mode'] }) {
  const highlighted = new Set(mode.patterns[0].map(([row, column]) => `${row}-${column}`))
  return <div className="mode-guide" aria-label={`${mode.name} winning pattern`}>
    {Array.from({ length: 25 }, (_, index) => {
      const row = Math.floor(index / 5)
      const column = index % 5
      const isFree = row === 2 && column === 2
      return <span className={`guide-cell${highlighted.has(`${row}-${column}`) ? ' guide-cell-active' : ''}${isFree ? ' guide-cell-free' : ''}`} key={index}>{isFree ? 'FREE' : ''}</span>
    })}
  </div>
}

  function CalledBalls({ balls }: { balls: number[] }) {
    return <div className="called-balls-grid" aria-label="Called balls">
      {'BINGO'.split('').map((letter, column) => <div className="called-column" aria-label={`${letter} column`} key={letter}>
        <strong>{letter}</strong>
        {balls.filter((ball) => Math.floor((ball - 1) / 15) === column).sort((left, right) => left - right).map((ball) => <span key={ball}>{ball}</span>)}
      </div>)}
    </div>
  }

export function Room({ state, client, error }: { state: RoomStateEvent; client: GameClient; error: string }) {
  const [qr, setQr] = useState('')
  const [newGameMode, setNewGameMode] = useState<Bingo75ModeId>(state.mode.id)
  const currentPlayer = state.players.find((player) => player.playerId === state.playerId)
  const [displayName, setDisplayName] = useState(currentPlayer?.name ?? '')
  const joinUrl = `${window.location.origin}/?room=${state.roomCode}`
  useEffect(() => { void QRCode.toDataURL(joinUrl, { width: 220, margin: 1 }).then(setQr) }, [joinUrl])
  const lastBall = state.calledBalls.at(-1)
  const winnerName = state.winnerId ? state.players.find((player) => player.playerId === state.winnerId)?.name : undefined
  const selectedModeId = state.phase === 'lobby' || !state.isHost ? state.mode.id : newGameMode
  const selectedMode = state.phase === 'lobby' || !state.isHost ? state.mode : bingo75Modes[newGameMode]
  const handleModeChange = (modeId: Bingo75ModeId) => {
    setNewGameMode(modeId)
    if (state.phase !== 'playing') client.send({ type: 'setMode', modeId })
  }

  return <main className="room-layout">
    <section className="game-panel">
      <div className="status-row"><span className={`status-dot ${state.phase}`} />{state.phase === 'lobby' ? 'Waiting for the host' : state.phase === 'playing' ? 'Game in progress' : state.winnerId === state.playerId ? 'Bingo confirmed!' : 'Game complete'}</div>
      {state.isHost && state.phase === 'playing' && <div className="draw-action"><button className="primary-button" onClick={() => client.send({ type: 'drawBall' })}>Draw next ball</button></div>}
      {state.phase !== 'lobby' && <div className="ball-call"><span>Latest call</span><strong>{lastBall ? <><span className="ball-letter">{'BINGO'[Math.floor((lastBall - 1) / 15)]}</span><span className="ball-number">{lastBall}</span></> : 'Ready'}</strong></div>}
      {error && <p className="error" role="alert">{error}</p>}
      <div className="board-wrap">
        {winnerName && <p className="winner-banner winner-overlay" role="status">{winnerName} won the game</p>}
        <Card card={state.card} called={state.calledBalls} eliminated={state.eliminated} onMark={(row, column) => client.send({ type: 'markCell', row, column })} />
      </div>
      <button className="claim-button" disabled={state.eliminated || state.phase !== 'playing'} onClick={() => client.send({ type: 'claimBingo' })}>{state.eliminated ? 'Out of the game' : state.winnerId ? 'Game complete' : 'Bingo!'}</button>
      <div className="called-panel"><div className="eyebrow">Called balls</div>{state.calledBalls.length ? <CalledBalls balls={state.calledBalls} /> : <small>No calls yet</small>}</div>
    </section>
    <aside className="side-panel">
      <h2>{state.roomName}</h2>
      <div className="host-controls">
        {qr && <><img className="qr-code" src={qr} alt={`Join room ${state.roomCode}`} /><label className="share-link">Room link<input aria-label="Room link" readOnly value={joinUrl} onFocus={(event) => event.currentTarget.select()} /></label><div className="room-code room-code-distinct">{state.roomCode}</div></>}
        {state.isHost && state.phase !== 'playing' && <div className="new-game-controls"><label>Game mode<select aria-label="Game mode" value={selectedModeId} onChange={(event) => handleModeChange(event.target.value as Bingo75ModeId)}>{Object.values(bingo75Modes).map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}</select></label>{state.phase === 'lobby' ? <button className="primary-button" onClick={() => client.send({ type: 'startGame' })}>Start game</button> : <button className="primary-button" onClick={() => client.send({ type: 'newGame', modeId: newGameMode })}>Start!</button>}</div>}
        <div className="mode-info"><div className="eyebrow">Game mode</div><h2>{selectedMode.name}</h2><p>{selectedMode.description}</p><ModePreview mode={selectedMode} /></div>
        <div className="players">
          <h3>Players ({state.players.length})</h3><ul>{state.players.filter((player) => player.playerId !== state.playerId).map((player) => <li key={player.playerId}>{player.name}{player.eliminated ? ' (out)' : ''}{player.playerId === state.winnerId && <img className="winner-dragon" src="/welsh-dragon.svg" alt="Winner: Welsh dragon" title="Winner: Welsh dragon" />}</li>)}</ul>
          <form className="name-form" onSubmit={(event) => { event.preventDefault(); client.send({ type: 'rename', name: displayName }) }}>
            <label htmlFor="display-name">Current Players Name</label>
            <div><input className="display-name-input" id="display-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} /><button className="secondary-button" type="submit">Change name</button></div>
          </form>
        </div>
      </div>
    </aside>
  </main>
}

export default function App() {
  const initialRoomCode = new URLSearchParams(window.location.search).get('room') ?? ''
  const [mode, setMode] = useState<Mode | undefined>(initialRoomCode ? 'player' : undefined)
  const [name, setName] = useState('')
  const [roomName, setRoomName] = useState('')
  const [roomCode, setRoomCode] = useState(initialRoomCode)
  const [state, setState] = useState<RoomStateEvent>()
  const [error, setError] = useState('')
  const [client] = useState(() => new GameClient((event: ServerEvent) => {
    if (event.type === 'error') setError(event.message)
    else {
      setError('')
      setState(event)
      if ((window.history.state as AppHistoryState | null)?.view !== 'room') {
        window.history.pushState({ view: 'room' } satisfies AppHistoryState, '', `/?room=${event.roomCode}`)
      }
      localStorage.setItem(`bingo-token-${event.roomCode}`, event.token)
    }
  }))

  useEffect(() => {
    const currentRoute = window.history.state as AppHistoryState | null
    if (!currentRoute?.view) window.history.replaceState({ view: 'landing' } satisfies AppHistoryState, '', window.location.href)
    const handlePopState = (event: PopStateEvent) => {
      const route = event.state as AppHistoryState | null
      if (route?.view === 'form') {
        setMode(route.mode)
        setState(undefined)
      } else if (route?.view === 'landing') {
        setMode(undefined)
        setState(undefined)
      }
      setError('')
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  function enterMode(nextMode: Mode) {
    window.history.pushState({ view: 'form', mode: nextMode } satisfies AppHistoryState, '', window.location.href)
    setMode(nextMode)
  }

  async function enterRoom(event: React.FormEvent) {
    event.preventDefault()
    try {
      await client.connect()
      const token = roomCode ? localStorage.getItem(`bingo-token-${roomCode}`) ?? undefined : undefined
      client.send(mode === 'host' ? { type: 'createRoom', name, roomName } : { type: 'joinRoom', roomCode, name, token })
    } catch (connectionError) { setError(connectionError instanceof Error ? connectionError.message : 'Unable to connect') }
  }

  if (state) return <Room state={state} client={client} error={error} />
  if (!mode) return <main className="landing"><div className="eyebrow">Bingo Bango Bongo</div><h1>Make a little<br /><em>noise</em></h1><p>LET'S PLAY SOME BINGO!</p><div className="mode-actions"><button className="primary-button" onClick={() => enterMode('host')}>Host a game</button><button className="secondary-button" onClick={() => enterMode('player')}>Join a game</button></div></main>

  const hasSavedToken = mode === 'player' && roomCode ? Boolean(localStorage.getItem(`bingo-token-${roomCode}`)) : false

  return <main className="join-screen"><div className="eyebrow">{mode === 'host' ? 'New room' : 'Join room'}</div><h1>{mode === 'host' ? 'Gather Your Friends' : 'Get Your Card'}</h1><form className="join-form" onSubmit={enterRoom}><label>Players Name<input autoFocus required value={name} onChange={(event) => setName(event.target.value)} /></label>{mode === 'host' && <label>Room Name<input required value={roomName} onChange={(event) => setRoomName(event.target.value)} /></label>}{mode === 'player' && <label>Room code<input required maxLength={6} value={roomCode} onChange={(event) => setRoomCode(event.target.value.toUpperCase())} /></label>}<button className="primary-button" type="submit">{mode === 'host' ? 'Create room' : hasSavedToken ? 'Rejoin room' : 'Join room'}</button></form>{error && <p className="error">{error}</p>}<button className="back-button" onClick={() => window.history.back()}>Back</button></main>
}