import { icon } from './icons.js';
import { musicAudio } from './music-audio.js';
import { emptyLibrary, openMusic, readMusic, writeMusic, identifyMp3, librarySize, LIBRARY_LIMIT, TRACK_LIMIT, PLAYLIST_LIMIT } from './music-store.js';

const PREFS = 'small-beginnings-music-settings';
const repeatModes = ['off', 'playlist', 'song'];
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
const mb = bytes => (bytes / (1024 * 1024)).toFixed(1);
const timestamp = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
const shuffle = ids => {
  const mixed = [...ids];
  for (let index = mixed.length - 1; index > 0; index -= 1) {
    const next = Math.floor(Math.random() * (index + 1));
    [mixed[index], mixed[next]] = [mixed[next], mixed[index]];
  }
  return mixed;
};

export function setupMusic() {
  const dialog = document.querySelector('#music-dialog');
  const opener = document.querySelector('#open-music');
  const player = dialog.querySelector('.music-player');
  const libraryView = dialog.querySelector('.music-library');
  const files = dialog.querySelector('#music-files');
  const replaceFile = dialog.querySelector('#music-replacement');
  const notice = dialog.querySelector('.music-notice');
  const volume = dialog.querySelector('#music-volume');
  let db;
  let library = emptyLibrary();
  let playlist = '';
  let track = '';
  let repeat = 'off';
  let random = false;
  let order = [];
  let replacing;
  let busy = false;
  let position = 0;
  let persistAt = 0;
  const names = () => library.tracks.map(item => item.id);
  const currentPlaylist = () => library.playlists.find(item => item.id === playlist);
  const playlistTracks = () => currentPlaylist()?.tracks ?? names();
  const selected = () => library.tracks.find(item => item.id === track);

  try {
    const saved = JSON.parse(localStorage.getItem(PREFS)) ?? {};
    playlist = typeof saved.playlist === 'string' ? saved.playlist : '';
    track = typeof saved.track === 'string' ? saved.track : '';
    repeat = repeatModes.includes(saved.repeat) ? saved.repeat : 'off';
    random = saved.random === true;
    position = Number.isFinite(saved.position) && saved.position > 0 ? saved.position : 0;
    if (Number.isFinite(saved.volume)) volume.value = Math.max(0, Math.min(100, saved.volume));
  } catch { /* Defaults are available when preferences cannot be read. */ }

  function persist() {
    try {
      localStorage.setItem(PREFS, JSON.stringify({ playlist, track, repeat, random, position: audio.position(), volume: Number(volume.value) }));
    } catch { /* Playback can continue without saving preferences. */ }
  }

  function rebuildOrder() {
    const ids = playlistTracks();
    order = random ? [...ids.filter(id => id === track), ...shuffle(ids.filter(id => id !== track))] : [...ids];
  }

  function updateClock() {
    const time = audio.position();
    player.querySelector('.music-time').textContent = audio.duration ? `${timestamp(time)} / ${timestamp(audio.duration)}` : '';
  }

  function renderPlayer() {
    const item = selected();
    player.querySelector('.music-title').textContent = item?.title ?? 'No song selected';
    player.querySelector('.music-collection').textContent = currentPlaylist()?.title ?? 'All songs';
    const toggle = player.querySelector('[data-music="play"]');
    const playing = audio.playing;
    const label = playing ? 'Pause' : 'Play';
    toggle.disabled = !item;
    toggle.setAttribute('aria-label', audio.loading ? 'Cancel loading' : label);
    toggle.innerHTML = audio.loading ? '…' : icon(playing ? 'pause' : 'play');
    player.querySelector('[data-music="shuffle"]').setAttribute('aria-pressed', random);
    player.querySelector('[data-music="repeat"]').textContent = repeat === 'off' ? 'Repeat off' : repeat === 'song' ? 'Repeat song' : 'Repeat playlist';
    for (const key of ['next', 'previous']) player.querySelector(`[data-music="${key}"]`).disabled = !item;
    opener.classList.toggle('music-playing', playing);
    for (const song of libraryView.querySelectorAll('[data-music="song"]')) {
      if (song.dataset.id === track) song.setAttribute('aria-current', 'true');
      else song.removeAttribute('aria-current');
    }
    updateClock();
  }

  const button = (action, label, id = '') =>
    `<button type="button" class="button secondary music-small" data-music="${action}" data-id="${id}">${label}</button>`;

  function renderLibrary() {
    const active = currentPlaylist();
    const songs = playlistTracks().map(id => library.tracks.find(item => item.id === id)).filter(Boolean);
    libraryView.innerHTML = `
      <div class="music-library-heading">
        <label for="music-playlist">Playlist</label>
        <select id="music-playlist">
          <option value="">All songs</option>
          ${library.playlists.map(item => `<option value="${item.id}" ${playlist === item.id ? 'selected' : ''}>${escape(item.title)}</option>`).join('')}
        </select>
        ${active ? button('delete-playlist', 'Delete playlist') : ''}
      </div>
      <form class="music-new"><input name="title" aria-label="New playlist name" placeholder="New playlist name" required maxlength="60">
        <button class="button secondary" type="submit">Create</button></form>
      <div class="music-import">
        ${button('import', 'Add MP3s')}
        <span>${mb(librarySize(library))} / 180 MB used · 20 MB per song</span>
      </div>
      ${songs.length ? `<ul class="music-songs">${songs.map(item => `
        <li><button type="button" class="music-song" data-music="song" data-id="${item.id}">${escape(item.title)}</button>
          <details><summary aria-label="Options for ${escape(item.title)}">•••</summary><div class="music-song-actions">
          ${active ? button('exclude', 'Take out of playlist', item.id) : ''}
          ${button('replace', 'Replace MP3', item.id)}
          ${button('remove', 'Remove from library', item.id)}
          </div></details>
        </li>`).join('')}</ul>` : `<p class="music-empty">${active ? 'Choose songs below to fill this playlist.' : 'Add MP3s from Files to start listening.'}</p>`}
      ${active && library.tracks.some(item => !active.tracks.includes(item.id)) ? `<form class="music-add-song">
        <label for="music-add-choice">Add a song to ${escape(active.title)}</label>
        <div><select id="music-add-choice" name="song" required>
          <option value="">Choose a song</option>
          ${library.tracks.filter(item => !active.tracks.includes(item.id)).map(item =>
            `<option value="${item.id}">${escape(item.title)}</option>`).join('')}
        </select><button class="button secondary" type="submit">Add</button></div>
      </form>` : ''}`;
    renderPlayer();
  }

  function show(message) {
    notice.textContent = message;
  }

  function select(id, seconds = 0) {
    track = id;
    audio.select(id, seconds);
    renderPlayer();
    persist();
  }

  function play() {
    show('');
    audio.play().catch(error => {
      show(error.name === 'EncodingError' || error.name === 'NotSupportedError'
        ? 'This MP3 could not be decoded. Try replacing it with a fresh copy.' : error.message || 'Tap Play to try again.');
    });
    renderPlayer();
  }

  function advance(direction, auto = false) {
    if (!order.length) return;
    const index = order.indexOf(track);
    if (direction < 0 && audio.position() > 3) {
      const playing = audio.playing;
      select(track);
      if (playing) play();
      return;
    }
    const next = index + direction;
    if (auto && repeat === 'song') {
      select(track);
      play();
    } else if (auto && next >= order.length && repeat === 'off') {
      select(track);
    } else {
      const playing = audio.playing || audio.loading || auto;
      select(order[(next + order.length) % order.length]);
      if (playing) play();
    }
  }

  const audio = musicAudio(id => readMusic(db, 'audio', id), () => {
    renderPlayer();
    persist();
  }, () => advance(1, true));
  audio.setVolume(Number(volume.value) / 100);

  async function ready() {
    if (db) return;
    db = await openMusic();
    library = await readMusic(db, 'library', 'catalog') ?? emptyLibrary();
    if (!currentPlaylist()) playlist = '';
    if (!playlistTracks().includes(track)) {
      track = playlistTracks()[0] ?? '';
      position = 0;
    }
    rebuildOrder();
    audio.select(track, position);
  }

  async function change(mutate, after) {
    if (busy) return;
    busy = true;
    try {
      library = await writeMusic(db, mutate);
      after?.();
      if (!currentPlaylist()) playlist = '';
      if (!playlistTracks().includes(track)) select(playlistTracks()[0] ?? '');
      rebuildOrder();
      renderLibrary();
      persist();
    } catch (error) {
      show(error.name === 'QuotaExceededError' ? 'This device is out of room for music. Remove a song or free some space and try again.' : error.message);
    } finally {
      busy = false;
    }
  }

  async function importFiles(picks, replacingId) {
    if (busy || !picks.length) return;
    const imported = [];
    const rejected = [];
    const destination = playlist;
    const candidates = picks.slice(0, replacingId ? 1 : TRACK_LIMIT);
    let incomingBytes = 0;
    // Process a batch in one transaction so catalog entries and audio stay in sync.
    busy = true;
    show('Reading MP3 files…');
    try {
      for (const file of candidates) {
        try {
          const info = await identifyMp3(file);
          if (incomingBytes + info.size > LIBRARY_LIMIT) {
            return show('This selection is over 180 MB. Pick fewer songs and try again.');
          }
          // Copy bytes out of the picker. Safari can lose access to the original File.
          const bytes = await file.arrayBuffer();
          imported.push({ id: replacingId ?? crypto.randomUUID(), ...info, bytes });
          incomingBytes += info.size;
        } catch (error) {
          rejected.push(error.message);
        }
      }
    } finally {
      busy = false;
    }
    if (!imported.length) return show(rejected[0]);
    await change((catalog, audioStore) => {
      const previous = catalog.tracks.find(item => item.id === replacingId);
      if (replacingId && !previous) throw new Error('That song is no longer in the library.');
      const total = librarySize(catalog) - (previous?.size ?? 0) + incomingBytes;
      if (total > LIBRARY_LIMIT || catalog.tracks.length - Number(Boolean(previous)) + imported.length > TRACK_LIMIT) {
        throw new Error('Music Box holds up to 180 MB or 200 songs. Pick fewer files or remove a song, then try again.');
      }
      const list = catalog.playlists.find(item => item.id === destination);
      for (const { bytes, ...item } of imported) {
        if (previous) Object.assign(previous, item);
        else catalog.tracks.push(item);
        audioStore.put(bytes, item.id);
        if (list && !previous) list.tracks.push(item.id);
      }
    }, () => {
      if (replacingId === track) {
        audio.select('');
        select(track);
      }
      const skipped = rejected.length + picks.length - candidates.length;
      show(replacingId ? 'Song replaced.' : `Added ${imported.length} ${imported.length === 1 ? 'song' : 'songs'}.${skipped ? ' Skipped ' + skipped + ' files.' : ''}`);
    });
  }

  opener.addEventListener('click', async () => {
    dialog.showModal();
    try {
      await ready();
      renderLibrary();
    } catch {
      db = null;
      show('Local music storage is unavailable. Try reopening the game in Safari.');
    }
  });
  dialog.addEventListener('click', event => {
    const control = event.target.closest('[data-music]');
    if (!control || !db) return;
    const { music: action, id } = control.dataset;
    if (action === 'play') {
      if (audio.playing || audio.loading) audio.pause();
      else play();
    } else if (action === 'song') {
      select(id);
      if (random) rebuildOrder();
      play();
    } else if (action === 'next' || action === 'previous') advance(action === 'next' ? 1 : -1);
    else if (action === 'shuffle' || action === 'repeat') {
      if (action === 'shuffle') {
        random = !random;
        rebuildOrder();
      } else repeat = repeatModes[(repeatModes.indexOf(repeat) + 1) % repeatModes.length];
      renderPlayer();
      persist();
    } else if (action === 'import') {
      void navigator.storage?.persist?.().catch(() => {});
      files.click();
    } else if (action === 'replace') {
      replacing = id;
      replaceFile.click();
    } else if (action === 'exclude') {
      void change(catalog => {
        const list = catalog.playlists.find(item => item.id === playlist);
        if (list) list.tracks = list.tracks.filter(song => song !== id);
      }, () => show('Song taken out of this playlist.'));
    } else if (action === 'delete-playlist' && window.confirm(`Delete “${currentPlaylist()?.title}”?`)) {
      void change(catalog => {
        catalog.playlists = catalog.playlists.filter(item => item.id !== playlist);
      }, () => { playlist = ''; show('Playlist deleted.'); });
    } else if (action === 'remove' && window.confirm(`Remove “${library.tracks.find(item => item.id === id)?.title}” from Music Box?`)) {
      void change((catalog, audioStore) => {
        catalog.tracks = catalog.tracks.filter(item => item.id !== id);
        for (const list of catalog.playlists) list.tracks = list.tracks.filter(song => song !== id);
        audioStore.delete(id);
      }, () => show('Song removed from the library.'));
    }
  });

  files.addEventListener('change', () => {
    const picks = [...files.files];
    files.value = '';
    void importFiles(picks);
  });
  replaceFile.addEventListener('change', () => {
    const picks = [...replaceFile.files];
    replaceFile.value = '';
    if (replacing) void importFiles(picks, replacing);
    replacing = undefined;
  });
  volume.addEventListener('input', () => {
    audio.setVolume(Number(volume.value) / 100);
    persist();
  });
  libraryView.addEventListener('change', event => {
    if (event.target.id !== 'music-playlist') return;
    playlist = event.target.value;
    if (!playlistTracks().includes(track)) select(playlistTracks()[0] ?? '');
    rebuildOrder();
    renderLibrary();
    persist();
  });
  libraryView.addEventListener('submit', event => {
    event.preventDefault();
    const form = event.target;
    const fields = new FormData(form);
    if (form.matches('.music-new')) {
      const title = fields.get('title')?.trim();
      if (!title) return show('Give the playlist a name.');
      const id = crypto.randomUUID();
      void change(catalog => {
        if (catalog.playlists.length >= PLAYLIST_LIMIT) throw new Error('Music Box holds up to 30 playlists.');
        catalog.playlists.push({ id, title, tracks: [] });
      }, () => { playlist = id; show('Playlist created.'); });
    } else if (form.matches('.music-add-song')) {
      const id = fields.get('song');
      void change(catalog => {
        const list = catalog.playlists.find(item => item.id === playlist);
        if (list && catalog.tracks.some(item => item.id === id) && !list.tracks.includes(id)) list.tracks.push(id);
      }, () => show('Song added to playlist.'));
    }
  });

  setInterval(() => {
    if (dialog.open && audio.playing) updateClock();
    if (audio.playing && Date.now() - persistAt > 4000) {
      persistAt = Date.now();
      persist();
    }
  }, 500);
  document.addEventListener('visibilitychange', () => { if (db && document.hidden) persist(); });
  window.addEventListener('pagehide', () => { if (db) persist(); });
}
