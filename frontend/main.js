import { SceneEngine } from './components/SceneEngine.js';

class AetherisApp {
    constructor() {
        this.sceneEngine = new SceneEngine('view3d');
        this.init();
    }

    async init() {
        console.log("Aetheris initialized");

        // Initial location (San Francisco)
        await this.sceneEngine.loadSite(37.7749, -122.4194);

        this.setupEventListeners();
    }

    setupEventListeners() {
        const searchInput = document.getElementById('site-search');
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchLocation(e.target.value);
            }
        });

        document.getElementById('place-volume').addEventListener('click', () => {
            this.sceneEngine.addDesignVolume();
        });

        const timeSlider = document.getElementById('time-slider');
        timeSlider.addEventListener('input', (e) => {
            const hour = parseFloat(e.target.value);
            const display = document.getElementById('time-display');
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const h = Math.floor(hour % 12) || 12;
            display.innerText = `${h}:00 ${ampm}`;
            this.sceneEngine.updateSunPosition(hour);
        });

        document.getElementById('generate-report').addEventListener('click', () => {
            this.generateAIAIReport();
        });

        document.getElementById('close-modal').addEventListener('click', () => {
            document.getElementById('report-modal').classList.add('hidden');
        });
    }

    async generateAIAIReport() {
        const solar = document.getElementById('solar-value').innerText;
        const airQuality = document.getElementById('aqi-value').innerText;

        const modal = document.getElementById('report-modal');
        const reportText = document.getElementById('report-text');

        modal.classList.remove('hidden');
        reportText.innerHTML = "<p>Architectural Intelligence AI is analyzing site data...</p>";

        try {
            const res = await fetch('/api/aiai/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ solar, airQuality, pollen: 'Moderate' })
            });
            const data = await res.json();

            // Simple markdown-to-html conversion for the demo
            reportText.innerHTML = data.suggestion.replace(/\n/g, '<br>').replace(/### (.*)/g, '<h3>$1</h3>').replace(/## (.*)/g, '<h2>$1</h2>');
        } catch (err) {
            reportText.innerHTML = "<p>Error generating report. Please check API keys.</p>";
        }
    }

    async searchLocation(query) {
        console.log(`Searching for: ${query}`);

        // Mocking lat/lng for now since we don't have Places API hooked up
        const lat = 37.7749;
        const lng = -122.4194;

        document.getElementById('solar-value').innerText = "Analyzing...";
        document.getElementById('aqi-value').innerText = "Measuring...";

        try {
            // Fetch Solar Data (Proxied)
            const solarRes = await fetch(`/api/solar/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}`);
            const solarData = await solarRes.json();

            if (solarData.solarPotential) {
                const maxPanels = solarData.solarPotential.maxArrayPanelsCount || 0;
                document.getElementById('solar-value').innerText = `${maxPanels} Panels Capable`;
            } else {
                document.getElementById('solar-value').innerText = "No Data";
            }

            // Fetch AQI Data (Proxied)
            const aqiRes = await fetch(`/api/airquality/currentConditions:lookup?location.latitude=${lat}&location.longitude=${lng}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ universalAqi: true })
            });
            const aqiData = await aqiRes.json();
            const aqi = aqiData.indexes?.[0]?.aqi || 0;
            document.getElementById('aqi-value').innerText = `${aqi} AQI`;

            // Update Particle Engine
            this.sceneEngine.atmosphericEngine.updateData(aqi);

        } catch (err) {
            console.error("API Error:", err);
            document.getElementById('solar-value').innerText = "Error";
            document.getElementById('aqi-value').innerText = "Error";
        }
    }
}

new AetherisApp();
