class PlaylistManager {
  constructor() {
    this.isPlaylistVisible = false;
    this.playlistWindow = null;
    this.initializePlaylistControls();
  }

  initializePlaylistControls() {
    const playlistBtn = document.getElementById('playlistBtn');
    
    console.log('Initializing playlist controls...');
    console.log('Playlist button found:', playlistBtn);
    
    if (!playlistBtn) {
      console.error('Playlist button not found!');
      return;
    }
    
    console.log('Adding click listener to playlist button');
    
    playlistBtn.addEventListener('click', (e) => {
      console.log('Playlist button clicked!');
      e.preventDefault();
      e.stopPropagation();
      playlistBtn.style.background = '#a0a0a0';
      setTimeout(() => {
        playlistBtn.style.background = '';
      }, 100);
      this.togglePlaylistWindow();
    });
  }

  togglePlaylistWindow() {
    console.log('Toggling playlist window, current state:', this.isPlaylistVisible);
    if (this.isPlaylistVisible) {
      this.hidePlaylistWindow();
    } else {
      this.showPlaylistWindow();
    }
  }

  showPlaylistWindow() {
    try {
      console.log('Starting showPlaylistWindow...');
      
      if (this.playlistWindow) {
        console.log('Hiding existing playlist window');
        this.hidePlaylistWindow();
      }

      console.log('Creating new playlist window');
      this.playlistWindow = document.createElement('div');
      this.playlistWindow.className = 'playlist-window';
      console.log('Playlist window element created:', this.playlistWindow);
    this.playlistWindow.innerHTML = `
      <div class="playlist-header">
        <span class="playlist-title">Playlist Editor</span>
        <div class="playlist-controls">
          <button class="playlist-control-btn" id="playlistClear">CLR</button>
          <button class="playlist-control-btn" id="playlistSave">SAVE</button>
          <button class="playlist-control-btn" id="playlistLoad">LOAD</button>
          <button class="playlist-control-btn playlist-close" id="playlistClose">×</button>
        </div>
      </div>
      <div class="playlist-content">
        <div class="playlist-info">
          <span id="playlistCount">0 files</span>
          <span id="playlistDuration">00:00</span>
        </div>
        <div class="playlist-list" id="playlistList">
        </div>
      </div>
    `;

      console.log('Adding playlist window to DOM');
      document.body.appendChild(this.playlistWindow);
      console.log('Playlist window appended to body');
      
      console.log('Positioning playlist window');
      this.positionPlaylistWindow();
      
      console.log('Updating playlist display');
      this.updatePlaylistDisplay();
      
      console.log('Initializing playlist window controls');
      this.initializePlaylistWindowControls();
      
      this.isPlaylistVisible = true;
      console.log('Set playlist visible to true');

      console.log('Adding visible class in 10ms...');
      setTimeout(() => {
        console.log('Adding visible class now');
        this.playlistWindow.classList.add('visible');
        console.log('Playlist window classes:', this.playlistWindow.className);
      }, 10);
      
      console.log('Expanding window for playlist');
      if (window.electronAPI) {
        window.electronAPI.resizeWindow(550, 232 + 400 + 10);
      }
      
      console.log('showPlaylistWindow completed successfully');
    } catch (error) {
      console.error('Error in showPlaylistWindow:', error);
    }
  }

  hidePlaylistWindow() {
    if (this.playlistWindow) {
      console.log('Hiding playlist window');
      
      // Resize window immediately
      console.log('Shrinking window back to normal size');
      if (window.electronAPI) {
        window.electronAPI.resizeWindow(550, 232);
      }
      
      this.playlistWindow.classList.remove('visible');
      this.isPlaylistVisible = false;
      
      setTimeout(() => {
        if (this.playlistWindow && this.playlistWindow.parentNode) {
          document.body.removeChild(this.playlistWindow);
        }
        this.playlistWindow = null;
      }, 200);
    }
  }

  positionPlaylistWindow() {
    try {
      const playerContainer = document.querySelector('.player-container');
      console.log('Player container found:', playerContainer);
      
      if (!playerContainer) {
        console.error('Player container not found, using default positioning');
        this.playlistWindow.style.position = 'fixed';
        this.playlistWindow.style.top = '250px';
        this.playlistWindow.style.left = '50px';
        this.playlistWindow.style.width = '550px';
        this.playlistWindow.style.height = '400px';
        return;
      }
      
      const playerRect = playerContainer.getBoundingClientRect();
      console.log('Player rect:', playerRect);
      
      this.playlistWindow.style.position = 'fixed';
      this.playlistWindow.style.top = `${playerRect.bottom + 10}px`;
      this.playlistWindow.style.left = `${playerRect.left}px`;
      this.playlistWindow.style.width = '550px';
      this.playlistWindow.style.height = '400px';
      this.playlistWindow.style.zIndex = '1000';
      
      console.log('Playlist window positioned at:', {
        top: this.playlistWindow.style.top,
        left: this.playlistWindow.style.left,
        width: this.playlistWindow.style.width,
        height: this.playlistWindow.style.height
      });
    } catch (error) {
      console.error('Error positioning playlist window:', error);
    }
  }

  initializePlaylistWindowControls() {
    const clearBtn = this.playlistWindow.querySelector('#playlistClear');
    const saveBtn = this.playlistWindow.querySelector('#playlistSave');
    const loadBtn = this.playlistWindow.querySelector('#playlistLoad');
    const closeBtn = this.playlistWindow.querySelector('#playlistClose');

    clearBtn.addEventListener('click', () => {
      this.clearPlaylist();
    });

    saveBtn.addEventListener('click', () => {
      this.savePlaylist();
    });

    loadBtn.addEventListener('click', () => {
      this.loadPlaylist();
    });

    closeBtn.addEventListener('click', () => {
      this.hidePlaylistWindow();
    });

    this.initializePlaylistDragging();
  }

