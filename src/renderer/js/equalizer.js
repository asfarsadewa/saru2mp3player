class EqualizerManager {
  constructor() {
    this.isEqVisible = false;
    this.eqWindow = null;
    this.frequencies = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];
    this.gains = new Array(10).fill(0); // -20 to +20 dB range
    this.filters = [];
    this.inputNode = null;
    this.outputNode = null;
    this.presets = {
      'Flat': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      'Rock': [5, 4, -1, -2, -1, 2, 4, 6, 6, 6],
      'Pop': [-1, 2, 4, 4, 1, -1, -2, -2, -1, -1],
      'Jazz': [4, 3, 1, 2, -1, -1, 0, 2, 3, 4],
      'Classical': [5, 4, 3, 2, -1, -1, 0, 2, 4, 5],
      'Bass': [8, 6, 4, 2, 1, -1, -2, -3, -3, -3],
      'Treble': [-3, -3, -2, -1, 1, 2, 4, 6, 8, 8]
    };
    this.currentPreset = 'Flat';
    this.enabled = true;
    this.initializeAudioNodes();
    this.initializeEqControls();
  }

  initializeAudioNodes() {
    if (!window.player || !window.player.audioContext) {
      setTimeout(() => this.initializeAudioNodes(), 100);
      return;
    }

    const audioContext = window.player.audioContext;
    
    try {
      // Create input and output nodes
      this.inputNode = audioContext.createGain();
      this.outputNode = audioContext.createGain();
      
      // Create 10 biquad filters for EQ bands
      this.filters = this.frequencies.map((frequency, index) => {
        const filter = audioContext.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = frequency;
        filter.Q.value = 1.0;
        filter.gain.value = this.gains[index];
        return filter;
      });
      
      // Connect the filter chain
      this.connectFilterChain();
      
      console.log('EQ audio nodes initialized');
    } catch (error) {
      console.error('Error initializing EQ audio nodes:', error);
    }
  }

  connectFilterChain() {
    if (!this.inputNode || !this.outputNode || this.filters.length === 0) return;

    if (this.enabled) {
      // Connect through filters: input -> filter1 -> filter2 -> ... -> output
      this.inputNode.connect(this.filters[0]);
      
      for (let i = 0; i < this.filters.length - 1; i++) {
        this.filters[i].connect(this.filters[i + 1]);
      }
      
      this.filters[this.filters.length - 1].connect(this.outputNode);
    } else {
      // Bypass filters: input -> output
      this.disconnectFilters();
      this.inputNode.connect(this.outputNode);
    }
  }

  disconnectFilters() {
    this.inputNode.disconnect();
    this.filters.forEach(filter => filter.disconnect());
  }

  initializeEqControls() {
    const eqBtn = document.getElementById('eqBtn');
    
    if (!eqBtn) {
      return;
    }
    
    eqBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      eqBtn.style.background = '#a0a0a0';
      setTimeout(() => {
        eqBtn.style.background = '';
      }, 100);
      this.toggleEqWindow();
    });
  }

  toggleEqWindow() {
    if (this.isEqVisible) {
      this.hideEqWindow();
    } else {
      this.showEqWindow();
    }
  }

  showEqWindow() {
    try {
      if (this.eqWindow) {
        this.hideEqWindow();
      }

      this.eqWindow = document.createElement('div');
      this.eqWindow.className = 'eq-window';
      this.eqWindow.innerHTML = `
        <div class="eq-header">
          <span class="eq-title">Equalizer</span>
          <div class="eq-controls">
            <button class="eq-control-btn" id="eqEnabled">ON</button>
            <button class="eq-control-btn eq-close" id="eqClose">×</button>
          </div>
        </div>
        <div class="eq-content">
          <div class="eq-presets">
            <select class="eq-preset-select" id="eqPresetSelect">
              ${Object.keys(this.presets).map(preset => 
                `<option value="${preset}" ${preset === this.currentPreset ? 'selected' : ''}>${preset}</option>`
              ).join('')}
            </select>
          </div>
          <div class="eq-sliders">
            ${this.frequencies.map((freq, index) => `
              <div class="eq-slider-container">
                <div class="eq-freq-label">${this.formatFrequency(freq)}</div>
                <input type="range" 
                       class="eq-slider" 
                       id="eqSlider${index}"
                       min="-20" 
                       max="20" 
                       value="${this.gains[index]}"
                       orient="vertical">
                <div class="eq-gain-label" id="eqGain${index}">${this.gains[index] > 0 ? '+' : ''}${this.gains[index]}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      document.body.appendChild(this.eqWindow);
      this.positionEqWindow();
      this.initializeEqWindowControls();
      this.isEqVisible = true;

      // Expand window
      if (window.electronAPI) {
        window.electronAPI.resizeWindow(550 + 275, 232);
      }

      setTimeout(() => {
        this.eqWindow.classList.add('visible');
      }, 10);
      
    } catch (error) {
      console.error('Error in showEqWindow:', error);
    }
  }

  hideEqWindow() {
    if (this.eqWindow) {
      // Resize window immediately
      if (window.electronAPI) {
        window.electronAPI.resizeWindow(550, 232);
      }
      
      this.eqWindow.classList.remove('visible');
      this.isEqVisible = false;
      
      setTimeout(() => {
        if (this.eqWindow && this.eqWindow.parentNode) {
          document.body.removeChild(this.eqWindow);
        }
        this.eqWindow = null;
      }, 200);
    }
  }

  positionEqWindow() {
    const playerContainer = document.querySelector('.player-container');
    
    if (!playerContainer) {
      this.eqWindow.style.position = 'fixed';
      this.eqWindow.style.top = '50px';
      this.eqWindow.style.left = '600px';
      return;
    }
    
    const playerRect = playerContainer.getBoundingClientRect();
    
    this.eqWindow.style.position = 'fixed';
    this.eqWindow.style.top = `${playerRect.top}px`;
    this.eqWindow.style.left = `${playerRect.right + 10}px`;
    this.eqWindow.style.width = '275px';
    this.eqWindow.style.height = '232px';
    this.eqWindow.style.zIndex = '1000';
  }

  initializeEqWindowControls() {
    const enabledBtn = this.eqWindow.querySelector('#eqEnabled');
    const closeBtn = this.eqWindow.querySelector('#eqClose');
    const presetSelect = this.eqWindow.querySelector('#eqPresetSelect');

    enabledBtn.addEventListener('click', () => {
      this.enabled = !this.enabled;
      enabledBtn.textContent = this.enabled ? 'ON' : 'OFF';
      enabledBtn.classList.toggle('disabled', !this.enabled);
      this.connectFilterChain();
      console.log('EQ', this.enabled ? 'enabled' : 'disabled');
    });

    closeBtn.addEventListener('click', () => {
      this.hideEqWindow();
    });

    presetSelect.addEventListener('change', (e) => {
      this.loadPreset(e.target.value);
    });

    // Add slider event listeners
    this.frequencies.forEach((freq, index) => {
      const slider = this.eqWindow.querySelector(`#eqSlider${index}`);
      const gainLabel = this.eqWindow.querySelector(`#eqGain${index}`);
      
      slider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        this.gains[index] = value;
        gainLabel.textContent = `${value > 0 ? '+' : ''}${value}`;
        this.currentPreset = 'Custom';
        presetSelect.value = 'Custom';
        
        // Update the actual filter gain
        if (this.filters[index]) {
          this.filters[index].gain.value = value;
        }
      });
    });

    this.updateEnabledState();
  }

  loadPreset(presetName) {
    if (this.presets[presetName]) {
      this.gains = [...this.presets[presetName]];
      this.currentPreset = presetName;
      
      // Update sliders
      this.gains.forEach((gain, index) => {
        const slider = this.eqWindow.querySelector(`#eqSlider${index}`);
        const gainLabel = this.eqWindow.querySelector(`#eqGain${index}`);
        if (slider && gainLabel) {
          slider.value = gain;
          gainLabel.textContent = `${gain > 0 ? '+' : ''}${gain}`;
        }
      });
      
      // Update the actual filter gains
      this.gains.forEach((gain, index) => {
        if (this.filters[index]) {
          this.filters[index].gain.value = gain;
        }
      });
    }
  }

  updateEnabledState() {
    const enabledBtn = this.eqWindow.querySelector('#eqEnabled');
    if (enabledBtn) {
      enabledBtn.textContent = this.enabled ? 'ON' : 'OFF';
      enabledBtn.classList.toggle('disabled', !this.enabled);
    }
  }


  formatFrequency(freq) {
    if (freq >= 1000) {
      return (freq / 1000) + 'k';
    }
    return freq + '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.equalizerManager = new EqualizerManager();
});