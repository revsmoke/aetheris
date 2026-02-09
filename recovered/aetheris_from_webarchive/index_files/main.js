/**
 * AETHERIS - Environmental Design Intelligence
 * Main Application Entry Point
 */

import { SceneEngine } from './components/SceneEngine.js';
import { AtmosphericEngine } from './components/AtmosphericEngine.js';
import { SolarEngine } from './components/SolarEngine.js';
import { DesignEngine } from './components/DesignEngine.js';

class AetherisApp {
    constructor() {
        this.apiKey = '';
        this.currentLat = 37.7749;
        this.currentLng = -122.4194;
        this.currentLocation = 'San Francisco, CA';
        this.siteData = null;
        
        // Sub-engines
        this.sceneEngine = null;
        this.atmosphericEngine = null;
        this.solarEngine = null;
        this.designEngine = null;
        
        // State
        this.activeView = 'explore';
        this.layers = {
            solar: false,
            air: false,
            pollen: false,
            shadows: true
        };
        
        this.init();
    }

    async init() {
        console.log('🌅 Aetheris initializing...');
        
        // Show loading screen
        await this.simulateLoading();
        
        // Fetch API config
        try {
            const res = await fetch('/api/config');
            const config = await res.json();
            this.apiKey = config.googleMapsApiKey;
        } catch (e) {
            console.error('Failed to fetch config:', e);
            this.showToast('Warning: API configuration error', 'error');
        }
        
        // Initialize 3D engines
        this.initializeEngines();
        
        // Setup UI
        this.setupEventListeners();
        this.setupPanelToggles();
        
        // Load initial site
        await this.loadSite(this.currentLat, this.currentLng);
        
        // Hide loading screen
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        
        console.log('✨ Aetheris ready');
        this.showToast('Welcome to Aetheris - Environmental Design Intelligence');
    }

    async simulateLoading() {
        const statuses = [
            'Initializing visualization engine...',
            'Connecting to environmental data sources...',
            'Loading photorealistic 3D tiles...',
            'Preparing atmospheric systems...',
            'Calibrating solar analysis...',
            'Ready to explore'
        ];
        
        const statusEl = document.querySelector('.loading-status');
        
        for (let i = 0; i < statuses.length; i++) {
            if (statusEl) statusEl.textContent = statuses[i];
            await this.delay(400);
        }
    }

