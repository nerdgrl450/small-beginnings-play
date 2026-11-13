import { customers, MINUTES_PER_SLOT, SLOTS_PER_HOUR, visitorsAt } from './traffic.js';
import { businessStage, campaigns, reserve, salePrice, season, stages, upgrades } from './business.js';
import {
  applicants, employeeCapacity, counterCapacity, staffOnShift, staffBreak,
  staffWage, blankWorkerStats, blankStaff, staffCanPrep, validSchedule,
} from './staff.js';
export { upgrades } from './business.js';

export const VERSION = 4;
export const OPEN_HOUR = 9;
export const CLOSE_HOUR = 16;
export const STALL_FEE = 100;
export const RENT = 400;
export const FOOD_COST = 225;
export const SHELTER_UPKEEP = 75;
export const SUPPLY_COST = 450;
export const PACK_SIZE = 12;
export const INGREDIENT_CAPACITY = 120;
export const BATCH_SIZES = [3, 6, 12, 18];
export const MIN_PRICE = 75;
export const MAX_PRICE = 350;
export const PRICE_STEP = 25;
export const BUSINESS_RESERVE = 550;

export const ingredients = {
  lemons: { name: 'Lemons', unit: 'lemons', cost: 200, icon: 'lemon' },
  sugar: { name: 'Sugar', unit: 'scoops', cost: 125, icon: 'sparkle' },
  water: { name: 'Water', unit: 'measures', cost: 25, icon: 'drop' },
  cups: { name: 'Paper cups', unit: 'cups', cost: 100, icon: 'cup' },
};

export const recipes = {
  balanced: { name: 'Balanced', lemons: 3, sugar: 3, note: 'A classic. Sells steadily in any weather.' },
  sweet: { name: 'Sweeter', lemons: 2, sugar: 4, note: 'A favorite at lunch or on cloudy days.' },
  mint: { name: 'Mint', lemons: 3, sugar: 2, note: 'Cool and fragrant. A favorite in summer and with mint lovers.' },
  tangy: { name: 'Tangier', lemons: 4, sugar: 2, note: 'A favorite on warm days.' },
};

const ingredientIds = Object.keys(ingredients);
const ingredientStock = (quantity) => Object.fromEntries(ingredientIds.map((id) => [id, quantity]));

export const decor = {
  lantern: { name: 'Brass lantern', cost: 600, description: 'A little pool of light after dark.' },
  planter: { name: 'Window-box flowers', cost: 1000, description: 'Terracotta and a spill of pink blooms.' },
  quilt: { name: 'Patchwork quilt', cost: 1400, description: 'A hand-stitched layer of warmth. Saves 75¢ in nightly shelter supplies when placed.' },
};

