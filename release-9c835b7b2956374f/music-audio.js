// A single Web Audio graph keeps volume control available on iPhone.
export function musicAudio(load, changed, ended) {
  let context;
  let gain;
  let source;
  let buffer;
  let track;
  let offset = 0;
  let startedAt = 0;
  let generation = 0;
  let pending = false;
  let queue = Promise.resolve();
  let volume = 0.6;

  const position = () => offset + (source ? context.currentTime - startedAt : 0);
  const stop = () => {
    if (!source) return;
    offset = Math.min(position(), buffer.duration);
    source.onended = null;
    source.stop();
    source.disconnect();
    source = null;
  };

  return {
    position,
    get playing() { return Boolean(source); },
    get loading() { return pending; },
    get duration() { return buffer?.duration ?? 0; },
    setVolume(value) {
      volume = value;
      if (gain) gain.gain.value = volume;
    },
    select(id, seconds = 0) {
      generation += 1;
      pending = false;
      stop();
      if (id !== track) buffer = null;
      track = id;
      offset = seconds;
    },
    pause() {
      generation += 1;
      pending = false;
      stop();
      changed();
    },
    async play() {
      if (!track || source || pending) return;
      const token = ++generation;
      const id = track;
      pending = true;
      try {
        if (!context) {
          const AudioContext = window.AudioContext ?? window.webkitAudioContext;
          if (!AudioContext) throw new Error('Audio playback is unavailable in this browser.');
          context = new AudioContext();
          gain = context.createGain();
          gain.gain.value = volume;
          gain.connect(context.destination);
          context.onstatechange = () => {
            // Treat system audio interruptions as a pause so a tap can resume.
            if (source && context.state !== 'running') this.pause();
          };
        }
        // This must happen before awaiting file access so Safari sees the tap.
        await context.resume();
        if (token !== generation) return;
        changed();
        const job = queue.then(async () => {
          if (token !== generation || buffer) return;
          const bytes = await load(id);
          if (!bytes) throw new Error('This song is missing. Replace its MP3 in the library.');
          if (token !== generation) return;
          const decoded = await context.decodeAudioData(bytes);
          if (token === generation) buffer = decoded;
        });
        queue = job.catch(() => {});
        await job;
        if (token !== generation) return;
        if (offset >= buffer.duration) offset = 0;
        source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(gain);
        source.onended = () => {
          source.disconnect();
          source = null;
          offset = 0;
          ended();
        };
        startedAt = context.currentTime;
        source.start(0, offset);
      } catch (error) {
        if (token === generation) throw error;
      } finally {
        if (token === generation) {
          pending = false;
          changed();
        }
      }
    },
  };
}
