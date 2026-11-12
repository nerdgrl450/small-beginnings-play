import { icon } from './icons.js';
import {
  capacity, availableDraw, forecast, money, clock, transition, upgrades, decor, homes,
  neighbors, ingredients, INGREDIENT_CAPACITY, SUPPLY_COST, PACK_SIZE, MIN_PRICE, MAX_PRICE,
  PRICE_STEP, STALL_FEE, UPGRADE_RESERVE, RENT, finishedServings, recipes, dailyPay, livingCost,
} from './engine.js';
import { openSave, loadSave, commitSave, exportSave, importSave, SaveConflict } from './save.js';
import { setupPrep } from './prep.js';
import { customers, nextTrafficDelay } from './traffic.js';

const $ = (id) => document.getElementById(id);
const safe = (text) => String(text).replace(/[&<>"']/g, (letter) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[letter]
));
const locations = {
  stand: { title: 'Lemonade Stand', area: 'Willowbrook · Willow Lane', art: 'stand', alt: 'A small wooden lemonade stand with a striped awning on a sunlit cobblestone lane.', caption: 'Willow Lane', note: 'Your little corner of town' },
  home: { title: 'Home', area: 'Willowbrook · Home', art: 'shelter', alt: 'A battered cardboard box and scrap of tarp used as a shelter behind a garden wall.', caption: 'The cardboard shelter', note: 'Behind the garden wall' },
  room: { title: 'Home', area: 'Willowbrook · Home', art: 'room', alt: 'A small rented room with a bed, a sunlit window, and wooden floors.', caption: 'The rented room', note: 'Upstairs on Willow Lane' },
  market: { title: 'Willowbrook Market', area: 'Willowbrook · Market Square', art: 'market', alt: 'A sage green village shop with crates of fruit under a striped awning.', caption: 'Market Square', note: 'Groceries, furnishings & neighbors' },
  ledger: { title: 'The Ledger', area: 'Willowbrook · Business accounts', art: 'stand', alt: 'The lemonade stand on Willow Lane.', caption: 'Lemonade stand accounts', note: 'Business and personal balances' },
};

const categories = { stock: 'Ingredients', home: 'Home goods', neighbors: 'Neighbors' };
const THEME_KEY = 'small-beginnings-theme';
let db;
let save;
let view = 'stand';
let category = 'stock';
let toastTimer;
let tradeTimer;
let busy = false;
let offlineReady = false;
let storageError = '';
let lastSale = 0;
let saleTimer;
let dialogue = null;
let customerMessage = '';

const prep = setupPrep({ getState: () => save?.state, make: perform,
  goMarket: () => selectView('market', 'stock'), onClose: scheduleTrade });

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]').content = theme === 'light' ? '#f6f2e8' : '#171f1a';
}

