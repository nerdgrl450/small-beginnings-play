export const applicants = {
  rowan: { name: 'Rowan', wage: 125, start: 9, end: 14, preferred: '9 AM–1 PM', prep: 3, service: 1,
    role: 'prep', detail: 'Fast with a pitcher. Takes the counter one customer at a time.' },
  mina: { name: 'Mina', wage: 175, start: 11, end: 16, preferred: '11 AM–4 PM', prep: 5, service: 2,
    role: 'serve', detail: 'Keeps the lunch line moving. Takes longer to mix a batch.' },
  ellis: { name: 'Ellis', wage: 225, start: 9, end: 16, preferred: '10 AM–3 PM', prep: 3, service: 2,
    role: 'flex', detail: 'Quick at both stations. Costs the most per hour.' },
};

export const roles = { prep: 'Preparation', serve: 'Counter', flex: 'Both stations' };
export const employeeCapacity = state => [0, 1, 1, 2, 3][state.stage];
export const counterCapacity = state => [6, 9, 12, 15, 18][state.stage];

export const staffOnShift = (worker, hour) => Boolean(worker && hour >= worker.start && hour < worker.end);
export const staffBreak = (worker, hour, slot) => hour === worker.start + 3 && slot === 0;
export const staffWage = id => applicants[id].wage / 5;
export const blankWorkerStats = () => ({ wages: 0, ticks: 0, cups: 0, prepared: 0, restocked: 0, revenue: 0 });
export const blankStaff = () => ({ crew: {}, staffHistory: {}, counter: 0, staffNotice: '' });
export const staffCanPrep = (state, hour) => Object.values(state.crew).some(worker =>
  staffOnShift(worker, hour) && worker.role !== 'serve');

export function validSchedule(id, role, start, end) {
  if (!Object.hasOwn(applicants, id) || !Object.hasOwn(roles, role)) return false;
  const person = applicants[id];
  return Number.isInteger(start) && Number.isInteger(end) && start >= person.start && end <= person.end && end - start >= 2;
}
