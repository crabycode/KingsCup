import { DECK, shuffleDeck, type Mode, type PlayingCard } from './cards';

export type Screen = 'home' | 'setup' | 'game' | 'finished';

export interface DrawRecord {
  card: PlayingCard;
  player: string;
  playerIndex: number;
}

export interface GameSnapshot {
  players: string[];
  mode: Mode;
  deck: PlayingCard[];
  history: DrawRecord[];
  currentPlayerIndex: number;
  kingsDrawn: number;
  awaitingContinue: boolean;
  undoStack: Omit<GameSnapshot, 'undoStack'>[];
}

export interface AppState {
  screen: Screen;
  game: GameSnapshot | null;
  muted: boolean;
}

export const initialState: AppState = { screen: 'home', game: null, muted: true };

export function createGame(players: string[], mode: Mode, deck = shuffleDeck(DECK)): GameSnapshot {
  return {
    players: [...players], mode, deck: [...deck], history: [], currentPlayerIndex: 0,
    kingsDrawn: 0, awaitingContinue: false, undoStack: [],
  };
}

type Action =
  | { type: 'screen'; screen: Screen }
  | { type: 'start'; players: string[]; mode: Mode }
  | { type: 'draw' }
  | { type: 'continue' }
  | { type: 'undo' }
  | { type: 'restart' }
  | { type: 'mute'; muted: boolean }
  | { type: 'home' }
  | { type: 'restore'; state: AppState };

function snapshot(game: GameSnapshot): Omit<GameSnapshot, 'undoStack'> {
  const { undoStack: _undoStack, ...copy } = game;
  return structuredClone(copy);
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'screen': return { ...state, screen: action.screen };
    case 'restore': return action.state;
    case 'mute': return { ...state, muted: action.muted };
    case 'home': return { ...state, screen: 'home' };
    case 'start': return { ...state, screen: 'game', game: createGame(action.players, action.mode) };
    case 'restart':
      return state.game ? { ...state, screen: 'game', game: createGame(state.game.players, state.game.mode) } : state;
    case 'draw': {
      const game = state.game;
      if (!game || game.awaitingContinue || game.history.length >= game.deck.length) return state;
      const card = game.deck[game.history.length];
      const record = { card, player: game.players[game.currentPlayerIndex], playerIndex: game.currentPlayerIndex };
      return {
        ...state,
        game: {
          ...game,
          history: [...game.history, record],
          kingsDrawn: game.kingsDrawn + (card.rank === 'K' ? 1 : 0),
          awaitingContinue: true,
          undoStack: [...game.undoStack, snapshot(game)],
        },
      };
    }
    case 'continue': {
      const game = state.game;
      if (!game?.awaitingContinue) return state;
      if (game.kingsDrawn >= 4 || game.history.length >= game.deck.length) return { ...state, screen: 'finished', game: { ...game, awaitingContinue: false } };
      return { ...state, game: { ...game, awaitingContinue: false, currentPlayerIndex: (game.currentPlayerIndex + 1) % game.players.length } };
    }
    case 'undo': {
      const game = state.game;
      if (!game || !game.undoStack.length) return state;
      const previous = game.undoStack[game.undoStack.length - 1];
      return { ...state, screen: 'game', game: { ...previous, undoStack: game.undoStack.slice(0, -1) } };
    }
  }
}

export function loadSavedState(storage: Pick<Storage, 'getItem'> = localStorage): AppState {
  try {
    const raw = storage.getItem('kings-cup-bg-v1');
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as AppState;
    if (!['home', 'setup', 'game', 'finished'].includes(parsed.screen) || typeof parsed.muted !== 'boolean') return initialState;
    if (parsed.game && (!Array.isArray(parsed.game.players) || parsed.game.players.length < 2 || !Array.isArray(parsed.game.deck) || !Array.isArray(parsed.game.history))) return initialState;
    return parsed;
  } catch { return initialState; }
}
