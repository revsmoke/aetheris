/**
 * SolarEngine - Solar Analysis Visualization
 * Renders solar potential, roof segments, and solar panel placements
 */

import * as THREE from 'three';

export class SolarEngine {
    constructor(scene) {
        this.scene = scene;
        
        // Data
        this.solarData = null;
        this.visible = false;
        
        // Visualization objects
        this.roofSegments = [];
        this.solarPanels = [];
        this.solarHeatmap = null;
        this.sunPathLine = null;
        
        this.init();
    }

    init() {
        this.createSunPathVisualization();
        console.log('☀️ SolarEngine initialized');
    }

    createSunPathVisualization() {
        // Create a semi-circle showing sun path
        const curve = new THREE.EllipseCurve(
            0, 0,            // ax, aY
            200, 200,        // xRadius, yRadius
            0, Math.PI,      // aStartAngle, aEndAngle
            false,           // aClockwise
            0                // aRotation
        );
        
        const points = curve.getPoints(50);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        const material = new THREE.LineBasicMaterial({
            color: 0xf5a623,
            transparent: true,
            opacity: 0.3
        });
        
        this.sunPathLine = new THREE.Line(geometry, material);
        this.sunPathLine.rotation.x = -Math.PI / 2;
        this.sunPathLine.position.y = 10;
        this.sunPathLine.visible = false;
        
        this.scene.add(this.sunPathLine);
    }

    setSolarData(data) {
        this.solarData = data;
        
        // Clear existing visualizations
        this.clearVisualizations();
        
        // Create new visualizations
        this.createRoofSegmentVisualization();
        this.createSolarPanelVisualization();
        this.createSolarHeatmap();
    }

    createRoofSegmentVisualization() {
        if (!this.solarData?.solarPotential?.roofSegmentStats) return;
        
        const segments = this.solarData.solarPotential.roofSegmentStats;
        
        segments.forEach((segment, index) => {
            // Create wireframe box for each roof segment
            const center = segment.center;
            const stats = segment.stats;
            
            // Estimate dimensions from area
            const area = stats.areaMeters2;
            const width = Math.sqrt(area) * 1.5;
            const depth = Math.sqrt(area) / 1.5;
            const height = 2; // Thin roof segment
            
            const geometry = new THREE.BoxGeometry(width, height, depth);
            
            // Color based on sunshine potential
            const sunshineQuantiles = stats.sunshineQuantiles;
            const medianSunshine = sunshineQuantiles[5] || 1500;
            const maxSunshine = 2000;
            const sunshineRatio = medianSunshine / maxSunshine;
            
            // Gradient from red (poor) to green (excellent)
            const color = new THREE.Color();
            color.setHSL(sunshineRatio * 0.33, 0.8, 0.5);
            
            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.4,
                wireframe: false
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            
            // Position
            // Convert lat/lng to local coordinates (simplified)
            mesh.position.set(
                (center.longitude - this.solarData.center.longitude) * 100000,
                30 + Math.random() * 20, // Approximate height
                -(center.latitude - this.solarData.center.latitude) * 100000
            );
            
            // Rotate based on azimuth and pitch
            mesh.rotation.y = (segment.azimuthDegrees * Math.PI) / 180;
            mesh.rotation.x = (segment.pitchDegrees * Math.PI) / 180;
            
            mesh.visible = this.visible;
            this.roofSegments.push(mesh);
            this.scene.add(mesh);
            
            // Add label showing stats
            // This would be done with CSS3D in a full implementation
        });
    }

    createSolarPanelVisualization() {
        if (!this.solarData?.solarPotential?.solarPanels) return;
        
        const panels = this.solarData.solarPotential.solarPanels;
        const panelWidth = this.solarData.solarPotential.panelWidthMeters || 1.0;
        const panelHeight = this.solarData.solarPotential.panelHeightMeters || 1.6;
        
        // Create instanced mesh for performance
        const geometry = new THREE.BoxGeometry(panelWidth, 0.1, panelHeight);
        const material = new THREE.MeshStandardMaterial({
            color: 0x1a237e,
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0x000033,
            emissiveIntensity: 0.2
        });
        
        // Limit number of panels rendered for performance
        const maxPanels = Math.min(panels.length, 500);
        const instancedMesh = new THREE.InstancedMesh(geometry, material, maxPanels);
        
        const dummy = new THREE.Object3D();
        
        panels.slice(0, maxPanels).forEach((panel, index) => {
            const center = panel.center;
            
            dummy.position.set(
                (center.longitude - this.solarData.center.longitude) * 100000,
                35 + Math.random() * 15,
                -(center.latitude - this.solarData.center.latitude) * 100000
            );
            
            // Rotate based on orientation
            if (panel.orientation === 'LANDSCAPE') {
                dummy.rotation.y = 0;
            } else {
                dummy.rotation.y = Math.PI / 2;
            }
            
            dummy.updateMatrix();
            instancedMesh.setMatrixAt(index, dummy.matrix);
        });
        
        instancedMesh.visible = this.visible;
        instancedMesh.castShadow = true;
        instancedMesh.receiveShadow = true;
        
        this.solarPanels.push(instancedMesh);
        this.scene.add(instancedMesh);
    }