    initializeEngines() {
        // Main 3D scene
        this.sceneEngine = new SceneEngine('view3d', this.apiKey);
        
        // Atmospheric visualization
        this.atmosphericEngine = new AtmosphericEngine(this.sceneEngine.scene);
        
        // Solar analysis
        this.solarEngine = new SolarEngine(this.sceneEngine.scene);
        
        // Design tools
        this.designEngine = new DesignEngine(this.sceneEngine.scene);
        
        // Connect engines
        this.sceneEngine.setAtmosphericEngine(this.atmosphericEngine);
        this.sceneEngine.setSolarEngine(this.solarEngine);
        this.sceneEngine.setDesignEngine(this.designEngine);
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });

        // Site search
        const searchInput = document.getElementById('site-search');
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch(searchInput.value);
            }
        });

        document.getElementById('search-btn').addEventListener('click', () => {
            this.handleSearch(searchInput.value);
        });

        // Quick location chips
        document.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const lat = parseFloat(chip.dataset.lat);
                const lng = parseFloat(chip.dataset.lng);
                this.currentLocation = chip.textContent;
                searchInput.value = chip.textContent;
                this.loadSite(lat, lng);
            });
        });

        // Time controls
        const timeSlider = document.getElementById('time-slider');
        timeSlider.addEventListener('input', (e) => {
            this.updateTime(parseFloat(e.target.value));
        });

        document.getElementById('date-picker').addEventListener('change', () => {
            this.updateSunPosition();
        });

        document.getElementById('play-day').addEventListener('click', () => {
            this.animateDay();
        });

        // Design controls
        document.getElementById('place-volume').addEventListener('click', () => {
            this.placeDesignVolume();
        });

        document.getElementById('clear-volumes').addEventListener('click', () => {
            this.clearDesignVolumes();
        });

        // Volume property controls
        ['width', 'depth', 'height', 'rotation'].forEach(prop => {
            const slider = document.getElementById(`vol-${prop}`);
            if (slider) {
                slider.addEventListener('input', (e) => {
                    const val = parseFloat(e.target.value);
                    document.getElementById(`vol-${prop}-val`).textContent = 
                        prop === 'rotation' ? `${val}°` : `${val}m`;
                    this.updateDesignVolume(prop, val);
                });
            }
        });

        // Layer toggles
        document.getElementById('toggle-solar').addEventListener('click', (e) => {
            this.toggleLayer('solar', e.currentTarget);
        });

        document.getElementById('toggle-air').addEventListener('click', (e) => {
            this.toggleLayer('air', e.currentTarget);
        });

        document.getElementById('toggle-pollen').addEventListener('click', (e) => {
            this.toggleLayer('pollen', e.currentTarget);
        });

        document.getElementById('toggle-shadows').addEventListener('click', (e) => {
            this.toggleLayer('shadows', e.currentTarget);
        });

        // Report generation
        document.getElementById('generate-report').addEventListener('click', () => {
            this.generateReport();
        });

        // Presentation mode
        document.getElementById('presentation-mode').addEventListener('click', () => {
            this.togglePresentationMode();
        });

        document.getElementById('close-modal').addEventListener('click', () => {
            this.closeModal();
        });

        document.querySelector('.modal-backdrop').addEventListener('click', () => {
            this.closeModal();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (document.body.classList.contains('presentation-mode')) {
                    this.togglePresentationMode();
                } else {
                    this.closeModal();
                }
            }
            if (e.key === 'p' || e.key === 'P') {
                this.togglePresentationMode();
            }
        });
    }

    setupPanelToggles() {
        document.querySelectorAll('.panel-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const panel = e.currentTarget.closest('.dock-panel');
                this.togglePanel(panel);
            });
        });
    }

    togglePanel(panel) {
        if (!panel) return;
        
        const isCollapsed = panel.classList.contains('collapsed');
        const panelGroup = panel.dataset.panelGroup;
        
        if (isCollapsed) {
            // Expanding this panel - collapse others in same group
            if (panelGroup) {
                document.querySelectorAll(`.dock-panel[data-panel-group="${panelGroup}"]`).forEach(p => {
                    if (p !== panel) p.classList.add('collapsed');
                });
            }
            panel.classList.remove('collapsed');
        } else {
            // Collapsing this panel
            panel.classList.add('collapsed');
        }
    }

    switchView(view) {
        this.activeView = view;
        
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        // Get target panel from nav button
        const activeBtn = document.querySelector(`.nav-btn[data-view="${view}"]`);
        const targetPanelId = activeBtn?.dataset.panel;
        
        // Smart panel management - collapse others on same side, expand target
        if (targetPanelId) {
            const targetPanel = document.getElementById(targetPanelId);
            if (targetPanel) {
                const panelGroup = targetPanel.dataset.panelGroup;
                
                // Collapse others in same group
                if (panelGroup) {
                    document.querySelectorAll(`.dock-panel[data-panel-group="${panelGroup}"]`).forEach(p => {
                        p.classList.add('collapsed');
                    });
                }
                
                // Expand target
                targetPanel.classList.remove('collapsed');
            }
        }
        
        // Auto-expand time panel for solar view
        if (view === 'solar') {
            document.getElementById('time-panel').classList.remove('collapsed');
        }
    }

    async handleSearch(query) {
        if (!query.trim()) return;
        
        this.showToast(`Searching for "${query}"...`);
        
        // Use geocoding API to get coordinates
        try {
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${this.apiKey}`
            );
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                const location = data.results[0].geometry.location;
                this.currentLocation = data.results[0].formatted_address;
                await this.loadSite(location.lat, location.lng);
            } else {
                this.showToast('Location not found. Try a different search.', 'error');
            }
        } catch (err) {
            console.error('Geocoding error:', err);
            this.showToast('Search error. Please try again.', 'error');
        }
    }

    async loadSite(lat, lng) {
        this.currentLat = lat;
        this.currentLng = lng;
        
        console.log(`📍 Loading site: ${lat}, ${lng}`);
        
        // Update coordinates display
        document.getElementById('site-coords').textContent = 
            `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        
        // Show site info panel
        document.getElementById('site-info').classList.remove('hidden');
        
        // Load 3D tiles
        await this.sceneEngine.loadSite(lat, lng);
        
        // Fetch environmental data in parallel
        await Promise.all([
            this.fetchSolarData(lat, lng),
            this.fetchAirQualityData(lat, lng),
            this.fetchPollenData(lat, lng)
        ]);
        
        this.showToast(`Site loaded: ${this.currentLocation}`);
    }

    async fetchSolarData(lat, lng) {
        try {
            const response = await fetch(
                `/api/solar/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&requiredQuality=HIGH`
            );
            const data = await response.json();
            
            if (data.solarPotential) {
                this.siteData = { ...this.siteData, solar: data };
                this.updateSolarUI(data);
                this.solarEngine.setSolarData(data);
                
                // Update imagery date
                if (data.imageryDate) {
                    const date = `${data.imageryDate.year}-${String(data.imageryDate.month).padStart(2, '0')}-${String(data.imageryDate.day).padStart(2, '0')}`;
                    document.getElementById('site-imagery-date').textContent = date;
                }
                
                // Update quality badge
                const qualityBadge = document.getElementById('site-quality');
                qualityBadge.textContent = data.imageryQuality || 'HIGH';
                qualityBadge.className = 'info-value quality-badge';
            }
        } catch (err) {
            console.error('Solar API error:', err);
        }
    }

    updateSolarUI(data) {
        const solar = data.solarPotential;
        
        document.getElementById('solar-panels').textContent = 
            solar.maxArrayPanelsCount?.toLocaleString() || '--';
        document.getElementById('solar-hours').textContent = 
            solar.maxSunshineHoursPerYear?.toLocaleString() || '--';
        
        // Calculate potential energy (rough estimate)
        const panelWatts = solar.panelCapacityWatts || 400;
        const sunshineHours = solar.maxSunshineHoursPerYear || 1500;
        const panelCount = solar.maxArrayPanelsCount || 0;
        const yearlyKwh = (panelCount * panelWatts * sunshineHours) / 1000;
        const yearlyMwh = (yearlyKwh / 1000).toFixed(1);
        
        document.getElementById('solar-energy').textContent = yearlyMwh;
    }

    async fetchAirQualityData(lat, lng) {
        try {
            const response = await fetch('/api/airquality/currentConditions:lookup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    location: { latitude: lat, longitude: lng },
                    universalAqi: true,
                    extraComputations: ['HEALTH_RECOMMENDATIONS', 'DOMINANT_POLLUTANT_CONCENTRATION']
                })
            });
            const data = await response.json();
            
            this.siteData = { ...this.siteData, airQuality: data };
            this.updateAirQualityUI(data);
            this.atmosphericEngine.setAirQualityData(data);
        } catch (err) {
            console.error('Air Quality API error:', err);
        }
    }

    updateAirQualityUI(data) {
        const index = data.indexes?.[0];
        if (!index) return;
        
        const aqi = index.aqi || 0;
        const category = index.category || 'Unknown';
        const pollutant = index.dominantPollutant || '--';
        
        // Update AQI number
        document.getElementById('aqi-number').textContent = aqi;
        document.getElementById('aqi-category').textContent = category;
        document.getElementById('aqi-pollutant').textContent = 
            pollutant !== '--' ? `Primary: ${pollutant.toUpperCase()}` : '';
        
        // Update ring progress
        const maxAqi = 200;
        const percentage = Math.min(aqi / maxAqi, 1);
        const circumference = 2 * Math.PI * 45;
        const offset = circumference - (percentage * circumference);
        
        const progressEl = document.getElementById('aqi-progress');
        if (progressEl) {
            progressEl.style.strokeDashoffset = offset;
        }
        
        // Color code the ring
        const ringEl = document.getElementById('aqi-ring');
        let color = '#4ade80'; // Good - green
        if (aqi > 50) color = '#fbbf24'; // Moderate - yellow
        if (aqi > 100) color = '#f87171'; // Unhealthy - red
        if (aqi > 150) color = '#a78bfa'; // Very unhealthy - purple
        
        if (ringEl) {
            ringEl.style.color = color;
        }
        
        // Health recommendation
        const healthRec = data.healthRecommendations?.generalPopulation;
        if (healthRec) {
            document.querySelector('.rec-text').textContent = healthRec;
        }
    }

    async fetchPollenData(lat, lng) {
        try {
            const response = await fetch(
                `/api/pollen/forecast:lookup?location.latitude=${lat}&location.longitude=${lng}&days=1`
            );
            const data = await response.json();
            
            this.siteData = { ...this.siteData, pollen: data };
            this.updatePollenUI(data);
            this.atmosphericEngine.setPollenData(data);
        } catch (err) {
            console.error('Pollen API error:', err);
        }
    }

    updatePollenUI(data) {
        const dailyInfo = data.dailyInfo?.[0];
        if (!dailyInfo) return;
        
        const types = ['GRASS', 'TREE', 'WEED'];
        const ids = ['pollen-grass', 'pollen-tree', 'pollen-weed'];
        const levelIds = ['pollen-grass-level', 'pollen-tree-level', 'pollen-weed-level'];
        
        types.forEach((type, i) => {
            const typeInfo = dailyInfo.pollenTypeInfo?.find(t => t.code === type);
            if (typeInfo?.indexInfo) {
                const value = typeInfo.indexInfo.value || 0;
                const category = typeInfo.indexInfo.category || 'None';
                const maxValue = 5;
                const percentage = (value / maxValue) * 100;
                
                const bar = document.getElementById(ids[i]);
                const level = document.getElementById(levelIds[i]);
                
                if (bar) bar.style.width = `${percentage}%`;
                if (level) level.textContent = category;
            }
        });
    }

    updateTime(hour) {
        const display = document.getElementById('time-value');
        const period = document.getElementById('time-period');
        
        const h = Math.floor(hour);
        const m = Math.floor((hour - h) * 60);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 || 12;
        const displayM = String(m).padStart(2, '0');
        
        display.textContent = `${displayH}:${displayM}`;
        period.textContent = ampm;
        
        // Update fill bar
        const min = 6, max = 20;
        const percentage = ((hour - min) / (max - min)) * 100;
        document.getElementById('time-fill').style.width = `${percentage}%`;
        
        // Update sun position
        this.updateSunPosition();
    }

    updateSunPosition() {
        const timeSlider = document.getElementById('time-slider');
        const datePicker = document.getElementById('date-picker');
        
        const hour = parseFloat(timeSlider.value);
        const date = new Date(datePicker.value);
        date.setHours(Math.floor(hour), (hour % 1) * 60);
        
        // Update scene sun
        const sunInfo = this.sceneEngine.updateSunPosition(date, this.currentLat, this.currentLng);
        
        if (sunInfo) {
            document.getElementById('sun-altitude').textContent = 
                `${sunInfo.altitude.toFixed(1)}°`;
            document.getElementById('sun-azimuth').textContent = 
                `${sunInfo.azimuth.toFixed(1)}°`;
        }
    }

    animateDay() {
        const slider = document.getElementById('time-slider');
        let hour = parseFloat(slider.value);
        const speed = 0.05; // hours per frame
        
        const animate = () => {
            hour += speed;
            if (hour > 20) hour = 6;
            
            slider.value = hour;
            this.updateTime(hour);
            
            if (hour < 20) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    toggleLayer(layer, button) {
        this.layers[layer] = !this.layers[layer];
        button.classList.toggle('active', this.layers[layer]);
        
        switch (layer) {
            case 'solar':
                this.solarEngine.setVisible(this.layers.solar);
                break;
            case 'air':
                this.atmosphericEngine.setAirQualityVisible(this.layers.air);
                break;
            case 'pollen':
                this.atmosphericEngine.setPollenVisible(this.layers.pollen);
                break;
            case 'shadows':
                this.sceneEngine.setShadowsEnabled(this.layers.shadows);
                break;
        }
        
        const status = this.layers[layer] ? 'enabled' : 'disabled';
        this.showToast(`${layer.charAt(0).toUpperCase() + layer.slice(1)} layer ${status}`);
    }

    placeDesignVolume() {
        this.designEngine.addVolume();
        document.getElementById('volume-controls').classList.remove('hidden');
        this.showToast('Design volume placed. Use controls to adjust.');
    }

    updateDesignVolume(property, value) {
        this.designEngine.updateVolume(property, value);
    }

    clearDesignVolumes() {
        this.designEngine.clearVolumes();
        document.getElementById('volume-controls').classList.add('hidden');
        this.showToast('All design volumes cleared');
    }

    async generateReport() {
        const modal = document.getElementById('report-modal');
        const loadingEl = document.getElementById('report-loading');
        const contentEl = document.getElementById('report-content');
        
        modal.classList.remove('hidden');
        loadingEl.classList.remove('hidden');
        contentEl.classList.add('hidden');
        contentEl.innerHTML = '';
        
        try {
            const solar = this.siteData?.solar?.solarPotential;
            const airQuality = this.siteData?.airQuality;
            const pollen = this.siteData?.pollen;
            
            const response = await fetch('/api/aiai/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    location: this.currentLocation,
                    coordinates: { lat: this.currentLat, lng: this.currentLng },
                    solar: solar ? {
                        maxPanels: solar.maxArrayPanelsCount,
                        sunshineHours: solar.maxSunshineHoursPerYear,
                        roofSegments: solar.roofSegmentStats?.length || 0
                    } : null,
                    airQuality: airQuality ? {
                        aqi: airQuality.indexes?.[0]?.aqi,
                        category: airQuality.indexes?.[0]?.category,
                        dominantPollutant: airQuality.indexes?.[0]?.dominantPollutant
                    } : null,
                    pollen: pollen ? {
                        grass: pollen.dailyInfo?.[0]?.pollenTypeInfo?.find(t => t.code === 'GRASS')?.indexInfo?.category,
                        tree: pollen.dailyInfo?.[0]?.pollenTypeInfo?.find(t => t.code === 'TREE')?.indexInfo?.category,
                        weed: pollen.dailyInfo?.[0]?.pollenTypeInfo?.find(t => t.code === 'WEED')?.indexInfo?.category
                    } : null
                })
            });
            
            const data = await response.json();
            
            // Convert markdown-like to HTML
            let html = data.suggestion
                .replace(/^# (.*$)/gm, '<h2>$1</h2>')
                .replace(/^## (.*$)/gm, '<h3>$1</h3>')
                .replace(/^### (.*$)/gm, '<h4>$1</h4>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/^- (.*$)/gm, '<li>$1</li>')
                .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br>');
            
            // Wrap in paragraphs if not already
            if (!html.startsWith('<')) {
                html = `<p>${html}</p>`;
            }
            
            contentEl.innerHTML = html;
            loadingEl.classList.add('hidden');
            contentEl.classList.remove('hidden');
            
        } catch (err) {
            console.error('Report generation error:', err);
            contentEl.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <p style="color: var(--accent-danger);">Error generating report</p>
                    <p style="color: var(--text-muted);">Please check your API configuration and try again.</p>
                </div>
            `;
            loadingEl.classList.add('hidden');
            contentEl.classList.remove('hidden');
        }
    }

    closeModal() {
        document.getElementById('report-modal').classList.add('hidden');
    }

    togglePresentationMode() {
        const isPresentation = document.body.classList.toggle('presentation-mode');
        
        if (isPresentation) {
            // Collapse all panels
            document.querySelectorAll('.dock-panel').forEach(panel => {
                panel.classList.add('collapsed');
            });
            this.showToast('Presentation mode - Press ESC or P to exit');
        } else {
            // Restore default view
            document.getElementById('site-panel').classList.remove('collapsed');
            this.showToast('Exited presentation mode');
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.aetheris = new AetherisApp();
});
