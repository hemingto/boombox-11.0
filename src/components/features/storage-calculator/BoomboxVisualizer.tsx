/**
 * @fileoverview 3D Boombox container visualizer using React Three Fiber
 * Renders containers with stacked items based on bin-packing algorithm
 *
 * FEATURES:
 * - 3D translucent container matching 95x56x83.5 proportions
 * - Realistic item stacking from bin-packing algorithm
 * - Multiple containers for overflow
 * - Boombox logo on container front
 * - Orbit controls for camera manipulation
 * - Lucide icons as HTML overlays on items
 */

'use client';

import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, useTexture } from '@react-three/drei';
import { useStorageStore } from '@/hooks/useStorageStore';
import {
  toThreeJSPosition,
  toThreeJSDimensions,
  getContainerThreeJSDimensions,
  getContainerCenterPosition,
  CONTAINER_GAP,
  CONTAINER,
  type PackedItem,
} from '@/lib/utils';
import { getItemById } from '@/data/inventoryData';
import { Package } from 'lucide-react';
import * as THREE from 'three';

// ==================== CONSTANTS ====================

const SCALE = 0.01; // Convert inches to Three.js units
const CONTAINER_COLOR = '#18181b'; // zinc-900
const CONTAINER_OPACITY = 0.15;
const EDGE_COLOR = '#3f3f46'; // zinc-700

// ==================== TYPES ====================

interface BoomboxVisualizerProps {
  className?: string;
}

// ==================== MAIN COMPONENT ====================

export function BoomboxVisualizer({ className }: BoomboxVisualizerProps) {
  const packedItems = useStorageStore(state => state.packedItems);
  const containerCount = useStorageStore(state => state.containerCount);

  // Calculate camera position based on number of containers
  const cameraPosition = useMemo(() => {
    const baseDistance = 2;
    const extraDistance = Math.max(0, containerCount - 1) * 0.8;
    return [
      baseDistance + extraDistance,
      1.2,
      baseDistance + extraDistance,
    ] as [number, number, number];
  }, [containerCount]);

  return (
    <div className={`relative w-full h-full min-h-[400px] ${className || ''}`}>
      <Canvas shadows camera={{ position: cameraPosition, fov: 45 }}>
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-5, 5, -5]} intensity={0.3} />

        {/* Scene Content - No Suspense needed for basic geometry */}
        <SceneContent
          packedItems={packedItems}
          containerCount={containerCount}
        />

        {/* Ground plane */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.01, 0]}
          receiveShadow
        >
          <planeGeometry args={[10, 10]} />
          <meshStandardMaterial color="#f4f4f5" />
        </mesh>

        {/* Controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={1}
          maxDistance={10}
          target={[
            containerCount > 1
              ? ((containerCount - 1) *
                  (CONTAINER.LENGTH + CONTAINER_GAP) *
                  SCALE) /
                2
              : 0,
            0.4,
            0,
          ]}
        />
      </Canvas>

      {/* Empty State Overlay */}
      {containerCount === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center p-6 bg-white/90 backdrop-blur rounded-lg shadow-lg">
            <Package className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
            <p className="text-zinc-600 font-medium">
              Add items to see them in 3D
            </p>
            <p className="text-sm text-zinc-400 mt-1">
              Select items from the list to visualize your storage
            </p>
          </div>
        </div>
      )}

      {/* Controls Hint */}
      <div className="absolute bottom-4 left-4 text-xs text-zinc-500 bg-white/80 backdrop-blur px-2 py-1 rounded">
        Drag to rotate • Scroll to zoom
      </div>
    </div>
  );
}

// ==================== SCENE CONTENT ====================

interface SceneContentProps {
  packedItems: PackedItem[];
  containerCount: number;
}

function SceneContent({ packedItems, containerCount }: SceneContentProps) {
  const effectiveContainerCount = Math.max(containerCount, 1);

  return (
    <group>
      {/* Render containers */}
      {Array.from({ length: effectiveContainerCount }).map((_, index) => (
        <Container key={index} containerIndex={index} />
      ))}

      {/* Render packed items */}
      {packedItems.map((packedItem, index) => (
        <PackedItemMesh
          key={`${packedItem.itemId}-${index}`}
          packedItem={packedItem}
        />
      ))}
    </group>
  );
}

