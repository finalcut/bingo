import { describe, expect, it } from 'vitest'
import { createCard, isWinningSelection, markCell } from './bingo75'
import { bingo75Modes, getBingo75Mode } from './bingo75Modes'

function select(card: ReturnType<typeof createCard>, coordinates: Array<[number, number]>): ReturnType<typeof createCard> {
  return coordinates.reduce((current, [row, column]) => markCell(current, row, column), card)
}

describe('75-ball game modes', () => {
  it('registers every supported mode', () => {
    expect(Object.keys(bingo75Modes).sort()).toEqual([
      'standard', '7', 'plus', 'blackout', 'checkerboard', 'four-corners',
      'letter-h', 'letter-t', 'letter-x', 'letter-z', 'large-picture-frame', 'tic-tac-toe',
    ].sort())
  })

  it('validates a fixed mode using its registered pattern', () => {
    const card = createCard(() => 0)
    const mode = getBingo75Mode('7')
    const coordinates: Array<[number, number]> = [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2], [3, 2], [4, 2]]
    const selected = select(card, coordinates)
    const called = new Set(selected.cells.flatMap((cell) => cell.value === null ? [] : [cell.value]))

    expect(isWinningSelection(selected, called, mode)).toBe(true)
    expect(isWinningSelection(select(card, coordinates.slice(0, -1)), called, mode)).toBe(false)
  })

  it('keeps standard mode as any row, column, or diagonal', () => {
    const card = createCard(() => 0)
    const selected = select(card, Array.from({ length: 5 }, (_, index) => [index, index]))
    const called = new Set(selected.cells.flatMap((cell) => cell.value === null ? [] : [cell.value]))

    expect(isWinningSelection(selected, called, getBingo75Mode('standard'))).toBe(true)
  })
})