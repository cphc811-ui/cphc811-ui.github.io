document.addEventListener('DOMContentLoaded', () => {
  const tubes = Array.from(
    document.querySelectorAll('.faulty-neon-title .tube')
  );

  function triggerVoltageSag() {
    if (!tubes.length) return;

    const count = Math.floor(Math.random() * 2) + 1;

    for (let i = 0; i < count; i++) {
      const targetTube =
        tubes[Math.floor(Math.random() * tubes.length)];

      if (!targetTube.classList.contains('neon-dead')) {
        targetTube.classList.add('dead-tube');

        playSparkSound();

        const duration =
          Math.floor(Math.random() * 250) + 80;

        setTimeout(() => {
          targetTube.classList.remove('dead-tube');
        }, duration);
      }
    }

    const nextInterval =
      Math.floor(Math.random() * 2700) + 1800;

    setTimeout(triggerVoltageSag, nextInterval);
  }

  setTimeout(triggerVoltageSag, 2000);

  let audioCtx = null;
  let isPlaying = false;

  let humOsc1 = null;
  let humOsc2 = null;
  let droneSub = null;
  let masterGain = null;

  const audioBtn = document.getElementById('audio-btn');

  function updateAudioButton(active) {
    if (!audioBtn) return;

    audioBtn.textContent = active
      ? '[ AUDIO: NEON BALLAST ACTIVE ]'
      : '[ AUDIO: OFF ]';

    audioBtn.style.color = active
      ? '#50fa7b'
      : 'var(--neon-red-glow)';

    audioBtn.style.borderColor = active
      ? '#50fa7b'
      : 'rgba(255, 8, 56, 0.35)';
  }

  async function initNeonAtmosphere() {
    if (isPlaying) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    try {
      if (!audioCtx) {
        audioCtx = new AudioContext();

        masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);

        humOsc1 = audioCtx.createOscillator();
        humOsc1.type = 'sawtooth';
        humOsc1.frequency.setValueAtTime(60, audioCtx.currentTime);

        humOsc2 = audioCtx.createOscillator();
        humOsc2.type = 'sawtooth';
        humOsc2.frequency.setValueAtTime(120, audioCtx.currentTime);

        droneSub = audioCtx.createOscillator();
        droneSub.type = 'sine';
        droneSub.frequency.setValueAtTime(45, audioCtx.currentTime);

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(220, audioCtx.currentTime);
        filter.Q.setValueAtTime(3, audioCtx.currentTime);

        humOsc1.connect(filter);
        humOsc2.connect(filter);
        droneSub.connect(filter);
        filter.connect(masterGain);
        masterGain.connect(audioCtx.destination);

        humOsc1.start();
        humOsc2.start();
        droneSub.start();
      }

      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      if (audioCtx.state !== 'running') {
        updateAudioButton(false);
        return;
      }

      masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
      masterGain.gain.setValueAtTime(
        Math.max(masterGain.gain.value, 0.0001),
        audioCtx.currentTime
      );
      masterGain.gain.exponentialRampToValueAtTime(
        0.14,
        audioCtx.currentTime + 2.5
      );

      isPlaying = true;
      updateAudioButton(true);
    } catch (e) {
      isPlaying = false;
      updateAudioButton(false);
    }
  }

  function stopNeonAtmosphere() {
    if (!audioCtx) return;

    try {
      if (masterGain && audioCtx.state === 'running') {
        masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
        masterGain.gain.setValueAtTime(
          Math.max(masterGain.gain.value, 0.0001),
          audioCtx.currentTime
        );
        masterGain.gain.exponentialRampToValueAtTime(
          0.0001,
          audioCtx.currentTime + 0.35
        );
      }

      setTimeout(() => {
        try {
          if (humOsc1) humOsc1.stop();
          if (humOsc2) humOsc2.stop();
          if (droneSub) droneSub.stop();
        } catch (e) {}

        if (humOsc1) humOsc1.disconnect();
        if (humOsc2) humOsc2.disconnect();
        if (droneSub) droneSub.disconnect();

        if (audioCtx) audioCtx.close();

        humOsc1 = null;
        humOsc2 = null;
        droneSub = null;
        masterGain = null;
        audioCtx = null;
      }, 400);
    } catch (e) {
      audioCtx.close();
      audioCtx = null;
    }

    isPlaying = false;
    updateAudioButton(false);
  }

  function playSparkSound() {
    if (!isPlaying || !audioCtx || audioCtx.state !== 'running') return;

    try {
      const sparkOsc = audioCtx.createOscillator();
      const sparkGain = audioCtx.createGain();

      sparkOsc.type = 'square';
      sparkOsc.frequency.setValueAtTime(
        Math.floor(Math.random() * 800) + 400,
        audioCtx.currentTime
      );

      sparkGain.gain.setValueAtTime(0.03, audioCtx.currentTime);
      sparkGain.gain.exponentialRampToValueAtTime(
        0.0001,
        audioCtx.currentTime + 0.04
      );

      sparkOsc.connect(sparkGain);
      sparkGain.connect(audioCtx.destination);

      sparkOsc.start();
      sparkOsc.stop(audioCtx.currentTime + 0.05);
    } catch (e) {}
  }

  if (audioBtn) {
    audioBtn.addEventListener('click', () => {
      if (isPlaying) {
        stopNeonAtmosphere();
      } else {
        initNeonAtmosphere();
      }
    });
  }

  initNeonAtmosphere();

  const resumeAudio = () => {
    if (!isPlaying) initNeonAtmosphere();
  };

  ['pointerdown', 'keydown', 'touchstart'].forEach((eventName) => {
    window.addEventListener(eventName, resumeAudio, { once: true, passive: true });
  });

  document.addEventListener('visibilitychange', () => {
    if (!audioCtx || !isPlaying) return;

    if (document.visibilityState === 'visible') {
      initNeonAtmosphere();
    }
  });
  const discordBtn = document.querySelector('.join-discord');

  if (discordBtn) {
    discordBtn.addEventListener('click', (event) => {
      event.preventDefault();

      const userId = discordBtn.dataset.discordId;
      const webUrl = `https://discord.com/users/${userId}`;
      const appUrl = `discord://-/users/${userId}`;
      let appOpened = false;

      const markOpened = () => {
        appOpened = true;
      };

      window.addEventListener('blur', markOpened, { once: true });
      window.location.href = appUrl;

      setTimeout(() => {
        if (!appOpened && document.visibilityState === 'visible') {
          window.location.href = webUrl;
        }
      }, 900);
    });
  }

});
