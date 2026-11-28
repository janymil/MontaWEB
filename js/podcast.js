// Article audio player. One <audio>, two control sets: the hero card and a mini
// player that appears once playback has started and the card is off-screen
// (docked in the sticky contents sidebar on desktop, bottom bar on mobile).
(() => {
    const card = document.querySelector('[data-pod]');
    if (!card) return;
    const audio = card.querySelector('audio');
    const mini = document.querySelector('[data-pod-mini]');
    const toc = document.querySelector('.toc');
    const speeds = [1, 1.25, 1.5, 0.75];
    const fmt = (s) => {
        if (!Number.isFinite(s)) return '0:00';
        s = Math.max(0, Math.floor(s));
        return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    };
    const total = Number(card.dataset.duration) || 0;
    const start = Number(card.dataset.start) || 0;
    const roots = [card, mini].filter(Boolean);
    const all = (sel) => roots.flatMap((r) => [...r.querySelectorAll(sel)]);

    let started = false;
    let cardVisible = true;

    function syncPlay() {
        const playing = !audio.paused;
        for (const b of all('[data-pod-play]')) {
            b.setAttribute('aria-label', playing ? 'Pausar el audio' : 'Escuchar el audio');
            b.innerHTML = `<i class="fas fa-${playing ? 'pause' : 'play'}" aria-hidden="true"></i>`;
        }
    }
    function syncTime() {
        const dur = Number.isFinite(audio.duration) ? audio.duration : total;
        // Pages that start at a segment show that position until playback begins.
        const now = !started && start && audio.currentTime === 0 ? start : audio.currentTime;
        const pct = dur ? (now / dur) * 100 : 0;
        for (const r of all('[data-pod-seek]')) {
            if (document.activeElement !== r) r.value = pct;
            r.style.setProperty('--val', r.value);
            r.setAttribute('aria-valuetext', `${fmt(now)} de ${fmt(dur)}`);
        }
        for (const t of all('[data-pod-cur]')) t.textContent = fmt(now);
        for (const t of all('[data-pod-dur]')) t.textContent = fmt(dur);
    }
    function syncMini() {
        if (!mini) return;
        const on = started && !cardVisible;
        mini.classList.toggle('is-on', on);
        mini.hidden = !on;
        document.body.classList.toggle('has-pod-mini', on && !mini.closest('.toc'));
    }
    function placeMini() {
        if (!mini || !toc) return;
        const desktop = window.matchMedia('(min-width: 1041px)').matches;
        if (desktop && mini.parentElement !== toc) toc.prepend(mini);
        if (!desktop && mini.parentElement !== document.body) document.body.append(mini);
        syncMini();
    }

    for (const b of all('[data-pod-play]')) {
        b.addEventListener('click', () => (audio.paused ? audio.play() : audio.pause()));
    }
    for (const b of all('[data-pod-back]')) {
        b.addEventListener('click', () => { audio.currentTime = Math.max(0, audio.currentTime - 15); });
    }
    for (const b of all('[data-pod-speed]')) {
        b.addEventListener('click', () => {
            audio.playbackRate = speeds[(speeds.indexOf(audio.playbackRate) + 1) % speeds.length];
            for (const x of all('[data-pod-speed]')) {
                x.textContent = `${String(audio.playbackRate).replace('.', ',')}×`;
                x.setAttribute('aria-label', `Velocidad: ${String(audio.playbackRate).replace('.', ',')} veces`);
            }
        });
    }
    for (const r of all('[data-pod-seek]')) {
        r.addEventListener('input', () => {
            r.style.setProperty('--val', r.value);
            const dur = Number.isFinite(audio.duration) ? audio.duration : total;
            if (dur) audio.currentTime = (r.value / 100) * dur;
        });
    }

    audio.addEventListener('play', () => {
        started = true;
        syncPlay();
        syncMini();
        if (window.gtag) window.gtag('event', 'podcast_play', { podcast: card.dataset.pod });
    });
    audio.addEventListener('pause', syncPlay);
    audio.addEventListener('ended', () => {
        syncPlay();
        if (window.gtag) window.gtag('event', 'podcast_complete', { podcast: card.dataset.pod });
    });
    audio.addEventListener('timeupdate', syncTime);
    audio.addEventListener('loadedmetadata', () => {
        if (start && !started && audio.currentTime === 0) audio.currentTime = start;
        syncTime();
    });

    new IntersectionObserver(([e]) => {
        cardVisible = e.isIntersecting;
        syncMini();
    }).observe(card);
    window.matchMedia('(min-width: 1041px)').addEventListener('change', placeMini);

    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: card.querySelector('.pod__title')?.textContent || document.title,
            artist: 'MontaWeb',
            artwork: [{ src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }],
        });
        navigator.mediaSession.setActionHandler('seekbackward', () => { audio.currentTime = Math.max(0, audio.currentTime - 15); });
        navigator.mediaSession.setActionHandler('seekforward', () => { audio.currentTime += 15; });
    }

    placeMini();
    syncPlay();
    syncTime();
})();
