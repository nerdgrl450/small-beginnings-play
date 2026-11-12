export const VERSION = 1;
export const OPEN_HOUR = 9;
export const CLOSE_HOUR = 16;
export const STALL_FEE = 100;
export const RENT = 400;
export const SUPPLY_COST = 450;
export const PACK_SIZE = 12;
export const START_CAPACITY = 30;
export const UPGRADE_CAPACITY = 60;
export const MIN_PRICE = 75;
export const MAX_PRICE = 350;
export const PRICE_STEP = 25;
export const BUSINESS_RESERVE = 550;

export const upgrades = {
  awning: { name: 'Garden awning', cost: 2000, description: 'A sage-striped canopy and flower garland. Draws one more shopper per hour.' },
  cooler: { name: 'Ice chest', cost: 3600, description: 'A mint-green chest for the stand. Holds 30 extra servings and helps sales on warm days.' },
};

export const decor = {
  lantern: { name: 'Brass lantern', cost: 600, description: 'A little pool of light after dark.' },
  planter: { name: 'Window-box flowers', cost: 1000, description: 'Terracotta and a spill of pink blooms.' },
  quilt: { name: 'Patchwork quilt', cost: 1400, description: 'A hand-stitched layer of warmth.' },
};

export const homes = {
  room: { name: 'Rented room', cost: 3800, description: 'A sunny upstairs room with a real bed. First night included, then $4 per night.' },
};

export const neighbors = {
  mae: { name: 'Mae', role: 'Market keeper', intro: 'I keep the lemons out front. You’re the one with the little stand, aren’t you?', lines: ['My mother always put a pinch of salt in her lemonade. She made me swear I’d never tell.', 'Those flowers by the lane? I plant a few more every spring. Help yourself to a cutting.', 'I set a bruised peach aside for you. The good side’s still sweet.'] },
};

const weather = [
  { name: 'Sunny', icon: 'sun', modifier: 0 },
  { name: 'Warm', icon: 'sun', modifier: 1 },
  { name: 'Cloudy', icon: 'cloud', modifier: -1 },
  { name: 'Sunny', icon: 'sun', modifier: 0 },
  { name: 'Warm', icon: 'sun', modifier: 1 },
];
const hourDemand = [2, 2, 3, 4, 3, 2, 2];

const emptyLedger = () => ({ revenue: 0, expenses: 0, cups: 0, draw: 0 });
const amount = (number, minimum = 0, maximum = 1_000_000_000_000) =>
  Number.isSafeInteger(number) && number >= minimum && number <= maximum;
const has = (object, key) => Object.hasOwn(object, key);

export function initialState() {
  return {
    version: VERSION,
    day: 1, hour: 8, phase: 'morning',
    business: 1300, personal: 700, price: 150, stock: 18,
    upgrades: { awning: false, cooler: false },
    owned: { lantern: false, planter: false, quilt: false },
    placed: { lantern: false, planter: false, quilt: false },
    home: 'shelter', rentPaidThrough: 0,
    today: emptyLedger(), previous: null,
    totalCups: 0, lifetimeProfit: 0, totalDraw: 0, lastOfferHour: null,
    neighbor: { mae: { visits: 0, lastDay: 0 } },
    log: [{ day: 1, text: 'You found a spot for your stand on Willow Lane.' }],
  };
}

export function forecast(day) {
  return weather[(day - 1) % weather.length];
}

export const capacity = (state) => state.upgrades.cooler ? UPGRADE_CAPACITY : START_CAPACITY;
export const availableDraw = (state) => Math.max(0, Math.min(
  state.business - BUSINESS_RESERVE,
  state.lifetimeProfit - state.totalDraw,
));

function addLog(state, text) {
  state.log.unshift({ day: state.day, text });
  state.log.length = Math.min(14, state.log.length);
}

function spendBusiness(state, cents) {
  state.business -= cents;
  state.today.expenses += cents;
  state.lifetimeProfit -= cents;
}

function sell(state, cups, tip = 0) {
  const count = Math.min(state.stock, cups);
  const revenue = count * state.price + (count ? tip : 0);
  state.stock -= count;
  state.business += revenue;
  state.today.revenue += revenue;
  state.today.cups += count;
  state.totalCups += count;
  state.lifetimeProfit += revenue;
  return count;
}

function demand(state) {
  const climate = forecast(state.day).modifier;
  const pricePenalty = state.price > 275 ? 3 : state.price > 200 ? 2 : state.price > 150 ? 1 : 0;
  const bargain = state.price <= 125 ? 1 : 0;
  const chilled = state.upgrades.cooler && climate === 1 ? 1 : 0;
  const hour = hourDemand[state.hour - OPEN_HOUR];
  return Math.max(0, hour + climate + Number(state.upgrades.awning) + chilled + bargain - pricePenalty);
}

