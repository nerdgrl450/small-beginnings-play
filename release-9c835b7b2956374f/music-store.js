const DATABASE = 'small-beginnings-music';
const MIB = 1024 * 1024;
export const FILE_LIMIT = 20 * MIB;
export const LIBRARY_LIMIT = 180 * MIB;
export const TRACK_LIMIT = 200;
export const PLAYLIST_LIMIT = 30;
export const emptyLibrary = () => ({ tracks: [], playlists: [] });

export function openMusic() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('library');
      request.result.createObjectStore('audio');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Close the other game window and reopen Music Box.'));
  });
}

export function readMusic(db, store, key) {
  return new Promise((resolve, reject) => {
    const request = db.transaction(store).objectStore(store).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function writeMusic(db, change) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['library', 'audio'], 'readwrite');
    const metadata = tx.objectStore('library');
    const current = metadata.get('catalog');
    let library;
    let failure;
    current.onsuccess = () => {
      try {
        library = current.result ?? emptyLibrary();
        change(library, tx.objectStore('audio'));
        metadata.put(library, 'catalog');
      } catch (error) {
        failure = error;
        tx.abort();
      }
    };
    tx.oncomplete = () => resolve(library);
    tx.onabort = () => reject(failure ?? tx.error ?? new Error('The music change was interrupted.'));
  });
}

export const librarySize = library => library.tracks.reduce((total, track) => total + track.size, 0);

export async function identifyMp3(file) {
  if (!file.size) throw new Error(file.name + ' is empty.');
  if (file.size > FILE_LIMIT) throw new Error(file.name + ' is over the 20 MB per-song limit.');
  const header = new Uint8Array(await file.slice(0, 10).arrayBuffer());
  const tag = header.length === 10 && header[0] === 73 && header[1] === 68 && header[2] === 51;
  const start = tag ? 10 + header.slice(6, 10).reduce((size, byte) => size * 128 + (byte & 127), 0) : 0;
  const bytes = new Uint8Array(await file.slice(start, start + 4096).arrayBuffer());
  const frame = bytes.some((byte, i) => byte === 255 && (bytes[i + 1] & 230) === 226 &&
    (bytes[i + 1] & 24) !== 8 && (bytes[i + 2] >> 4) > 0 && (bytes[i + 2] >> 4) < 15 &&
    (bytes[i + 2] & 12) !== 12);
  if (!frame) throw new Error(file.name + ' could not be read as an MP3.');
  return { title: file.name.replace(/\.mp3$/i, '').trim().slice(0, 120) || 'Untitled song', size: file.size };
}
