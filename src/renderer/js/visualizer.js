class AudioVisualizer {
  constructor() {
    this.bars = document.querySelectorAll('.viz-bar');
    this.isActive = false;
    this.animationId = null;
    this.barHeights = new Array(this.bars.length).fill(0);
    this.peakHeights = new Array(this.bars.length).fill(0);
    this.frequencyData = null;
    
    // Frequency ranges for each bar (Hz)
    this.frequencyRanges = [
      { min: 20, max: 60 },     // Sub-bass
      { min: 60, max: 250 },    // Bass
      { min: 250, max: 500 },   // Low-mid
      { min: 500, max: 2000 },  // Mid
      { min: 2000, max: 4000 }, // Upper-mid
      { min: 4000, max: 6000 }, // Presence
      { min: 6000, max: 12000 }, // Brilliance
      { min: 12000, max: 20000 } // Air
    ];
    
    this.initializeVisualizer();
  }

  initializeVisualizer() {
    // Wait for player to be ready
    const waitForPlayer = () => {
      if (window.player && window.player.audio) {
        this.setupAudioEvents();
      } else {
        setTimeout(waitForPlayer, 100);
      }
    };
    waitForPlayer();
  }

  setupAudioEvents() {
    window.player.audio.addEventListener('play', () => {
      this.start();
    });

    window.player.audio.addEventListener('pause', () => {
      this.stop();
    });

    window.player.audio.addEventListener('ended', () => {
      this.stop();
    });
  }

  start() {
    if (window.player && window.player.analyserNode) {
      this.isActive = true;
      const bufferLength = window.player.analyserNode.frequencyBinCount;
      this.frequencyData = new Uint8Array(bufferLength);
      this.animate();
    }
  }

  stop() {
    this.isActive = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.reset();
  }

  animate() {
    if (!this.isActive || !window.player.analyserNode) return;

    this.updateBars();
    this.renderBars();
    
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  updateBars() {
    // Get frequency data from analyzer
    window.player.analyserNode.getByteFrequencyData(this.frequencyData);
    
    const sampleRate = window.player.audioContext.sampleRate;
    const nyquist = sampleRate / 2;
    const binCount = this.frequencyData.length;
    
    for (let i = 0; i < this.bars.length; i++) {
      const range = this.frequencyRanges[i];
      
      // Convert frequency range to bin indices
      const startBin = Math.floor((range.min / nyquist) * binCount);
      const endBin = Math.floor((range.max / nyquist) * binCount);
      
      // Calculate average amplitude for this frequency range
      let sum = 0;
      let count = 0;
      
      for (let bin = startBin; bin <= endBin && bin < binCount; bin++) {
        sum += this.frequencyData[bin];
        count++;
      }
      
      const average = count > 0 ? sum / count : 0;
      const normalizedHeight = (average / 255) * 100;
      
      // Smooth transitions
      this.barHeights[i] += (normalizedHeight - this.barHeights[i]) * 0.3;
      
      // Peak hold for visual effect
      if (normalizedHeight > this.peakHeights[i]) {
        this.peakHeights[i] = normalizedHeight;
      } else {
        this.peakHeights[i] *= 0.95; // Peak decay
      }
    }
  }

  renderBars() {
    this.bars.forEach((bar, index) => {
      const height = Math.max(2, this.barHeights[index]);
      bar.style.height = `${height}%`;
      
      // Add peak flash effect
      const peakDiff = this.peakHeights[index] - this.barHeights[index];
      if (peakDiff > 10) {
        bar.style.boxShadow = `0 0 ${Math.min(8, peakDiff / 4)}px var(--winamp-accent-bright)`;
      } else {
        bar.style.boxShadow = '0 0 1px var(--winamp-display-text)';
      }
    });
  }

  reset() {
    this.barHeights.fill(0);
    this.peakHeights.fill(0);
    this.bars.forEach(bar => {
      bar.style.height = '2%';
      bar.style.boxShadow = '0 0 1px var(--winamp-display-text)';
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.audioVisualizer = new AudioVisualizer();
});