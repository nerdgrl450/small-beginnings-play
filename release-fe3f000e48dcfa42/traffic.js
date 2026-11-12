export const SLOTS_PER_HOUR = 5;
export const MINUTES_PER_SLOT = 60 / SLOTS_PER_HOUR;

export const customers = [
  { name: 'June', art: 'customer', tint: 'linen' },
  { name: 'Ollie', art: 'customer-ollie', tint: 'denim' },
  { name: 'Nora', art: 'customer-nora', tint: 'sage' },
  { name: 'Arthur', art: 'customer-arthur', tint: 'rust' },
  { name: 'Hazel', art: 'customer', tint: 'rose' },
  { name: 'Kit', art: 'customer-ollie', tint: 'moss' },
];

const hourTraffic = [46, 55, 74, 90, 75, 59, 47];

function roll(seed, salt) {
  let value = Math.imul(seed ^ salt, 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return ((value ^ (value >>> 16)) >>> 0) % 100;
}

function trafficSeed(state) {
  return state.day * 937 + state.hour * 41 + state.slot * 13;
}

export function visitorAt(state, climate, favorite) {
  const seed = trafficSeed(state);
  const appeal = hourTraffic[state.hour - 9] + climate * 11 +
    Number(state.upgrades.awning) * 12 + Number(state.upgrades.cooler) * (climate > 0 ? 8 : 4) +
    Number(favorite) * 9;
  if (roll(seed, 91) >= Math.min(96, appeal)) return null;

  const appetite = roll(seed, 41);
  const budget = appetite < 8 ? 125 : appetite < 44 ? 175 : appetite < 75 ? 225 :
    appetite < 93 ? 275 : 325;
  return { id: roll(seed, 17) % customers.length, budget };
}

export function nextTrafficDelay(state) {
  const variation = roll(trafficSeed(state), 137);
  return state.customer ? 2700 + variation * 20 : 1250 + variation * 19;
}
