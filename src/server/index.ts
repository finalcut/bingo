import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { WebSocketServer, type WebSocket } from 'ws'
import type { ClientCommand, RoomStateEvent, ServerEvent } from '../shared/protocol'
import { RoomRegistry } from './roomRegistry'

const port = Number(process.env.PORT ?? 3001)
const registry = new RoomRegistry()
const connections = new Map<WebSocket, { code: string; playerId: string; token: string }>()

function send(socket: WebSocket, event: ServerEvent): void {
  socket.send(JSON.stringify(event))
}

function stateFor(socket: WebSocket): RoomStateEvent | undefined {
  const connection = connections.get(socket)
  if (!connection) return undefined
  const registered = registry.get(connection.code)
  if (!registered) return undefined
  const player = registered.room.players.find((candidate) => candidate.playerId === connection.playerId)
  if (!player) return undefined

  return {
    type: 'roomState',
    roomCode: connection.code,
    phase: registered.room.phase,
    playerId: player.playerId,
    token: player.token,
    isHost: player.playerId === registered.room.hostId,
    eliminated: player.eliminated,
    card: player.card,
    players: registered.room.players.map(({ playerId, name, eliminated }) => ({ playerId, name, eliminated })),
    calledBalls: registered.room.calledBalls,
    mode: registered.room.mode,
    winnerId: registered.room.winnerId,
  }
}

function broadcast(code: string): void {
  for (const [socket, connection] of connections) {
    if (connection.code !== code) continue
    const state = stateFor(socket)
    if (state) send(socket, state)
  }
}

const clientRoot = fileURLToPath(new URL('../../dist', import.meta.url))

const httpServer = createServer(async (request, response) => {
  if (request.url === '/health') {
    response.writeHead(200, { 'content-type': 'application/json' })
    response.end(JSON.stringify({ service: 'bingo', status: 'ok' }))
    return
  }

  const requestedPath = (request.url ?? '/').split('?')[0]
  const filePath = join(clientRoot, requestedPath === '/' ? 'index.html' : requestedPath.replace(/^\/+/, ''))
  try {
    const body = await readFile(filePath)
    const extension = extname(filePath)
    const contentType = extension === '.js' ? 'text/javascript' : extension === '.css' ? 'text/css' : 'text/html'
    response.writeHead(200, { 'content-type': contentType })
    response.end(body)
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain' })
    response.end('Not found')
  }
})
const webSocketServer = new WebSocketServer({ server: httpServer })

webSocketServer.on('connection', (socket) => {
  socket.on('message', (raw) => {
    try {
      const command = JSON.parse(raw.toString()) as ClientCommand
      if (command.type === 'createRoom') {
        const created = registry.create(command.name, command.modeId)
        const host = created.room.players[0]
        connections.set(socket, { code: created.code, playerId: host.playerId, token: host.token })
        broadcast(created.code)
        return
      }

      if (command.type === 'joinRoom') {
        const found = registry.get(command.roomCode)
        if (!found) throw new Error('Room not found')
        const player = found.room.join(command.name, command.token)
        connections.set(socket, { code: found.code, playerId: player.playerId, token: player.token })
        broadcast(found.code)
        return
      }

      const connection = connections.get(socket)
      if (!connection) throw new Error('Join a room first')
      const found = registry.get(connection.code)
      if (!found) throw new Error('Room not found')

      switch (command.type) {
        case 'startGame': found.room.start(connection.playerId); break
        case 'drawBall': found.room.draw(connection.playerId); break
        case 'markCell': found.room.mark(connection.playerId, command.row, command.column); break
        case 'newGame': found.room.newGame(connection.playerId, command.modeId); break
        case 'claimBingo': {
          const claim = found.room.claimBingo(connection.playerId)
          if (!claim.accepted) send(socket, { type: 'error', message: claim.message })
          break
        }
        default: throw new Error('Unknown command')
      }
      broadcast(found.code)
    } catch (error) {
      send(socket, { type: 'error', message: error instanceof Error ? error.message : 'Invalid command' })
    }
  })
  socket.on('close', () => connections.delete(socket))
})

httpServer.listen(port, () => console.log(`Bingo server listening on http://localhost:${port}`))