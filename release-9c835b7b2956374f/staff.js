export const applicants = {
  rowan: { name: 'Rowan', wage: 125, start: 9, end: 14, preferred: '9 AM–1 PM', prep: 3, service: 1,
    role: 'prep', caps: { speed: 2, prep: 2, service: 2, reliability: 3 },
    detail: 'Fast with a pitcher. Can become especially dependable.' },
  mina: { name: 'Mina', wage: 175, start: 11, end: 16, preferred: '11 AM–4 PM', prep: 5, service: 2,
    role: 'serve', caps: { speed: 3, prep: 3, service: 3, reliability: 2 },
    detail: 'Good with crowds. Has plenty of room to improve her prep speed.' },
  ellis: { name: 'Ellis', wage: 225, start: 9, end: 16, preferred: '10 AM–3 PM', prep: 3, service: 2,
    role: 'flex', caps: { speed: 3, prep: 2, service: 3, reliability: 3 },
    detail: 'Quick at both stations. Costs the most per hour.' },
};

export const training = {
  speed: { name: 'Serving speed', cost: 650, practice: 45, unit: 'orders', effect: 'Handles more orders per turn and catches fresh arrivals during rushes.' },
  prep: { name: 'Lemonade prep', cost: 700, practice: 12, unit: 'batches', effect: 'Finishes each batch 12 game minutes sooner per level, down to 12 minutes.' },
  service: { name: 'Customer service', cost: 550, practice: 38, unit: 'sales', effect: 'Wins over customers near their price limit and earns praise for the stand.' },
  reliability: { name: 'Reliability', cost: 600, practice: 75, unit: 'paid turns', effect: 'Periodically mixes faster or handles one extra order while the line builds.' },
};

export const blankGrowth = () => ({
  skills: Object.fromEntries(Object.keys(training).map(skill => [skill, 1])),
  practice: Object.fromEntries(Object.keys(training).map(skill => [skill, 0])),
  course: null,
});
export const courseCost = (skill, level) => training[skill].cost * level;
export const courseDays = level => level;
export const prepTurns = (id, worker, press) => Math.max(1, applicants[id].prep - Number(press) - (worker.skills.prep - 1));
export const serviceCapacity = (id, worker) => applicants[id].service + worker.skills.speed - 1;
export const consistentTurn = worker => worker.skills.reliability > 1 &&
  worker.today.ticks % (6 - worker.skills.reliability) === 0;
export const expressTurn = worker => worker.skills.speed > 1 && worker.today.ticks % (5 - worker.skills.speed) === 0;

export const roles = { prep: 'Preparation', serve: 'Counter', flex: 'Both stations' };
export const employeeCapacity = state => [0, 1, 1, 2, 3][state.stage];
export const counterCapacity = state => [6, 9, 12, 15, 18][state.stage];

export const staffOnShift = (worker, hour) => Boolean(worker && hour >= worker.start && hour < worker.end);
export const staffBreak = (worker, hour, slot) => hour === worker.start + 3 && slot === 0;
export const staffWage = id => applicants[id].wage / 5;
export const blankWorkerStats = () => ({ wages: 0, ticks: 0, cups: 0, prepared: 0, restocked: 0, revenue: 0, praise: 0 });
export const blankStaff = () => ({ crew: {}, staffHistory: {}, counter: 0, staffNotice: '' });
export const staffCanPrep = (state, hour) => Object.values(state.crew).some(worker =>
  staffOnShift(worker, hour) && worker.role !== 'serve');

export function validSchedule(id, role, start, end) {
  if (!Object.hasOwn(applicants, id) || !Object.hasOwn(roles, role)) return false;
  const person = applicants[id];
  return Number.isInteger(start) && Number.isInteger(end) && start >= person.start && end <= person.end && end - start >= 2;
}