function tradeHour(state) {
  const count = sell(state, demand(state));
  state.hour += 1;
  if (state.hour === CLOSE_HOUR) state.phase = 'closed';
  return count;
}

export function transition(current, action) {
  const state = structuredClone(current);
  const reject = (message) => ({ state: current, message, ok: false });
  const accept = (message, detail = {}) => ({ state, message, ok: true, ...detail });
  const id = action.id;

  switch (action.type) {
    case 'price':
      if (!amount(action.cents, MIN_PRICE, MAX_PRICE) || action.cents % PRICE_STEP) return reject('Choose a price in 25¢ steps.');
      state.price = action.cents;
      return accept('Price updated.');

    case 'supplies':
      if (state.stock + PACK_SIZE > capacity(state)) return reject('There isn’t room for another supply pack.');
      if (state.business < SUPPLY_COST) return reject('The business needs more cash for supplies.');
      spendBusiness(state, SUPPLY_COST);
      state.stock += PACK_SIZE;
      addLog(state, 'Bought a fresh pack of lemons, sugar, and cups.');
      return accept('Added supplies for 12 cups.');

    case 'open':
      if (state.phase !== 'morning') return reject('You can open again tomorrow.');
      if (!state.stock) return reject('Restock before you open the stand.');
      if (state.business < STALL_FEE) return reject('You need $1.00 to cover the stall fee.');
      spendBusiness(state, STALL_FEE);
      state.phase = 'trading';
      state.hour = OPEN_HOUR;
      addLog(state, 'Opened the lemonade stand.');
      return accept('The stand is open.');

    case 'trade': {
      if (state.phase !== 'trading') return reject('The stand is closed.');
      const cups = tradeHour(state);
      if (state.phase === 'closed') addLog(state, `Closed the stand after selling ${state.today.cups} cups.`);
      return accept(cups ? `Sold ${cups} ${cups === 1 ? 'cup' : 'cups'}.` : 'A quiet hour at the stand.', { cups });
    }

    case 'serve': {
      if (state.phase !== 'trading') return reject('Open the stand to serve a customer.');
      if (state.lastOfferHour === state.hour) return reject('A new passerby will come by next hour.');
      if (!state.stock) return reject('Restock to serve the next customer.');
      state.lastOfferHour = state.hour;
      sell(state, 1, 25);
      return accept('Served a cup and earned a 25¢ tip.', { cups: 1 });
    }

    case 'finish': {
      if (state.phase !== 'trading') return reject('The stand is closed.');
      let cups = 0;
      while (state.phase === 'trading') cups += tradeHour(state);
      addLog(state, `Closed the stand after selling ${state.today.cups} cups.`);
      return accept(`Finished the shift. ${state.today.cups} sold today.`, { cups });
    }

    case 'draw': {
      if (state.phase === 'trading') return reject('Close the stand before taking pay.');
      const payout = availableDraw(state);
      if (!payout) return reject('There’s no profit available to take home yet.');
      state.business -= payout;
      state.personal += payout;
      state.totalDraw += payout;
      state.today.draw += payout;
      addLog(state, `Took ${money(payout)} home from the stand.`);
      return accept(`Moved ${money(payout)} to your personal wallet.`);
    }

    case 'upgrade':
      if (!has(upgrades, id) || state.upgrades[id]) return reject('That upgrade is already installed or unavailable.');
      if (state.business - upgrades[id].cost < BUSINESS_RESERVE) return reject('Keep $5.50 in business cash for your next shift.');
      spendBusiness(state, upgrades[id].cost);
      state.upgrades[id] = true;
      addLog(state, `Upgraded the stand with a ${upgrades[id].name.toLowerCase()}.`);
      return accept(`${upgrades[id].name} installed.`);

    case 'decor':
      if (!has(decor, id) || state.owned[id]) return reject('You already own that item or it’s unavailable.');
      if (state.personal < decor[id].cost) return reject('There isn’t enough in your personal wallet.');
      state.personal -= decor[id].cost;
      state.owned[id] = true;
      state.placed[id] = true;
      addLog(state, `Brought a ${decor[id].name.toLowerCase()} home.`);
      return accept(`${decor[id].name} placed at home.`);

    case 'place':
      if (!has(decor, id) || !state.owned[id]) return reject('Buy the item before placing it.');
      state.placed[id] = !state.placed[id];
      return accept(`${decor[id].name} ${state.placed[id] ? 'placed' : 'stored'}.`);

    case 'home':
      if (id !== 'room' || state.home === 'room') return reject('That home is unavailable.');
      if (state.personal < homes.room.cost) return reject('Save $38.00 in your personal wallet to move in.');
      state.personal -= homes.room.cost;
      state.home = 'room';
      state.rentPaidThrough = state.day;
      addLog(state, 'Moved upstairs into the rented room.');
      return accept('You have a room of your own.');

    case 'evening':
      if (state.phase === 'trading') return reject('Finish the shift before heading into the evening.');
      if (state.phase === 'night') return reject('It’s already evening.');
      state.phase = 'night';
      state.hour = 20;
      return accept('The lights are coming on around Willowbrook.');

    case 'sleep':
      if (state.phase !== 'night') return reject('Wait until evening to go to sleep.');
      if (state.home === 'room' && state.rentPaidThrough < state.day) {
        if (state.personal >= RENT) {
          state.personal -= RENT;
          state.rentPaidThrough = state.day;
          addLog(state, 'Paid $4.00 for the room tonight.');
        } else {
          state.home = 'shelter';
          state.rentPaidThrough = 0;
          addLog(state, 'You couldn’t cover the room tonight and moved back to the garden.');
        }
      }
      state.previous = { day: state.day, ...state.today };
      state.today = emptyLedger();
      state.day += 1;
      state.hour = 8;
      state.phase = 'morning';
      state.lastOfferHour = null;
      return accept(`Good morning. It’s Day ${state.day}.`);

    case 'chat': {
      if (!has(neighbors, id)) return reject('Nobody is around right now.');
      if (state.phase === 'night') return reject('Mae has closed the market for the evening.');
      const relation = state.neighbor[id];
      if (relation.lastDay === state.day) return reject('Mae waves as she sorts the fruit crates.');
      const person = neighbors[id];
      const message = relation.visits ? person.lines[(relation.visits - 1) % person.lines.length] : person.intro;
      relation.visits += 1;
      relation.lastDay = state.day;
      return accept(message);
    }

    default:
      return reject('That action isn’t available.');
  }
}

