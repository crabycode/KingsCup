import { useEffect, useMemo, useReducer, useState, type FormEvent } from 'react';
import { getRule, shuffleDeck, type Mode, type PlayingCard } from './cards';
import { loadSavedState, reducer } from './game';

const STORAGE_KEY = 'kings-cup-bg-v1';
const RANDOM_NAMES = ['Мила', 'Боби', 'Ники', 'Деси', 'Виктор', 'Ели', 'Мартин', 'Рая', 'Иво', 'Кали'];

function CupIcon({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <path d="M18 12h28l-3 26c-.5 5-4 8-8 9v5h13v4H16v-4h13v-5c-4-.8-7.5-4-8-9l-3-26Z" fill="currentColor" opacity=".9" />
    <path d="M20 24h24" stroke="#251718" strokeWidth="2" opacity=".5" />
    <path d="m24 10 3-6 5 4 5-5 4 7" stroke="#F0C675" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M46 17h7c4 0 4 8-1 11l-9 4" stroke="currentColor" strokeWidth="3" />
  </svg>;
}

function SuitMark({ card, big = false }: { card: PlayingCard; big?: boolean }) {
  return <span className={`suit-mark ${card.color} ${big ? 'big' : ''}`} aria-hidden="true">{card.suit}</span>;
}

function CardFace({ card }: { card: PlayingCard }) {
  return <div className={`playing-card ${card.color}`} aria-label={`${card.rank} ${card.suit}`}>
    <div className="card-corner"><b>{card.rank}</b><span>{card.suit}</span></div>
    <div className="card-center"><CupIcon className="card-cup" /><SuitMark card={card} big /></div>
    <div className="card-corner bottom"><b>{card.rank}</b><span>{card.suit}</span></div>
  </div>;
}

function App() {
  const [state, dispatch] = useReducer(reducer, undefined, () => loadSavedState());
  const [players, setPlayers] = useState<string[]>(['', '']);
  const [newName, setNewName] = useState('');
  const [mode, setMode] = useState<Mode>('classic');
  const [showHistory, setShowHistory] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [soundContext, setSoundContext] = useState<AudioContext | null>(null);
  const game = state.game;
  const activeRecord = game?.history.at(-1);
  const progress = game?.history.length ?? 0;
  const remaining = game ? game.deck.length - progress : 52;

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [state]);

  const sortedHistory = useMemo(() => [...(game?.history ?? [])].reverse(), [game?.history]);

  function playSound(kind: 'draw' | 'reveal') {
    if (state.muted) return;
    const context = soundContext ?? new AudioContext();
    if (!soundContext) setSoundContext(context);
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = kind === 'draw' ? 310 : 510;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.045, context.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.18);
    oscillator.connect(gain); gain.connect(context.destination);
    oscillator.start(); oscillator.stop(context.currentTime + 0.19);
  }

  function startGame(names: string[], selectedMode: Mode) {
    const cleaned = names.map((name) => name.trim()).filter(Boolean);
    if (cleaned.length < 2 || cleaned.length > 15) return;
    dispatch({ type: 'start', players: cleaned, mode: selectedMode });
  }

  function addPlayer(event: FormEvent) {
    event.preventDefault();
    const name = newName.trim();
    if (!name || players.length >= 15) return;
    setPlayers((current) => [...current, name]);
    setNewName('');
  }

  function quickStart() {
    const names = shuffleDeck(RANDOM_NAMES).slice(0, 4);
    startGame(names, 'party');
  }

  function draw() { playSound('draw'); dispatch({ type: 'draw' }); }
  function continueTurn() {
    playSound('reveal');
    const isOver = Boolean(game && (game.kingsDrawn >= 4 || game.history.length >= game.deck.length));
    dispatch({ type: 'continue' });
    if (isOver) setShowHistory(false);
  }

  if (state.screen === 'home') return <main className="app-shell home-shell">
    <header className="topbar"><div className="brand"><span className="brand-icon"><CupIcon /></span><span>КРАЛСКАТА ЧАША</span></div><span className="version-tag">ИГРА ЗА КОМПАНИЯ</span></header>
    <section className="hero">
      <div className="hero-copy">
        <div className="eyebrow"><span className="eyebrow-line" /> КЛАСИЧЕСКА КАРТОВА ИГРА</div>
        <h1>Една колода.<br /><em>Вашата вечер.</em></h1>
        <p className="hero-sub">Познатата игра King's Cup, разказана на български. Съберете компанията и оставете картите да решат.</p>
        <div className="hero-actions">
          <button className="button primary large" onClick={() => { setPlayers(['', '']); setMode('classic'); dispatch({ type: 'screen', screen: 'setup' }); }}>Нова игра <span aria-hidden="true">↗</span></button>
          <button className="button ghost large" onClick={quickStart}>Бърз старт <span aria-hidden="true">✦</span></button>
        </div>
        <div className="home-note"><span className="tiny-dot" /> 2–15 играчи <span>·</span> Без регистрация <span>·</span> Работи офлайн</div>
      </div>
      <div className="hero-art" aria-label="Илюстрация на кралска чаша и карти">
        <div className="halo" />
        <div className="art-card art-card-back"><i>♠</i><b>К</b></div>
        <div className="art-card art-card-front"><span>К</span><b>♛</b><i>К</i></div>
        <div className="art-cup"><CupIcon /></div>
        <div className="art-caption"><span>♛</span><div><b>Кралската чаша</b><small>ПРАВИЛАТА СА ВЪВ ВАШИ РЪЦЕ</small></div></div>
      </div>
    </section>
    <section className="home-bottom">
      <div className="how-card"><span className="step-index">01</span><div><b>Добавете играчите</b><p>Въведете имена и изберете режим.</p></div></div>
      <div className="how-card"><span className="step-index">02</span><div><b>Теглете по ред</b><p>Всяка карта носи ново правило.</p></div></div>
      <div className="how-card"><span className="step-index">03</span><div><b>Играйте по свой начин</b><p>Безалкохолното и пасът са винаги опция.</p></div></div>
    </section>
    <footer className="responsible"><span>✦</span> Играйте отговорно. Само за пълнолетни. Изберете безалкохолна напитка или пропуснете ход по всяко време.</footer>
  </main>;

  if (state.screen === 'setup') return <main className="app-shell setup-shell">
    <header className="topbar"><button className="back-button" onClick={() => dispatch({ type: 'screen', screen: 'home' })}>← <span>Начало</span></button><div className="brand"><span className="brand-icon"><CupIcon /></span><span>КРАЛСКАТА ЧАША</span></div><span className="version-tag">НАСТРОЙКА</span></header>
    <section className="setup-layout">
      <div className="setup-intro"><div className="eyebrow"><span className="eyebrow-line" /> ПОДГОТОВКА НА МАСАТА</div><h1>Кой е<br /><em>на ход?</em></h1><p>Съберете компанията около масата. Трябват ви поне двама.</p><div className="setup-stamp"><span>♛</span><div><b>Добре дошли в играта</b><small>НЯМА ТОЧКИ. НЯМА НАКАЗАНИЯ.</small></div></div></div>
      <div className="setup-panel">
        <div className="panel-heading"><div><span className="section-kicker">СТЪПКА 01</span><h2>Играчи <span>{players.filter((p) => p.trim()).length}/15</span></h2></div><button className="text-button" onClick={quickStart}>Случайни имена ↗</button></div>
        <div className="players-list">
          {players.map((player, index) => <div className="player-input-row" key={index}><span className="player-number">{String(index + 1).padStart(2, '0')}</span><input aria-label={`Име на играч ${index + 1}`} value={player} maxLength={22} placeholder={`Играч ${index + 1}`} onChange={(e) => setPlayers((current) => current.map((name, i) => i === index ? e.target.value : name))} /><button className="remove-player" aria-label={`Премахни играч ${index + 1}`} onClick={() => setPlayers((current) => current.filter((_, i) => i !== index))}>×</button></div>)}
        </div>
        <form className="add-player-form" onSubmit={addPlayer}><input aria-label="Ново име" value={newName} maxLength={22} placeholder="Добави име…" onChange={(e) => setNewName(e.target.value)} /><button type="submit" disabled={!newName.trim() || players.length >= 15}>+ Добави</button></form>
        <div className="mode-heading"><span className="section-kicker">СТЪПКА 02</span><h2>Изберете режим</h2></div>
        <div className="mode-options">
          <button className={`mode-option ${mode === 'classic' ? 'selected' : ''}`} onClick={() => setMode('classic')}><span className="mode-symbol">♠</span><span><b>Класически</b><small>Познатите правила на King's Cup</small></span><i>{mode === 'classic' ? '●' : '○'}</i></button>
          <button className={`mode-option ${mode === 'party' ? 'selected' : ''}`} onClick={() => setMode('party')}><span className="mode-symbol party-symbol">✦</span><span><b>Парти</b><small>Повече разговори и закачки</small></span><i>{mode === 'party' ? '●' : '○'}</i></button>
        </div>
        <div className="setup-bottom"><span>♧ <span>Всички действия са по желание.</span></span><button className="button primary" disabled={players.filter((p) => p.trim()).length < 2} onClick={() => startGame(players, mode)}>Започни играта <span>→</span></button></div>
      </div>
    </section>
  </main>;

  if (!game) return <main className="app-shell"><div className="empty-state"><CupIcon /><h1>Няма активна игра</h1><button className="button primary" onClick={() => dispatch({ type: 'screen', screen: 'setup' })}>Започни игра</button></div></main>;

  if (state.screen === 'finished') return <main className="app-shell game-shell finish-shell">
    <header className="topbar"><div className="brand"><span className="brand-icon"><CupIcon /></span><span>КРАЛСКАТА ЧАША</span></div><span className="version-tag">КРАЙ НА ИГРАТА</span></header>
    <section className="finish-content"><div className="finish-emblem"><CupIcon /><span>✦</span></div><div className="eyebrow"><span className="eyebrow-line" /> ПОСЛЕДНАТА КАРТА Е ОБЪРНАТА</div><h1>Наздраве за<br /><em>компанията.</em></h1><p>Изиграхте {progress} {progress === 1 ? 'карта' : 'карти'} в режим „{game.mode === 'classic' ? 'Класически' : 'Парти'}“. Благодаря, че играхте заедно.</p><div className="finish-stats"><div><b>{progress}</b><span>ИЗТЕГЛЕНИ КАРТИ</span></div><div><b>{game.players.length}</b><span>ИГРАЧИ</span></div><div><b>{game.kingsDrawn}/4</b><span>КРАЛЕ</span></div></div><div className="hero-actions finish-actions"><button className="button primary large" onClick={() => dispatch({ type: 'restart' })}>Играй отново <span>↻</span></button><button className="button ghost large" onClick={() => dispatch({ type: 'home' })}>Към началото</button></div><p className="finish-disclaimer">Никой не е длъжен да пие. Водата, безалкохолните напитки и пасът са винаги добре дошли.</p></section>
  </main>;

  const activeCard = activeRecord?.card;
  const currentPlayer = game.players[game.currentPlayerIndex];
  const isEndingCard = game.kingsDrawn >= 4 || progress >= game.deck.length;

  return <main className="app-shell game-shell">
    <header className="topbar game-topbar"><button className="back-button" onClick={() => setConfirmRestart(true)}>↻ <span>Рестарт</span></button><div className="brand"><span className="brand-icon"><CupIcon /></span><span>КРАЛСКАТА ЧАША</span></div><div className="top-tools"><button className="icon-button" onClick={() => { dispatch({ type: 'mute', muted: !state.muted }); if (state.muted) playSound('reveal'); }} aria-label={state.muted ? 'Включи звука' : 'Изключи звука'}>{state.muted ? '♫̸' : '♫'}</button><button className="history-button" onClick={() => setShowHistory(true)}>История <span>{progress}</span></button></div></header>
    <section className="game-layout">
      <aside className="game-sidebar">
        <div className="turn-card"><span className="section-kicker">СЕГА Е НА РЕД</span><div className="turn-avatar">{currentPlayer.slice(0, 1).toLocaleUpperCase('bg')}</div><h2>{currentPlayer}</h2><p>тегли карта</p><div className="turn-position">ИГРАЧ {String(game.currentPlayerIndex + 1).padStart(2, '0')} <span>/ {String(game.players.length).padStart(2, '0')}</span></div></div>
        <div className="side-stats"><div className="side-stat"><span>КАРТИ ОСТАВАТ</span><b>{String(remaining).padStart(2, '0')}<i>/ 52</i></b><div className="progress-track"><span style={{ width: `${(progress / 52) * 100}%` }} /></div></div><div className="side-stat king-stat"><span>ИЗТЕГЛЕНИ КРАЛЕ</span><b>{game.kingsDrawn}<i>/ 4</i></b><div className="king-pips">{[0, 1, 2, 3].map((n) => <span key={n} className={n < game.kingsDrawn ? 'lit' : ''}>♛</span>)}</div></div></div>
        <div className="player-order"><div className="order-head"><span className="section-kicker">ОКОЛО МАСАТА</span><span>{game.players.length} ИГРАЧИ</span></div><div className="order-list">{game.players.map((name, i) => <div className={`order-player ${i === game.currentPlayerIndex ? 'active' : ''}`} key={`${name}-${i}`}><span className="order-dot">{String(i + 1).padStart(2, '0')}</span><span>{name}</span>{i === game.currentPlayerIndex && <i>НА ХОД</i>}</div>)}</div></div>
      </aside>
      <div className="table-area">
        <div className="table-heading"><div><span className="section-kicker">{game.mode === 'classic' ? 'КЛАСИЧЕСКИ РЕЖИМ' : 'ПАРТИ РЕЖИМ'}</span><h1>{game.awaitingContinue ? 'Твоята карта.' : 'Тегли карта.'}</h1></div><button className="undo-button" disabled={!game.undoStack.length} onClick={() => dispatch({ type: 'undo' })}>↶ <span>Отмени</span></button></div>
        <div className={`table-scene ${game.awaitingContinue ? 'revealed' : ''}`}>
          <div className="table-glow" />
          <div className="deck-stack" aria-label={`${remaining} карти остават`}>
            <div className="deck-card deck-1" /><div className="deck-card deck-2" />
            {game.awaitingContinue && activeCard ? <div className="revealed-card"><CardFace card={activeCard} /></div> : <button className="deck-card deck-top" onClick={draw} aria-label="Изтегли карта"><span className="deck-ornament">♛<i>✦</i></span><small>КРАЛСКАТА<br />ЧАША</small><span className="deck-count">{remaining}</span></button>}
          </div>
          <div className={`center-cup ${game.kingsDrawn ? 'cup-active' : ''}`}><CupIcon /><span>КРАЛСКА ЧАША</span><div className="cup-progress">{[0, 1, 2, 3].map((i) => <i key={i} className={i < game.kingsDrawn ? 'lit' : ''} />)}</div></div>
          <div className="scene-stat left"><b>{String(progress).padStart(2, '0')}</b><span>ИЗТЕГЛЕНИ</span></div><div className="scene-stat right"><b>{String(remaining).padStart(2, '0')}</b><span>В КОЛОДАТА</span></div>
        </div>
        {game.awaitingContinue && activeCard ? <div className="rule-panel" key={activeCard.id}><div className="rule-topline"><span className="rule-label">{activeCard.rank === 'K' ? 'КРАЛСКА КАРТА' : 'КАРТА ' + activeCard.rank}</span><span className="rule-suit"><SuitMark card={activeCard} /> {activeCard.rank === 'K' ? `КРАЛ ${game.kingsDrawn}/4` : activeCard.suit}</span></div><h2>{activeCard.title}</h2><p>{getRule(activeCard, game.mode)}</p><div className="rule-actions"><span className="optional-note">◎ По желание · пасът е винаги опция</span><button className="button primary" onClick={continueTurn}>{isEndingCard ? 'Към финала' : 'Готово, следващ играч'} <span>→</span></button></div></div> : <div className="draw-prompt"><div className="draw-prompt-icon">✦</div><div><b>{currentPlayer}, твой ред е.</b><span>Изтегли карта, за да видиш правилото.</span></div><button className="button primary" onClick={draw}>Изтегли карта <span>↓</span></button></div>}
        <div className="game-footer"><span>ПО РЕД НА ЧАСОВНИКОВАТА СТРЕЛКА</span><span>БЕЗАЛКОХОЛНОТО И ПАСЪТ СА ВИНАГИ ОПЦИЯ</span></div>
      </div>
    </section>
    {showHistory && <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowHistory(false); }}><section className="history-modal" role="dialog" aria-modal="true" aria-labelledby="history-title"><div className="modal-heading"><div><span className="section-kicker">ХОД ПО ХОД</span><h2 id="history-title">История <span>{progress}</span></h2></div><button className="close-button" onClick={() => setShowHistory(false)} aria-label="Затвори историята">×</button></div>{sortedHistory.length ? <div className="history-list">{sortedHistory.map((entry, i) => <article className="history-entry" key={`${entry.card.id}-${i}`}><CardFace card={entry.card} /><div><div className="history-meta"><span>{entry.player}</span><span>{entry.card.rank} {entry.card.suit}</span></div><h3>{entry.card.title}</h3><p>{getRule(entry.card, game.mode)}</p></div></article>)}</div> : <div className="history-empty"><span>♧</span><b>Още няма изтеглени карти.</b><p>Историята ще се появи тук.</p></div>}</section></div>}
    {confirmRestart && <div className="modal-backdrop"><section className="confirm-modal" role="dialog" aria-modal="true"><span className="confirm-icon">↻</span><span className="section-kicker">ЗАПОЧНИ ОТНАЧАЛО</span><h2>Нова колода?</h2><p>Текущият напредък ще се изчисти. Играчите и режимът ще се запазят.</p><div><button className="button ghost" onClick={() => setConfirmRestart(false)}>Продължи играта</button><button className="button primary" onClick={() => { dispatch({ type: 'restart' }); setConfirmRestart(false); }}>Рестартирай</button></div></section></div>}
  </main>;
}

export default App;
