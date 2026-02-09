/**
 * DesignEngine - Design Volume Tools
 * Handles placement, manipulation, and analysis of design volumes
 */

import * as THREE from 'three';

export class DesignEngine {
    constructor(scene) {
        this.scene = scene;
        
        // Design volumes
        this.volumes = [];
        this.selectedVolume = null;
        
        // Default properties
        this.defaultProps = {
            width: 20,
            depth: 20,
            height: 30,
            rotation: 0
        };
        
        // Shadow analysis
        this.shadowCatcher = null;
        
        this.init();
    }

    init() {
        this.createShadowCatcher();
        console.log('🏗️ DesignEngine initialized');
    }

    createShadowCatcher() {
        // Large plane to capture shadows from design volumes
        const geometry = new THREE.PlaneGeometry(1000, 1000);
        const material = new THREE.ShadowMaterial({
            opacity: 0.4,
            color: 0x000000
        });
        
        this.shadowCatcher = new THREE.Mesh(geometry, material);
        this.shadowCatcher.rotation.x = -Math.PI / 2;
        this.shadowCatcher.position.y = 0.1;
        this.shadowCatcher.receiveShadow = true;
        this.shadowCatcher.visible = true;
        
        this.scene.add(this.shadowCatcher);
    }

    addVolume() {
        // Create a design volume (representative building mass)
        const geometry = new THREE.BoxGeometry(
            this.defaultProps.width,
            this.defaultProps.height,
            this.defaultProps.depth
        );
        
        // Translucent material for design visualization
        const material = new THREE.MeshPhysicalMaterial({
            color: 0xf5a623,
            metalness: 0.1,
            roughness: 0.2,
            transmission: 0.6,
            thickness: 1,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        const volume = new THREE.Mesh(geometry, material);
        
        // Position in center of scene, at ground level
        volume.position.set(0, this.defaultProps.height / 2, 0);
        volume.castShadow = true;
        volume.receiveShadow = true;
        
        // Add wireframe outline
        const edges = new THREE.EdgesGeometry(geometry);
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.5
        });
        const wireframe = new THREE.LineSegments(edges, lineMaterial);
        volume.add(wireframe);
        
        // Add dimension labels (simplified as sprites)
        this.addDimensionLabels(volume);
        
        // Store volume with its properties
        volume.userData = {
            id: Date.now(),
            ...this.defaultProps,
            isDesignVolume: true
        };
        
        this.volumes.push(volume);
        this.scene.add(volume);
        this.selectedVolume = volume;
        
        // Animate in
        volume.scale.set(0, 0, 0);
        this.animateVolumeIn(volume);
        
        console.log(`✅ Design volume added: ${volume.userData.id}`);
        
        return volume;
    }

    addDimensionLabels(volume) {
        // Create canvas-based dimension label
        const createLabel = (text, position) => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 128;
            canvas.height = 64;
            
            context.fillStyle = 'rgba(0, 0, 0, 0.6)';
            context.fillRect(0, 0, 128, 64);
            
            context.font = 'bold 24px sans-serif';
            context.fillStyle = 'white';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(text, 64, 32);
            
            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(material);
            
            sprite.position.copy(position);
            sprite.scale.set(10, 5, 1);
            
            return sprite;
        };
        