try { applyTheme(localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'); } catch { applyTheme('dark'); }

const buttons = {
  evening: (label = 'Head into evening') => button(label, 'evening', { style: 'primary', symbol: 'moon' }),
  sleep: () => button('Sleep until morning', 'sleep', { style: 'primary', symbol: 'moon' }),
};

function button(label, action, options = {}) {
  const { id, symbol, style = 'secondary', disabled = false, extra = '' } = options;
  return `<button class="button ${style}" data-action="${action}" ${id ? `data-id="${id}"` : ''} ${extra} ${disabled ? 'disabled' : ''}>${symbol ? icon(symbol) : ''}<span>${label}</span></button>`;
}

function tag(label, variant = '') {
  return `<span class="tag ${variant}">${label}</span>`;
}

function sectionTitle(title, symbol) {
  return `<div class="panel-title"><span class="panel-icon">${icon(symbol)}</span><h2>${title}</h2></div>`;
}

function priceRow(s) {
  return `<div class="price-row">
    <div><span class="field-title">Price per cup</span><span class="field-help">Adjust in 25¢ steps</span></div>
    <div class="stepper">
      <button class="icon-button" data-action="price" data-id="minus" data-cents="${s.price - PRICE_STEP}" aria-label="Decrease price" ${s.price <= MIN_PRICE ? 'disabled' : ''}>${icon('minus')}</button>
      <strong>${money(s.price)}</strong>
      <button class="icon-button" data-action="price" data-id="plus" data-cents="${s.price + PRICE_STEP}" aria-label="Increase price" ${s.price >= MAX_PRICE ? 'disabled' : ''}>${icon('plus')}</button>
    </div>
  </div>`;
}

function businessPanel(s) {
  const stock = finishedServings(s);
  const make = button('Make Lemonade', 'make-lemonade', { style: stock ? 'secondary' : 'primary', symbol: 'lemon' });
  let actions;
  if (s.phase === 'morning') {
    const open = button('Open stand', 'open', { style: 'primary', symbol: 'stand', disabled: !stock || s.business < STALL_FEE });
    actions = `${stock ? open + make : make + open}
      <p class="action-hint">${stock ? '9 AM – 4 PM · $1.00 stall fee' : 'Make a batch before opening the stand.'}</p>`;
  } else if (s.phase === 'trading') {
    const visitor = s.customer && customers[s.customer.id];
    const serve = button(visitor ? `Serve ${visitor.name}` : 'Waiting for a customer', 'serve', {
      style: 'primary', symbol: 'cup', disabled: !stock || !visitor,
    });
    actions = `${stock ? serve + make : make + serve}
      ${button('Finish shift', 'finish', { symbol: 'arrow' })}
      <p class="action-hint">Serve customers yourself for tips. Walk-up sales happen automatically.</p>`;
  } else if (s.phase === 'closed') {
    actions = `${buttons.evening()}${make}<p class="action-hint">The stand opens again tomorrow.</p>`;
  } else {
    actions = `${button('Go home', 'go-home', { style: 'primary', symbol: 'home' })}
      <p class="action-hint">The stand opens again tomorrow.</p>`;
  }
  return `${sectionTitle('Your stand', 'lemon')}
    <div class="metrics">
      <div><span>${icon('cup')} Cups ready to sell</span><strong>${stock}<small> / ${capacity(s)}</small></strong></div>
      <div><span>${icon('coin')} Sales today</span><strong>${money(s.today.revenue)}</strong></div>
    </div>
    ${stock ? `<p class="serving-next">Serving ${recipes[s.batches[0].recipe].name.toLowerCase()} lemonade next.</p>` : ''}
    ${priceRow(s)}
    <div class="action-stack">${actions}</div>
    ${s.phase === 'trading' ? `<div class="customer-note"><strong>${s.customer ? `${customers[s.customer.id].name} is at the counter` : 'Willow Lane'}</strong>
      <span>${safe(customerMessage || 'The lunch rush usually starts around 11 AM.')}</span><small>${s.today.visitors} stopped by · ${s.today.cups} bought a cup</small></div>` : ''}
    <div class="panel-footer">${button('Get ingredients', 'market-supplies', { style: 'text-button', symbol: 'basket' })}
    ${button('See ledger', 'go-ledger', { style: 'text-button', symbol: 'book' })}</div>`;
}

function listing(name, description, symbol, control, art = '') {
  return `<div class="listing">
    <span class="listing-icon">${art ? `<img src="./art/${art}.webp" alt="">` : icon(symbol)}</span>
    <div class="listing-copy"><strong>${name}</strong><p>${description}</p></div>
    ${control}
  </div>`;
}

function homePanel(s) {
  let actions;
  if (s.phase === 'night') {
    const due = s.home === 'room' && s.rentPaidThrough < s.day;
    const basics = `${money(livingCost(s))} for food and daily basics.`;
    const note = due && s.personal < RENT
      ? 'Rent is $4.00 tonight. Without it, you’ll sleep at the cardboard shelter.'
      : due ? '$4.00 rent tonight.' : '';
    actions = `${buttons.sleep()}<p class="action-hint">${note} ${basics}</p>`;
  } else if (s.phase === 'trading') {
    actions = button('Back to the stand', 'go-stand', { style: 'primary', symbol: 'stand' });
  } else {
    actions = `${buttons.evening()}<p class="action-hint">Spend the evening at home before turning in.</p>`;
  }
  const owned = Object.entries(decor).filter(([id]) => s.owned[id]);
  const furnishing = owned.map(([id, item]) => listing(item.name, s.placed[id] ? 'On display' : 'In storage', 'home',
    button(s.placed[id] ? 'Store' : 'Place', 'place', { id, style: 'compact' }), id)).join('');
  const description = s.home === 'room'
    ? 'A real bed and a door that closes.'
    : 'A battered box, a scrap of tarp, and a place to get out of the wind.';
  return `${sectionTitle('Your place', 'home')}
    <p class="panel-description">${description}</p>
    ${s.home === 'shelter' ? `<div class="room-goal"><div><strong>Rented room</strong><span>${money(Math.min(s.personal, homes.room.cost))} / ${money(homes.room.cost)}</span></div><progress aria-label="Savings toward a rented room" value="${Math.min(s.personal, homes.room.cost)}" max="${homes.room.cost}"></progress></div>` : ''}
    <div class="action-stack">${actions}</div>
    <div class="home-furnishings">${furnishing}</div>
    <div class="panel-footer">${button('Shop home goods', 'market-home', { style: 'text-button', symbol: 'basket' })}</div>`;
}

function marketPanel(s) {
  let offerings;
  if (category === 'stock') {
    const full = (id) => s.pantry[id] + PACK_SIZE > INGREDIENT_CAPACITY;
    offerings = listing('Ingredient bundle', '12 of each ingredient · Paid from business cash', 'basket',
      button(money(SUPPLY_COST), 'supplies', { style: 'compact', disabled: s.business - SUPPLY_COST < STALL_FEE || Object.keys(ingredients).some(full), extra: 'aria-label="Buy ingredient bundle for $4.50"' }));
    offerings += Object.entries(ingredients).map(([id, item]) => listing(item.name,
      `${s.pantry[id]} in pantry · ${full(id) ? 'Pantry full' : `Pack of ${PACK_SIZE} ${item.unit}`}`, item.icon,
      button(money(item.cost), 'supplies', { id, style: 'compact', disabled: s.business - item.cost < STALL_FEE || full(id), extra: `aria-label="Buy ${item.name.toLowerCase()} for ${money(item.cost)}"` }))).join('');
  } else if (category === 'home') {
    offerings = Object.entries(decor).map(([id, item]) => listing(item.name, item.description, 'home', s.owned[id]
      ? tag('Owned', 'quiet') : button(money(item.cost), 'decor', { id, style: 'compact', disabled: s.personal < item.cost, extra: `aria-label="Buy ${item.name} for ${money(item.cost)}"` }), id)).join('');
    offerings += listing(homes.room.name, homes.room.description, 'home', s.home === 'room'
      ? tag('Current home', 'quiet') : button(money(homes.room.cost), 'home', { id: 'room', style: 'compact', disabled: s.personal < homes.room.cost, extra: `aria-label="Rent the room for ${money(homes.room.cost)}"` }));
  } else {
    const mae = neighbors.mae;
    offerings = listing(mae.name, `${mae.role} · ${s.phase === 'night' ? 'Gone home' : 'At the market'}`, 'chat',
      button('Say hello', 'chat', { id: 'mae', style: 'compact', disabled: s.phase === 'night' }));
    if (dialogue) offerings += `<blockquote class="dialogue">“${safe(dialogue)}”<cite>Mae</cite></blockquote>`;
  }
  return `${sectionTitle('The market', 'basket')}
    <div class="subnav" aria-label="Market sections">${Object.entries(categories).map(([id, label]) =>
      `<button data-category="${id}" aria-pressed="${category === id}">${label}</button>`).join('')}</div>
    <div class="listings">${offerings}</div>`;
}

function ledgerPanel(s) {
  const payout = availableDraw(s);
  const totals = (ledger) => `<dl class="ledger-rows">
    <div><dt>Sales</dt><dd>${money(ledger.revenue)}</dd></div>
    <div><dt>Expenses</dt><dd>${money(ledger.expenses)}</dd></div>
    <div class="ledger-total"><dt>Cash profit</dt><dd>${money(ledger.revenue - ledger.expenses)}</dd></div>
    <div><dt>Cups sold</dt><dd>${ledger.cups}</dd></div>
    <div><dt>Visitors</dt><dd>${ledger.visitors}</dd></div>
    <div><dt>Customer favorites</dt><dd>${ledger.favorites}</dd></div>
    <div><dt>Owner pay taken</dt><dd>${money(ledger.draw)}</dd></div>
    <div><dt>Food &amp; daily basics</dt><dd>${money(ledger.living)}</dd></div>
  </dl>`;
  return `${sectionTitle('Day ' + s.day + ' accounts', 'book')}${totals(s.today)}
    <div class="action-stack">
      ${button(payout ? 'Take home ' + money(payout) : 'Take home pay', 'draw', { style: 'primary', symbol: 'wallet', disabled: !payout || s.phase === 'trading' })}
      <p class="action-hint">${s.phase === 'trading' ? 'Finish the shift before taking pay. ' : ''}Up to ${money(dailyPay(s))} a day. Extra profit funds the stand.</p>
    </div>
    ${s.previous ? `<details class="prior-ledger"><summary>Day ${s.previous.day} accounts</summary>${totals(s.previous)}</details>` : ''}`;
}

function standExtras(s) {
  return `<section class="extra-card">
    <div class="extra-heading"><h2>Stand upgrades</h2><span>Keep ${money(UPGRADE_RESERVE)} for your next shift</span></div>
    <div class="listings">${Object.entries(upgrades).map(([id, item]) => listing(item.name, item.description, 'sparkle', s.upgrades[id]
      ? tag('Installed', 'quiet') : button(money(item.cost), 'upgrade', { id, style: 'compact', disabled: s.business - item.cost < UPGRADE_RESERVE, extra: `aria-label="Buy ${item.name} for ${money(item.cost)}"` }), id === 'cooler' ? 'cooler' : 'garland')).join('')}</div>
  </section>`;
}

function activity(s) {
  return `<section class="extra-card">
    <div class="extra-heading"><h2>Recent activity</h2></div>
    <ol class="activity">${s.log.slice(0, 6).map((item) => `<li><span>Day ${item.day}</span>${safe(item.text)}</li>`).join('')}</ol>
  </section>`;
}

function renderStatus(s) {
  const status = `<span class="day-badge">${icon(s.phase === 'night' ? 'moon' : forecast(s.day).icon)}<strong>Day ${s.day}</strong></span>
    <div class="balance-badge"><span class="balance-icon business-icon">${icon('coin')}</span><span><small>Business</small><strong>${money(s.business)}</strong></span></div>
    <div class="balance-badge"><span class="balance-icon personal-icon">${icon('wallet')}</span><span><small>Personal</small><strong>${money(s.personal)}</strong></span></div>`;
  $('status').innerHTML = status;
}

function renderScene(s) {
  const place = locations[view === 'home' && s.home === 'room' ? 'room' : view];
  const art = view === 'stand' && s.upgrades.awning ? 'stand-upgraded' : place.art;
  const source = `./art/${art}.webp`;
  const phase = s.phase === 'trading' ? tag('Open for business', 'open') : tag(s.phase === 'morning' ? 'Ready to open' : 'Closed for the day', 'quiet');
  $('location').innerHTML = `${icon('pin')}${place.area}`;
  $('title').textContent = place.title;
  $('scene-status').innerHTML = view === 'stand' ? phase : '';
  if ($('scene-image').getAttribute('src') !== source) $('scene-image').src = source;
  $('scene-image').alt = place.alt;
  $('scene').dataset.art = art;
  $('scene-light').className = `scene-light ${s.phase === 'night' ? 'night' : s.hour >= 15 ? 'golden' : forecast(s.day).icon === 'cloud' ? 'overcast' : ''}`;
  $('scene-time').innerHTML = `${icon(s.phase === 'night' ? 'moon' : forecast(s.day).icon)}<span>${clock(s.hour, s.slot)}</span><i></i><span>${s.phase === 'night' ? 'Evening' : forecast(s.day).name}</span>`;
  $('scene-caption').innerHTML = `<strong>${place.caption}</strong><span>${place.note}</span>`;
  const props = [];
  if (view === 'home') {
    for (const [id, placed] of Object.entries(s.placed)) {
      if (placed) props.push(`<img class="prop prop-${id}" src="./art/${id}.webp" alt="">`);
    }
  }
  if (view === 'stand' && s.upgrades.cooler) props.push('<img class="prop prop-cooler" src="./art/cooler.webp" alt="">');
  if (view === 'stand' && s.customer) {
    const visitor = customers[s.customer.id];
    props.push(`<div class="customer-active ${visitor.tint}" data-visitor="${s.hour}-${s.slot}"><img src="./art/${visitor.art}.webp" alt=""><span>${visitor.name}</span></div>`);
  }
  if (view === 'stand' && lastSale && s.phase === 'trading') {
    props.push(`<span class="sale-pop">+${lastSale} ${lastSale === 1 ? 'cup' : 'cups'}</span>`);
  }
  const html = props.join('');
  if ($('scene-props').innerHTML !== html) $('scene-props').innerHTML = html;
  $('scene').setAttribute('aria-label', place.caption + (s.phase === 'night' ? ' in the evening' : ''));
}

function render() {
  if (!save) return;
  const active = document.activeElement;
  const s = save.state;
  renderStatus(s);
  renderScene(s);
  const panels = { stand: businessPanel, home: homePanel, market: marketPanel, ledger: ledgerPanel };
  $('panel').innerHTML = panels[view](s);
  $('scene-extra').innerHTML = view === 'stand' ? standExtras(s) : view === 'ledger' ? activity(s) : '';
  document.querySelectorAll('[data-view]').forEach((tab) => {
    if (tab.dataset.view === view) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  });
  const target = [...document.querySelectorAll('[data-action], [data-category]')].find((element) =>
    (active?.dataset.action && element.dataset.action === active.dataset.action && element.dataset.id === active.dataset.id) ||
    (active?.dataset.category && element.dataset.category === active.dataset.category));
  if (target && !target.disabled && active !== target) target.focus({ preventScroll: true });
  $('main').setAttribute('aria-busy', 'false');
}

function announce(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.add('shown');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('shown'), 3500);
}

function selectView(next, nextCategory) {
  if (!save) return;
  view = next;
  if (nextCategory) category = nextCategory;
  render();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function scheduleTrade() {
  clearTimeout(tradeTimer);
  if (save?.state.phase === 'trading' && !document.hidden) {
    tradeTimer = setTimeout(() => {
      if (busy || $('dialog').open || prep.active) scheduleTrade();
      else perform({ type: 'pulse' }, true);
    }, nextTrafficDelay(save.state));
  }
}

function showDialog() {
  const ready = offlineReady ? 'Ready to play offline.' : 'Open the game online once to download offline play.';
  const line = storageError || (save?.recovered ? 'Recovered your previous checkpoint.' : 'Progress saves automatically on this device.');
  const dark = document.documentElement.dataset.theme === 'dark';
  $('dialog-content').innerHTML = `<p>${safe(line)}</p>
    <div class="save-controls">
      ${button(dark ? 'Switch to light mode' : 'Switch to dark mode', 'theme', { symbol: dark ? 'sun' : 'moon' })}
      ${button('Export save', 'export', { symbol: 'arrow', disabled: !save })}
      ${button('Import save', 'import', { symbol: 'book', disabled: !db })}
      ${button('Restore previous checkpoint', 'restore', { symbol: 'clock', disabled: !save?.hasPrevious })}
    </div>
    <p class="offline-note">${icon('check')} ${ready}</p>
    <p class="offline-note">On iPhone, open in Safari, choose Share, then Add to Home Screen.</p>`;
  if (!$('dialog').open) $('dialog').showModal();
}

async function handleSaveError(error) {
  if (error instanceof SaveConflict) {
    save = await loadSave(db);
    render();
    announce('This game changed in another tab. Your latest save has been loaded.');
  } else {
    announce('Could not save that action. Your last checkpoint is safe.');
  }
}

async function perform(action, automatic = false) {
  if (!save || busy) return;
  busy = true;
  try {
    const result = transition(save.state, action);
    if (!result.ok) {
      if (action.type === 'chat') {
        dialogue = result.message;
        render();
      } else if (!automatic && action.type !== 'prepare') announce(result.message);
      return result;
    }
    save = await commitSave(db, save.revision, result.state);
    if (result.customerMessage) customerMessage = result.customerMessage;
    if (action.type === 'open' || action.type === 'sleep') customerMessage = '';
    if (result.cups) {
      lastSale = result.cups;
      clearTimeout(saleTimer);
      saleTimer = setTimeout(() => {
        lastSale = 0;
        $('scene-props').querySelector('.sale-pop')?.remove();
      }, 2350);
    }
    if (action.type === 'chat') dialogue = result.message;
    if (action.type === 'sleep') dialogue = null;
    if (action.type === 'home') view = 'home';
    render();
    if (!automatic && !['chat', 'prepare'].includes(action.type)) announce(result.message);
    if (action.type === 'open' || save.state.phase !== 'trading') scheduleTrade();
    return result;
  } catch (error) {
    try { await handleSaveError(error); } catch { announce('The game could not reload the local save.'); }
  } finally {
    busy = false;
    if (automatic) scheduleTrade();
  }
}

function confirmSave(mode, state) {
  if (busy) return;
  const replacing = mode === 'import';
  $('dialog-content').innerHTML = `<p>${replacing
    ? `Load your Day ${state.day} save? Your current game becomes the previous checkpoint.`
    : 'Restore the previous checkpoint? You can restore again to return to the current game.'}</p>
    <div class="save-controls">${button(replacing ? 'Load save' : 'Restore checkpoint', 'confirm-save', { style: 'primary', symbol: 'check' })}
    ${button('Cancel', 'cancel-save')}</div>`;
  $('dialog-content').querySelector('[data-action="confirm-save"]').addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    try {
      save = await commitSave(db, save?.revision, state, mode);
      storageError = '';
      dialogue = null;
      customerMessage = '';
      lastSale = 0;
      $('dialog').close();
      render();
      announce(replacing ? 'Save loaded.' : 'Previous checkpoint restored.');
      scheduleTrade();
    } catch (error) {
      await handleSaveError(error);
    } finally {
      busy = false;
    }
  }, { once: true });
}

