import React, { useMemo, useEffect, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Text } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { LayoutComponent } from '../services/layoutApi';
import * as THREE from 'three';

// Camera Controller Component
const CameraPanControls = () => {
    const { camera, gl } = useThree();
    const controlsRef = React.useRef<OrbitControlsImpl>(null);
    const [movement, setMovement] = useState({ up: false, down: false, left: false, right: false });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    setMovement(m => ({ ...m, up: true }));
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    setMovement(m => ({ ...m, down: true }));
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    setMovement(m => ({ ...m, left: true }));
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    setMovement(m => ({ ...m, right: true }));
                    break;
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    setMovement(m => ({ ...m, up: false }));
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    setMovement(m => ({ ...m, down: false }));
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    setMovement(m => ({ ...m, left: false }));
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    setMovement(m => ({ ...m, right: false }));
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    useFrame((_, delta) => {
        if (!controlsRef.current) return;

        const speed = 1000 * delta; // Speed in units per second
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);

        // Flatten vectors to X-Z plane (we want to walk on the "floor")
        forward.y = 0;
        forward.normalize();
        right.y = 0;
        right.normalize();

        const moveVector = new THREE.Vector3(0, 0, 0);

        if (movement.up) moveVector.add(forward);
        if (movement.down) moveVector.sub(forward);
        if (movement.right) moveVector.add(right);
        if (movement.left) moveVector.sub(right);

        if (moveVector.lengthSq() > 0) {
            moveVector.normalize().multiplyScalar(speed);
            camera.position.add(moveVector);
            controlsRef.current.target.add(moveVector);
            controlsRef.current.update();
        }
    });

    return <OrbitControls ref={controlsRef} args={[camera, gl.domElement]} makeDefault maxDistance={50000} zoomSpeed={0.2} />;
};

interface Factory3DLayoutProps {
    components: LayoutComponent[];
}

const Component3D = ({ component }: { component: LayoutComponent }) => {
    // 3D Mapping Logic
    // X -> X (Right)
    // Y -> Z (Depth - forward/back in 2D is up/down in 2D top-down view, so maps to Z in 3D)
    // Z (Height) -> Y (Up)

    // Default heights based on type if not specified (future improvement: add height property to component)
    const height = 20; // Default height for generic components
    const width = component.template?.width || 100;
    const depth = component.template?.height || 100;

    // Calculate position
    // 2D Origin is top-left usually. 3D Origin is center.
    // We need to adjust based on scene scale.
    // Let's assume 1px = 1 unit for simplicity first.

    // In LayoutEditor:
    // transform={`translate(${x}, ${y}) rotate(${rotation}, ${scaledWidth / 2}, ${scaledHeight / 2})`}

    // 3D Position:
    // x = component.x + width/2 (center)
    // z = component.y + depth/2 (center)
    // y = height/2 (sit on floor)

    const position: [number, number, number] = [
        component.x + width * component.scaleX / 2,
        height / 2 + (component.zIndex || 0), // Use zIndex as elevation offset? Or strictly layer. Let's stack on 0 for now.
        component.y + depth * component.scaleY / 2
    ];

    const rotation: [number, number, number] = [
        0,
        -(component.rotation * Math.PI) / 180, // Rotate around Y axis. SVG rotation is often CW? ThreeJS is CCW? Check directions.
        0
    ];

    // Safe parse customData
    const customData = useMemo(() => {
        if (typeof component.customData === 'string') {
            try {
                return JSON.parse(component.customData);
            } catch (e) {
                console.error('Error parsing customData:', e);
                return {};
            }
        }
        return component.customData || {};
    }, [component.customData]);

    // Color based on category or custom data
    const color = useMemo(() => {
        // First check if a custom color is defined
        if (customData?.color) {
            return customData.color;
        }

        const cat = component.template?.category;
        switch (cat) {
            case 'floors': return '#334155'; // Dark slate
            case 'stations': return '#3b82f6'; // Blue
            case 'conveyors': return '#f59e0b'; // Amber
            case 'robots': return '#ef4444'; // Red
            case 'buffers': return '#10b981'; // Green
            default: return '#94a3b8'; // Gray
        }
    }, [component.template?.category, component.customData?.color]);

    const isFloor = component.template?.category === 'floors';

    return (
        <group position={position} rotation={rotation}>
            {/* Main Body */}
            <mesh castShadow receiveShadow>
                <boxGeometry args={[width * component.scaleX, isFloor ? 2 : height, depth * component.scaleY]} />
                <meshStandardMaterial color={color} />
            </mesh>

            {/* Label floating above */}
            {!isFloor && (
                <Text
                    position={[0, height / 2 + 10, 0]}
                    fontSize={12}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                >
                    {component.instanceName}
                </Text>
            )}

            {/* Floor Label flat on surface */}
            {isFloor && (
                <Text
                    position={[0, 2, 0]}
                    rotation={[-Math.PI / 2, 0, 0]} // Flat on ground
                    fontSize={24}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                >
                    {component.instanceName}
                </Text>
            )}
        </group>
    );
};

const Factory3DLayout: React.FC<Factory3DLayoutProps> = ({ components }) => {
    return (
        <div style={{ width: '100%', height: '100%', background: '#111827' }}>
            <Canvas
                shadows
                camera={{ position: [800, 800, 800], fov: 50, far: 50000 }} // Increased far plane significantly
                gl={{ preserveDrawingBuffer: true }}
            >
                <CameraPanControls />

                {/* Lighting */}
                <ambientLight intensity={0.5} />
                <directionalLight
                    position={[1000, 2000, 1000]}
                    intensity={1}
                    castShadow
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                    shadow-camera-left={-2000}
                    shadow-camera-right={2000}
                    shadow-camera-top={2000}
                    shadow-camera-bottom={-2000}
                    shadow-camera-far={10000}
                />

                {/* Grid */}
                <Grid
                    position={[0, -0.1, 0]}
                    args={[10000, 10000]} // Increased grid size
                    cellSize={100}
                    sectionSize={500}
                    fadeDistance={10000} // Increased fade distance
                    sectionColor="#4b5563"
                    cellColor="#374151"
                />

                {/* Components */}
                {components.map((comp) => (
                    <Component3D key={comp.id} component={comp} />
                ))}

                {/* Origin Marker */}
                <mesh position={[0, 0, 0]}>
                    <sphereGeometry args={[5]} />
                    <meshBasicMaterial color="red" />
                </mesh>

            </Canvas>

            {/* Overlay Info */}
            <div style={{
                position: 'absolute',
                top: 20,
                right: 20,
                background: 'rgba(0,0,0,0.7)',
                color: 'white',
                padding: '10px',
                borderRadius: '8px',
                pointerEvents: 'none'
            }}>
                <h3 style={{ margin: 0, fontSize: '14px' }}>3D Viewer (Mod)</h3>
                <p style={{ margin: '5px 0 0', fontSize: '12px', opacity: 0.8 }}>
                    Sol Tık: Döndür<br />
                    Sağ Tık: Kaydır<br />
                    Tekerlek: Yakınlaştır<br />
                    Yön Tuşları: Gezinti (Pan)
                </p>
            </div>
        </div>
    );
};

export default Factory3DLayout;
