import { initialState, validState } from './engine.js';

const DB_NAME = 'small-beginnings';
const STORE = 'saves';
const FORMAT = 'small-beginnings-save';

export class SaveConflict extends Error {}
const validRecord = (record) => Number.isSafeInteger(record?.revision) && record.revision >= 1 && validState(record.state);
const makeRecord = (state, revision) => ({ state, revision, savedAt: new Date().toISOString() });

export async function openSave() {
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Close the other game tab and try again.'));
  });
  db.onversionchange = () => db.close();
  return db;
}

// Read, verify and write both snapshots inside one IndexedDB transaction.
function transact(db, mutate) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const current = store.get('current');
    const previous = store.get('previous');
    let output;
    let failure;
    previous.onsuccess = () => {
      try {
        output = mutate(store, current.result, previous.result);
      } catch (error) {
        failure = error;
        tx.abort();
      }
    };
    tx.oncomplete = () => resolve(output);
    tx.onabort = () => reject(failure ?? tx.error ?? new Error('The save was interrupted.'));
  });
}

export function loadSave(db) {
  return transact(db, (store, current, previous) => {
    if (validRecord(current)) return { ...current, hasPrevious: validRecord(previous) };
    if (validRecord(previous)) {
      const restored = makeRecord(previous.state, previous.revision + 1);
      store.put(restored, 'current');
      return { ...restored, hasPrevious: true, recovered: true };
    }
    if (current || previous) throw new Error('The local save could not be read. You can import a backup.');
    const first = makeRecord(initialState(), 1);
    store.put(first, 'current');
    return { ...first, hasPrevious: false };
  });
}

export function commitSave(db, expectedRevision, state, mode = 'normal') {
  return transact(db, (store, current, previous) => {
    const currentValid = validRecord(current);
    if (currentValid && current.revision !== expectedRevision) throw new SaveConflict();
    if (!currentValid && mode !== 'import') throw new SaveConflict();

    const nextState = mode === 'restore' ? previous?.state : state;
    if (!validState(nextState)) throw new Error('The save format is invalid.');
    const revision = currentValid ? current.revision + 1 : 1;
    const next = makeRecord(nextState, revision);
    if (currentValid) store.put(current, 'previous');
    else store.delete('previous');
    store.put(next, 'current');
    return { ...next, hasPrevious: currentValid };
  });
}

export function exportSave(state) {
  return JSON.stringify({ format: FORMAT, exportedAt: new Date().toISOString(), state }, null, 2);
}

export function importSave(text) {
  const value = JSON.parse(text);
  if (value?.format !== FORMAT || !validState(value.state)) {
    throw new Error('Choose a valid Small Beginnings save file.');
  }
  return value.state;
}
