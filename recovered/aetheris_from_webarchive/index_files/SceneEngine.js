/**
 * SceneEngine - Core 3D Visualization Engine
 * Handles Three.js setup, Google 3D Tiles, lighting, and camera
 */

import * as THREE from 'three';
import { TilesRenderer } from '3d-tiles-renderer';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as SunCalc from 'suncalc';

export class SceneEngine {
    constructor(canvasId, apiKey) {
        this.canvas = document.getElementById(canvasId);
        this.apiKey = apiKey;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.tiles = null;
        
        // Sub-engines
        this.atmosphericEngine = null;
        this.solarEngine = null;
        this.designEngine = null;
        
        // Lighting
        this.sunLight = null;
        this.ambientLight = null;
        this.hemisphereLight = null;
        
        // State
        this.shadowsEnabled = true;
        this.currentSitePosition = new THREE.Vector3();
        
        this.init();
    }

    init() {
        // Scene setup - lighter background for better visibility
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1f2e);
        this.scene.fog = new THREE.FogExp2(0x1a1f2e, 0.0002);
        
        // Camera
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100000);
        this.camera.position.set(200, 150, 200);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        
        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevent going under ground
        this.controls.minDistance = 10;
        this.controls.maxDistance = 2000;
        this.controls.target.set(0, 0, 0);
        
        // Lighting setup
        this.setupLighting();
        
        // Ground plane for shadows
        this.setupGroundPlane();
        
        // Event listeners
        window.addEventListener('resize', () => this.onResize());
        
        // Start render loop
        this.animate();
        
        console.log('🎬 SceneEngine initialized');
    }

    setupLighting() {
        // Ambient light (base illumination)
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(this.ambientLight);
        
        // Hemisphere light (sky/ground ambient)
        this.hemisphereLight = new THREE.HemisphereLight(
            0x87ceeb, // Sky color
            0x362d1d, // Ground color
            0.4
        );
        this.scene.add(this.hemisphereLight);
        
        // Directional sun light with shadows
        this.sunLight = new THREE.DirectionalLight(0xfff4e6, 1.5);
        this.sunLight.position.set(100, 200, 100);
        this.sunLight.castShadow = true;
        
        // Shadow properties
        this.sunLight.shadow.mapSize.width = 4096;
        this.sunLight.shadow.mapSize.height = 4096;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 1000;
        this.sunLight.shadow.camera.left = -300;
        this.sunLight.shadow.camera.right = 300;
        this.sunLight.shadow.camera.top = 300;
        this.sunLight.shadow.camera.bottom = -300;
        this.sunLight.shadow.bias = -0.0001;
        this.sunLight.shadow.radius = 2; // Soft shadows
        
        this.scene.add(this.sunLight);
        this.scene.add(this.sunLight.target);
    }

    setupGroundPlane() {
        // Large invisible plane to catch shadows
        const geometry = new THREE.PlaneGeometry(2000, 2000);
        const material = new THREE.ShadowMaterial({ 
            opacity: 0.3,
            color: 0x000000
        });
        this.groundPlane = new THREE.Mesh(geometry, material);
        this.groundPlane.rotation.x = -Math.PI / 2;
        this.groundPlane.position.y = -0.1;
        this.groundPlane.receiveShadow = true;
        this.scene.add(this.groundPlane);
        
        // Grid helper for reference (subtle)
        this.gridHelper = new THREE.GridHelper(1000, 50, 0x333333, 0x1a1a1a);
        this.gridHelper.position.y = 0.01;
        this.gridHelper.material.opacity = 0.3;
        this.gridHelper.material.transparent = true;
        this.scene.add(this.gridHelper);
    }

    setAtmosphericEngine(engine) {
        this.atmosphericEngine = engine;
    }

    setSolarEngine(engine) {
        this.solarEngine = engine;
    }

    setDesignEngine(engine) {
        this.designEngine = engine;
    }

    async loadSite(lat, lng) {
        console.log(`🌍 Loading site: ${lat}, ${lng}`);
        
        // Remove existing tiles
        if (this.tiles) {
            this.scene.remove(this.tiles.group);
            this.tiles.dispose();
            this.tiles = null;
        }
        
        if (!this.apiKey) {
            console.error('No API key available');
            return;
        }
        
        try {
            // Initialize 3D Tiles renderer
            const tilesUrl = 'https://tile.googleapis.com/v1/3dtiles/root.json';
            this.tiles = new TilesRenderer(tilesUrl);
            
            // Add API key to tile requests
            this.tiles.preprocessURL = (uri) => {
                const url = new URL(uri);
                url.searchParams.append('key', this.apiKey);
                return url.toString();
            };
            
            this.tiles.setCamera(this.camera);
            this.tiles.setResolutionFromRenderer(this.camera, this.renderer);
            
            // Error handling
            this.tiles.addEventListener('load-error', (ev) => {
                console.warn('Tile load error:', ev.message);
            });
            
            // Adjust orientation and position
            this.tiles.group.rotation.x = -Math.PI / 2;
            
            // Position the tiles at the requested location
            // This is a simplified positioning - in production you'd use proper geospatial transforms
            this.currentSitePosition.set(0, 0, 0);
            
            this.scene.add(this.tiles.group);
            
            // Update camera to look at site
            this.controls.target.copy(this.currentSitePosition);
            this.controls.update();
            
            console.log('✅ 3D Tiles loaded');
            
        } catch (err) {
            console.error('Error loading 3D tiles:', err);
        }
    }

    updateSunPosition(date, lat, lng) {
        if (!this.sunLight) return null;
        
        // Calculate sun position using SunCalc
        const sunPos = SunCalc.getPosition(date, lat, lng);
        
        // Convert to Cartesian coordinates
        const radius = 500;
        const phi = Math.PI / 2 - sunPos.altitude;
        const theta = sunPos.azimuth + Math.PI;
        
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);
        
        this.sunLight.position.set(x, y, z);
        this.sunLight.target.position.set(0, 0, 0);
        this.sunLight.target.updateMatrixWorld();
        
        // Adjust light properties based on sun altitude
        const altitudeDeg = sunPos.altitude * 180 / Math.PI;
        
        if (altitudeDeg > 0) {
            // Daytime
            const intensity = Math.max(0.3, Math.sin(sunPos.altitude));
            this.sunLight.intensity = intensity * 1.5;
            
            // Color temperature shifts with altitude
            const hue = 0.08 + Math.max(0, (1 - intensity) * 0.04);
            const saturation = 0.8 - Math.max(0, (1 - intensity) * 0.3);
            this.sunLight.color.setHSL(hue, saturation, 0.5 + intensity * 0.5);
            
            // Ambient light follows sun
            this.ambientLight.intensity = 0.2 + intensity * 0.3;
            this.hemisphereLight.intensity = 0.3 + intensity * 0.3;
        } else {
            // Nighttime
            this.sunLight.intensity = 0.1;
            this.sunLight.color.setHex(0x4444ff);
            this.ambientLight.intensity = 0.1;
            this.hemisphereLight.intensity = 0.1;
        }
        
        // Notify sub-engines
        if (this.solarEngine) {
            this.solarEngine.onSunPositionChange(sunPos);
        }
        
        if (this.designEngine) {
            this.designEngine.onSunPositionChange(this.sunLight);
        }
        
        return {
            altitude: altitudeDeg,
            azimuth: (sunPos.azimuth * 180 / Math.PI + 180) % 360
        };
    }

    setShadowsEnabled(enabled) {
        this.shadowsEnabled = enabled;
        this.sunLight.castShadow = enabled;
        this.renderer.shadowMap.enabled = enabled;
        
        // Update all materials
        this.scene.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = enabled;
                child.receiveShadow = enabled;
            }
        });
        
        this.groundPlane.receiveShadow = enabled;
    }

    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        
        if (this.tiles) {
            this.tiles.setResolutionFromRenderer(this.camera, this.renderer);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update controls
        this.controls.update();
        
        // Update tiles
        if (this.tiles) {
            this.camera.updateMatrixWorld();
            this.tiles.update();
        }
        
        // Update sub-engines
        if (this.atmosphericEngine) {
            this.atmosphericEngine.animate();
        }
        
        if (this.solarEngine) {
            this.solarEngine.animate();
        }
        
        if (this.designEngine) {
            this.designEngine.animate();
        }
        
        // Render
        this.renderer.render(this.scene, this.camera);
    }

    // Utility: Raycast from mouse position
    raycast(mouseX, mouseY) {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        mouse.x = (mouseX / window.innerWidth) * 2 - 1;
        mouse.y = -(mouseY / window.innerHeight) * 2 + 1;
        
        raycaster.setFromCamera(mouse, this.camera);
        
        // Intersect with tiles and ground
        const objects = [];
        if (this.tiles?.group) objects.push(this.tiles.group);
        objects.push(this.groundPlane);
        
        return raycaster.intersectObjects(objects, true);
    }

    // Get current camera info for sharing/saving views
    getCameraState() {
        return {
            position: this.camera.position.clone(),
            target: this.controls.target.clone(),
            zoom: this.camera.zoom
        };
    }

    // Restore camera state
    setCameraState(state) {
        if (state.position) this.camera.position.copy(state.position);
        if (state.target) {
            this.controls.target.copy(state.target);
            this.controls.update();
        }
        if (state.zoom) this.camera.zoom = state.zoom;
    }
}
