export const stages = [
  { name: 'Folding table', art: 'stand-table', cost: 0, sales: 0, fee: 100, capacity: 30, line: 1, traffic: 0, detail: 'A pitcher, paper cups, and a handwritten sign.' },
  { name: 'Roadside stand', art: 'stand-roadside', cost: 2200, sales: 30, fee: 125, capacity: 36, line: 2, traffic: 7, detail: 'Shade and a chalkboard draw more visitors. Two people can wait and you can stock 36 cups.' },
  { name: 'Wooden lemonade stall', art: 'stand-upgraded', cost: 7500, sales: 115, fee: 175, capacity: 42, line: 3, traffic: 14, detail: 'A proper counter with a striped awning. Holds 42 cups and has room for a line of three.' },
  { name: 'Outdoor beverage stand', art: 'stand-expanded', cost: 17000, sales: 310, fee: 250, capacity: 54, line: 4, traffic: 21, detail: 'A longer counter and a second pickup window. Holds 54 cups and has room for a line of four.' },
  { name: 'Permanent storefront', art: 'stand-storefront', cost: 32000, sales: 680, fee: 400, capacity: 72, line: 5, traffic: 28, detail: 'A year-round shop with a takeaway window. Holds 72 cups and has room for a line of five.' },
];

export const campaigns = {
  flyers: { name: 'Handmade flyers', cost: 400, days: 2, traffic: 12, extra: 12, stage: 0, detail: 'A small bump in walk-by traffic.' },
  posters: { name: 'Local posters', cost: 1000, days: 3, traffic: 17, extra: 18, stage: 1, detail: 'More people spot the stand around town.' },
  newspaper: { name: 'Newspaper ad', cost: 2200, days: 4, traffic: 21, extra: 25, stage: 2, detail: 'Broader reach over four days.' },
  discount: { name: 'Discount promotion', cost: 250, days: 1, traffic: 9, extra: 15, stage: 0, discount: 25, detail: 'Draws a few extra visitors. Each cup sells for 25¢ less, with a 75¢ minimum.' },
  event: { name: 'Town event sponsor', cost: 3800, days: 2, traffic: 28, extra: 43, stage: 3, detail: 'Brings the biggest rush. Stock up and expect a line.' },
};

export const upgrades = {
  awning: { name: 'Garden awning', cost: 2000, stage: 1, art: 'garland', description: 'A flower garland at the counter. Attracts more walk-by traffic.' },
  cooler: { name: 'Ice chest', cost: 3600, stage: 0, art: 'cooler', description: 'A mint-green ice chest. Holds 30 extra servings and draws more visitors on warm days.' },
  press: { name: 'Countertop citrus press', cost: 1800, stage: 1, art: 'citrus-press', description: 'Squeezes and mixes in one step. Lets you make batches of 24.' },
  mint: { name: 'Mint planter', cost: 2600, stage: 2, art: 'mint', description: 'Unlocks Mint lemonade. Cut fresh mint from the planter at no supply cost.' },
};

export const businessStage = state => stages[state.stage];
export const activeCampaign = state => state.campaign && state.day >= state.campaign.startDay ? campaigns[state.campaign.id] : null;
export const salePrice = state => Math.max(75, state.price - (activeCampaign(state)?.discount ?? 0));
export const reserve = state => businessStage(state).fee + 900;
export const season = day => ['Spring', 'Summer', 'Autumn', 'Winter'][Math.floor((day - 1) / 14) % 4];
export const seasonTraffic = day => ({ Spring: 0, Summer: 9, Autumn: -3, Winter: -12 })[season(day)];