export const homes = {
  room: { name: 'Rented room', cost: 9500, description: 'A sunny upstairs room with a real bed. $95 to move in, first night included. Then $4 per night.' },
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

const emptyLedger = () => ({ revenue: 0, expenses: 0, cups: 0, draw: 0, favorites: 0, visitors: 0, living: 0, turnedAway: 0, ads: 0, wages: 0, staffCups: 0, staffPrep: 0 });
const amount = (number, minimum = 0, maximum = 1_000_000_000_000) =>
  Number.isSafeInteger(number) && number >= minimum && number <= maximum;
const has = (object, key) => Object.hasOwn(object, key);

export function initialState() {
  return {
    version: VERSION,
    day: 1, hour: 8, slot: 0, phase: 'morning',
    business: 1300, personal: 700, price: 150, pantry: ingredientStock(18), batches: [],
    stage: 0, reputation: 0, campaign: null, queue: [], ...blankStaff(),
    upgrades: { awning: false, cooler: false, press: false, mint: false },
    owned: { lantern: false, planter: false, quilt: false },
    placed: { lantern: false, planter: false, quilt: false },
    home: 'shelter', rentPaidThrough: 0,
    today: emptyLedger(), previous: null,
    totalCups: 0, lifetimeProfit: 0, totalDraw: 0, customer: null,
    neighbor: { mae: { visits: 0, lastDay: 0 } },
    log: [{ day: 1, text: 'You found a spot for your stand on Willow Lane.' }],
  };
}

export function forecast(day) {
  const today = weather[(day - 1) % weather.length];
  if (season(day) === 'Winter' && today.name === 'Warm') return { name: 'Cold', icon: 'cloud', modifier: -1 };
  return today;
}

export const capacity = (state) => businessStage(state).capacity + (state.upgrades.cooler ? 30 : 0);
export const batchSizes = state => state.upgrades.press ? [...BATCH_SIZES, 24] : BATCH_SIZES;
export const finishedServings = (state) => state.batches.reduce((total, batch) => total + batch.servings, 0);
export const dailyPay = (state) => 1100 + state.stage * 200 + Number(state.upgrades.awning) * 100 + Number(state.upgrades.cooler) * 100;
export const livingCost = (state) => FOOD_COST + (state.home === 'shelter' && !state.placed.quilt ? SHELTER_UPKEEP : 0);
export const availableDraw = (state) => Math.max(0, Math.min(
  dailyPay(state) - state.today.draw,
  state.business - BUSINESS_RESERVE - businessStage(state).fee + STALL_FEE,
  state.lifetimeProfit - state.totalDraw,
));

export function batchRequirements(recipe, servings) {
  if (!has(recipes, recipe) || ![...BATCH_SIZES, 24].includes(servings)) return null;
  const { lemons, sugar } = recipes[recipe];
  return { lemons: lemons * servings / 3, sugar: sugar * servings / 3, water: servings, cups: servings };
}

export function batchProblem(state, recipe, servings) {
  const requirements = batchRequirements(recipe, servings);
  if (!requirements || !batchSizes(state).includes(servings)) return 'Choose an available batch size.';
  if (recipe === 'mint' && !state.upgrades.mint) return 'Install the mint planter to make this recipe.';
  if (state.phase === 'night') return 'The stand is closed for the night.';
  if (finishedServings(state) + servings > capacity(state)) return 'There isn’t room for that many finished cups.';
  const missing = ingredientIds.filter((id) => state.pantry[id] < requirements[id]);
  return missing.length ? `You need more ${missing.map((id) => ingredients[id].name.toLowerCase()).join(', ')}.` : '';
}

function isFavorite(state, recipe, customerId) {
  const climate = forecast(state.day).modifier;
  if (recipe === 'mint') return season(state.day) === 'Summer' || customerId === 2 || customerId === 4;
  if (recipe === 'tangy') return climate === 1;
  return recipe === 'sweet' && (climate === -1 || (state.hour >= 11 && state.hour <= 13));
}

function addLog(state, text) {
  state.log.unshift({ day: state.day, text });
  state.log.length = Math.min(14, state.log.length);
}

function spendBusiness(state, cents) {
  state.business -= cents;
  state.today.expenses += cents;
  state.lifetimeProfit -= cents;
}

function sell(state, cups, tip, customerId) {
  let count = 0;
  while (count < cups && state.batches.length) {
    const batch = state.batches[0];
    const served = Math.min(batch.servings, cups - count);
    if (isFavorite(state, batch.recipe, customerId)) state.today.favorites += served;
    batch.servings -= served;
    count += served;
    if (!batch.servings) state.batches.shift();
  }
  state.counter = Math.max(0, state.counter - count);
  const revenue = count * salePrice(state) + (count ? tip : 0);
  state.business += revenue;
  state.today.revenue += revenue;
  state.today.cups += count;
  state.totalCups += count;
  state.lifetimeProfit += revenue;
  return count;
}

function customerOrder(state, manual) {
  const customer = state.customer;
  if (!customer) return { cups: 0 };
  const name = customers[customer.id].name;
  const favorite = isFavorite(state, state.batches[0]?.recipe, customer.id);
  const budget = customer.budget + Number(favorite) * 35;
  state.customer = state.queue.shift() ?? null;
  if (!state.batches.length) return { cups: 0, customerId: customer.id, customerMessage: `${name} came by while you were sold out.` };
  if (salePrice(state) > budget) return { cups: 0, customerId: customer.id, customerMessage: `${name} passed at ${money(salePrice(state))} a cup.` };
  const tip = manual ? (favorite ? 35 : 25) : 0;
  sell(state, 1, tip, customer.id);
  const reaction = favorite ? ' Loved this recipe!' : '';
  return { cups: 1, customerId: customer.id, customerMessage: `${name} bought a cup for ${money(salePrice(state))}.${reaction}${tip ? ` +${tip}¢ tip.` : ''}` };
}

function makeBatch(state, recipe, servings) {
  const requirements = batchRequirements(recipe, servings);
  for (const item of ingredientIds) state.pantry[item] -= requirements[item];
  const lastBatch = state.batches.at(-1);
  if (lastBatch?.recipe === recipe) lastBatch.servings += servings;
  else state.batches.push({ recipe, servings });
}

function restockCounter(state, worker) {
  const moved = Math.min(counterCapacity(state), finishedServings(state)) - state.counter;
  state.counter += moved;
  worker.today.restocked += moved;
}

function runCrew(state, result) {
  const paid = [];
  const notices = new Set();
  for (const [id, worker] of Object.entries(state.crew)) {
    worker.status = 'off';
    if (!staffOnShift(worker, state.hour)) continue;
    if (staffBreak(worker, state.hour, state.slot)) {
      worker.status = 'break';
      continue;
    }
    const wage = staffWage(id);
    if (state.business < wage) {
      worker.status = 'unpaid';
      notices.add('Business cash is too low to pay staff.');
      continue;
    }
    spendBusiness(state, wage);
    state.today.wages += wage;
    worker.today.wages += wage;
    worker.today.ticks += 1;
    worker.status = 'ready';
    paid.push([id, worker]);
  }

  for (const [id, worker] of paid) {
    if (worker.role === 'serve' || finishedServings(state) >= counterCapacity(state) + 3) continue;
    const sizes = state.upgrades.press ? [18, 12, 6, 3] : [12, 6, 3];
    const servings = sizes.find(size => !batchProblem(state, worker.recipe, size));
    if (!servings) {
      if (finishedServings(state) < 3) notices.add('Staff need ingredients to make more lemonade.');
      continue;
    }
    const ticks = Math.max(1, applicants[id].prep - Number(state.upgrades.press));
    worker.progress += 1;
    worker.status = 'preparing';
    if (worker.progress < ticks) continue;
    worker.progress = 0;
    makeBatch(state, worker.recipe, servings);
    worker.today.prepared += servings;
    state.today.staffPrep += servings;
    restockCounter(state, worker);
  }

  let counterOrders = 0;
  for (const [id, worker] of paid) {
    if (worker.role === 'prep' || (worker.status === 'preparing' && worker.progress)) continue;
    restockCounter(state, worker);
    if (!state.counter && state.customer) notices.add('The counter is out of lemonade. Assign prep staff or make a batch.');
    for (let i = 0; i < applicants[id].service && state.customer && state.counter; i += 1) {
      const order = customerOrder(state, false);
      counterOrders += 1;
      result.cups += order.cups;
      result.customerId = order.customerId;
      result.customerMessage = order.customerMessage;
      worker.status = 'serving';
      worker.today.cups += order.cups;
      worker.today.revenue += order.cups * salePrice(state);
      state.today.staffCups += order.cups;
    }
  }
  state.staffNotice = [...notices].join(' ');
  return counterOrders;
}

function tradePulse(state) {
  const result = { cups: 0 };
  const counterOrders = runCrew(state, result);
  // Keep the built-in walk-up capacity when no employee is available to cover it.
  const walkUpCapacity = state.stage >= 3 ? 2 : 1;
  for (let orderIndex = counterOrders; orderIndex < walkUpCapacity && state.customer; orderIndex += 1) {
    const order = customerOrder(state, false);
    result.cups += order.cups;
    if (order.customerId !== undefined) {
      result.customerId ??= order.customerId;
      result.customerMessage = [result.customerMessage, order.customerMessage].filter(Boolean).join(' ');
    }
  }
  state.slot += 1;
  if (state.slot === SLOTS_PER_HOUR) {
    state.slot = 0;
    state.hour += 1;
  }
  if (state.hour === CLOSE_HOUR) {
    // Serve everyone already in line before closing.
    while (state.customer) result.cups += customerOrder(state, false).cups;
    state.phase = 'closed';
    if (state.staffNotice) addLog(state, state.staffNotice);
    state.staffNotice = '';
    for (const worker of Object.values(state.crew)) worker.status = 'off';
    const goodShift = state.today.cups >= 10;
    const crowdFavorite = state.today.favorites >= 5;
    state.reputation = Math.min(100, state.reputation + Number(goodShift) + Number(crowdFavorite));
  } else {
    const turnedAway = state.today.turnedAway;
    for (const arrival of visitorsAt(state, forecast(state.day).modifier)) {
      state.today.visitors += 1;
      if (!state.customer) state.customer = arrival;
      else if (1 + state.queue.length < businessStage(state).line) state.queue.push(arrival);
      else state.today.turnedAway += 1;
    }
    if (!state.staffNotice && state.today.turnedAway > turnedAway && Object.keys(state.crew).length) {
      state.staffNotice = 'The queue filled up. Try overlapping your counter shifts during the rush.';
    }
  }
  return result;
}

export function investmentProblem(state, type, id) {
  const stage = businessStage(state);
  if (type === 'expand') {
    const next = stages[state.stage + 1];
    if (!next) return 'The permanent storefront is already open.';
    if (state.phase === 'trading') return 'Finish the shift before expanding.';
    if (state.totalCups < next.sales) return `Sell ${next.sales} lifetime cups to unlock this stage.`;
    if (state.business < next.cost + next.fee + 900) return `Keep ${money(next.fee + 900)} in business cash after expanding.`;
    return '';
  }
  const isAd = type === 'advertise';
  const options = isAd ? campaigns : upgrades;
  if (!has(options, id)) return 'This purchase is unavailable.';
  const item = options[id];
  if (state.stage < item.stage) return `Unlock the ${stages[item.stage].name.toLowerCase()} first.`;
  if (isAd ? state.campaign : state.upgrades[id]) return isAd ? 'Finish your current campaign first.' : 'Already installed.';
  if (state.business < item.cost + reserve(state)) return `Keep ${money(reserve(state))} in business cash for supplies and fees.`;
  return '';
}

export function openingProblem(state) {
  if (!state.batches.length && !staffCanPrep(state, OPEN_HOUR)) return 'Make a batch or schedule preparation staff at opening.';
  const fee = businessStage(state).fee;
  if (state.business < fee) return `You need ${money(fee)} to cover the stall fee.`;
  return '';
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

    case 'supplies': {
      if (id && !has(ingredients, id)) return reject('That ingredient is unavailable.');
      const items = id ? [id] : ingredientIds;
      const cost = id ? ingredients[id].cost : SUPPLY_COST;
      if (items.some((item) => state.pantry[item] + PACK_SIZE > INGREDIENT_CAPACITY)) return reject('There isn’t room in the ingredient pantry.');
      if (state.business - cost < businessStage(state).fee) return reject(`Keep ${money(businessStage(state).fee)} in business cash for the stall fee.`);
      spendBusiness(state, cost);
      for (const item of items) state.pantry[item] += PACK_SIZE;
      const label = id ? ingredients[id].name.toLowerCase() : 'lemons, sugar, water, and paper cups';
      addLog(state, `Bought ${label} for the ingredient pantry.`);
      return accept(`Stored ${label} in the pantry.`);
    }

    case 'prepare': {
      const { recipe, servings } = action;
      const problem = batchProblem(state, recipe, servings);
      if (problem) return reject(problem);
      makeBatch(state, recipe, servings);
      addLog(state, `Made ${servings} cups of ${recipes[recipe].name.toLowerCase()} lemonade.`);
      return accept(`${servings} fresh cups of lemonade are ready.`);
    }

    case 'open': {
      if (state.phase !== 'morning') return reject('You can open again tomorrow.');
      const problem = openingProblem(state);
      if (problem) return reject(problem);
      spendBusiness(state, businessStage(state).fee);
      state.phase = 'trading';
      state.staffNotice = '';
      state.hour = OPEN_HOUR;
      state.slot = 0;
      addLog(state, 'Opened the lemonade stand.');
      return accept('The stand is open.');
    }

    case 'pulse': {
      if (state.phase !== 'trading') return reject('The stand is closed.');
      const result = tradePulse(state);
      if (state.phase === 'closed') addLog(state, `Closed the stand after selling ${state.today.cups} cups.`);
      return accept(result.customerMessage || 'The stand is open.', result);
    }

    case 'serve': {
      if (state.phase !== 'trading') return reject('Open the stand to serve a customer.');
      if (!state.customer) return reject('Wait for a customer to stop by.');
      const result = customerOrder(state, true);
      return accept(result.customerMessage, result);
    }

    case 'finish': {
      if (state.phase !== 'trading') return reject('The stand is closed.');
      let cups = 0;
      while (state.phase === 'trading') cups += tradePulse(state).cups;
      addLog(state, `Closed the stand after selling ${state.today.cups} cups.`);
      return accept(`Finished the shift. ${state.today.cups} sold today.`, { cups });
    }

    case 'draw': {
      if (state.phase === 'trading') return reject('Close the stand before taking pay.');
      const payout = availableDraw(state);
      if (!payout) return reject('There’s no owner pay available today.');
      state.business -= payout;
      state.personal += payout;
      state.totalDraw += payout;
      state.today.draw += payout;
      addLog(state, `Took ${money(payout)} home from the stand.`);
      return accept(`Moved ${money(payout)} to your personal wallet.`);
    }

    case 'upgrade': {
      const problem = investmentProblem(state, 'upgrade', id);
      if (problem) return reject(problem);
      spendBusiness(state, upgrades[id].cost);
      state.upgrades[id] = true;
      addLog(state, `Installed ${upgrades[id].name.toLowerCase()}.`);
      return accept(`${upgrades[id].name} installed.`);
    }

    case 'expand': {
      const problem = investmentProblem(state, 'expand');
      if (problem) return reject(problem);
      state.stage += 1;
      const stage = businessStage(state);
      spendBusiness(state, stage.cost);
      addLog(state, `Opened the ${stage.name.toLowerCase()}.`);
      return accept(`${stage.name} unlocked.`);
    }

    case 'advertise': {
      const problem = investmentProblem(state, 'advertise', id);
      if (problem) return reject(problem);
      const campaign = campaigns[id];
      const startDay = state.day + Number(state.phase !== 'morning');
      state.campaign = { id, startDay, endDay: startDay + campaign.days - 1 };
      spendBusiness(state, campaign.cost);
      state.today.ads += campaign.cost;
      addLog(state, `Booked ${campaign.name.toLowerCase()} for Day ${startDay}.`);
      return accept(`${campaign.name} booked for Day ${startDay}.`);
    }

    case 'hire': {
      if (!has(applicants, id) || has(state.crew, id)) return reject('This applicant is unavailable.');
      if (Object.keys(state.crew).length >= employeeCapacity(state)) return reject('Expand the stand for more staff space.');
      const person = applicants[id];
      const start = Math.max(person.start, person.role === 'serve' ? 11 : 9);
      state.crew[id] = { role: person.role, start, end: start + 3, recipe: 'balanced', progress: 0,
        status: 'off', today: state.staffHistory[id]?.today ?? blankWorkerStats(), previous: state.staffHistory[id]?.previous ?? null };
      delete state.staffHistory[id];
      addLog(state, `Hired ${person.name}.`);
      return accept(`${person.name} joined the stand.`);
    }

    case 'staff-plan': {
      if (!has(state.crew, id)) return reject('That employee is unavailable.');
      const { role, start, end, recipe } = action;
      if (!validSchedule(id, role, start, end)) return reject('Choose at least two hours within their availability.');
      if (!has(recipes, recipe) || (recipe === 'mint' && !state.upgrades.mint)) return reject('Choose an available recipe.');
      const worker = state.crew[id];
      Object.assign(worker, { role, start, end, recipe, progress: 0, status: 'off' });
      return accept(`${applicants[id].name}’s schedule saved.`);
    }

    case 'dismiss': {
      if (!has(state.crew, id)) return reject('That employee is unavailable.');
      // Keep today's payroll and productivity visible if they are rehired.
      state.staffHistory[id] = { today: state.crew[id].today, previous: state.crew[id].previous };
      delete state.crew[id];
      if (!Object.keys(state.crew).length) state.staffNotice = '';
      addLog(state, `${applicants[id].name} left the stand.`);
      return accept(`${applicants[id].name} was dismissed.`);
    }

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
      if (state.personal < homes.room.cost) return reject(`Save ${money(homes.room.cost)} in your personal wallet to move in.`);
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
      state.slot = 0;
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
      const spent = Math.min(state.personal, livingCost(state));
      state.personal -= spent;
      state.today.living = spent;
      if (spent) addLog(state, `Spent ${money(spent)} on food and daily basics.`);
      state.previous = { day: state.day, ...state.today };
      state.today = emptyLedger();
      for (const worker of [...Object.values(state.crew), ...Object.values(state.staffHistory)]) {
        worker.previous = worker.today;
        worker.today = blankWorkerStats();
      }
      for (const worker of Object.values(state.crew)) worker.progress = 0;
      state.staffNotice = '';
      state.day += 1;
      if (state.campaign && state.day > state.campaign.endDay) state.campaign = null;
      state.hour = 8;
      state.phase = 'morning';
      state.slot = 0;
      state.customer = null;
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
export const clock = (hour, slot = 0) => `${hour % 12 || 12}:${String(slot * MINUTES_PER_SLOT).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;

function validFlags(value, definitions) {
  return value && typeof value === 'object' &&
    Object.keys(value).length === Object.keys(definitions).length &&
    Object.keys(definitions).every((id) => has(value, id) && typeof value[id] === 'boolean');
}

function validLedger(value) {
  return value && ['revenue', 'expenses', 'cups', 'draw'].every((key) => amount(value[key]));
}

function validCommonState(s) {
  if (!s || !amount(s.day, 1) || !amount(s.hour, 8, 20)) return false;
  const hours = { morning: [8, 8], trading: [9, 15], closed: [16, 16], night: [20, 20] };
  if (!has(hours, s.phase) || !amount(s.hour, ...hours[s.phase])) return false;
  if (!validFlags(s.upgrades, s.version >= 3 ? upgrades : { awning: true, cooler: true }) || !validFlags(s.owned, decor) || !validFlags(s.placed, decor)) return false;
  if (!Object.keys(decor).every((id) => !s.placed[id] || s.owned[id])) return false;
  if (!['shelter', 'room'].includes(s.home) || !amount(s.rentPaidThrough, 0, s.day) ||
      (s.home === 'shelter' && s.rentPaidThrough !== 0) || (s.home === 'room' && s.rentPaidThrough === 0)) return false;
  if (!['business', 'personal', 'totalCups', 'totalDraw'].every((key) => amount(s[key])) ||
      !amount(s.lifetimeProfit, -1_000_000_000_000)) return false;
  if (!amount(s.price, MIN_PRICE, MAX_PRICE) || s.price % PRICE_STEP) return false;
  if (!validLedger(s.today) || (s.day === 1 ? s.previous !== null : !validLedger(s.previous) || s.previous.day !== s.day - 1)) return false;
  const mae = s.neighbor?.mae;
  if (!mae || !amount(mae.lastDay, 0, s.day) || !amount(mae.visits, 0, mae.lastDay)) return false;
  return Array.isArray(s.log) && s.log.length <= 14 && s.log.every((item) =>
    item && amount(item.day, 1, s.day) && typeof item.text === 'string' && item.text.length <= 300);
}

export function validState(s) {
  if (s?.version !== VERSION || !validCommonState(s) || has(s, 'stock')) return false;
  if (!amount(s.stage, 0, stages.length - 1) || !amount(s.reputation, 0, 100)) return false;
  if (!s.pantry || Object.keys(s.pantry).length !== ingredientIds.length ||
      !ingredientIds.every((id) => has(s.pantry, id) && amount(s.pantry[id], 0, INGREDIENT_CAPACITY))) return false;
  if (!Array.isArray(s.batches) || s.batches.length > capacity(s) || !s.batches.every((batch) =>
    batch && has(recipes, batch.recipe) && (batch.recipe !== 'mint' || s.upgrades.mint) && amount(batch.servings, 1, capacity(s)))) return false;
  const validShiftLedger = (ledger) => amount(ledger.favorites, 0, ledger.cups) &&
    amount(ledger.visitors, ledger.cups) && amount(ledger.living) &&
    amount(ledger.turnedAway, 0, ledger.visitors - ledger.cups) && amount(ledger.ads, 0, ledger.expenses) && amount(ledger.wages, 0, ledger.expenses - ledger.ads) &&
    amount(ledger.staffCups, 0, ledger.cups) && amount(ledger.staffPrep);
  if (!amount(s.slot, 0, s.phase === 'trading' ? SLOTS_PER_HOUR - 1 : 0)) return false;
  const validCustomer = (customer) => amount(customer?.id, 0, customers.length - 1) && amount(customer?.budget, 125, 325);
  if (s.customer !== null && (s.phase !== 'trading' || !validCustomer(s.customer))) return false;
  if (!Array.isArray(s.queue) || s.queue.length >= businessStage(s).line ||
    (s.queue.length && !s.customer) || !s.queue.every(validCustomer)) return false;
  if (s.campaign !== null) {
    const ad = s.campaign;
    if (!ad || !has(campaigns, ad.id) || s.stage < campaigns[ad.id].stage ||
      !amount(ad.startDay, 1, s.day + 1) || !amount(ad.endDay, s.day) ||
      ad.endDay !== ad.startDay + campaigns[ad.id].days - 1) return false;
  }
  if (!s.crew || !s.staffHistory || !amount(s.counter, 0, Math.min(counterCapacity(s), finishedServings(s))) ||
    typeof s.staffNotice !== 'string' || s.staffNotice.length > 220) return false;
  const validStats = stats => stats && Object.keys(blankWorkerStats()).every(key => amount(stats[key]));
  const validPerformance = worker => worker && validStats(worker.today) && (worker.previous === null || validStats(worker.previous));
  if (Object.keys(s.crew).length > employeeCapacity(s) || !Object.entries(s.crew).every(([id, worker]) =>
    validPerformance(worker) && validSchedule(id, worker.role, worker.start, worker.end) &&
    has(recipes, worker.recipe) && (worker.recipe !== 'mint' || s.upgrades.mint) && amount(worker.progress, 0, 4) &&
    ['off', 'ready', 'preparing', 'serving', 'break', 'unpaid'].includes(worker.status))) return false;
  if (!Object.entries(s.staffHistory).every(([id, history]) =>
    has(applicants, id) && !has(s.crew, id) && validPerformance(history))) return false;
  return finishedServings(s) <= capacity(s) && validShiftLedger(s.today) &&
    (!s.previous || validShiftLedger(s.previous));
}

export function readSaveState(state) {
  if (validState(state)) return state;
  if (![1, 2, 3].includes(state?.version) || !validCommonState(state)) return null;
  const { stock, lastOfferHour, ...legacy } = state;
  if (state.version === 1 && (!amount(stock, 0, state.upgrades.cooler ? 60 : 30) ||
    (lastOfferHour !== null && !amount(lastOfferHour, 9, Math.min(15, state.hour))))) return null;
  const staffLedger = old => ({ ...old, wages: 0, staffCups: 0, staffPrep: 0 });
  if (state.version === 3) {
    const migrated = { ...state, ...blankStaff(), version: VERSION, today: staffLedger(state.today),
      previous: state.previous ? staffLedger(state.previous) : null };
    return validState(migrated) ? migrated : null;
  }
  const ledger = (old) => staffLedger( ({ favorites: 0, visitors: old.cups, living: 0, ...old, turnedAway: 0, ads: 0 }));
  const migrated = {
    ...legacy,
    ...blankStaff(),
    version: VERSION,
    stage: state.upgrades.awning ? 2 : 0,
    reputation: Math.min(25, Math.floor(state.totalCups / 20)),
    campaign: null,
    queue: [],
    upgrades: { ...state.upgrades, press: false, mint: false },
    slot: state.version === 2 ? state.slot : 0,
    customer: state.version === 2 ? state.customer : null,
    pantry: state.version === 2 ? state.pantry : ingredientStock(0),
    batches: state.version === 2 ? state.batches : stock ? [{ recipe: 'balanced', servings: stock }] : [],
    today: ledger(state.today),
    previous: state.previous ? ledger(state.previous) : null,
  };
  return validState(migrated) ? migrated : null;
}
