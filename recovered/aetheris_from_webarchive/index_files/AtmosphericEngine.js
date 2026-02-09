/**
 * AtmosphericEngine - Environmental Data Visualization
 * Renders particle systems for air quality, wind, and pollen
 */

import * as THREE from 'three';

export class AtmosphericEngine {
    constructor(scene) {
        this.scene = scene;
        
        // Particle systems
        this.airParticles = null;
        this.pollenParticles = null;
        this.windParticles = null;
        
        // Data
        this.airQualityData = null;
        this.pollenData = null;
        
        // Visibility
        this.airQualityVisible = false;
        this.pollenVisible = false;
        
        // Animation
        this.clock = new THREE.Clock();
        
        this.init();
    }

    init() {
        this.createAirQualityParticles();
        this.createPollenParticles();
        this.createWindParticles();
        
        console.log('🌬️ AtmosphericEngine initialized');
    }

    createAirQualityParticles() {
        const particleCount = 15000;
        const geometry = new THREE.BufferGeometry();
        
        // Positions
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        const opacities = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            // Spread particles in a large volume around the site
            const angle = Math.random() * Math.PI * 2;
            const radius = 50 + Math.random() * 400;
            const height = Math.random() * 150;
            
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = height;
            positions[i * 3 + 2] = Math.sin(angle) * radius;
            
            // Default color (will be updated based on AQI)
            colors[i * 3] = 0.3;
            colors[i * 3 + 1] = 0.8;
            colors[i * 3 + 2] = 0.5;
            
            sizes[i] = 1 + Math.random() * 2;
            opacities[i] = 0.3 + Math.random() * 0.4;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
        
        // Custom shader for better looking particles
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
            },
            vertexShader: `
                attribute float size;
                attribute float opacity;
                attribute vec3 color;
                
                varying vec3 vColor;
                varying float vOpacity;
                varying float vDistance;
                
                uniform float uTime;
                uniform float uPixelRatio;
                
                void main() {
                    vColor = color;
                    vOpacity = opacity;
                    
                    // Add subtle movement
                    vec3 pos = position;
                    pos.x += sin(uTime * 0.5 + position.y * 0.1) * 2.0;
                    pos.z += cos(uTime * 0.3 + position.x * 0.1) * 2.0;
                    pos.y += sin(uTime * 0.2) * 1.0;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    
                    // Size attenuation
                    vDistance = -mvPosition.z;
                    gl_PointSize = size * uPixelRatio * (300.0 / vDistance);
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vOpacity;
                varying float vDistance;
                
                void main() {
                    // Soft circular particle
                    vec2 coord = gl_PointCoord - vec2(0.5);
                    float dist = length(coord);
                    
                    if (dist > 0.5) discard;
                    
                    // Soft edge
                    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
                    alpha *= vOpacity;
                    
                    // Fade with distance
                    alpha *= smoothstep(500.0, 100.0, vDistance);
                    
                    // Add glow center
                    float glow = 1.0 - dist * 2.0;
                    glow = pow(glow, 2.0);
                    
                    vec3 finalColor = vColor * (0.5 + glow * 0.5);
                    
                    gl_FragColor = vec4(finalColor, alpha * 0.6);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        this.airParticles = new THREE.Points(geometry, material);
        this.airParticles.visible = false;
        this.scene.add(this.airParticles);
    }

    createPollenParticles() {
        const particleCount = 8000;
        const geometry = new THREE.BufferGeometry();
        
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 30 + Math.random() * 300;
            const height = 5 + Math.random() * 80;
            
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = height;
            positions[i * 3 + 2] = Math.sin(angle) * radius;
            
            // Pollen colors (yellows, greens)
            const type = Math.random();
            if (type < 0.33) {
                // Grass - yellow-green
                colors[i * 3] = 0.8;
                colors[i * 3 + 1] = 0.9;
                colors[i * 3 + 2] = 0.2;
            } else if (type < 0.66) {
                // Tree - light green
                colors[i * 3] = 0.6;
                colors[i * 3 + 1] = 0.8;
                colors[i * 3 + 2] = 0.3;
            } else {
                // Weed - brown-yellow
                colors[i * 3] = 0.9;
                colors[i * 3 + 1] = 0.7;
                colors[i * 3 + 2] = 0.2;
            }
            
            sizes[i] = 0.5 + Math.random() * 1.5;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                
                varying vec3 vColor;
                varying float vAlpha;
                
                uniform float uTime;
                uniform float uPixelRatio;
                
                void main() {
                    vColor = color;
                    
                    // Floating pollen movement
                    vec3 pos = position;
                    float t = uTime * 0.5;
                    
                    // Drift with "wind"
                    pos.x += sin(t + position.y * 0.5) * 3.0 + t * 0.5;
                    pos.z += cos(t * 0.7 + position.x * 0.3) * 2.0;
                    pos.y += sin(t * 1.2 + position.z * 0.2) * 1.5;
                    
                    // Reset position for looping
                    pos.x = mod(pos.x + 200.0, 400.0) - 200.0;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    gl_PointSize = size * uPixelRatio * (400.0 / -mvPosition.z);
                    
                    // Twinkle effect
                    vAlpha = 0.4 + sin(uTime * 2.0 + position.x) * 0.2;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vAlpha;
                
                void main() {
                    vec2 coord = gl_PointCoord - vec2(0.5);
                    float dist = length(coord);
                    
                    if (dist > 0.5) discard;
                    
                    // Soft glow
                    float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
                    
                    gl_FragColor = vec4(vColor, alpha * vAlpha);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        this.pollenParticles = new THREE.Points(geometry, material);
        this.pollenParticles.visible = false;
        this.scene.add(this.pollenParticles);
    }

    createWindParticles() {
        // Streamlines showing wind direction
        const streamCount = 20;
        const pointsPerStream = 100;
        
        this.windLines = [];
        
        for (let i = 0; i < streamCount; i++) {
            const points = [];
            const y = 20 + Math.random() * 100;
            const startX = -200 + Math.random() * 400;
            const startZ = -200 + Math.random() * 400;
            
            for (let j = 0; j < pointsPerStream; j++) {
                points.push(new THREE.Vector3(
                    startX + j * 5,
                    y,
                    startZ + Math.sin(j * 0.1) * 20
                ));
            }
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: 0x4fc3f7,
                transparent: true,
                opacity: 0.1
            });
            
            const line = new THREE.Line(geometry, material);
            line.visible = false;
            this.scene.add(line);
            this.windLines.push(line);
        }
    }

    setAirQualityData(data) {
        this.airQualityData = data;
        
        if (!this.airParticles) return;
        
        const aqi = data.indexes?.[0]?.aqi || 0;
        const colors = this.airParticles.geometry.attributes.color.array;
        
        // Color based on AQI
        let baseColor;
        let particleCount = 15000;
        
        if (aqi <= 50) {
            // Good - mint/teal
            baseColor = new THREE.Color(0x46d39a);
            particleCount = 8000;
        } else if (aqi <= 100) {
            // Moderate - yellow
            baseColor = new THREE.Color(0xf5a623);
            particleCount = 12000;
        } else if (aqi <= 150) {
            // Unhealthy for sensitive - orange
            baseColor = new THREE.Color(0xf97316);
            particleCount = 18000;
        } else {
            // Unhealthy - red/purple
            baseColor = new THREE.Color(0xef4444);
            particleCount = 25000;
        }
        
        // Update colors with variation
        for (let i = 0; i < colors.length / 3; i++) {
            const variation = (Math.random() - 0.5) * 0.2;
            colors[i * 3] = Math.max(0, Math.min(1, baseColor.r + variation));
            colors[i * 3 + 1] = Math.max(0, Math.min(1, baseColor.g + variation));
            colors[i * 3 + 2] = Math.max(0, Math.min(1, baseColor.b + variation));
        }
        
        this.airParticles.geometry.attributes.color.needsUpdate = true;
    }

    setPollenData(data) {
        this.pollenData = data;
        
        // Adjust pollen visibility based on levels
        const dailyInfo = data.dailyInfo?.[0];
        if (!dailyInfo) return;
        
        let maxPollenLevel = 0;
        ['GRASS', 'TREE', 'WEED'].forEach(type => {
            const typeInfo = dailyInfo.pollenTypeInfo?.find(t => t.code === type);
            if (typeInfo?.indexInfo) {
                maxPollenLevel = Math.max(maxPollenLevel, typeInfo.indexInfo.value || 0);
            }
        });
        
        // Adjust particle count based on pollen level
        if (this.pollenParticles) {
            const maxCount = 8000;
            const visibleCount = Math.floor((maxPollenLevel / 5) * maxCount);
            this.pollenParticles.geometry.setDrawRange(0, Math.max(100, visibleCount));
        }
    }

    setAirQualityVisible(visible) {
        this.airQualityVisible = visible;
        if (this.airParticles) {
            this.airParticles.visible = visible;
        }
    }

    setPollenVisible(visible) {
        this.pollenVisible = visible;
        if (this.pollenParticles) {
            this.pollenParticles.visible = visible;
        }
    }

    animate() {
        const elapsedTime = this.clock.getElapsedTime();
        
        // Update air particles
        if (this.airParticles?.visible) {
            this.airParticles.material.uniforms.uTime.value = elapsedTime;
            this.airParticles.rotation.y = elapsedTime * 0.02;
        }
        
        // Update pollen particles
        if (this.pollenParticles?.visible) {
            this.pollenParticles.material.uniforms.uTime.value = elapsedTime;
        }
        
        // Animate wind lines
        this.windLines.forEach((line, i) => {
            if (line.visible) {
                const positions = line.geometry.attributes.position.array;
                for (let j = 0; j < positions.length; j += 3) {
                    positions[j] += 0.5; // Move in X direction
                    if (positions[j] > 200) {
                        positions[j] = -200;
                    }
                }
                line.geometry.attributes.position.needsUpdate = true;
            }
        });
    }
}