const format = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const money = (cents) => format.format(cents / 100);
export const clock = (hour) => `${hour % 12 || 12}:00 ${hour >= 12 ? 'PM' : 'AM'}`;

function validFlags(value, definitions) {
  return value && typeof value === 'object' &&
    Object.keys(value).length === Object.keys(definitions).length &&
    Object.keys(definitions).every((id) => has(value, id) && typeof value[id] === 'boolean');
}

function validLedger(value) {
  return value && ['revenue', 'expenses', 'cups', 'draw'].every((key) => amount(value[key]));
}

export function validState(s) {
  if (!s || s.version !== VERSION || !amount(s.day, 1) || !amount(s.hour, 8, 20)) return false;
  const hours = { morning: [8, 8], trading: [9, 15], closed: [16, 16], night: [20, 20] };
  if (!has(hours, s.phase) || !amount(s.hour, ...hours[s.phase])) return false;
  if (!validFlags(s.upgrades, upgrades) || !validFlags(s.owned, decor) || !validFlags(s.placed, decor)) return false;
  if (!Object.keys(decor).every((id) => !s.placed[id] || s.owned[id])) return false;
  if (!['shelter', 'room'].includes(s.home) || !amount(s.rentPaidThrough, 0, s.day) ||
      (s.home === 'shelter' && s.rentPaidThrough !== 0) || (s.home === 'room' && s.rentPaidThrough === 0)) return false;
  if (!['business', 'personal', 'totalCups', 'totalDraw'].every((key) => amount(s[key])) ||
      !amount(s.lifetimeProfit, -1_000_000_000_000)) return false;
  if (!amount(s.stock, 0, capacity(s)) || !amount(s.price, MIN_PRICE, MAX_PRICE) || s.price % PRICE_STEP) return false;
  if (!validLedger(s.today) || (s.day === 1 ? s.previous !== null : !validLedger(s.previous) || s.previous.day !== s.day - 1)) return false;
  if (s.lastOfferHour !== null && !amount(s.lastOfferHour, 9, Math.min(15, s.hour))) return false;
  const mae = s.neighbor?.mae;
  if (!mae || !amount(mae.lastDay, 0, s.day) || !amount(mae.visits, 0, mae.lastDay)) return false;
  return Array.isArray(s.log) && s.log.length <= 14 && s.log.every((item) =>
    item && amount(item.day, 1, s.day) && typeof item.text === 'string' && item.text.length <= 300);
}
