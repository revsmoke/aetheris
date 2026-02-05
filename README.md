# Aetheris | Environmental Design Intelligence

Aetheris is a next-generation web application for architects that makes clever use of Google Environments APIs to provide an immersive interface for virtual site exploration, environmental reporting, and real-time visualization.

## Features
- **3D Site Exploration**: High-fidelity navigation using Google Photorealistic 3D Tiles.
- **Volumetric Atmospheric Engines**: Real-time Air Quality (AQI) and Pollen visualization via WebGPU-powered particle systems.
- **Solar Intelligence**: Automated analysis of rooftop solar potential.
- **AIAI (Architectural Intelligence AI)**: Gemini-powered design suggestion reports based on site-specific environmental data.
- **Shadow Simulation**: Real-time time-of-day simulation for user-placed design volumes.

## Prerequisites
- [Deno](https://deno.land/) installed (v2.x recommended).
- Google Cloud API Key with the following enabled:
  - Photorealistic 3D Tiles API
  - Solar API
  - Air Quality API
  - Pollen API
- Google AI (Gemini) API Key.

## Setup & Implementation
1. **Clone the repository**:
   ```bash
   cd aetheris/
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in your API keys:
   ```bash
   cp .env.example .env
   ```

3. **Install Dependencies**:
   Deno will handle dependencies automatically on run, as defined in `deno.json`.

4. **Run the Application**:
   ```bash
   deno task dev
   ```

5. **Access the App**:
   Open [http://localhost:8000](http://localhost:8000) in a modern browser (Chrome or Edge recommended for WebGPU support).

## Tech Stack
- **Backend**: Deno, Hono (Server & Proxy).
- **Frontend**: Vanilla JS, Three.js (3D Engine), WebGPU (Particle Systems).
- **Styles**: Vanilla CSS (Glassmorphism design system).
