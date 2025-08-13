class AudioVisualizer {
  constructor() {
    this.bars = document.querySelectorAll('.viz-bar');
    this.isActive = false;
    this.animationId = null;
    this.barHeights = new Array(this.bars.length).fill(0);
    this.targetHeights = new Array(this.bars.length).fill(0);
    
    this.initializeVisualizer();
  }

  initializeVisualizer() {
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
    this.isActive = true;
    this.animate();
  }

  stop() {
    this.isActive = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.reset();
  }

  animate() {
    if (!this.isActive) return;

    this.updateBars();
    this.renderBars();
    
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  updateBars() {
    for (let i = 0; i < this.bars.length; i++) {
      if (Math.random() < 0.3) {
        this.targetHeights[i] = Math.random() * 100;
      }
      
      this.barHeights[i] += (this.targetHeights[i] - this.barHeights[i]) * 0.1;
    }
  }

  renderBars() {
    this.bars.forEach((bar, index) => {
      const height = Math.max(2, this.barHeights[index]);
      bar.style.height = `${height}%`;
    });
  }

  reset() {
    this.barHeights.fill(0);
    this.targetHeights.fill(0);
    this.bars.forEach(bar => {
      bar.style.height = '2%';
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.audioVisualizer = new AudioVisualizer();
});