// ==================== CONTAINER ====================

interface ContainerProps {
  containerIndex: number;
}

function Container({ containerIndex }: ContainerProps) {
  const dimensions = getContainerThreeJSDimensions(SCALE);
  const position = getContainerCenterPosition(containerIndex, SCALE);

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Container Box - Translucent */}
      <mesh>
        <boxGeometry
          args={[dimensions.width, dimensions.height, dimensions.depth]}
        />
        <meshStandardMaterial
          color={CONTAINER_COLOR}
          transparent
          opacity={CONTAINER_OPACITY}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Container Edges */}
      <lineSegments>
        <edgesGeometry
          args={[
            new THREE.BoxGeometry(
              dimensions.width,
              dimensions.height,
              dimensions.depth
            ),
          ]}
        />
        <lineBasicMaterial color={EDGE_COLOR} linewidth={2} />
      </lineSegments>

      {/* Logo on Front Face */}
      <ContainerLogo dimensions={dimensions} />

      {/* Base Platform */}
      <mesh position={[0, -dimensions.height / 2 - 0.005, 0]} receiveShadow>
        <boxGeometry
          args={[dimensions.width + 0.02, 0.01, dimensions.depth + 0.02]}
        />
        <meshStandardMaterial color="#27272a" />
      </mesh>
    </group>
  );
}

// ==================== CONTAINER LOGO ====================

interface ContainerLogoProps {
  dimensions: { width: number; height: number; depth: number };
}

function ContainerLogo({ dimensions }: ContainerLogoProps) {
  // Calculate logo size (about 30% of container width)
  const logoWidth = dimensions.width * 0.4;
  const logoHeight = logoWidth * 0.5; // Approximate aspect ratio

  return (
    <Suspense fallback={null}>
      <ContainerLogoInner
        dimensions={dimensions}
        logoWidth={logoWidth}
        logoHeight={logoHeight}
      />
    </Suspense>
  );
}

interface ContainerLogoInnerProps {
  dimensions: { width: number; height: number; depth: number };
  logoWidth: number;
  logoHeight: number;
}

function ContainerLogoInner({
  dimensions,
  logoWidth,
  logoHeight,
}: ContainerLogoInnerProps) {
  const texture = useTexture('/logo.png');

  return (
    <mesh
      position={[0, dimensions.height * 0.15, dimensions.depth / 2 + 0.001]}
      rotation={[0, 0, 0]}
    >
      <planeGeometry args={[logoWidth, logoHeight]} />
      <meshBasicMaterial map={texture} transparent opacity={0.9} />
    </mesh>
  );
}

// ==================== PACKED ITEM MESH ====================

interface PackedItemMeshProps {
  packedItem: PackedItem;
}

function PackedItemMesh({ packedItem }: PackedItemMeshProps) {
  const position = toThreeJSPosition(
    packedItem.position,
    packedItem.dimensions,
    packedItem.containerIndex,
    SCALE
  );

  const dimensions = toThreeJSDimensions(packedItem.dimensions, SCALE);

  const inventoryItem = getItemById(packedItem.itemId);
  const Icon = inventoryItem?.icon;

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Item Box */}
      <mesh castShadow>
        <boxGeometry
          args={[dimensions.width, dimensions.height, dimensions.depth]}
        />
        <meshStandardMaterial
          color={packedItem.color}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>

      {/* Item Edges */}
      <lineSegments>
        <edgesGeometry
          args={[
            new THREE.BoxGeometry(
              dimensions.width,
              dimensions.height,
              dimensions.depth
            ),
          ]}
        />
        <lineBasicMaterial color="#000000" opacity={0.3} transparent />
      </lineSegments>

      {/* Icon Label (on front face) */}
      {Icon && (
        <Html
          position={[0, 0, dimensions.depth / 2 + 0.001]}
          center
          distanceFactor={1.5}
          style={{ pointerEvents: 'none' }}
        >
          <div
            className="flex items-center justify-center rounded-full bg-white/90 shadow-sm"
            style={{
              width: '24px',
              height: '24px',
            }}
          >
            <Icon size={14} color={packedItem.color} strokeWidth={2} />
          </div>
        </Html>
      )}
    </group>
  );
}

export default BoomboxVisualizer;
