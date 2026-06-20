// ================================
// 大陆风云 - 音频管理
// ================================

export class AudioManager {
  constructor() {
    this.audioContext = null;
    this.masterVolume = 0.7;
    this.musicVolume = 0.5;
    this.sfxVolume = 0.8;
    
    this.bgmGain = null;
    this.sfxGain = null;
    
    this.currentBgm = null;
    this.bgmSource = null;
    
    this.sounds = {};
    
    this.initialized = false;
  }
  
  // 初始化音频上下文
  init() {
    if (this.initialized) return;
    
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // 创建主增益节点
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.masterVolume;
      this.masterGain.connect(this.audioContext.destination);
      
      // 创建BGM增益节点
      this.bgmGain = this.audioContext.createGain();
      this.bgmGain.gain.value = this.musicVolume;
      this.bgmGain.connect(this.masterGain);
      
      // 创建SFX增益节点
      this.sfxGain = this.audioContext.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);
      
      this.initialized = true;
    } catch (e) {
      console.warn('音频初始化失败:', e);
    }
  }
  
  // 恢复音频上下文（需要用户交互）
  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
  
  // 播放BGM
  playBgm(url, loop = true) {
    if (!this.initialized) this.init();
    
    // 停止当前BGM
    this.stopBgm();
    
    fetch(url)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        this.currentBgm = audioBuffer;
        
        this.bgmSource = this.audioContext.createBufferSource();
        this.bgmSource.buffer = audioBuffer;
        this.bgmSource.loop = loop;
        this.bgmSource.connect(this.bgmGain);
        this.bgmSource.start();
      })
      .catch(err => {
        console.warn('无法播放BGM:', err);
      });
  }
  
  // 停止BGM
  stopBgm() {
    if (this.bgmSource) {
      try {
        this.bgmSource.stop();
      } catch (e) {
        // 忽略
      }
      this.bgmSource = null;
    }
  }
  
  // 播放音效
  playSfx(url) {
    if (!this.initialized) this.init();
    
    fetch(url)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.sfxGain);
        source.start();
      })
      .catch(err => {
        console.warn('无法播放音效:', err);
      });
  }
  
  // 播放音调（简单合成）
  playTone(frequency, duration, type = 'square', volume = 0.3) {
    if (!this.initialized) this.init();
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    
    gainNode.gain.value = volume;
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + duration
    );
    
    oscillator.connect(gainNode);
    gainNode.connect(this.sfxGain);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + duration);
  }
  
  // 播放点击音效
  playClickSound() {
    this.playTone(800, 0.05, 'square', 0.2);
  }
  
  // 播放攻击音效
  playAttackSound() {
    this.playTone(200, 0.1, 'sawtooth', 0.3);
    setTimeout(() => this.playTone(150, 0.08, 'square', 0.2), 50);
  }
  
  // 播放受伤音效
  playHurtSound() {
    this.playTone(300, 0.1, 'sawtooth', 0.25);
    this.playTone(200, 0.15, 'square', 0.2);
  }
  
  // 播放拾取音效
  playPickupSound() {
    this.playTone(600, 0.05, 'square', 0.2);
    setTimeout(() => this.playTone(800, 0.05, 'square', 0.2), 50);
    setTimeout(() => this.playTone(1000, 0.08, 'square', 0.15), 100);
  }
  
  // 播放金币音效
  playCoinSound() {
    this.playTone(1200, 0.05, 'square', 0.15);
    setTimeout(() => this.playTone(1400, 0.08, 'square', 0.1), 60);
  }
  
  // 播放胜利音效
  playVictorySound() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'square', 0.2), i * 100);
    });
  }
  
  // 播放失败音效
  playDefeatSound() {
    const notes = [400, 350, 300, 250];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.3, 'sawtooth', 0.2), i * 150);
    });
  }
  
  // 设置主音量
  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.masterVolume;
    }
  }
  
  // 设置BGM音量
  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.bgmGain) {
      this.bgmGain.gain.value = this.musicVolume;
    }
  }
  
  // 设置音效音量
  setSfxVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    if (this.sfxGain) {
      this.sfxGain.gain.value = this.sfxVolume;
    }
  }
  
  // 静音切换
  toggleMute() {
    if (this.masterGain) {
      this.masterVolume = this.masterGain.gain.value > 0 ? 0 : 0.7;
      this.masterGain.gain.value = this.masterVolume;
    }
  }
}
