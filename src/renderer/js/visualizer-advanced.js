class AdvancedVisualizerManager {
  constructor() {
    this.isVizVisible = true; // Start visible by default
    this.vizWindow = null;
    this.canvas = null;
    this.ctx = null;
    this.currentMode = 'cascade';
    this.isAnimating = false;
    this.animationId = null;
    
    // Audio analysis data
    this.frequencyData = null;
    this.timeData = null;
    this.highResFreqData = null;
    
    // Beat detection
    this.beatThreshold = 0.8;
    this.lastBeatTime = 0;
    this.beatHistory = [];
    
    this.initializeVisualizerManager();
  }

  initializeVisualizerManager() {
    console.log('AdvancedVisualizerManager: Starting initialization');
    
    const waitForElements = () => {
      const vizBtn = document.getElementById('vizBtn');
      const vizWindow = document.getElementById('vizWindow');
      
      console.log('AdvancedVisualizerManager: Looking for elements...', {
        vizBtn: !!vizBtn,
        vizWindow: !!vizWindow
      });
      
      if (vizBtn && vizWindow) {
        console.log('AdvancedVisualizerManager: Found all elements, setting up...');
        try {
          this.setupVisualizerWindow();
          this.setupVisualizerControls();
          console.log('AdvancedVisualizerManager: Initialization complete');
        } catch (error) {
          console.error('AdvancedVisualizerManager: Setup failed:', error);
        }
      } else {
        console.log('AdvancedVisualizerManager: Elements not ready, retrying...');
        setTimeout(waitForElements, 100);
      }
    };
    
    // Start immediately if DOM is already loaded
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      waitForElements();
    } else {
      document.addEventListener('DOMContentLoaded', waitForElements);
    }
  }

  setupVisualizerWindow() {
    this.vizWindow = document.getElementById('vizWindow');
    this.canvas = document.getElementById('vizCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Set up high DPI rendering
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = 263 * dpr;
    this.canvas.height = 280 * dpr;
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = '263px';
    this.canvas.style.height = '280px';
    
    // Start visible by default
    this.vizWindow.classList.add('visible');
    
    this.positionVisualizerWindow();
  }

  setupVisualizerControls() {
    const vizBtn = document.getElementById('vizBtn');
    const vizClose = document.getElementById('vizClose');
    const vizModeSelect = document.getElementById('vizModeSelect');
    
    console.log('AdvancedVisualizerManager: Setting up controls...', {
      vizBtn: !!vizBtn,
      vizClose: !!vizClose,
      vizModeSelect: !!vizModeSelect
    });
    
    if (!vizBtn) {
      console.error('AdvancedVisualizerManager: VIZ button not found!');
      return;
    }
    
    vizBtn.addEventListener('click', (e) => {
      console.log('AdvancedVisualizerManager: VIZ button clicked');
      e.preventDefault();
      e.stopPropagation();
      
      this.toggleVisualizerWindow();
    });
    
    if (vizClose) {
      vizClose.addEventListener('click', () => {
        console.log('AdvancedVisualizerManager: Close button clicked');
        this.hideVisualizerWindow();
      });
    }
    
    if (vizModeSelect) {
      vizModeSelect.addEventListener('change', (e) => {
        console.log('AdvancedVisualizerManager: Mode changed to:', e.target.value);
        this.currentMode = e.target.value;
        const modeName = document.getElementById('vizModeName');
        if (modeName) {
          modeName.textContent = e.target.selectedOptions[0].textContent;
        }
      });
    }
    
    // Initialize button state
    this.updateVizButtonState();
  }

  positionVisualizerWindow() {
    // Position is now handled by CSS - no dynamic positioning needed
  }

  toggleVisualizerWindow() {
    console.log('AdvancedVisualizerManager: Toggling visualizer window, current state:', this.isVizVisible);
    if (this.isVizVisible) {
      this.hideVisualizerWindow();
    } else {
      this.showVisualizerWindow();
    }
  }

  showVisualizerWindow() {
    console.log('AdvancedVisualizerManager: Showing visualizer window');
    if (this.vizWindow) {
      this.vizWindow.classList.add('visible');
      this.isVizVisible = true;
      this.updateVizButtonState();
      
      if (window.player && window.player.isPlaying) {
        this.startVisualization();
      }
    }
  }

  hideVisualizerWindow() {
    console.log('AdvancedVisualizerManager: Hiding visualizer window');
    if (this.vizWindow) {
      this.vizWindow.classList.remove('visible');
      this.isVizVisible = false;
      this.updateVizButtonState();
      this.stopVisualization();
    }
  }

  updateVizButtonState() {
    const vizBtn = document.getElementById('vizBtn');
    if (vizBtn) {
      if (this.isVizVisible) {
        vizBtn.style.background = '';
        vizBtn.title = 'Hide Visualizer';
      } else {
        vizBtn.style.background = 'linear-gradient(145deg, #666666 0%, #444444 100%)';
        vizBtn.title = 'Show Visualizer';
      }
    }
  }

  startVisualization() {
    if (!window.player || !window.player.analyserNode || !this.isVizVisible) return;
    
    this.isAnimating = true;
    
    // Set up higher resolution analysis for advanced viz
    window.player.analyserNode.fftSize = 2048;
    window.player.analyserNode.smoothingTimeConstant = 0.6;
    
    const bufferLength = window.player.analyserNode.frequencyBinCount;
    this.frequencyData = new Uint8Array(bufferLength);
    this.timeData = new Uint8Array(bufferLength);
    
    this.animate();
  }

  stopVisualization() {
    this.isAnimating = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  animate() {
    if (!this.isAnimating || !this.isVizVisible) return;
    
    // Get audio data
    window.player.analyserNode.getByteFrequencyData(this.frequencyData);
    window.player.analyserNode.getByteTimeDomainData(this.timeData);
    
    // Beat detection
    this.detectBeat();
    
    // Clear canvas
    this.ctx.fillStyle = 'rgb(10, 15, 26)';
    this.ctx.fillRect(0, 0, 263, 280);
    
    // Render current visualization mode
    switch (this.currentMode) {
      case 'cascade':
        this.renderSpectrumCascade();
        break;
      case 'waterfall':
        this.renderWaveformWaterfall();
        break;
      case 'meters':
        this.renderVUMeters();
        break;
      case 'circle':
        this.renderCircularSpectrum();
        break;
      case 'oscilloscope':
        this.renderOscilloscopeTower();
        break;
      case 'helix':
        this.renderDNAHelix();
        break;
    }
    
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  detectBeat() {
    // Simple beat detection using low frequency energy
    let bassEnergy = 0;
    for (let i = 0; i < 10; i++) {
      bassEnergy += this.frequencyData[i];
    }
    bassEnergy /= 10;
    
    this.beatHistory.push(bassEnergy);
    if (this.beatHistory.length > 30) {
      this.beatHistory.shift();
    }
    
    const average = this.beatHistory.reduce((a, b) => a + b, 0) / this.beatHistory.length;
    const beatIndicator = document.getElementById('vizBeatIndicator');
    
    if (bassEnergy > average * this.beatThreshold && Date.now() - this.lastBeatTime > 200) {
      this.lastBeatTime = Date.now();
      beatIndicator.classList.add('beat');
      setTimeout(() => beatIndicator.classList.remove('beat'), 100);
      return true;
    }
    return false;
  }

  renderSpectrumCascade() {
    const width = 263;
    const height = 280;
    const barWidth = 4;
    const numBars = Math.floor(width / barWidth);
    
    this.ctx.fillStyle = 'rgba(0, 255, 65, 0.8)';
    
    for (let i = 0; i < numBars; i++) {
      const dataIndex = Math.floor((i / numBars) * this.frequencyData.length);
      const barHeight = (this.frequencyData[dataIndex] / 255) * height * 0.8;
      
      const x = i * barWidth;
      const y = height - barHeight;
      
      // Create gradient for each bar
      const gradient = this.ctx.createLinearGradient(0, y, 0, height);
      gradient.addColorStop(0, '#00ff41');
      gradient.addColorStop(0.5, '#4fd1c7');
      gradient.addColorStop(1, '#00cc33');
      
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(x, y, barWidth - 1, barHeight);
      
      // Add glow effect
      this.ctx.shadowColor = '#00ff41';
      this.ctx.shadowBlur = 3;
      this.ctx.fillRect(x, y, barWidth - 1, Math.min(barHeight, 10));
      this.ctx.shadowBlur = 0;
    }
  }

  renderWaveformWaterfall() {
    // Shift previous data down
    const imageData = this.ctx.getImageData(0, 0, 263, 279);
    this.ctx.putImageData(imageData, 0, 1);
    
    // Draw new waveform at top
    this.ctx.strokeStyle = '#00ff41';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    
    const sliceWidth = 263 / this.timeData.length;
    let x = 0;
    
    for (let i = 0; i < this.timeData.length; i++) {
      const v = this.timeData[i] / 255;
      const y = v * 20; // Only use top portion for new waveform
      
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
      
      x += sliceWidth;
    }
    
    this.ctx.stroke();
  }

  renderVUMeters() {
    const numColumns = 10;
    const columnWidth = 263 / numColumns;
    const height = 280;
    
    for (let i = 0; i < numColumns; i++) {
      const startFreq = Math.floor((i / numColumns) * this.frequencyData.length);
      const endFreq = Math.floor(((i + 1) / numColumns) * this.frequencyData.length);
      
      let average = 0;
      for (let j = startFreq; j < endFreq; j++) {
        average += this.frequencyData[j];
      }
      average /= (endFreq - startFreq);
      
      const barHeight = (average / 255) * height * 0.9;
      const x = i * columnWidth;
      
      // Draw VU meter with segments
      const segments = 20;
      const segmentHeight = height / segments;
      
      for (let seg = 0; seg < segments; seg++) {
        const segY = height - (seg + 1) * segmentHeight;
        
        if (segY >= height - barHeight) {
          // Color based on level (green -> yellow -> red)
          let color;
          if (seg < segments * 0.7) {
            color = '#00ff41';
          } else if (seg < segments * 0.9) {
            color = '#ffff00';
          } else {
            color = '#ff4444';
          }
          
          this.ctx.fillStyle = color;
          this.ctx.fillRect(x + 2, segY, columnWidth - 4, segmentHeight - 1);
        }
      }
    }
  }

  renderCircularSpectrum() {
    const centerX = 263 / 2;
    const centerY = 140;
    const maxRadius = 100;
    
    this.ctx.strokeStyle = '#4fd1c7';
    this.ctx.lineWidth = 2;
    
    const angleStep = (Math.PI * 2) / this.frequencyData.length;
    
    for (let i = 0; i < this.frequencyData.length; i++) {
      const angle = i * angleStep;
      const amplitude = this.frequencyData[i] / 255;
      const radius = 20 + amplitude * maxRadius;
      
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      if (i === 0) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    
    this.ctx.closePath();
    this.ctx.stroke();
    
    // Add center pulse
    const bassLevel = this.frequencyData.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
    const pulseRadius = 5 + (bassLevel / 255) * 15;
    
    this.ctx.fillStyle = '#ff8c00';
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  renderOscilloscopeTower() {
    const numTraces = 8;
    const traceHeight = 280 / numTraces;
    
    for (let trace = 0; trace < numTraces; trace++) {
      const y = trace * traceHeight + traceHeight / 2;
      
      // Different frequency ranges for each trace
      const freqStart = Math.floor((trace / numTraces) * this.timeData.length);
      const freqEnd = Math.floor(((trace + 1) / numTraces) * this.timeData.length);
      
      this.ctx.strokeStyle = `hsl(${120 + trace * 30}, 80%, 60%)`;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      
      const sliceWidth = 263 / (freqEnd - freqStart);
      let x = 0;
      
      for (let i = freqStart; i < freqEnd; i++) {
        const v = (this.timeData[i] - 128) / 128;
        const waveY = y + v * (traceHeight / 3);
        
        if (i === freqStart) {
          this.ctx.moveTo(x, waveY);
        } else {
          this.ctx.lineTo(x, waveY);
        }
        
        x += sliceWidth;
      }
      
      this.ctx.stroke();
    }
  }

  renderDNAHelix() {
    const centerX = 263 / 2;
    const height = 280;
    const time = Date.now() * 0.001;
    
    // Create two helixes
    for (let helix = 0; helix < 2; helix++) {
      this.ctx.strokeStyle = helix === 0 ? '#00ff41' : '#4fd1c7';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      
      let lastX, lastY;
      
      for (let y = 0; y < height; y += 2) {
        const progress = y / height;
        const dataIndex = Math.floor(progress * this.frequencyData.length);
        const amplitude = this.frequencyData[dataIndex] / 255;
        
        const angle = (y * 0.05 + time + helix * Math.PI) % (Math.PI * 2);
        const radius = 20 + amplitude * 60;
        const x = centerX + Math.cos(angle) * radius;
        
        if (y === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
          
          // Add connecting lines between helixes
          if (Math.abs(angle % Math.PI) < 0.2) {
            this.ctx.stroke();
            this.ctx.strokeStyle = '#ffff00';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(lastX, lastY);
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
            this.ctx.strokeStyle = helix === 0 ? '#00ff41' : '#4fd1c7';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
          }
        }
        
        lastX = x;
        lastY = y;
      }
      
      this.ctx.stroke();
    }
  }
}

// Initialize when DOM is ready
console.log('AdvancedVisualizerManager: Script loaded');

// Use a more robust initialization approach
const initAdvancedVisualizer = () => {
  console.log('AdvancedVisualizerManager: Initializing...');
  
  try {
    window.advancedVisualizerManager = new AdvancedVisualizerManager();
    console.log('AdvancedVisualizerManager: Instance created');
    
    // Hook into audio player events
    const setupVizAudioEvents = () => {
      if (window.player && window.player.audio) {
        console.log('AdvancedVisualizerManager: Setting up audio events');
        
        window.player.audio.addEventListener('play', () => {
          if (window.advancedVisualizerManager.isVizVisible) {
            window.advancedVisualizerManager.startVisualization();
          }
        });
        
        window.player.audio.addEventListener('pause', () => {
          window.advancedVisualizerManager.stopVisualization();
        });
        
        window.player.audio.addEventListener('ended', () => {
          window.advancedVisualizerManager.stopVisualization();
        });
        
        console.log('AdvancedVisualizerManager: Audio events set up');
      } else {
        console.log('AdvancedVisualizerManager: Player not ready, retrying audio events setup...');
        setTimeout(setupVizAudioEvents, 100);
      }
    };
    
    setupVizAudioEvents();
    
  } catch (error) {
    console.error('AdvancedVisualizerManager: Initialization failed:', error);
  }
};

// Try multiple initialization strategies
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdvancedVisualizer);
} else {
  // DOM is already ready
  initAdvancedVisualizer();
}