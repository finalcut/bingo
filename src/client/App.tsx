import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import type { BingoCard } from '../domain/bingo75'
import { bingo75Modes, type Bingo75ModeId } from '../domain/bingo75Modes'
import type { RoomStateEvent, ServerEvent } from '../shared/protocol'
import { GameClient } from './gameClient'
import './styles.css'

type Mode = 'host' | 'player'

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

export function Room({ state, client, error }: { state: RoomStateEvent; client: GameClient; error: string }) {
  const [qr, setQr] = useState('')
  const [newGameMode, setNewGameMode] = useState<Bingo75ModeId>(state.mode.id)
  const joinUrl = `${window.location.origin}/?room=${state.roomCode}`
  useEffect(() => { void QRCode.toDataURL(joinUrl, { width: 220, margin: 1 }).then(setQr) }, [joinUrl])
  const lastBall = state.calledBalls.at(-1)
  const winnerName = state.winnerId ? state.players.find((player) => player.playerId === state.winnerId)?.name : undefined

  return <main className="room-layout">
    <section className="game-panel">
      <div className="eyebrow">Room {state.roomCode}</div>
      <h1>{state.isHost ? 'Your game room' : 'Your bingo card'}</h1>
      <div className="status-row"><span className={`status-dot ${state.phase}`} />{state.phase === 'lobby' ? 'Waiting for the host' : state.phase === 'playing' ? 'Game in progress' : state.winnerId === state.playerId ? 'Bingo confirmed!' : 'Game complete'}</div>
      {winnerName && <p className="winner-banner" role="status">{winnerName} won the game</p>}
      <div className="mode-info"><div className="eyebrow">Game mode</div><h2>{state.mode.name}</h2><p>{state.mode.description}</p><ModePreview mode={state.mode} /></div>
      {state.phase !== 'lobby' && <div className="ball-call"><span>Latest call</span><strong>{lastBall ? `${'BINGO'[Math.floor((lastBall - 1) / 15)]}${lastBall}` : 'Ready'}</strong></div>}
      {error && <p className="error" role="alert">{error}</p>}
      <Card card={state.card} called={state.calledBalls} eliminated={state.eliminated} onMark={(row, column) => client.send({ type: 'markCell', row, column })} />
      <button className="claim-button" disabled={state.eliminated || state.phase !== 'playing'} onClick={() => client.send({ type: 'claimBingo' })}>{state.eliminated ? 'Out of the game' : state.winnerId ? 'Game complete' : 'Bingo!'}</button>
    </section>
    <aside className="side-panel">
      {state.isHost && <div className="host-controls">
        <div className="eyebrow">Host controls</div>
        {state.phase === 'lobby' && <button className="primary-button" onClick={() => client.send({ type: 'startGame' })}>Start game</button>}
        {state.phase === 'playing' && <button className="primary-button" onClick={() => client.send({ type: 'drawBall' })}>Draw next ball</button>}
        {state.phase === 'finished' && <><label>New game mode<select aria-label="New game mode" value={newGameMode} onChange={(event) => setNewGameMode(event.target.value as Bingo75ModeId)}>{Object.values(bingo75Modes).map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}</select></label><button className="primary-button" onClick={() => client.send({ type: 'newGame', modeId: newGameMode })}>Start new game</button></>}
        <div className="players"><span>Players</span><strong>{state.players.length}</strong>{state.players.map((player) => <div key={player.playerId}>{player.name}{player.eliminated ? ' (out)' : ''}</div>)}</div>
        {qr && <img className="qr-code" src={qr} alt={`Join room ${state.roomCode}`} />}
      </div>}
      <div className="called-panel"><div className="eyebrow">Called balls</div><div className="called-balls">{state.calledBalls.length ? state.calledBalls.map((ball) => <span key={ball}>{ball}</span>) : <small>No calls yet</small>}</div></div>
    </aside>
  </main>
}

export default function App() {
  const [mode, setMode] = useState<Mode>()
  const [gameMode, setGameMode] = useState<Bingo75ModeId>('standard')
  const [name, setName] = useState('')
  const [roomCode, setRoomCode] = useState(new URLSearchParams(window.location.search).get('room') ?? '')
  const [state, setState] = useState<RoomStateEvent>()
  const [error, setError] = useState('')
  const [client] = useState(() => new GameClient((event: ServerEvent) => {
    if (event.type === 'error') setError(event.message)
    else { setError(''); setState(event); localStorage.setItem(`bingo-token-${event.roomCode}`, event.token) }
  }))

  async function enterRoom(event: React.FormEvent) {
    event.preventDefault()
    try {
      await client.connect()
      const token = roomCode ? localStorage.getItem(`bingo-token-${roomCode}`) ?? undefined : undefined
      client.send(mode === 'host' ? { type: 'createRoom', name, modeId: gameMode } : { type: 'joinRoom', roomCode, name, token })
    } catch (connectionError) { setError(connectionError instanceof Error ? connectionError.message : 'Unable to connect') }
  }

  if (state) return <Room state={state} client={client} error={error} />
  if (!mode) return <main className="landing"><div className="eyebrow">75-ball bingo</div><h1>Make a little<br /><em>noise.</em></h1><p>One room. One caller. Every number matters.</p><div className="mode-actions"><button className="primary-button" onClick={() => setMode('host')}>Host a game</button><button className="secondary-button" onClick={() => setMode('player')}>Join a game</button></div></main>

  return <main className="join-screen"><div className="eyebrow">{mode === 'host' ? 'New room' : 'Join room'}</div><h1>{mode === 'host' ? 'Set the room in motion.' : 'Find your seat.'}</h1><form onSubmit={enterRoom}><label>Display name<input autoFocus required value={name} onChange={(event) => setName(event.target.value)} /></label>{mode === 'host' && <label>Game mode<select aria-label="Game mode" value={gameMode} onChange={(event) => setGameMode(event.target.value as Bingo75ModeId)}>{Object.values(bingo75Modes).map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}</select></label>}{mode === 'player' && <label>Room code<input required maxLength={6} value={roomCode} onChange={(event) => setRoomCode(event.target.value.toUpperCase())} /></label>}<button className="primary-button" type="submit">{mode === 'host' ? 'Create room' : 'Join room'}</button></form>{error && <p className="error">{error}</p>}<button className="back-button" onClick={() => setMode(undefined)}>Back</button></main>
}