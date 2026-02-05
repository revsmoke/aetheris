import * as THREE from 'https://cdn.skypack.dev/three@0.160.0';
import { TilesRenderer } from 'https://cdn.skypack.dev/3d-tiles-renderer@0.3.26';
import { AtmosphericEngine } from './AtmosphericEngine.js';

export class SceneEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.init();
    }

    init() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

        this.camera.position.set(0, 100, 200);
        this.camera.lookAt(0, 0, 0);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
        sunLight.position.set(100, 200, 100);
        sunLight.castShadow = true;
        this.scene.add(sunLight);
        this.sunLight = sunLight;

        this.atmosphericEngine = new AtmosphericEngine(this.scene, this.renderer);

        this.animate();
        window.addEventListener('resize', () => this.onResize());
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.tiles) this.tiles.update();
        if (this.atmosphericEngine) this.atmosphericEngine.animate();
        this.renderer.render(this.scene, this.camera);
    }

    async loadSite(lat, lng) {
        console.log(`Loading site: ${lat}, ${lng}`);

        if (this.tiles) {
            this.scene.remove(this.tiles.group);
            this.tiles.dispose();
        }

        // Google Photorealistic 3D Tiles URL (example proxy)
        const tilesUrl = `https://tile.googleapis.com/v1/3dtiles/datasets/google-photorealistic-3d-tiles/tileset.json?key=YOUR_API_KEY`;
        // Note: For real use, this should be proxied or use the correct API key logic.
        // For the demo, we will use a public 3D tileset or maintain the placeholder if key is missing.

        this.tiles = new TilesRenderer(tilesUrl);
        this.tiles.setCamera(this.camera);
        this.tiles.setResolutionFromRenderer(this.renderer);
        this.scene.add(this.tiles.group);

        // Position adjustment for lat/lng (simplified)
        this.tiles.group.rotation.x = -Math.PI / 2;

        // Ground for shadows
        const groundGeo = new THREE.PlaneGeometry(1000, 1000);
        const groundMat = new THREE.ShadowMaterial({ opacity: 0.4 });
        this.ground = new THREE.Mesh(groundGeo, groundMat);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);
    }

    addDesignVolume() {
        const geometry = new THREE.BoxGeometry(20, 50, 20);
        const material = new THREE.MeshStandardMaterial({ color: 'var(--neo-mint)' }); // Corrected color string
        const box = new THREE.Mesh(geometry, material);
        box.position.set(0, 25, 0);
        box.castShadow = true;
        this.scene.add(box);
    }

    updateSunPosition(hour) {
        const theta = (hour / 24) * Math.PI * 2;
        const x = Math.cos(theta) * 200;
        const y = Math.sin(theta) * 200;
        this.sunLight.position.set(x, y, 50);
    }
}