function download() {
  const file = new Blob([exportSave(save.state)], { type: 'application/json' });
  const url = URL.createObjectURL(file);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `small-beginnings-day-${save.state.day}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

document.querySelectorAll('[data-icon]').forEach((element) => { element.innerHTML = icon(element.dataset.icon); });
$('settings').addEventListener('click', showDialog);
$('dialog').addEventListener('click', (event) => { if (event.target === $('dialog')) $('dialog').close(); });
$('save-file').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  try {
    if (file.size > 128_000) throw new Error();
    if (!$('dialog').open) showDialog();
    confirmSave('import', importSave(await file.text()));
  } catch {
    if (!$('dialog').open) showDialog();
    $('dialog-content').insertAdjacentHTML('afterbegin', '<p class="error" role="alert">Choose a valid Small Beginnings save file.</p>');
  }
});

document.addEventListener('click', (event) => {
  const control = event.target.closest('button');
  if (!control || control.disabled) return;
  const { action, view: nextView, category: nextCategory, id, cents } = control.dataset;
  if (nextView) selectView(nextView);
  else if (nextCategory) {
    category = nextCategory;
    render();
  } else if (action === 'market-supplies') selectView('market', 'stock');
  else if (action === 'market-home') selectView('market', 'home');
  else if (action === 'make-lemonade') prep.open();
  else if (action === 'theme') {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* Theme still applies for this session. */ }
    showDialog();
    $('dialog-content').querySelector('[data-action="theme"]').focus();
  }
  else if (action?.startsWith('go-')) selectView(action.slice(3));
  else if (action === 'export' && save) download();
  else if (action === 'import') $('save-file').click();
  else if (action === 'restore' && save?.hasPrevious) confirmSave('restore');
  else if (action === 'cancel-save') showDialog();
  else if (action && action !== 'confirm-save') perform({ type: action, id, cents: Number(cents) });
});

document.addEventListener('visibilitychange', scheduleTrade);

try {
  db = await openSave();
  save = await loadSave(db);
  render();
  if (save.recovered) announce('Recovered your previous checkpoint.');
  scheduleTrade();
} catch (error) {
  storageError = db ? 'The local save could not be read. Import a backup to continue.' : 'Local storage is unavailable. Try opening the game in Safari.';
  $('panel').innerHTML = `<p class="error" role="alert">${safe(storageError)}</p>${db ? button('Import save', 'import', { style: 'primary' }) : ''}`;
  $('main').setAttribute('aria-busy', 'false');
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then(() => navigator.serviceWorker.ready).then(() => {
    offlineReady = true;
  }).catch(() => {});
}