    createSolarHeatmap() {
        // Create a circular heatmap on the ground showing solar potential
        const size = 400;
        const segments = 64;
        
        const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
        
        // Create vertex colors based on solar potential
        const colors = [];
        const positionAttribute = geometry.attributes.position;
        
        for (let i = 0; i < positionAttribute.count; i++) {
            const x = positionAttribute.getX(i);
            const z = positionAttribute.getZ(i);
            
            // Distance from center
            const dist = Math.sqrt(x * x + z * z);
            const maxDist = size / 2;
            
            // Create a gradient pattern (this would use actual solar data)
            const angle = Math.atan2(z, x);
            const potential = 0.5 + 0.5 * Math.cos(angle) * (1 - dist / maxDist);
            
            // Color gradient: red (low) -> yellow -> green (high)
            const color = new THREE.Color();
            if (potential < 0.5) {
                color.setHSL(0.0, 0.8, 0.3 + potential); // Red to orange
            } else {
                color.setHSL(0.15 + (potential - 0.5) * 0.2, 0.8, 0.4); // Orange to green
            }
            
            colors.push(color.r, color.g, color.b);
        }
        
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        const material = new THREE.MeshBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        this.solarHeatmap = new THREE.Mesh(geometry, material);
        this.solarHeatmap.rotation.x = -Math.PI / 2;
        this.solarHeatmap.position.y = 0.5;
        this.solarHeatmap.visible = false;
        
        this.scene.add(this.solarHeatmap);
    }

    clearVisualizations() {
        // Remove roof segments
        this.roofSegments.forEach(mesh => {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        });
        this.roofSegments = [];
        
        // Remove solar panels
        this.solarPanels.forEach(mesh => {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        });
        this.solarPanels = [];
    }

    setVisible(visible) {
        this.visible = visible;
        
        this.roofSegments.forEach(mesh => {
            mesh.visible = visible;
        });
        
        this.solarPanels.forEach(mesh => {
            mesh.visible = visible;
        });
        
        if (this.solarHeatmap) {
            this.solarHeatmap.visible = visible;
        }
        
        if (this.sunPathLine) {
            this.sunPathLine.visible = visible;
        }
    }

    onSunPositionChange(sunPos) {
        // Update sun path visualization based on current position
        if (!this.sunPathLine) return;
        
        const altitude = sunPos.altitude;
        const azimuth = sunPos.azimuth;
        
        // Adjust sun path line opacity based on time of day
        const intensity = Math.max(0, Math.sin(altitude));
        this.sunPathLine.material.opacity = 0.1 + intensity * 0.2;
    }

    animate() {
        // Subtle animation for solar panels (shine effect)
        if (this.visible && this.solarPanels.length > 0) {
            const time = Date.now() * 0.001;
            
            this.solarPanels.forEach(mesh => {
                // Subtle emissive pulse
                const pulse = 0.2 + Math.sin(time) * 0.05;
                mesh.material.emissiveIntensity = pulse;
            });
        }
    }

    // Get statistics for the report
    getSolarStats() {
        if (!this.solarData?.solarPotential) return null;
        
        const solar = this.solarData.solarPotential;
        
        return {
            maxPanels: solar.maxArrayPanelsCount,
            sunshineHours: solar.maxSunshineHoursPerYear,
            panelCapacityWatts: solar.panelCapacityWatts,
            carbonOffsetFactor: solar.carbonOffsetFactorKgPerMwh,
            roofSegments: solar.roofSegmentStats?.length || 0
        };
    }
}