        // Height label
        const heightLabel = createLabel(
            `${volume.userData?.height || this.defaultProps.height}m`,
            new THREE.Vector3(volume.geometry.parameters.width / 2 + 2, 0, 0)
        );
        volume.add(heightLabel);
    }

    animateVolumeIn(volume) {
        const startScale = volume.scale.clone();
        const targetScale = new THREE.Vector3(1, 1, 1);
        const duration = 500;
        const start = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out elastic
            const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            
            volume.scale.lerpVectors(startScale, targetScale, ease);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    updateVolume(property, value) {
        if (!this.selectedVolume) return;
        
        const volume = this.selectedVolume;
        volume.userData[property] = value;
        
        // Recreate geometry with new dimensions
        const props = volume.userData;
        
        if (['width', 'height', 'depth'].includes(property)) {
            // Dispose old geometry
            volume.geometry.dispose();
            
            // Create new geometry
            const newGeometry = new THREE.BoxGeometry(
                props.width,
                props.height,
                props.depth
            );
            volume.geometry = newGeometry;
            
            // Update position to keep bottom on ground
            volume.position.y = props.height / 2;
            
            // Update wireframe
            volume.children.forEach(child => {
                if (child.isLineSegments) {
                    child.geometry.dispose();
                    child.geometry = new THREE.EdgesGeometry(newGeometry);
                }
            });
        }
        
        if (property === 'rotation') {
            volume.rotation.y = (value * Math.PI) / 180;
        }
    }

    onSunPositionChange(sunLight) {
        // Update shadow analysis based on sun position
        this.volumes.forEach(volume => {
            // Calculate shadow length
            const sunDirection = new THREE.Vector3()
                .copy(sunLight.position)
                .normalize();
            
            // This would be used for more complex shadow analysis
            // For now, Three.js handles the visual shadows
        });
    }

    calculateShadowImpact() {
        // Calculate how much shadow the design volumes cast
        // This is a simplified calculation
        
        let totalShadowArea = 0;
        
        this.volumes.forEach(volume => {
            const props = volume.userData;
            // Approximate shadow area based on footprint
            const footprint = props.width * props.depth;
            totalShadowArea += footprint;
        });
        
        return {
            totalVolumes: this.volumes.length,
            totalShadowArea: totalShadowArea,
            averageHeight: this.volumes.reduce((sum, v) => sum + v.userData.height, 0) / this.volumes.length || 0
        };
    }

    calculateSolarAccess() {
        // Estimate solar access for the site with current volumes
        if (!this.volumes.length) return { score: 100, obstructedArea: 0 };
        
        // Simplified calculation: less obstruction = higher score
        const totalVolume = this.volumes.reduce((sum, v) => {
            return sum + (v.userData.width * v.userData.depth * v.userData.height);
        }, 0);
        
        // Arbitrary scoring (would use actual solar analysis in production)
        const obstructionScore = Math.max(0, 100 - totalVolume / 100);
        
        return {
            score: Math.round(obstructionScore),
            obstructedArea: Math.round(totalVolume / 30) // Rough estimate
        };
    }

    clearVolumes() {
        this.volumes.forEach(volume => {
            // Dispose resources
            volume.geometry.dispose();
            volume.material.dispose();
            
            // Dispose children
            volume.children.forEach(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            
            this.scene.remove(volume);
        });
        
        this.volumes = [];
        this.selectedVolume = null;
    }

    animate() {
        // Subtle floating animation for design volumes
        const time = Date.now() * 0.001;
        
        this.volumes.forEach((volume, index) => {
            // Very subtle hover effect
            const hoverOffset = Math.sin(time + index) * 0.2;
            volume.position.y = volume.userData.height / 2 + hoverOffset;
        });
    }

    // Raycasting for volume selection
    intersect(mouseX, mouseY, camera) {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        mouse.x = (mouseX / window.innerWidth) * 2 - 1;
        mouse.y = -(mouseY / window.innerHeight) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        
        const intersects = raycaster.intersectObjects(this.volumes);
        
        if (intersects.length > 0) {
            return intersects[0].object;
        }
        
        return null;
    }

    selectVolume(volume) {
        // Deselect previous
        if (this.selectedVolume) {
            this.selectedVolume.material.emissive.setHex(0x000000);
        }
        
        // Select new
        this.selectedVolume = volume;
        if (volume) {
            volume.material.emissive.setHex(0x332200);
        }
    }

    getVolumesData() {
        return this.volumes.map(v => ({
            id: v.userData.id,
            position: v.position.clone(),
            dimensions: {
                width: v.userData.width,
                height: v.userData.height,
                depth: v.userData.depth
            },
            rotation: v.userData.rotation
        }));
    }
}