  initializePlaylistDragging() {
    const header = this.playlistWindow.querySelector('.playlist-header');
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let windowStart = { x: 0, y: 0 };

    header.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('playlist-control-btn')) return;
      
      isDragging = true;
      dragStart.x = e.clientX;
      dragStart.y = e.clientY;
      
      const rect = this.playlistWindow.getBoundingClientRect();
      windowStart.x = rect.left;
      windowStart.y = rect.top;
      
      const handleDrag = (e) => {
        if (!isDragging) return;
        
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        
        const newX = Math.max(0, windowStart.x + deltaX);
        const newY = Math.max(0, windowStart.y + deltaY);
        
        this.playlistWindow.style.left = `${newX}px`;
        this.playlistWindow.style.top = `${newY}px`;
      };

      const handleDragEnd = () => {
        isDragging = false;
        document.removeEventListener('mousemove', handleDrag);
        document.removeEventListener('mouseup', handleDragEnd);
        header.style.cursor = 'grab';
      };
      
      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', handleDragEnd);
      header.style.cursor = 'grabbing';
      e.preventDefault();
    });
  }

  updatePlaylistDisplay() {
    if (!this.playlistWindow) return;

    const playlistList = this.playlistWindow.querySelector('#playlistList');
    const playlistCount = this.playlistWindow.querySelector('#playlistCount');
    const playlistDuration = this.playlistWindow.querySelector('#playlistDuration');

    playlistList.innerHTML = '';
    
    if (window.player.playlist.length === 0) {
      playlistList.innerHTML = '<div class="playlist-empty">No files in playlist</div>';
      playlistCount.textContent = '0 files';
      playlistDuration.textContent = '00:00';
      return;
    }

    let totalDuration = 0;
    
    window.player.playlist.forEach((track, index) => {
      const item = document.createElement('div');
      item.className = `playlist-item ${index === window.player.currentTrackIndex ? 'current' : ''}`;
      item.dataset.index = index;
      
      item.innerHTML = `
        <div class="playlist-item-number">${(index + 1).toString().padStart(2, '0')}</div>
        <div class="playlist-item-info">
          <div class="playlist-item-title">${track.title}</div>
          <div class="playlist-item-artist">${track.artist}</div>
        </div>
        <div class="playlist-item-duration">${this.formatDuration(track.duration)}</div>
        <button class="playlist-item-remove" data-index="${index}">×</button>
      `;
      
      item.addEventListener('dblclick', () => {
        this.playTrack(index);
      });

      const removeBtn = item.querySelector('.playlist-item-remove');
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeTrack(index);
      });
      
      playlistList.appendChild(item);
      totalDuration += track.duration || 0;
    });

    playlistCount.textContent = `${window.player.playlist.length} files`;
    playlistDuration.textContent = this.formatDuration(totalDuration);
  }

  async playTrack(index) {
    if (index >= 0 && index < window.player.playlist.length) {
      window.player.currentTrackIndex = index;
      const track = window.player.playlist[index];
      
      try {
        await window.player.loadTrack(track.path, track);
        window.player.play();
        this.updatePlaylistDisplay();
      } catch (error) {
        console.error('Error playing track:', error);
      }
    }
  }

  removeTrack(index) {
    if (index >= 0 && index < window.player.playlist.length) {
      window.player.playlist.splice(index, 1);
      
      if (window.player.currentTrackIndex >= index) {
        window.player.currentTrackIndex = Math.max(0, window.player.currentTrackIndex - 1);
      }
      
      this.updatePlaylistDisplay();
    }
  }

  clearPlaylist() {
    window.player.clearPlaylist();
    window.player.stop();
    window.player.updateDisplay('No file loaded', '');
    this.updatePlaylistDisplay();
  }

  savePlaylist() {
    if (window.player.playlist.length === 0) {
      return;
    }

    const m3uContent = this.generateM3UContent();
    const blob = new Blob([m3uContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'playlist.m3u';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  loadPlaylist() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.m3u,.m3u8';
    
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.parseM3UFile(file);
      }
    });
    
    input.click();
  }

  generateM3UContent() {
    let content = '#EXTM3U\n';
    
    window.player.playlist.forEach(track => {
      content += `#EXTINF:${Math.floor(track.duration || 0)},${track.artist} - ${track.title}\n`;
      content += `${track.path}\n`;
    });
    
    return content;
  }

  async parseM3UFile(file) {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    const newTracks = [];
    
    for (const line of lines) {
      if (line.startsWith('#') || !line.trim()) continue;
      
      const filePath = line.trim();
      if (filePath.toLowerCase().endsWith('.mp3')) {
        try {
          if (window.electronAPI) {
            const fileInfo = await window.electronAPI.getFileInfo(filePath);
            newTracks.push(fileInfo);
          }
        } catch (error) {
          console.error(`Error loading track from playlist: ${filePath}`, error);
        }
      }
    }
    
    if (newTracks.length > 0) {
      window.player.clearPlaylist();
      window.player.addToPlaylist(newTracks);
      this.updatePlaylistDisplay();
      
      if (newTracks.length > 0) {
        const firstTrack = newTracks[0];
        await window.player.loadTrack(firstTrack.path, firstTrack);
        window.player.currentTrackIndex = 0;
      }
    }
  }

  formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.playlistManager = new PlaylistManager();
});