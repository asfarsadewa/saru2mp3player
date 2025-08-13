# Saru2 MP3 Player 🎵

A retro-themed MP3 player built with Electron, inspired by the classic Winamp interface. Features authentic 80s/90s aesthetics with modern functionality including a working equalizer and AM radio effects.

![Retro MP3 Player](https://img.shields.io/badge/Style-Retro-orange) ![Platform](https://img.shields.io/badge/Platform-Desktop-blue) ![License](https://img.shields.io/badge/License-ISC-green)

## ✨ Features

### 🎨 **Authentic Retro Design**
- Classic Winamp-inspired interface
- Beveled borders and LCD-style displays
- Retro color scheme with green text on black displays
- Proper window controls and drag-to-move functionality

### 🎵 **Audio Playback**
- **MP3-only support** (any bitrate)
- Standard playback controls (play, pause, stop, previous, next)
- Volume control with visual slider
- Progress bar with seek functionality
- Shuffle and repeat modes

### 🎛️ **10-Band Equalizer**
- **Real audio processing** using Web Audio API
- Frequency bands: 60Hz, 170Hz, 310Hz, 600Hz, 1kHz, 3kHz, 6kHz, 12kHz, 14kHz, 16kHz
- Built-in presets: Flat, Rock, Pop, Jazz, Classical, Bass, Treble
- Visual EQ window with authentic retro styling

### 📻 **Retro Mode (AM Radio Effects)**
- Authentic 80s AM radio sound processing
- Mono conversion and frequency limiting (300Hz - 3kHz)
- Vintage distortion and compression
- Background static and vinyl crackle
- Can be toggled on/off during playback

### 📁 **Playlist Management**
- Drag-and-drop MP3 files
- Visual playlist window with track listing
- File browser integration (Ctrl+O)
- Automatic ID3 metadata extraction
- M3U playlist support

### ⌨️ **Keyboard Shortcuts**
- `Space` - Play/Pause
- `Ctrl+O` - Open files
- `Ctrl+S` - Stop
- `Arrow Keys` - Previous/Next track
- `F12` - Toggle developer tools

## 🚀 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/saru2mp3player.git
cd saru2mp3player

# Install dependencies
npm install

# Start the application
npm start
```

### Development Mode
```bash
# Run with developer tools enabled
npm run dev
```

## 🎮 Usage

### Basic Playback
1. **Load Files**: Click "OPEN" button or drag MP3 files into the player
2. **Play Music**: Use the standard media controls (▶, ⏸, ⏹)
3. **Adjust Volume**: Use the volume slider on the right side
4. **Seek**: Click anywhere on the progress bar to jump to that position

### Using the Equalizer
1. Click the "EQ" button to open the equalizer window
2. Adjust frequency bands by dragging the sliders
3. Select presets from the dropdown menu
4. Changes apply in real-time during playback

### Retro Mode
1. Click the "RETRO" button to toggle AM radio effects
2. Can be activated/deactivated during playback
3. Notice the "[AM RADIO]" indicator in the track title
4. Experience authentic 80s radio sound with static and compression

### Playlist Features
1. Click "PL" to open the playlist window
2. Drag multiple MP3 files to add them to the playlist
3. Click on tracks in the playlist to switch songs
4. Use shuffle (S) and repeat (R) buttons for playback modes

## 🏗️ Architecture

### Technology Stack
- **Framework**: Electron
- **Audio Processing**: Web Audio API
- **ID3 Metadata**: node-id3
- **UI**: HTML5/CSS3/JavaScript

### Project Structure
```
saru2mp3player/
├── main.js                 # Electron main process
├── preload.js             # IPC bridge
├── package.json           # Dependencies and scripts
├── public/
│   └── index.html         # Main UI structure
└── src/
    └── renderer/
        ├── js/
        │   ├── player.js      # Core audio player
        │   ├── equalizer.js   # EQ functionality
        │   ├── retromode.js   # AM radio effects
        │   ├── playlist.js    # Playlist management
        │   ├── ui.js          # User interface
        │   └── visualizer.js  # Audio visualizer
        └── css/
            ├── main.css       # Main styling
            └── retro-theme.css # Retro window themes
```

### Audio Processing Chain
```
Audio Source → Equalizer → Retro Effects → Gain → Output
     ↓            ↓           ↓           ↓       ↓
  MediaElement  BiquadFilters  AM Radio   Volume  Speakers
                             Processing
```

## 🎛️ Technical Details

### Web Audio API Implementation
- **Equalizer**: 10 cascaded BiquadFilter nodes with peaking filter type
- **Retro Mode**: Custom processing chain with mono conversion, frequency limiting, waveshaper distortion, and dynamic compression
- **Real-time Processing**: All effects can be adjusted during playbook without interruption

### Security Features
- Secure IPC communication between main and renderer processes
- File system access controlled through Electron's security model
- No remote content loading - fully offline application

## 🔧 Development

### Building
The application runs directly with Electron. For distribution builds, you can add electron-builder:

```bash
npm install --save-dev electron-builder
```

### Adding Features
- **Audio Effects**: Extend `src/renderer/js/retromode.js`
- **UI Components**: Modify `public/index.html` and CSS files
- **File Formats**: Currently MP3-only by design for simplicity

## 📋 System Requirements

- **OS**: Windows, macOS, or Linux
- **Memory**: 200MB+ RAM
- **Disk**: 100MB free space
- **Audio**: Standard audio output device

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the package.json file for details.

## 🎯 Roadmap

- [ ] Additional audio formats (WAV, FLAC)
- [ ] Spectrum analyzer visualization
- [ ] More retro effect presets
- [ ] Keyboard shortcuts customization
- [ ] Skin/theme system
- [ ] Plugin architecture

## 🐛 Known Issues

- Large playlists (1000+ files) may cause UI lag
- Very high sample rate files might cause audio glitches

## 📞 Support

For issues, feature requests, or contributions, please use the GitHub issue tracker.

---

**Made with ❤️ for retro music lovers** 🎵📻