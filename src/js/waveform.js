import WaveSurfer from 'wavesurfer.js';

let wavesurfer = null;
let isPlaying = false;

export function initWaveform() {
    // Initialiser WaveSurfer
    wavesurfer = WaveSurfer.create({
        container: '#waveform',
        waveColor: '#4B5563',
        progressColor: '#1F2937',
        cursorColor: '#1F2937',
        barWidth: 2,
        barRadius: 3,
        cursorWidth: 1,
        height: 100,
        barGap: 3,
        responsive: true,
    });

    // Gérer le bouton play/pause
    const playPauseBtn = document.getElementById('play-pause');
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', () => {
            if (wavesurfer) {
                wavesurfer.playPause();
                isPlaying = !isPlaying;
                playPauseBtn.textContent = isPlaying ? 'Pause' : 'Jouer';
            }
        });
    }

    // Événement de fin de lecture
    wavesurfer.on('finish', () => {
        isPlaying = false;
        playPauseBtn.textContent = 'Jouer';
    });
}

export function loadPokemonCry(cryUrl) {
    if (wavesurfer) {
        wavesurfer.load(cryUrl);
        isPlaying = false;
        const playPauseBtn = document.getElementById('play-pause');
        if (playPauseBtn) {
            playPauseBtn.textContent = 'Jouer';
        }
    }
}

export function destroyWaveform() {
    if (wavesurfer) {
        wavesurfer.destroy();
        wavesurfer = null;
    }
} 