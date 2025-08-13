class MP3Player {
  constructor() {
    this.audio = document.getElementById('audioPlayer');
    this.currentTrackIndex = 0;
    this.isPlaying = false;
    this.isPaused = false;
    this.volume = 0.5;
    this.playlist = [];
    this.shuffle = false;
    this.repeat = false;
    
    this.initializeWebAudio();
    this.initializeAudioEvents();
    this.initializeElements();
  }

  initializeElements() {
    this.timeDisplay = document.getElementById('timeDisplay');
    this.trackTitle = document.getElementById('trackTitle');
    this.trackArtist = document.getElementById('trackArtist');
    this.progressBar = document.getElementById('progressBar');
    this.volumeSlider = document.getElementById('volumeSlider');
    
    this.audio.volume = this.volume;
    this.volumeSlider.value = this.volume * 100;
  }

  initializeWebAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.source = null;
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = this.volume;
      
      // EQ will be initialized by EqualizerManager
      this.eqFilters = [];
      
      console.log('Web Audio API initialized');
    } catch (error) {
      console.error('Web Audio API not supported:', error);
      this.audioContext = null;
    }
  }

  setupAudioChain() {
    if (!this.audioContext) return;

    try {
      // Reset source if it already exists
      if (this.source) {
        this.source.disconnect();
        this.source = null;
      }

      // Create source from audio element
      this.source = this.audioContext.createMediaElementSource(this.audio);
      
      // Connect through the processing chain: Source -> EQ -> Retro -> Gain -> Output
      this.connectProcessingChain();
      
      console.log('Audio chain connected');
    } catch (error) {
      console.error('Error setting up audio chain:', error);
    }
  }

  connectProcessingChain() {
    if (!this.source) return;

    try {
      // Only disconnect the source and gain nodes - let EQ/Retro handle their own internal connections
      this.source.disconnect();
      this.gainNode.disconnect();
    } catch (e) {
      // Ignore disconnect errors - nodes might not be connected yet
    }

    let currentNode = this.source;
    
    // Connect to EQ if available
    if (window.equalizerManager && window.equalizerManager.inputNode) {
      currentNode.connect(window.equalizerManager.inputNode);
      currentNode = window.equalizerManager.outputNode;
    }
    
    // Connect to Retro Mode if available
    if (window.retroMode && window.retroMode.inputNode) {
      currentNode.connect(window.retroMode.inputNode);
      window.retroMode.ensureConnection(); // Ensure retro internal chain is connected
      currentNode = window.retroMode.outputNode;
    }
    
    // Final connection to gain and output
    currentNode.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);
  }

  initializeAudioEvents() {
    this.audio.addEventListener('loadedmetadata', () => {
      this.updateProgressMax();
    });

    this.audio.addEventListener('timeupdate', () => {
      this.updateProgress();
    });

    this.audio.addEventListener('ended', () => {
      this.handleTrackEnd();
    });

    this.audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      this.updateDisplay('Error loading file', 'MP3 Player');
    });

    this.audio.addEventListener('canplay', () => {
      this.updateProgressMax();
    });
  }

  loadTrack(filePath, trackInfo) {
    return new Promise((resolve, reject) => {
      if (!filePath || !filePath.endsWith('.mp3')) {
        reject(new Error('Invalid MP3 file'));
        return;
      }

      this.audio.src = `file://${filePath}`;
      this.currentTrack = trackInfo;
      
      // Reset audio chain for new track
      if (this.audioContext) {
        this.setupAudioChain();
      }
      
      this.audio.addEventListener('loadeddata', () => {
        this.updateDisplay(trackInfo.title, trackInfo.artist);
        resolve();
      }, { once: true });

      this.audio.addEventListener('error', () => {
        reject(new Error('Failed to load audio file'));
      }, { once: true });
    });
  }

  play() {
    if (this.audio.src && this.audio.readyState >= 2) {
      // Resume audio context if suspended
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      
      // Set up audio chain if not already done
      if (this.audioContext && !this.source) {
        this.setupAudioChain();
      }
      
      this.audio.play()
        .then(() => {
          this.isPlaying = true;
          this.isPaused = false;
        })
        .catch(error => {
          console.error('Playback failed:', error);
        });
    }
  }

  pause() {
    this.audio.pause();
    this.isPlaying = false;
    this.isPaused = true;
  }

  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.isPlaying = false;
    this.isPaused = false;
    this.updateProgress();
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.audio.volume = this.volume;
    
    // Also update Web Audio API gain node
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume;
    }
  }

  seek(position) {
    if (this.audio.duration) {
      this.audio.currentTime = (position / 100) * this.audio.duration;
    }
  }

  updateProgress() {
    if (this.audio.duration) {
      const progress = (this.audio.currentTime / this.audio.duration) * 100;
      this.progressBar.value = progress;
      
      const currentTime = this.formatTime(this.audio.currentTime);
      const duration = this.formatTime(this.audio.duration);
      this.timeDisplay.textContent = `${currentTime}/${duration}`;
    } else {
      this.timeDisplay.textContent = '00:00';
    }
  }

  updateProgressMax() {
    if (this.audio.duration && !isNaN(this.audio.duration)) {
      this.progressBar.max = 100;
    }
  }

  updateDisplay(title, artist) {
    this.trackTitle.textContent = title || 'Unknown Title';
    this.trackArtist.textContent = artist || '';
  }

  formatTime(seconds) {
    if (isNaN(seconds) || !isFinite(seconds)) return '00:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  handleTrackEnd() {
    if (this.repeat && this.playlist.length > 0) {
      this.play();
    } else if (this.playlist.length > 1) {
      this.nextTrack();
    } else {
      this.stop();
      this.isPlaying = false;
      this.isPaused = false;
    }
  }

  nextTrack() {
    if (this.playlist.length === 0) return;

    if (this.shuffle) {
      this.currentTrackIndex = Math.floor(Math.random() * this.playlist.length);
    } else {
      this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
    }

    const track = this.playlist[this.currentTrackIndex];
    this.loadTrack(track.path, track)
      .then(() => {
        if (this.isPlaying) {
          this.play();
        }
      })
      .catch(error => {
        console.error('Error loading next track:', error);
      });
  }

  previousTrack() {
    if (this.playlist.length === 0) return;

    if (this.audio.currentTime > 3) {
      this.audio.currentTime = 0;
      return;
    }

    if (this.shuffle) {
      this.currentTrackIndex = Math.floor(Math.random() * this.playlist.length);
    } else {
      this.currentTrackIndex = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
    }

    const track = this.playlist[this.currentTrackIndex];
    this.loadTrack(track.path, track)
      .then(() => {
        if (this.isPlaying) {
          this.play();
        }
      })
      .catch(error => {
        console.error('Error loading previous track:', error);
      });
  }

  toggleShuffle() {
    this.shuffle = !this.shuffle;
    return this.shuffle;
  }

  toggleRepeat() {
    this.repeat = !this.repeat;
    return this.repeat;
  }

  addToPlaylist(tracks) {
    if (Array.isArray(tracks)) {
      this.playlist.push(...tracks);
    } else {
      this.playlist.push(tracks);
    }
  }

  clearPlaylist() {
    this.playlist = [];
    this.currentTrackIndex = 0;
  }

  getCurrentTrack() {
    return this.playlist[this.currentTrackIndex] || null;
  }
}

window.player = new MP3Player();