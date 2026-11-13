import { icon } from './icons.js';
import { setupMusic } from './music.js';
import {
  capacity, availableDraw, forecast, money, clock, transition, upgrades, decor, homes,
  neighbors, ingredients, INGREDIENT_CAPACITY, SUPPLY_COST, PACK_SIZE, MIN_PRICE, MAX_PRICE,
  PRICE_STEP, RENT, finishedServings, recipes, dailyPay, livingCost, investmentProblem, openingProblem, practiceGoal, trainingProblem,
} from './engine.js';
import { openSave, loadSave, commitSave, exportSave, importSave, SaveConflict } from './save.js';
import { setupPrep } from './prep.js';
import { activeCampaign, businessStage, campaigns, salePrice, season, stages } from './business.js';
import { applicants, roles, employeeCapacity, counterCapacity, staffOnShift, training, courseCost, courseDays, prepTurns, serviceCapacity } from './staff.js';
import { customers, nextTrafficDelay } from './traffic.js';
import { furniture, rooms, homeRooms, itemFor, ownedFurniture, availableSpots } from './housing.js';

const $ = (id) => document.getElementById(id);
const safe = (text) => String(text).replace(/[&<>"']/g, (letter) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[letter]
));
const locations = {
  stand: { title: 'Lemonade Stand', area: 'Willowbrook · Willow Lane', art: 'stand', alt: 'A small wooden lemonade stand with a striped awning on a sunlit cobblestone lane.', caption: 'Willow Lane', note: 'Your little corner of town' },
  home: { title: 'Home', area: 'Willowbrook · Home', art: 'shelter', alt: 'A battered cardboard box and scrap of tarp used as a shelter behind a garden wall.', caption: 'The cardboard shelter', note: 'Behind the garden wall' },
  market: { title: 'Willowbrook Market', area: 'Willowbrook · Market Square', art: 'market', alt: 'A sage green village shop with crates of fruit under a striped awning.', caption: 'Market Square', note: 'Groceries, furnishings & neighbors' },
  staff: { title: 'Staff', area: 'Willowbrook · Business', art: 'stand', alt: 'The lemonade stand on Willow Lane.', caption: 'Staff office', note: 'Hiring & schedules' },
  advertising: { title: 'Advertising', area: 'Willowbrook · Business', art: 'market', alt: 'A row of village shops.', caption: 'Around town', note: 'Get the word out' },
  ledger: { title: 'The Ledger', area: 'Willowbrook · Business accounts', art: 'stand', alt: 'The lemonade stand on Willow Lane.', caption: 'Lemonade stand accounts', note: 'Business and personal balances' },
};

const categories = { stock: 'Ingredients', home: 'Home goods', neighbors: 'Neighbors' };
const THEME_KEY = 'small-beginnings-theme';
let db;
let save;
let view = 'stand';
let category = 'stock';
let homeRoom = 'garden';
let arranging = '';
let toastTimer;
let tradeTimer;
let busy = false;
let offlineReady = false;
let storageError = '';
let lastSale = 0;
let departing = null;
const staffDrafts = new Map();
const staffStatuses = { ready: 'On duty', preparing: 'Preparing', serving: 'Serving', break: 'On break', unpaid: 'Waiting for wages', off: 'Starting shift' };

function staffStatus(state, worker) {
  return state.phase === 'trading' && staffOnShift(worker, state.hour) ? staffStatuses[worker.status] : 'Off shift';
}

