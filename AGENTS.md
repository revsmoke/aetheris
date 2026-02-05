# Aetheris | Agent Development Guide

Aetheris is an environmental design intelligence application for architects that integrates Google Environment APIs (Solar, Air Quality, Pollen) with 3D visualization using Google Photorealistic 3D Tiles.

## Project Overview

**Aetheris** provides:
- **3D Site Exploration**: Interactive navigation using Google Photorealistic 3D Tiles
- **Environmental Visualization**: Real-time Air Quality (AQI) and Pollen data via particle systems
- **Solar Analysis**: Rooftop solar potential assessment
- **AIAI Reports**: AI-powered design suggestions using Google's Gemini API
- **Shadow Simulation**: Time-of-day shadow casting for architectural volumes

## Technology Stack

### Backend
- **Runtime**: Deno v2.x
- **Framework**: Hono (lightweight web framework)
- **Server**: Deno.serve() native HTTP server

### Frontend
- **Language**: Vanilla JavaScript (ES Modules)
- **3D Engine**: Three.js v0.160.0
- **3D Tiles**: `3d-tiles-renderer` library
- **Styling**: Vanilla CSS with CSS custom properties
- **Design System**: Glassmorphism UI

### External APIs
- Google Photorealistic 3D Tiles API
- Google Solar API
- Google Air Quality API
- Google Pollen API
- Google Gemini API (for AIAI reports)

## Project Structure

```
├── server.ts              # Main Deno server with Hono routes
├── deno.json              # Deno configuration and tasks
├── deno.lock              # Dependency lock file
├── .env                   # Environment variables (NOT committed)
├── .env.example           # Environment template
├── frontend/              # Static frontend assets
│   ├── index.html         # Main HTML entry point
│   ├── main.js            # Application bootstrap and UI logic
│   ├── styles/
│   │   └── main.css       # Glassmorphism design system
│   └── components/
│       ├── SceneEngine.js      # Three.js scene and 3D tiles management
│       └── AtmosphericEngine.js # Particle system for environmental data
└── api/                   # Reserved for future API modules (currently empty)
```

## Development Setup

### Prerequisites
1. Install Deno v2.x: https://deno.land/
2. Obtain Google Cloud API Key with these APIs enabled:
   - Photorealistic 3D Tiles API
   - Solar API
   - Air Quality API
   - Pollen API
3. Obtain Google AI (Gemini) API Key

### Environment Configuration

Copy the example environment file and fill in your keys:

```bash
cp .env.example .env
```

Required variables in `.env`:
```
GOOGLE_MAPS_API_KEY=your_google_cloud_api_key
GEMINI_API_KEY=your_gemini_api_key
```

### Running the Application

```bash
# Development mode with auto-reload
deno task dev
```

This command (defined in `deno.json`):
- Runs with network, read, and environment permissions
- Watches files for changes
- Serves on http://localhost:8000

### Accessing the App

Open http://localhost:8000 in a modern browser (Chrome or Edge recommended for WebGPU support).

## Architecture Details

### Backend (server.ts)

The Hono application provides:

1. **API Proxies** (to protect API keys):
   - `GET /api/solar/*` → Proxies to Google Solar API
   - `GET /api/airquality/*` → Proxies to Google Air Quality API
   - `GET /api/pollen/*` → Proxies to Google Pollen API

2. **AIAI Report Generation**:
   - `POST /api/aiai/report` → Generates design suggestions via Gemini
   - Constructs prompt from solar, air quality, and pollen data
   - Returns Markdown-formatted recommendations

3. **Config Endpoint**:
   - `GET /api/config` → Exposes Google Maps API key to frontend

4. **Static File Serving**:
   - `/*` → Serves files from `./frontend` directory

### Frontend Components

#### SceneEngine.js
Manages the Three.js scene:
- Initializes renderer, camera, and lighting
- Loads Google Photorealistic 3D Tiles via `TilesRenderer`
- Handles window resize events
- Provides methods for:
  - `loadSite(lat, lng, apiKey)`: Load 3D tiles for coordinates
  - `addDesignVolume()`: Place architectural volume in scene
  - `updateSunPosition(hour)`: Animate sun for shadow simulation

#### AtmosphericEngine.js
Manages environmental visualization:
- Creates particle system (50,000 particles) using `THREE.Points`
- Updates particle color/opacity based on AQI values:
  - < 50: Neo-mint (green) - Good air quality
  - 50-100: Solar gold (yellow) - Moderate
  - > 100: Red - Poor air quality
- Falls back to Three.js Points if WebGPU unavailable

#### main.js
Application controller:
- Initializes SceneEngine with default location (San Francisco)
- Sets up event listeners for UI controls
- Handles location search and API data fetching
- Manages AIAI report generation and modal display

## Code Style Guidelines

### JavaScript
- Use ES Modules (`import`/`export`)
- Class-based architecture for components
- Async/await for asynchronous operations
- Single quotes for strings
- 4-space indentation

### CSS
- CSS custom properties for theming (defined in `:root`)
- Glassmorphism pattern: `backdrop-filter: blur(12px)`
- Color palette:
  - `--bg-dark: #0B0E14` (background)
  - `--neo-mint: #46D39A` (primary accent)
  - `--solar-gold: #FFD700` (secondary accent)

## Security Considerations

### API Key Protection
- **NEVER commit `.env` file** (it's in `.gitignore`)
- API keys are stored server-side only
- Frontend accesses Google Maps API key via `/api/config` endpoint
- All Google API calls go through backend proxies

### Environment Variables
The following are required:
- `GOOGLE_MAPS_API_KEY`: For 3D Tiles and Google Environment APIs
- `GEMINI_API_KEY`: For AIAI report generation

### CORS and Permissions
The Deno server runs with these permissions:
- `--allow-net`: Network access for API calls
- `--allow-read`: File system access for static assets
- `--allow-env`: Environment variable access
- `--env`: Load `.env` file automatically

## Testing Strategy

Currently, the project does not have automated tests. When adding tests:

1. **Backend**: Use Deno's built-in test runner
   ```bash
   deno test --allow-net --allow-env
   ```

2. **Frontend**: Consider adding a test framework like Vitest or Playwright for E2E testing

## Deployment Notes

The application is designed to run as a single Deno process serving both API and static assets. For production:

1. Set environment variables in your hosting platform
2. Ensure Deno has read access to the `frontend` directory
3. Consider using a reverse proxy (nginx, etc.) for SSL termination
4. The application listens on the default port (8000) via `Deno.serve()`

## Common Development Tasks

### Adding a New API Endpoint
1. Add route handler in `server.ts`
2. Follow existing proxy pattern for Google APIs
3. Update frontend to consume the new endpoint

### Modifying the 3D Scene
1. Edit `frontend/components/SceneEngine.js`
2. Scene uses Three.js - refer to Three.js documentation
3. Ensure proper cleanup (dispose geometries/materials) to prevent memory leaks

### Styling Changes
1. CSS variables in `frontend/styles/main.css` control the theme
2. The `.glass` class provides the glassmorphism effect
3. Keep UI elements within `#ui-overlay` for proper z-indexing

## Dependencies

### Runtime Dependencies (via esm.sh in frontend)
- `three@0.160.0` - 3D graphics library
- `3d-tiles-renderer@0.3.26` - 3D Tiles rendering

### Backend Dependencies (via JSR)
- `@hono/hono@^4.4.7` - Web framework

No `node_modules` or `package.json` - this is a Deno-native project.
