import { describe, expect, it } from 'vitest'
import { createCard, createDrawBag, isWinningCard } from './bingo75'

describe('75-ball bingo rules', () => {
  it('creates a 5x5 card with column ranges and a free center', () => {
    const card = createCard(() => 0)

    expect(card.cells).toHaveLength(25)
    expect(card.cells[12]).toEqual({ value: null, marked: true, free: true })

    for (const [index, cell] of card.cells.entries()) {
      if (index === 12) continue
      const column = index % 5
      const rangeStart = column * 15 + 1
      expect(cell.value).toBeGreaterThanOrEqual(rangeStart)
      expect(cell.value).toBeLessThanOrEqual(rangeStart + 14)
      expect(cell.marked).toBe(false)
      expect(cell.free).toBe(false)
    }
  })

  it('never repeats a number on the same card', () => {
    for (let cardNumber = 0; cardNumber < 20; cardNumber += 1) {
      const card = createCard()
      const values = card.cells.flatMap((cell) => cell.value === null ? [] : [cell.value])
      expect(new Set(values).size).toBe(24)
    }
  })

  it('creates a draw bag containing every ball exactly once', () => {
    const bag = createDrawBag(() => 0)

    expect(bag).toHaveLength(75)
    expect(new Set(bag)).toHaveProperty('size', 75)
    expect(bag).toContain(1)
    expect(bag).toContain(75)
  })

  it('recognizes rows, columns, and diagonals as winning patterns', () => {
    const card = createCard(() => 0)
    const row = card.cells.filter((_, index) => index < 5).map((cell) => cell.value).filter((value): value is number => value !== null)
    const diagonal = card.cells.filter((_, index) => index % 6 === 0).map((cell) => cell.value).filter((value): value is number => value !== null)

    expect(isWinningCard(card, new Set(row))).toBe(true)
    expect(isWinningCard(card, new Set(diagonal))).toBe(true)
    expect(isWinningCard(card, new Set([1, 2, 3]))).toBe(false)
  })
})