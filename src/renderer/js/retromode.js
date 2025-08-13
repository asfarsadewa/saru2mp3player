class RetroMode {
  constructor() {
    this.enabled = false;
    this.audioNodes = {};
    this.noiseBuffer = null;
    this.isConnectedToChain = false;
    this.initializeRetroControls();
  }

  initializeRetroControls() {
    const retroIndicator = document.getElementById('retroIndicator');
    
    if (retroIndicator) {
      retroIndicator.addEventListener('click', () => {
        this.toggleRetroMode();
      });
    }
  }

  initializeAudioNodes() {
    if (!window.player || !window.player.audioContext) {
      setTimeout(() => this.initializeAudioNodes(), 100);
      return;
    }

    const audioContext = window.player.audioContext;

    try {
      // Create audio processing nodes
      this.audioNodes = {
        input: audioContext.createGain(),
        output: audioContext.createGain(),
        
        // Mono conversion (merge channels)
        merger: audioContext.createChannelMerger(1),
        splitter: audioContext.createChannelSplitter(2),
        
        // Frequency limiting (AM radio bandwidth)
        highpass: audioContext.createBiquadFilter(),
        lowpass: audioContext.createBiquadFilter(),
        
        // Distortion
        waveshaper: audioContext.createWaveShaper(),
        
        // Compression
        compressor: audioContext.createDynamicsCompressor(),
        
        // Noise
        noiseGain: audioContext.createGain(),
        
        // Final mix
        mixer: audioContext.createGain()
      };

      this.setupFilters();
      this.setupDistortion();
      this.setupCompression();
      this.createNoiseBuffer();
      
      // Set up initial internal chain based on current enabled state
      this.connectInternalChain();
      
      console.log('Retro Mode audio nodes initialized');
    } catch (error) {
      console.error('Error initializing Retro Mode audio nodes:', error);
    }
  }

  setupFilters() {
    // High-pass filter (remove low frequencies below 300Hz)
    this.audioNodes.highpass.type = 'highpass';
    this.audioNodes.highpass.frequency.value = 300;
    this.audioNodes.highpass.Q.value = 0.7;

    // Low-pass filter (remove high frequencies above 3kHz)
    this.audioNodes.lowpass.type = 'lowpass';
    this.audioNodes.lowpass.frequency.value = 3000;
    this.audioNodes.lowpass.Q.value = 0.7;
  }

  setupDistortion() {
    // Create a soft clipping curve for vintage distortion
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + 20) * x * 20 * deg) / (Math.PI + 20 * Math.abs(x));
    }
    
    this.audioNodes.waveshaper.curve = curve;
    this.audioNodes.waveshaper.oversample = '2x';
  }

  setupCompression() {
    // Heavy compression for that "squashed" radio sound
    this.audioNodes.compressor.threshold.value = -24;
    this.audioNodes.compressor.knee.value = 30;
    this.audioNodes.compressor.ratio.value = 12;
    this.audioNodes.compressor.attack.value = 0.001;
    this.audioNodes.compressor.release.value = 0.25;
  }

  createNoiseBuffer() {
    if (!window.player || !window.player.audioContext) return;

    const audioContext = window.player.audioContext;
    const bufferSize = audioContext.sampleRate * 2; // 2 seconds of noise
    this.noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    
    const output = this.noiseBuffer.getChannelData(0);
    
    // Generate vinyl crackle and static noise
    for (let i = 0; i < bufferSize; i++) {
      // Base pink noise
      let noise = (Math.random() * 2 - 1) * 0.02;
      
      // Add occasional pops and crackles
      if (Math.random() < 0.0001) {
        noise += (Math.random() * 2 - 1) * 0.1;
      }
      
      // Add high-frequency static
      noise += (Math.random() * 2 - 1) * 0.005;
      
      output[i] = noise;
    }
  }

  connectInternalChain() {
    if (!this.audioNodes.input || !this.audioNodes.output) return;

    try {
      // First disconnect only internal nodes (not input/output)
      this.disconnectInternalChain();

      if (this.enabled) {
        // Audio path: input -> splitter -> merger (mono) -> highpass -> lowpass -> waveshaper -> compressor -> mixer -> output
        this.audioNodes.input.connect(this.audioNodes.splitter);
        
        // Connect both channels to mono merger
        this.audioNodes.splitter.connect(this.audioNodes.merger, 0, 0);
        this.audioNodes.splitter.connect(this.audioNodes.merger, 1, 0);
        
        // Filter chain
        this.audioNodes.merger.connect(this.audioNodes.highpass);
        this.audioNodes.highpass.connect(this.audioNodes.lowpass);
        this.audioNodes.lowpass.connect(this.audioNodes.waveshaper);
        this.audioNodes.waveshaper.connect(this.audioNodes.compressor);
        this.audioNodes.compressor.connect(this.audioNodes.mixer);
        
        // Add noise
        this.startNoise();
        this.audioNodes.noiseGain.connect(this.audioNodes.mixer);
        
        // Final output (reduced volume for authenticity)
        this.audioNodes.mixer.gain.value = 0.7;
        this.audioNodes.mixer.connect(this.audioNodes.output);
      } else {
        // Bypass: direct connection input -> output
        this.stopNoise();
        this.audioNodes.input.connect(this.audioNodes.output);
      }
      
      console.log('Retro internal chain', this.enabled ? 'connected' : 'bypassed');
    } catch (error) {
      console.error('Error connecting retro internal chain:', error);
    }
  }

  disconnectInternalChain() {
    // Only disconnect internal processing nodes, preserve input/output connections to main chain
    const internalNodes = [
      'splitter', 'merger', 'highpass', 'lowpass', 'waveshaper', 
      'compressor', 'mixer', 'noiseGain'
    ];
    
    internalNodes.forEach(nodeName => {
      if (this.audioNodes[nodeName] && this.audioNodes[nodeName].disconnect) {
        try {
          this.audioNodes[nodeName].disconnect();
        } catch (e) {
          // Ignore disconnect errors
        }
      }
    });

    // Also disconnect input from any internal connections, but don't disconnect input itself
    if (this.audioNodes.input) {
      try {
        this.audioNodes.input.disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
    }
  }

  // Only for complete cleanup (when destroying)
  disconnectAllNodes() {
    Object.values(this.audioNodes).forEach(node => {
      if (node && node.disconnect) {
        try {
          node.disconnect();
        } catch (e) {
          // Ignore disconnect errors
        }
      }
    });
  }

  startNoise() {
    if (!this.noiseBuffer || !window.player?.audioContext) return;

    // Stop existing noise
    this.stopNoise();

    const audioContext = window.player.audioContext;
    this.noiseSource = audioContext.createBufferSource();
    this.noiseSource.buffer = this.noiseBuffer;
    this.noiseSource.loop = true;
    
    this.audioNodes.noiseGain.gain.value = 0.15; // Subtle noise level
    this.noiseSource.connect(this.audioNodes.noiseGain);
    this.noiseSource.start();
  }

  stopNoise() {
    if (this.noiseSource) {
      try {
        this.noiseSource.stop();
        this.noiseSource.disconnect();
      } catch (e) {
        // Ignore stop errors
      }
      this.noiseSource = null;
    }
  }

  toggleRetroMode() {
    this.enabled = !this.enabled;
    
    const retroIndicator = document.getElementById('retroIndicator');
    const trackTitle = document.getElementById('trackTitle');
    
    if (retroIndicator) {
      retroIndicator.classList.toggle('active', this.enabled);
    }

    // Initialize audio nodes if needed
    if (this.enabled && !this.audioNodes.input) {
      this.initializeAudioNodes();
      // Wait a bit for nodes to be ready, then reconnect the entire audio chain
      setTimeout(() => {
        this.connectInternalChain();
        // Trigger full audio chain reconnection to include retro processing
        if (window.player && window.player.source) {
          console.log('🔗 Reconnecting audio chain to include Retro Mode');
          window.player.connectProcessingChain();
        }
      }, 50);
    } else if (this.audioNodes.input) {
      // Immediately update the internal chain for seamless toggle
      this.connectInternalChain();
    }

    // Update display
    if (this.enabled) {
      if (trackTitle && !trackTitle.textContent.includes('[AM RADIO]')) {
        trackTitle.textContent = trackTitle.textContent + ' [AM RADIO]';
      }
      console.log('📻 Retro Mode ON - AM Radio effect enabled');
    } else {
      if (trackTitle && trackTitle.textContent.includes('[AM RADIO]')) {
        trackTitle.textContent = trackTitle.textContent.replace(' [AM RADIO]', '');
      }
      console.log('📻 Retro Mode OFF');
    }

    return this.enabled;
  }

  // Method to be called by the player when setting up audio chain
  ensureConnection() {
    if (this.audioNodes.input && this.audioNodes.output && !this.isConnectedToChain) {
      this.connectInternalChain();
      this.isConnectedToChain = true;
    }
  }

  // Public getters for audio chain integration
  get inputNode() {
    return this.audioNodes?.input || null;
  }

  get outputNode() {
    return this.audioNodes?.output || null;
  }

  get isEnabled() {
    return this.enabled;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.retroMode = new RetroMode();
});