class PlayerUI {
  constructor() {
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.windowStart = { x: 0, y: 0 };
    
    this.initializeControls();
    this.initializeWindowControls();
    this.initializeDragging();
    this.initializeKeyboardShortcuts();
    this.initializeDragAndDrop();
  }

  initializeControls() {
    const playBtn = document.getElementById('playBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const openFileBtn = document.getElementById('openFileBtn');
    const eqBtn = document.getElementById('eqBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    const progressBar = document.getElementById('progressBar');
    const shuffleIndicator = document.getElementById('shuffleIndicator');
    const repeatIndicator = document.getElementById('repeatIndicator');
    const retroIndicator = document.getElementById('retroIndicator');

    playBtn.addEventListener('click', () => {
      window.player.play();
      this.updatePlayPauseButtons(true);
    });

    pauseBtn.addEventListener('click', () => {
      window.player.pause();
      this.updatePlayPauseButtons(false);
    });

    stopBtn.addEventListener('click', () => {
      window.player.stop();
      this.updatePlayPauseButtons(false);
    });

    prevBtn.addEventListener('click', () => {
      window.player.previousTrack();
    });

    nextBtn.addEventListener('click', () => {
      window.player.nextTrack();
    });

    openFileBtn.addEventListener('click', async () => {
      await this.openFiles();
    });

    // EQ button is now handled by EqualizerManager

    volumeSlider.addEventListener('input', (e) => {
      const volume = parseFloat(e.target.value) / 100;
      window.player.setVolume(volume);
    });

    let isSeekingManually = false;
    
    progressBar.addEventListener('mousedown', () => {
      isSeekingManually = true;
    });

    progressBar.addEventListener('mouseup', () => {
      isSeekingManually = false;
    });

    progressBar.addEventListener('input', (e) => {
      if (isSeekingManually) {
        const position = parseFloat(e.target.value);
        window.player.seek(position);
      }
    });

    shuffleIndicator.addEventListener('click', () => {
      const isShuffleOn = window.player.toggleShuffle();
      shuffleIndicator.classList.toggle('active', isShuffleOn);
    });

    repeatIndicator.addEventListener('click', () => {
      const isRepeatOn = window.player.toggleRepeat();
      repeatIndicator.classList.toggle('active', isRepeatOn);
    });

    // Retro Mode is handled by RetroMode class

    window.player.audio.addEventListener('play', () => {
      this.updatePlayPauseButtons(true);
    });

    window.player.audio.addEventListener('pause', () => {
      this.updatePlayPauseButtons(false);
    });
  }

  initializeWindowControls() {
    const minimizeBtn = document.getElementById('minimizeBtn');
    const closeBtn = document.getElementById('closeBtn');

    minimizeBtn.addEventListener('click', () => {
      if (window.electronAPI) {
        window.electronAPI.minimizeWindow();
      }
    });

    closeBtn.addEventListener('click', () => {
      if (window.electronAPI) {
        window.electronAPI.closeWindow();
      }
    });
  }

  initializeDragging() {
    const titleBar = document.querySelector('.title-bar');
    const playerContainer = document.querySelector('.player-container');

    titleBar.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('title-bar-control')) return;
      
      this.isDragging = true;
      this.dragStart.x = e.clientX;
      this.dragStart.y = e.clientY;
      
      const rect = playerContainer.getBoundingClientRect();
      this.windowStart.x = rect.left;
      this.windowStart.y = rect.top;
      
      document.addEventListener('mousemove', this.handleDrag);
      document.addEventListener('mouseup', this.handleDragEnd);
      
      titleBar.style.cursor = 'grabbing';
      e.preventDefault();
    });
  }

  handleDrag = (e) => {
    if (!this.isDragging) return;
    
    const deltaX = e.clientX - this.dragStart.x;
    const deltaY = e.clientY - this.dragStart.y;
    
    const newX = this.windowStart.x + deltaX;
    const newY = this.windowStart.y + deltaY;
    
    document.body.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  };

  handleDragEnd = () => {
    this.isDragging = false;
    document.removeEventListener('mousemove', this.handleDrag);
    document.removeEventListener('mouseup', this.handleDragEnd);
    
    const titleBar = document.querySelector('.title-bar');
    titleBar.style.cursor = 'grab';
    document.body.style.transform = '';
  };

  initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (window.player.isPlaying) {
            window.player.pause();
          } else {
            window.player.play();
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          window.player.nextTrack();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          window.player.previousTrack();
          break;
        case 'KeyS':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            window.player.stop();
          }
          break;
        case 'KeyO':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.openFiles();
          }
          break;
      }
    });
  }

  initializeDragAndDrop() {
    const playerContainer = document.querySelector('.player-container');

    playerContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      playerContainer.classList.add('drag-over');
    });

    playerContainer.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!playerContainer.contains(e.relatedTarget)) {
        playerContainer.classList.remove('drag-over');
      }
    });

    playerContainer.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      playerContainer.classList.remove('drag-over');

      const files = Array.from(e.dataTransfer.files);
      const mp3Files = files.filter(file => 
        file.type === 'audio/mpeg' || 
        file.name.toLowerCase().endsWith('.mp3')
      );

      if (mp3Files.length === 0) {
        this.showNotification('No MP3 files found in selection', 'error');
        return;
      }

      try {
        const filePaths = mp3Files.map(file => file.path);
        await this.loadFilePaths(filePaths);
        this.showNotification(`Loaded ${mp3Files.length} MP3 files`, 'success');
        
        // Update playlist display if it's open
        if (window.playlistManager && window.playlistManager.isPlaylistVisible) {
          console.log('Updating playlist display after drag and drop');
          window.playlistManager.updatePlaylistDisplay();
        }
      } catch (error) {
        console.error('Error loading dropped files:', error);
        this.showNotification('Error loading files', 'error');
      }
    });

    document.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    document.addEventListener('drop', (e) => {
      e.preventDefault();
    });
  }

  async loadFilePaths(filePaths) {
    if (!window.electronAPI) {
      console.error('Electron API not available');
      return;
    }

    window.player.clearPlaylist();
    
    for (const filePath of filePaths) {
      try {
        const fileInfo = await window.electronAPI.getFileInfo(filePath);
        window.player.addToPlaylist(fileInfo);
      } catch (error) {
        console.error(`Error processing file ${filePath}:`, error);
      }
    }
    
    if (window.player.playlist.length > 0) {
      const firstTrack = window.player.playlist[0];
      await window.player.loadTrack(firstTrack.path, firstTrack);
      window.player.currentTrackIndex = 0;
    }
  }

  updatePlayPauseButtons(isPlaying) {
    const playBtn = document.getElementById('playBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    
    if (isPlaying) {
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'inline-block';
    } else {
      playBtn.style.display = 'inline-block';
      pauseBtn.style.display = 'none';
    }
  }

  async openFiles() {
    if (!window.electronAPI) {
      console.error('Electron API not available');
      return;
    }

    try {
      const filePaths = await window.electronAPI.selectMp3Files();
      
      if (filePaths && filePaths.length > 0) {
        console.log('Loading files:', filePaths);
        window.player.clearPlaylist();
        
        for (const filePath of filePaths) {
          try {
            const fileInfo = await window.electronAPI.getFileInfo(filePath);
            console.log('Adding file to playlist:', fileInfo);
            window.player.addToPlaylist(fileInfo);
          } catch (error) {
            console.error(`Error processing file ${filePath}:`, error);
          }
        }
        
        console.log('Total files in playlist:', window.player.playlist.length);
        
        if (window.player.playlist.length > 0) {
          const firstTrack = window.player.playlist[0];
          await window.player.loadTrack(firstTrack.path, firstTrack);
          window.player.currentTrackIndex = 0;
          
          // Update playlist display if it's open
          if (window.playlistManager && window.playlistManager.isPlaylistVisible) {
            console.log('Updating playlist display');
            window.playlistManager.updatePlaylistDisplay();
          }
        }
      }
    } catch (error) {
      console.error('Error opening files:', error);
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 2000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.playerUI = new PlayerUI();
});