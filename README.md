#  YouTube Downloader

A modern, full-featured YouTube downloader web application built with Next.js 16, featuring real-time download progress tracking, dark/light mode, and a professional UI.

##  Features

-  **YouTube Search** - Search for videos directly within the app
-  **Video Preview** - View thumbnails, titles, channels, and duration
-  **Multiple Formats** - Download as MP3 (audio) or MP4 (video)
-  **Quality Selection** - Choose from various quality options
  - MP4: 1080p, 720p, 480p, 360p
  - MP3: 320kbps, 192kbps, 128kbps
-  **Real-Time Progress** - Live download progress tracking with SSE
-  **Dark/Light Mode** - Toggle between themes with smooth transitions
-  **Responsive Design** - Works on desktop, tablet, and mobile
-  **Modern Stack** - Built with Next.js 16, React 19, TypeScript, and Tailwind CSS v4
-  **Professional UI** - Clean, modern dashboard-style interface

##  Tech Stack

- **Framework:** Next.js 16.1.6 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** Lucide React (icons)
- **YouTube Integration:** ytdl-core, youtube-search-api
- **Theme Management:** next-themes
- **Progress Tracking:** Server-Sent Events (SSE)

##  Prerequisites

- Node.js 18+ and npm
- Internet connection for YouTube API access

##  Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd d:\Programming\NextJS\yt-downloader
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

##  Usage

1. **Search for Videos**
   - Enter a search query in the search bar
   - Click the search button or press Enter
   - Browse through the results displayed as cards

2. **Select a Video**
   - Click on any video card to select it
   - The card will highlight with a red border

3. **Choose Download Options**
   - Select format: MP3 (audio only) or MP4 (video)
   - Choose quality from the dropdown
   - Quality options update automatically based on format

4. **Download**
   - Click "Start Download" button
   - Watch real-time progress bar
   - When complete, click "Download Complete - Click to Save"
   - File will be downloaded to your browser's download folder

##  Project Structure

```
yt-downloader/
 app/
    api/
       search/
          route.ts          # YouTube search endpoint
       download/
          route.ts          # Download with SSE progress
          file/
              route.ts      # File delivery endpoint
       playlist/
           route.ts          # Playlist support (placeholder)
    components/
       SearchBar.tsx         # Search input component
       VideoCard.tsx         # Video result card
       FormatSelector.tsx    # MP3/MP4 selector
       QualitySelector.tsx   # Quality dropdown
       ProgressBar.tsx       # Download progress
       ThemeToggle.tsx       # Dark/light mode toggle
       ThemeProvider.tsx     # Theme context provider
    globals.css               # Global styles + Tailwind
    layout.tsx                # Root layout with theme
    page.tsx                  # Main application page
 lib/
    types.ts                  # TypeScript interfaces
 public/                       # Static assets
 next.config.ts                # Next.js configuration
 tsconfig.json                 # TypeScript configuration
 package.json                  # Dependencies
 README.md                     # This file
```

##  Features Breakdown

### Search Functionality
- Uses `youtube-search-api` for no-API-key searching
- Returns video ID, title, thumbnail, channel, and duration
- Displays results in a responsive grid layout

### Download System
- **Backend:** Uses `ytdl-core` for video/audio extraction
- **Progress Tracking:** Server-Sent Events (SSE) stream
- **File Management:** Temporary storage in OS temp directory
- **Auto-Cleanup:** Files deleted after 5 minutes

### Real-Time Progress
- SSE connection streams download progress
- Updates include:
  - Percentage complete
  - Downloaded/total bytes
  - Download speed (when available)
  - ETA (when available)

### Theme System
- Uses `next-themes` for theme management
- Supports system preference detection
- Smooth transitions between modes
- Persistent across sessions

##  Important Notes

### Limitations

1. **Quality Selection:** Actual quality depends on video availability
2. **File Size:** Large videos may take time to process
3. **Temporary Storage:** Downloaded files are cleaned up automatically
4. **Rate Limiting:** YouTube may rate limit requests
5. **Copyright:** Only download content you have rights to use

### Development vs Production

- **Development:** Uses ytdl-core which works for most videos
- **Production Considerations:**
  - Consider using yt-dlp for better compatibility
  - Implement proper error handling and logging
  - Add rate limiting and request queuing
  - Consider external storage (S3, Azure Blob)
  - May need YouTube Data API for search (requires API key)

##  Configuration

### Environment Variables (Optional)

Create a `.env.local` file for configuration:

```env
# YouTube Data API (if switching from youtube-search-api)
YOUTUBE_API_KEY=your_api_key_here

# Storage configuration
TEMP_DIR=/tmp
CLEANUP_INTERVAL=300000
```

##  Troubleshooting

**Issue:** Videos won't download
- Check internet connection
- Try a different video
- Some videos may have restrictions

**Issue:** Search returns no results
- Verify search query
- Check network connectivity
- YouTube API may be rate limiting

**Issue:** Dark mode not working
- Clear browser cache
- Check if JavaScript is enabled

##  Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint
```

##  Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

**Note:** Vercel's serverless functions have execution time limits. For production, consider:
- Using a dedicated backend server for downloads
- Implementing queue system for long downloads
- External storage for files

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

##  Legal & Compliance

This tool is for educational purposes. Users must:
- Respect copyright laws
- Only download content they have rights to
- Comply with YouTube's Terms of Service
- Not use for commercial purposes without permission

##  Contributing

Feel free to submit issues and enhancement requests!

##  License

This project is for educational purposes. Use responsibly.

##  Acknowledgments

- Next.js team for the amazing framework
- ytdl-core for YouTube download capabilities
- Tailwind CSS for the styling system
- Lucide for beautiful icons

---

**Built with  using Next.js 16**
