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
      'goalpost', 'letter-a', 'letter-h', 'letter-t', 'letter-u', 'letter-w', 'letter-x', 'letter-y', 'letter-z', 'lucky-clover', 'postage-stamp', 'railroad-tracks', 'small-diamond', 'small-pyramid', 'smiley-face', 'starburst', 'large-picture-frame', 'tic-tac-toe',
    ].sort())
  })

  it('validates the smiley face pattern', () => {
    const card = createCard(() => 0)
    const mode = getBingo75Mode('smiley-face')
    const coordinates: Array<[number, number]> = [
      [1, 1], [1, 3], [2, 2], [3, 0], [3, 4], [4, 1], [4, 2], [4, 3],
    ]
    const selected = select(card, coordinates)
    const called = new Set(selected.cells.flatMap((cell) => cell.value === null ? [] : [cell.value]))

    expect(isWinningSelection(selected, called, mode)).toBe(true)
    expect(isWinningSelection(select(card, coordinates.slice(0, -1)), called, mode)).toBe(false)
  })

  it('validates the starburst pattern', () => {
    const card = createCard(() => 0)
    const mode = getBingo75Mode('starburst')
    const coordinates: Array<[number, number]> = [
      [0, 0], [0, 4], [1, 1], [1, 3], [2, 1], [2, 2], [2, 3], [3, 1], [3, 3], [4, 0], [4, 4],
    ]
    const selected = select(card, coordinates)
    const called = new Set(selected.cells.flatMap((cell) => cell.value === null ? [] : [cell.value]))

    expect(isWinningSelection(selected, called, mode)).toBe(true)
    expect(isWinningSelection(select(card, coordinates.slice(0, -1)), called, mode)).toBe(false)
  })

  it('validates the small pyramid pattern', () => {
    const card = createCard(() => 0)
    const mode = getBingo75Mode('small-pyramid')
    const coordinates: Array<[number, number]> = [
      [2, 2], [3, 1], [3, 2], [3, 3], [4, 0], [4, 1], [4, 2], [4, 3], [4, 4],
    ]
    const selected = select(card, coordinates)
    const called = new Set(selected.cells.flatMap((cell) => cell.value === null ? [] : [cell.value]))

    expect(isWinningSelection(selected, called, mode)).toBe(true)
    expect(isWinningSelection(select(card, coordinates.slice(0, -1)), called, mode)).toBe(false)
  })

  it('validates the small diamond pattern', () => {
    const card = createCard(() => 0)
    const mode = getBingo75Mode('small-diamond')
    const coordinates: Array<[number, number]> = [[1, 2], [2, 1], [2, 2], [2, 3], [3, 2]]
    const selected = select(card, coordinates)
    const called = new Set(selected.cells.flatMap((cell) => cell.value === null ? [] : [cell.value]))

    expect(isWinningSelection(selected, called, mode)).toBe(true)
    expect(isWinningSelection(select(card, coordinates.slice(0, -1)), called, mode)).toBe(false)
  })

  it('validates the railroad tracks pattern', () => {
    const card = createCard(() => 0)
    const mode = getBingo75Mode('railroad-tracks')
    const coordinates: Array<[number, number]> = [
      ...Array.from({ length: 5 }, (_, row) => [row, 0] as [number, number]),
      ...Array.from({ length: 5 }, (_, row) => [row, 4] as [number, number]),
    ]
    const selected = select(card, coordinates)
    const called = new Set(selected.cells.flatMap((cell) => cell.value === null ? [] : [cell.value]))

    expect(isWinningSelection(selected, called, mode)).toBe(true)
    expect(isWinningSelection(select(card, coordinates.slice(0, -1)), called, mode)).toBe(false)
  })

  it('validates the postage stamp pattern', () => {
    const card = createCard(() => 0)
    const mode = getBingo75Mode('postage-stamp')
    const coordinates: Array<[number, number]> = [[0, 3], [0, 4], [1, 3], [1, 4]]
    const selected = select(card, coordinates)
    const called = new Set(selected.cells.flatMap((cell) => cell.value === null ? [] : [cell.value]))

    expect(isWinningSelection(selected, called, mode)).toBe(true)
    expect(isWinningSelection(select(card, coordinates.slice(0, -1)), called, mode)).toBe(false)
  })

  it('validates the lucky clover pattern', () => {
    const card = createCard(() => 0)
    const mode = getBingo75Mode('lucky-clover')
    const coordinates: Array<[number, number]> = [
      [0, 0], [0, 1], [0, 3], [0, 4], [1, 0], [1, 1], [1, 3], [1, 4],
      [3, 0], [3, 1], [3, 3], [3, 4], [4, 0], [4, 1], [4, 3], [4, 4],
    ]
    const selected = select(card, coordinates)
    const called = new Set(selected.cells.flatMap((cell) => cell.value === null ? [] : [cell.value]))

    expect(isWinningSelection(selected, called, mode)).toBe(true)
    expect(isWinningSelection(select(card, coordinates.slice(0, -1)), called, mode)).toBe(false)
  })

  it('validates the letter Y pattern', () => {
    const card = createCard(() => 0)
    const mode = getBingo75Mode('letter-y')
    const coordinates: Array<[number, number]> = [
      [0, 0], [0, 4], [1, 1], [1, 3], [2, 2], [3, 2], [4, 2],
    ]
    const selected = select(card, coordinates)
    const called = new Set(selected.cells.flatMap((cell) => cell.value === null ? [] : [cell.value]))

    expect(isWinningSelection(selected, called, mode)).toBe(true)
    expect(isWinningSelection(select(card, coordinates.slice(0, -1)), called, mode)).toBe(false)
  })

  it('validates the letter W pattern', () => {
    const card = createCard(() => 0)
    const mode = getBingo75Mode('letter-w')
    const coordinates: Array<[number, number]> = [
      ...Array.from({ length: 5 }, (_, row) => [row, 0] as [number, number]),
      ...Array.from({ length: 5 }, (_, row) => [row, 4] as [number, number]),
      [3, 1], [3, 3],
    ]
    const selected = select(card, coordinates)
    const called = new Set(selected.cells.flatMap((cell) => cell.value === null ? [] : [cell.value]))

    expect(isWinningSelection(selected, called, mode)).toBe(true)
    expect(isWinningSelection(select(card, coordinates.slice(0, -1)), called, mode)).toBe(false)
  })

  it('validates the letter U pattern', () => {
    const card = createCard(() => 0)
    const mode = getBingo75Mode('letter-u')
    const coordinates: Array<[number, number]> = [
      ...Array.from({ length: 5 }, (_, row) => [row, 0] as [number, number]),
      ...Array.from({ length: 5 }, (_, row) => [row, 4] as [number, number]),
      [4, 1], [4, 2], [4, 3],
    ]
    const selected = select(card, coordinates)
    const called = new Set(selected.cells.flatMap((cell) => cell.value === null ? [] : [cell.value]))

    expect(isWinningSelection(selected, called, mode)).toBe(true)
    expect(isWinningSelection(select(card, coordinates.slice(0, -1)), called, mode)).toBe(false)
  })

  it('validates the letter A pattern', () => {
    const card = createCard(() => 0)
    const mode = getBingo75Mode('letter-a')
    const coordinates: Array<[number, number]> = [
      [0, 2], [1, 1], [1, 3], [2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [3, 0], [3, 4], [4, 0], [4, 4],
    ]
    const selected = select(card, coordinates)
    const called = new Set(selected.cells.flatMap((cell) => cell.value === null ? [] : [cell.value]))

    expect(isWinningSelection(selected, called, mode)).toBe(true)
    expect(isWinningSelection(select(card, coordinates.slice(0, -1)), called, mode)).toBe(false)
  })

  it('validates the goalpost pattern', () => {
    const card = createCard(() => 0)
    const mode = getBingo75Mode('goalpost')
    const coordinates: Array<[number, number]> = [
      [0, 0], [0, 4], [1, 0], [1, 4], [2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [3, 2], [4, 2],
    ]
    const selected = select(card, coordinates)
    const called = new Set(selected.cells.flatMap((cell) => cell.value === null ? [] : [cell.value]))

    expect(isWinningSelection(selected, called, mode)).toBe(true)
    expect(isWinningSelection(select(card, coordinates.slice(0, -1)), called, mode)).toBe(false)
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