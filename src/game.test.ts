import { describe, expect, it } from 'vitest';
import { DECK } from './cards';
import { createGame, initialState, reducer, type AppState } from './game';

describe('King’s Cup deck and turn flow', () => {
  it('contains 52 uniquely identified cards with a rule for each mode', () => {
    expect(DECK).toHaveLength(52);
    expect(new Set(DECK.map((card) => card.id)).size).toBe(52);
    expect(DECK.every((card) => card.rule.length > 0 && card.partyRule.length > 0)).toBe(true);
  });

  it('advances clockwise only after a card is acknowledged and never draws twice', () => {
    const deck = [...DECK];
    let state: AppState = { ...initialState, screen: 'game', game: createGame(['Ани', 'Боби', 'Вики'], 'classic', deck) };
    state = reducer(state, { type: 'draw' });
    expect(state.game?.history[0].card.id).toBe(deck[0].id);
    expect(state.game?.currentPlayerIndex).toBe(0);
    expect(reducer(state, { type: 'draw' })).toEqual(state);
    state = reducer(state, { type: 'continue' });
    expect(state.game?.currentPlayerIndex).toBe(1);
    state = reducer(state, { type: 'draw' });
    expect(state.game?.history.map((record) => record.card.id)).toEqual([deck[0].id, deck[1].id]);
  });

  it('undo restores the previous card, turn, and king count', () => {
    const kingsFirst = [...DECK.filter((card) => card.rank === 'K'), ...DECK.filter((card) => card.rank !== 'K')];
    let state: AppState = { ...initialState, screen: 'game', game: createGame(['Ани', 'Боби'], 'party', kingsFirst) };
    state = reducer(state, { type: 'draw' });
    expect(state.game?.kingsDrawn).toBe(1);
    state = reducer(state, { type: 'undo' });
    expect(state.game?.history).toHaveLength(0);
    expect(state.game?.kingsDrawn).toBe(0);
    expect(state.game?.awaitingContinue).toBe(false);
    expect(state.game?.currentPlayerIndex).toBe(0);
  });

  it('ends after the fourth king and restart creates a fresh game', () => {
    const kingsFirst = [...DECK.filter((card) => card.rank === 'K'), ...DECK.filter((card) => card.rank !== 'K')];
    let state: AppState = { ...initialState, screen: 'game', game: createGame(['Ани', 'Боби'], 'classic', kingsFirst) };
    for (let i = 0; i < 4; i += 1) {
      state = reducer(state, { type: 'draw' });
      if (i < 3) state = reducer(state, { type: 'continue' });
    }
    expect(state.game?.kingsDrawn).toBe(4);
    state = reducer(state, { type: 'continue' });
    expect(state.screen).toBe('finished');
    state = reducer(state, { type: 'restart' });
    expect(state.screen).toBe('game');
    expect(state.game?.history).toHaveLength(0);
    expect(state.game?.players).toEqual(['Ани', 'Боби']);
  });
});
