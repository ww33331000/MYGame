export class AudioManager {
    constructor() {
        this.sounds = {};
        this.music = null;
        this.musicVolume = 0.5;
        this.sfxVolume = 0.7;
        this.muted = false;

        this.init();
    }

    init() {
        this.sounds = {
            click: { frequency: 800, duration: 0.1, type: 'square' },
            success: { frequency: 1200, duration: 0.2, type: 'sine' },
            error: { frequency: 200, duration: 0.3, type: 'sawtooth' },
            battle: { frequency: 150, duration: 0.5, type: 'square' }
        };
    }

    playSound(name) {
        if (this.muted || !this.sounds[name]) return;

        const sound = this.sounds[name];
        this.playTone(sound.frequency, sound.duration, sound.type);
    }

    playTone(frequency, duration, type = 'sine') {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.type = type;
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

            gainNode.gain.setValueAtTime(this.sfxVolume * 0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        } catch (e) {
            console.warn('Audio not supported');
        }
    }

    playMusic(name) {
        this.stopMusic();
    }

    stopMusic() {
        if (this.music) {
            this.music.pause();
            this.music = null;
        }
    }

    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.music) {
            this.music.volume = this.musicVolume;
        }
    }

    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }

    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }
}