function staffPerformance(stats) {
  return `${stats.cups} sold (${money(stats.revenue)}) · ${stats.prepared} prepared · ${stats.restocked} moved to counter · ${money(stats.wages)} paid · ${stats.praise} compliments`;
}
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
    <div><span class="field-title">Price per cup</span><span class="field-help">${activeCampaign(s)?.discount ? 'Customers pay ' + money(salePrice(s)) + ' today' : 'Adjust in 25¢ steps'}</span></div>
    <div class="stepper">
      <button class="icon-button" data-action="price" data-id="minus" data-cents="${s.price - PRICE_STEP}" aria-label="Decrease price" ${s.price <= MIN_PRICE ? 'disabled' : ''}>${icon('minus')}</button>
      <strong>${money(s.price)}</strong>
      <button class="icon-button" data-action="price" data-id="plus" data-cents="${s.price + PRICE_STEP}" aria-label="Increase price" ${s.price >= MAX_PRICE ? 'disabled' : ''}>${icon('plus')}</button>
    </div>
  </div>`;
}

function businessPanel(s) {
  const stock = finishedServings(s);
  const stage = businessStage(s);
  const openProblem = openingProblem(s);
  const make = button('Make Lemonade', 'make-lemonade', { style: stock ? 'secondary' : 'primary', symbol: 'lemon' });
  let actions;
  if (s.phase === 'morning') {
    const open = button('Open stand', 'open', { style: 'primary', symbol: 'stand', disabled: Boolean(openProblem) });
    actions = `${stock ? open + make : make + open}
      <p class="action-hint">${openProblem || '9 AM – 4 PM · ' + money(stage.fee) + ' operating fee'}</p>`;
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
  return `${sectionTitle(stage.name, 'lemon')}
    <div class="metrics">
      <div><span>${icon('cup')} Cups ready to sell</span><strong>${stock}<small> / ${capacity(s)}</small></strong></div>
      <div><span>${icon('coin')} Sales today</span><strong>${money(s.today.revenue)}</strong></div>
    </div>
    ${stock ? `<p class="serving-next">Serving ${recipes[s.batches[0].recipe].name.toLowerCase()} lemonade next.</p>` : ''}
    ${priceRow(s)}
    <div class="action-stack">${actions}</div>
    ${s.phase === 'trading' ? `<div class="customer-note"><strong>${s.customer ? `${customers[s.customer.id].name} is at the counter` : 'Willow Lane'}</strong>
      <span>${safe(customerMessage || 'The lunch rush usually starts around 11 AM.')}</span><small>${s.today.visitors} stopped by · ${s.today.cups} bought a cup · ${s.queue.length} waiting</small></div>` : ''}
    <div class="panel-footer">${button('Get ingredients', 'market-supplies', { style: 'text-button', symbol: 'basket' })}
    ${button('Advertising', 'go-advertising', { style: 'text-button', symbol: 'sparkle' })}
    ${button('Staff', 'go-staff', { style: 'text-button', symbol: 'staff' })}</div>
    ${Object.keys(s.crew).length ? `<p class="serving-next">Counter: ${s.counter} / ${counterCapacity(s)} cups · ${Object.entries(s.crew).map(([id, worker]) => applicants[id].name + ': ' + staffStatus(s, worker)).join(' · ')}</p>` : ''}`;
}

function listing(name, description, symbol, control, art = '') {
  return `<div class="listing">
    <span class="listing-icon">${art ? `<img src="./art/${art}.webp" alt="">` : icon(symbol)}</span>
    <div class="listing-copy"><strong>${name}</strong><p>${description}</p></div>
    ${control}
  </div>`;
}

const currentRoom = s => s?.home === 'room' ? 'rental' : s?.home === 'house' ? homeRoom : '';
const furnitureArt = id => Object.hasOwn(furniture, id) ? 'furniture-' + id : id;

function housingGoal(s, id) {
  const home = homes[id];
  const saved = Math.min(s.personal, home.cost);
  const label = id === 'room' ? 'a rented room' : home.name;
  return `<div class="room-goal"><div><strong>${home.name}</strong><span>${money(saved)} / ${money(home.cost)}</span></div>
    <progress aria-label="Savings toward ${label}" value="${saved}" max="${home.cost}"></progress></div>`;
}

function arrangedHome(s) {
  const room = currentRoom(s);
  const items = ownedFurniture(s);
  const displayed = items.filter(id => s.furnishings[id]?.room === room);
  const stored = items.filter(id => !s.furnishings[id]);
  const elsewhere = items.filter(id => s.furnishings[id] && s.furnishings[id].room !== room);
  const rows = (ids, title) => ids.length ? `<h3>${title}</h3>${ids.map(id => {
    const position = s.furnishings[id];
    const label = position ? `${rooms[position.room].name} · ${rooms[position.room].spots[position.slot].name}` : 'In storage';
    return listing(itemFor(id).name, label, 'home',
      button(position ? 'Arrange' : 'Place', 'arrange-furniture', { id, style: 'compact', extra: `aria-label="${position ? 'Arrange' : 'Place'} ${itemFor(id).name}"` }), furnitureArt(id));
  }).join('')}` : '';
  const tabs = s.home === 'house' ? `<div class="subnav home-tabs" aria-label="Cottage rooms">${homeRooms(s).map(key =>
    `<button data-action="home-room" data-id="${key}" aria-pressed="${room === key}">${rooms[key].name}</button>`).join('')}</div>` : '';
  const edit = items.includes(arranging) ? arrangementPanel(s, arranging) : '';
  return `${tabs}${edit}<div class="home-inventory">
    ${rows(displayed, 'In this room')}${rows(stored, 'In storage')}${rows(elsewhere, 'In other rooms')}
    ${items.length ? '' : '<p class="action-hint">Bring something home from the market to make this space yours.</p>'}
  </div>`;
}

function arrangementPanel(s, id) {
  const position = s.furnishings[id];
  const room = currentRoom(s);
  const points = availableSpots(s, id, room);
  return `<section class="arrange-card" aria-label="Arrange ${itemFor(id).name}">
    <div class="arrange-heading"><h3>${itemFor(id).name}</h3>${button('Done', 'arrange-furniture', { style: 'compact' })}</div>
    <p class="action-hint">${points.length ? 'Tap a spot in the scene or choose one below.' : 'There are no free spots that fit in this room.'}</p>
    <div class="arrange-choices">${points.map(([key, point], index) =>
      button(`${index + 1}. ${point.name}`, 'furniture-place', { id, style: 'compact', disabled: position?.room === room && position.slot === key,
        extra: `data-room="${room}" data-slot="${key}"` })).join('')}
    ${position ? button('Store item', 'furniture-place', { id, style: 'compact' }) : ''}</div>
  </section>`;
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
  if (s.home !== 'shelter') {
    return `${sectionTitle(s.home === 'house' ? 'Willow Cottage' : 'Your rented room', 'home')}
      ${s.home === 'room' ? housingGoal(s, 'house') : ''}
      <div class="panel-footer">${button('Shop home goods', 'market-home', { style: 'text-button', symbol: 'basket' })}</div>
      ${arrangedHome(s)}<div class="action-stack">${actions}</div>`;
  }
  const owned = Object.entries(decor).filter(([id]) => s.owned[id]);
  const furnishing = owned.map(([id, item]) => listing(item.name, s.placed[id] ? 'On display' : 'In storage', 'home',
    button(s.placed[id] ? 'Store' : 'Place', 'place', { id, style: 'compact' }), id)).join('');
  return `${sectionTitle('Your place', 'home')}
    <p class="panel-description">A battered box, a scrap of tarp, and a place to get out of the wind.</p>
    ${housingGoal(s, 'room')}
    <div class="action-stack">${actions}</div>
    <div class="home-furnishings">${furnishing}</div>
    <div class="panel-footer">${button('Shop home goods', 'market-home', { style: 'text-button', symbol: 'basket' })}</div>`;
}

function marketPanel(s) {
  let offerings;
  if (category === 'stock') {
    const full = (id) => s.pantry[id] + PACK_SIZE > INGREDIENT_CAPACITY;
    offerings = listing('Ingredient bundle', '12 of each ingredient · Paid from business cash', 'basket',
      button(money(SUPPLY_COST), 'supplies', { style: 'compact', disabled: s.business - SUPPLY_COST < businessStage(s).fee || Object.keys(ingredients).some(full), extra: 'aria-label="Buy ingredient bundle for $4.50"' }));
    offerings += Object.entries(ingredients).map(([id, item]) => listing(item.name,
      `${s.pantry[id]} in pantry · ${full(id) ? 'Pantry full' : `Pack of ${PACK_SIZE} ${item.unit}`}`, item.icon,
      button(money(item.cost), 'supplies', { id, style: 'compact', disabled: s.business - item.cost < businessStage(s).fee || full(id), extra: `aria-label="Buy ${item.name.toLowerCase()} for ${money(item.cost)}"` }))).join('');
  } else if (category === 'home') {
    offerings = Object.entries(decor).map(([id, item]) => listing(item.name, item.description, 'home', s.owned[id]
      ? tag('Owned', 'quiet') : button(money(item.cost), 'decor', { id, style: 'compact', disabled: s.personal < item.cost, extra: `aria-label="Buy ${item.name} for ${money(item.cost)}"` }), id)).join('');
    if (s.home !== 'house') offerings += listing(homes.room.name, homes.room.description, 'home', s.home === 'room'
      ? tag('Current home', 'quiet') : button(money(homes.room.cost), 'home', { id: 'room', style: 'compact', disabled: s.personal < homes.room.cost, extra: `aria-label="Rent the room for ${money(homes.room.cost)}"` }), 'room');
    if (s.rentedBefore) offerings += listing(homes.house.name, homes.house.description, 'home', s.home === 'house'
      ? tag('Current home', 'quiet') : button(money(homes.house.cost), 'home', { id: 'house', style: 'compact', disabled: s.personal < homes.house.cost,
        extra: `aria-label="Buy Willow Cottage for ${money(homes.house.cost)}"` }), rooms.garden.art);
    if (s.home !== 'shelter') {
      offerings += '<h3 class="catalog-heading">Furniture &amp; decorations</h3>';
      offerings += Object.entries(furniture).filter(([, item]) => !item.house || s.home === 'house').map(([id, item]) => {
        const spots = homeRooms(s).flatMap(room => availableSpots(s, id, room));
        const copy = spots.length ? `Fits ${homeRooms(s).filter(room => availableSpots(s, id, room).length).map(room => rooms[room].name.toLowerCase()).join(' or ')}.` : 'Goes into storage until a spot is free.';
        return listing(item.name, copy, 'home', Object.hasOwn(s.furnishings, id) ? tag('Owned', 'quiet') :
          button(money(item.cost), 'furniture-buy', { id, style: 'compact', disabled: s.personal < item.cost,
            extra: `aria-label="Buy ${item.name} for ${money(item.cost)}"` }), furnitureArt(id));
      }).join('');
    }
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
    <div><dt>Staff wages included in expenses</dt><dd>${money(ledger.wages)}</dd></div>
    <div><dt>Staff training included in expenses</dt><dd>${money(ledger.training)}</dd></div>
    <div><dt>Staff sales / prepared</dt><dd>${ledger.staffCups} / ${ledger.staffPrep} cups</dd></div>
    <div><dt>Advertising included in expenses</dt><dd>${money(ledger.ads)}</dd></div>
    <div><dt>Left because the line was full</dt><dd>${ledger.turnedAway}</dd></div>
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
  const next = stages[s.stage + 1];
  const reason = investmentProblem(s, 'expand');
  return `<section class="extra-card">
    <div class="extra-heading"><h2>Grow your business</h2><span>Reputation ${s.reputation}/100</span></div>
    <ol class="stage-track" aria-label="Business stages">${stages.map((stage, index) => `<li ${index === s.stage ? 'aria-current="step"' : ''}>${stage.name}</li>`).join('')}</ol>
    ${next ? `<div class="next-stage">
      <img src="./art/${next.art}.webp" alt="">
      <div><h3>${next.name}</h3><p>${next.detail} ${money(next.fee)} per shift.</p>
      <small>${Math.min(s.totalCups, next.sales)} / ${next.sales} lifetime cups sold</small>
      ${button('Expand for ' + money(next.cost), 'expand', { style: 'compact', disabled: Boolean(reason) })}
      ${reason ? `<small>${reason}</small>` : ''}</div></div>` : ''}
    <div class="listings">${Object.entries(upgrades).map(([id, item]) => {
      const locked = investmentProblem(s, 'upgrade', id);
      return listing(item.name, item.description + (locked && !s.upgrades[id] ? ' ' + locked : ''), 'sparkle', s.upgrades[id]
        ? tag('Installed', 'quiet') : button(money(item.cost), 'upgrade', { id, style: 'compact', disabled: Boolean(locked), extra: `aria-label="Buy ${item.name} for ${money(item.cost)}"` }), item.art);
    }).join('')}</div>
  </section>`;
}

function staffSpeeds(s, id) {
  const worker = s.crew[id];
  const prep = worker ? prepTurns(id, worker, s.upgrades.press) : applicants[id].prep;
  const service = worker ? serviceCapacity(id, worker) : applicants[id].service;
  return `Prep ${prep * 12} min per batch · Counter up to ${service} ${service === 1 ? 'order' : 'orders'} per 12 min`;
}

function trainingSummary(worker) {
  if (!worker.course) return 'Training & skills';
  const { skill, readyDay } = worker.course;
  return `${training[skill].name} training · Ready Day ${readyDay}`;
}

function staffTraining(s, id) {
  const worker = s.crew[id];
  const person = applicants[id];
  return Object.entries(training).map(([skill, course]) => {
    const level = worker.skills[skill];
    const cap = person.caps[skill];
    const cost = money(courseCost(skill, level));
    const days = courseDays(level);
    const problem = trainingProblem(s, id, skill);
    const enrolled = worker.course?.skill === skill;
    return `<div class="training-row">
      <p><strong>${course.name}</strong> · Level ${level} / ${cap}</p>
      <p>${course.effect}</p>
      ${level === cap ? '<p>Maximum level</p>' : `
        <p>${worker.practice[skill]} / ${practiceGoal(skill, level)} ${course.unit} toward the next level</p>
        ${enrolled ? `<p>Level ${level + 1} ready on Day ${worker.course.readyDay}</p>` : `
          ${button(`Train · ${cost} · ${days} ${days === 1 ? 'day' : 'days'}`, 'staff-train', { id, style: 'compact', disabled: Boolean(problem),
            extra: `data-skill="${skill}" aria-label="Train ${person.name} in ${course.name.toLowerCase()} for ${cost}"` })}
          ${problem && !worker.course ? `<p>${problem}</p>` : ''}`}`}
    </div>`;
  }).join('');
}

function staffPanel(s) {
  const capacity = employeeCapacity(s);
  const crewSize = Object.keys(s.crew).length;
  const rolesMenu = Object.entries(roles);
  const recipeMenu = Object.entries(recipes).filter(([id]) => id !== 'mint' || s.upgrades.mint)
    .map(([id, recipe]) => [id, recipe.name]);
  function menu(id, label, name, choices, current) {
    const control = `shift-${id}-${name}`;
    return `<div class="staff-field"><label for="${control}">${label}</label><select id="${control}" name="${name}">${choices.map(([value, text]) =>
      `<option value="${value}" ${String(value) === String(current) ? 'selected' : ''}>${text}</option>`).join('')}</select></div>`;
  }
  return `${sectionTitle('Staff', 'staff')}
    <p class="panel-description">${crewSize} / ${capacity} staff spaces · Unpaid 12-minute break after 3 hours on longer shifts.</p>
    ${!capacity ? '<p class="panel-description">Build the roadside stand to hire your first employee.</p>' : ''}
    <div class="staff-list">${Object.entries(applicants).map(([id, person]) => {
      const worker = s.crew[id];
      const performance = worker ?? s.staffHistory[id];
      const plan = staffDrafts.get(id) ?? worker;
      const hours = Array.from({ length: person.end - person.start + 1 }, (_, index) => person.start + index);
      const shift = plan && (plan.end - plan.start) * person.wage - (plan.end - plan.start > 3 ? person.wage / 5 : 0);
      return `<article class="staff-card" data-employee="${id}">
        <div class="staff-heading"><div class="staff-portrait"><img src="./art/staff-${id}.webp" alt=""></div>
          <div><h3>${person.name}</h3><p>${money(person.wage)} / hour · <span class="staff-status">${worker ? staffStatus(s, worker) : 'Applicant'}</span></p></div></div>
        <p>${person.detail}</p>
        <p class="staff-speeds">${staffSpeeds(s, id)}</p>
        <p>Available ${clock(person.start)}–${clock(person.end)} · Prefers ${person.preferred}</p>
        ${performance ? `<p><strong>Today</strong> · <span class="staff-performance">${staffPerformance(performance.today)}</span></p>
        ${performance.previous ? `<p>Yesterday · ${performance.previous.cups} sold · ${performance.previous.prepared} prepared · ${money(performance.previous.wages)} paid</p>` : ''}` : ''}
        ${worker ? `<form class="staff-plan" data-worker="${id}">
          ${menu(id, 'Role', 'role', rolesMenu, plan.role)}
          ${menu(id, 'Recipe', 'recipe', recipeMenu, plan.recipe)}
          ${menu(id, 'Start', 'start', hours.slice(0, -2).map(hour => [hour, clock(hour)]), plan.start)}
          ${menu(id, 'End', 'end', hours.slice(2).map(hour => [hour, clock(hour)]), plan.end)}
          <p>Scheduled wage: ${shift > 0 ? money(shift) : '—'}</p>
          <div class="staff-actions"><button class="button primary" type="submit">Save schedule</button>
          ${button('Dismiss', 'dismiss', { id, extra: 'type="button" aria-label="Dismiss ' + person.name + '"' })}</div>
        </form>
        <details class="staff-training">
          <summary>${trainingSummary(worker)}</summary>
          <p>Courses are paid from business cash. Staff work their usual shifts while enrolled.</p>
          <div class="training-list">${staffTraining(s, id)}</div>
        </details>` : button('Hire ' + person.name, 'hire', { id, style: 'compact', disabled: crewSize >= capacity })}
      </article>`;
    }).join('')}</div>
    <div class="panel-footer">${button('Back to stand', 'go-stand', { style: 'text-button', symbol: 'stand' })}</div>`;
}

function advertisingPanel(s) {
  const booked = s.campaign;
  const status = booked ? `${campaigns[booked.id].name} · ${activeCampaign(s) ? 'Active' : 'Booked'} · Day ${booked.startDay}${booked.startDay !== booked.endDay ? '–' + booked.endDay : ''}` : 'No campaign running.';
  return `${sectionTitle('Town advertising', 'sparkle')}
    <p class="panel-description">Campaigns bring more people past the counter. Every visitor still decides whether to buy. One campaign can run at a time.</p>
    <div class="customer-note"><strong>${status}</strong><span>${s.phase === 'morning' ? 'New campaigns start today.' : 'New campaigns start tomorrow.'}</span></div>
    <div class="listings">${Object.entries(campaigns).map(([id, item]) => {
      const reason = investmentProblem(s, 'advertise', id);
      return listing(item.name, `${item.days} ${item.days === 1 ? 'day' : 'days'} · ${item.detail}${reason && !booked ? ' ' + reason : ''}`, 'sparkle',
        button(money(item.cost), 'advertise', { id, style: 'compact', disabled: Boolean(reason), extra: `aria-label="Book ${item.name} for ${money(item.cost)}"` }));
    }).join('')}</div>
    <div class="panel-footer">${button('Back to stand', 'go-stand', { style: 'text-button', symbol: 'stand' })}</div>`;
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
  const room = view === 'home' ? currentRoom(s) : '';
  const roomInfo = rooms[room];
  const place = roomInfo ? { ...locations.home, ...roomInfo, caption: roomInfo.name, note: s.home === 'house' ? 'Willow Cottage' : 'Upstairs on Willow Lane' } : locations[view];
  const stage = businessStage(s);
  const customBed = room && s.furnishings['oak-bed']?.room === room;
  const art = ['stand', 'staff'].includes(view) ? (s.stage === 2 && !s.upgrades.awning ? 'stand' : stage.art) :
    customBed ? place.art + '-empty' : place.art;
  const source = `./art/${art}.webp`;
  const phase = s.phase === 'trading' ? tag('Open for business', 'open') : tag(s.phase === 'morning' ? 'Ready to open' : 'Closed for the day', 'quiet');
  $('location').innerHTML = `${icon('pin')}${place.area}`;
  $('title').textContent = place.title;
  $('scene-status').innerHTML = view === 'stand' ? phase : '';
  if ($('scene-image').getAttribute('src') !== source) $('scene-image').src = source;
  $('scene-image').alt = view === 'stand' ? stage.name + ' on Willow Lane.' : place.alt;
  $('scene').dataset.art = art;
  $('scene-light').className = `scene-light ${s.phase === 'night' ? 'night' : s.hour >= 15 ? 'golden' : forecast(s.day).icon === 'cloud' ? 'overcast' : ''}`;
  $('scene-time').innerHTML = `${icon(s.phase === 'night' ? 'moon' : forecast(s.day).icon)}<span>${clock(s.hour, s.slot)}</span><i></i><span>${s.phase === 'night' ? 'Evening' : forecast(s.day).name}</span><i></i><span>${season(s.day)}</span>`;
  $('scene-caption').innerHTML = `<strong>${view === 'stand' ? stage.name : place.caption}</strong><span>${place.note}</span>`;
  const props = [];
  const people = [];
  const workers = [];
  if (view === 'home' && !room) {
    for (const [id, placed] of Object.entries(s.placed)) {
      if (placed) props.push(`<img class="prop prop-${id}" src="./art/${id}.webp" alt="">`);
    }
  }
  if (roomInfo) {
    const placed = Object.entries(s.furnishings).filter(([, position]) => position?.room === room)
      .map(([id, { slot }]) => [id, roomInfo.spots[slot]]).sort((a, b) => a[1].depth - b[1].depth);
    for (const [id, point] of placed) {
      const shape = furniture[id]?.kind ?? 'small';
      const maxWidth = { 'floor-lamp': 9, lantern: 5.5, mirror: 8, 'botanical-print': 9 };
      const width = Math.min(point.width, maxWidth[id] ?? point.width);
      props.push(`<img class="prop home-prop home-prop-${shape}${id === 'lantern' ? ' prop-lantern' : ''}" data-furniture="${id}"
        src="./art/${furnitureArt(id)}.webp" alt="" style="--x:${point.x}%;--y:${point.y}%;--w:${width}%">`);
    }
  }
  const targets = roomInfo && arranging ? availableSpots(s, arranging, room).map(([slot, point], index) =>
    `<button type="button" data-action="furniture-place" data-id="${arranging}" data-room="${room}" data-slot="${slot}"
      aria-label="Place ${itemFor(arranging).name} at ${point.name.toLowerCase()}" style="--x:${point.x}%;--y:${point.y}%">${index + 1}</button>`).join('') : '';
  if (view === 'stand' && s.upgrades.cooler) props.push('<img class="prop prop-cooler" src="./art/cooler.webp" alt="">');
  if (view === 'stand') {
    for (const id of ['awning', 'press', 'mint']) {
      if (s.upgrades[id] && !(id === 'awning' && s.stage === 2)) props.push(`<img class="prop prop-${id}" src="./art/${upgrades[id].art}.webp" alt="">`);
    }
    if (activeCampaign(s)) props.push('<img class="prop prop-ad" src="./art/campaign-board-cutout.webp" alt="">');
    if (s.phase === 'trading') {
      Object.entries(s.crew).forEach(([id, worker], index) => {
        if (staffOnShift(worker, s.hour) && worker.status !== 'unpaid') {
          workers.push(`<div class="staff-sprite staff-position-${index} staff-${worker.status}"><img src="./art/staff-${id}.webp" alt=""><span>${applicants[id].name} · ${staffStatus(s, worker)}</span></div>`);
        }
      });
    }
    if (s.customer) {
      for (const [position, customer] of [s.customer, ...s.queue].entries()) {
        const visitor = customers[customer.id];
        people.push(`<div class="customer-active line-${position}"><img src="./art/${visitor.art}.webp" alt=""><span>${visitor.name}</span></div>`);
      }
    }
  }
  if (view === 'stand' && departing !== null && s.phase === 'trading') {
    const visitor = customers[departing];
    people.push(`<div class="customer-active customer-leaving"><img src="./art/${visitor.art}.webp" alt=""></div>`);
  }
  if (view === 'stand' && lastSale && s.phase === 'trading') {
    people.push(`<span class="sale-pop">+${lastSale} ${lastSale === 1 ? 'cup' : 'cups'}</span>`);
  }
  // Preserve fixed prop nodes when the customer queue or sale effects change.
  for (const [layer, sprites] of [['scene-props', props], ['scene-customers', people], ['scene-staff', workers], ['home-targets', [targets]]]) {
    const element = $(layer);
    const html = sprites.join('');
    if (element.innerHTML !== html) element.innerHTML = html;
  }
  $('scene').setAttribute('aria-label', place.caption + (s.phase === 'night' ? ' in the evening' : ''));
}

function render(automatic = false) {
  if (!save) return;
  const active = document.activeElement;
  const s = save.state;
  renderStatus(s);
  renderScene(s);
  const panels = { stand: businessPanel, home: homePanel, market: marketPanel, ledger: ledgerPanel, advertising: advertisingPanel, staff: staffPanel };
  if (automatic && view === 'staff') {
    for (const [id, worker] of Object.entries(s.crew)) {
      const card = $('panel').querySelector(`[data-employee="${id}"]`);
      card.querySelector('.staff-status').textContent = staffStatus(s, worker);
      card.querySelector('.staff-performance').textContent = staffPerformance(worker.today);
      card.querySelector('.staff-speeds').textContent = staffSpeeds(s, id);
      card.querySelector('.staff-training summary').textContent = trainingSummary(worker);
      const list = card.querySelector('.training-list');
      const content = staffTraining(s, id);
      if (list.dataset.rendered !== content) {
        list.innerHTML = content;
        list.dataset.rendered = content;
      }
    }
  } else {
    const expanded = [...$('panel').querySelectorAll('.staff-training[open]')].map(details => details.closest('.staff-card').dataset.employee);
    $('panel').innerHTML = panels[view](s);
    for (const id of expanded) $('panel').querySelector(`[data-employee="${id}"] .staff-training`)?.setAttribute('open', '');
  }
  const notice = $('staff-notice');
  if (notice.textContent !== s.staffNotice) notice.textContent = s.staffNotice;
  notice.hidden = !s.staffNotice;
  const activeForm = active?.closest('.staff-plan');
  if (!automatic && view === 'staff' && activeForm && active.name) {
    [...$('panel').querySelectorAll('.staff-plan')].find(form => form.dataset.worker === activeForm.dataset.worker)
      ?.elements.namedItem(active.name)?.focus({ preventScroll: true });
  }
  $('scene-extra').innerHTML = view === 'stand' ? standExtras(s) : view === 'ledger' ? activity(s) : '';
  document.querySelectorAll('[data-view]').forEach((tab) => {
    if (tab.dataset.view === view) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  });
  const target = [...document.querySelectorAll('[data-action], [data-category]')].find((element) =>
    (active?.dataset.action && element.dataset.action === active.dataset.action && element.dataset.id === active.dataset.id &&
      element.dataset.skill === active.dataset.skill && element.dataset.room === active.dataset.room && element.dataset.slot === active.dataset.slot) ||
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
    if (action.type === 'staff-plan' || action.type === 'dismiss') staffDrafts.delete(action.id);
    if (result.customerMessage) customerMessage = result.customerMessage;
    if (action.type === 'open' || action.type === 'sleep') customerMessage = '';
    if (result.customerId !== undefined || result.cups) {
      departing = result.customerId ?? null;
      lastSale = result.cups;
      clearTimeout(saleTimer);
      saleTimer = setTimeout(() => {
        lastSale = 0;
        departing = null;
        $('scene-customers').querySelectorAll('.sale-pop, .customer-leaving').forEach(element => element.remove());
      }, 2350);
    }
    if (action.type === 'chat') dialogue = result.message;
    if (action.type === 'sleep') dialogue = null;
    if (action.type === 'home') {
      view = 'home';
      homeRoom = 'garden';
      arranging = '';
    }
    if (action.type === 'sleep' && save.state.home === 'shelter') arranging = '';
    render(automatic);
    if (!automatic && !['chat', 'prepare'].includes(action.type)) announce(result.message);
    if (action.type === 'open' || (action.type === 'serve' && !Object.keys(save.state.crew).length) || save.state.phase !== 'trading') scheduleTrade();
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
      staffDrafts.clear();
      dialogue = null;
      customerMessage = '';
      lastSale = 0;
      departing = null;
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

function readStaffPlan(form) {
  const fields = new FormData(form);
  return { id: form.dataset.worker, role: fields.get('role'), recipe: fields.get('recipe'),
    start: Number(fields.get('start')), end: Number(fields.get('end')) };
}

$('panel').addEventListener('change', event => {
  const form = event.target.closest('.staff-plan');
  if (!form) return;
  const plan = readStaffPlan(form);
  staffDrafts.set(plan.id, plan);
  const person = applicants[plan.id];
  const hours = plan.end - plan.start;
  form.querySelector('p').textContent = 'Scheduled wage: ' + (hours >= 2 ? money(hours * person.wage - (hours > 3 ? person.wage / 5 : 0)) : '—');
});
$('panel').addEventListener('submit', event => {
  if (!event.target.matches('.staff-plan')) return;
  event.preventDefault();
  perform({ type: 'staff-plan', ...readStaffPlan(event.target) });
});

document.querySelectorAll('[data-icon]').forEach((element) => { element.innerHTML = icon(element.dataset.icon); });
setupMusic();
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
  const { action, view: nextView, category: nextCategory, id, cents, skill, room, slot } = control.dataset;
  if (nextView) selectView(nextView);
  else if (nextCategory) {
    category = nextCategory;
    render();
  } else if (action === 'market-supplies') selectView('market', 'stock');
  else if (action === 'market-home') selectView('market', 'home');
  else if (action === 'home-room') {
    homeRoom = id;
    render();
  } else if (action === 'arrange-furniture') {
    arranging = id ?? '';
    render();
    if (arranging) $('panel').querySelector('.arrange-card')?.scrollIntoView({ block: 'nearest' });
  }
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
  else if (action && action !== 'confirm-save') perform({ type: action, id, cents: Number(cents), skill, room: room ?? currentRoom(save?.state), slot });
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
