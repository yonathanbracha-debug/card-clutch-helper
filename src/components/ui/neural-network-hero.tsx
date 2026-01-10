"use client";

import { useRef, useEffect, useState, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Float, Environment } from "@react-three/drei";
import { gsap } from "gsap";
import * as THREE from "three";
import { cn } from "@/lib/utils";

// Neural network node component
function NetworkNode({ position, color }: { position: [number, number, number]; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.1;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
    </Float>
  );
}

// Connection line between nodes
function ConnectionLine({
  start,
  end,
  opacity = 0.3,
}: {
  start: [number, number, number];
  end: [number, number, number];
  opacity?: number;
}) {
  const points = [new THREE.Vector3(...start), new THREE.Vector3(...end)];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color: "#4a9eff", transparent: true, opacity });

  return <primitive object={new THREE.Line(geometry, material)} />;
}

// Neural network scene
function NeuralNetworkScene() {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useEffect(() => {
    if (groupRef.current) {
      gsap.fromTo(
        groupRef.current.rotation,
        { y: -Math.PI / 4 },
        { y: 0, duration: 2, ease: "power2.out" }
      );
    }
    
    gsap.to(camera.position, {
      z: 6,
      duration: 2,
      ease: "power2.out",
    });
  }, [camera]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  // Define node positions for a credit card network visualization
  const nodePositions: [number, number, number][] = [
    // Input layer (left)
    [-2.5, 1.5, 0],
    [-2.5, 0.5, 0],
    [-2.5, -0.5, 0],
    [-2.5, -1.5, 0],
    // Hidden layer 1
    [-1, 1, 0.5],
    [-1, 0, 0.5],
    [-1, -1, 0.5],
    // Hidden layer 2
    [0.5, 0.8, 0],
    [0.5, -0.8, 0],
    // Output layer (right)
    [2, 0.5, -0.3],
    [2, -0.5, -0.3],
  ];

  // Define connections
  const connections: [[number, number, number], [number, number, number]][] = [
    [nodePositions[0], nodePositions[4]],
    [nodePositions[0], nodePositions[5]],
    [nodePositions[1], nodePositions[4]],
    [nodePositions[1], nodePositions[5]],
    [nodePositions[1], nodePositions[6]],
    [nodePositions[2], nodePositions[5]],
    [nodePositions[2], nodePositions[6]],
    [nodePositions[3], nodePositions[5]],
    [nodePositions[3], nodePositions[6]],
    [nodePositions[4], nodePositions[7]],
    [nodePositions[5], nodePositions[7]],
    [nodePositions[5], nodePositions[8]],
    [nodePositions[6], nodePositions[8]],
    [nodePositions[7], nodePositions[9]],
    [nodePositions[7], nodePositions[10]],
    [nodePositions[8], nodePositions[9]],
    [nodePositions[8], nodePositions[10]],
  ];

  return (
    <group ref={groupRef}>
      {/* Connections */}
      {connections.map((conn, i) => (
        <ConnectionLine key={`conn-${i}`} start={conn[0]} end={conn[1]} />
      ))}
      
      {/* Nodes */}
      {nodePositions.map((pos, i) => (
        <NetworkNode
          key={`node-${i}`}
          position={pos}
          color={i < 4 ? "#6b7280" : i >= 9 ? "#22c55e" : "#3b82f6"}
        />
      ))}
      
      {/* Ambient lighting */}
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[-5, -5, -5]} intensity={0.3} color="#3b82f6" />
    </group>
  );
}

// Loading fallback
function LoadingFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-muted-foreground font-mono text-sm">Loading...</div>
    </div>
  );
}

interface NeuralNetworkHeroProps {
  className?: string;
}

export function NeuralNetworkHero({ className }: NeuralNetworkHeroProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <LoadingFallback />;
  }

  return (
    <div className={cn("relative w-full h-[600px] bg-background", className)}>
      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <Suspense fallback={<LoadingFallback />}>
          <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
            <NeuralNetworkScene />
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              maxPolarAngle={Math.PI / 2}
              minPolarAngle={Math.PI / 3}
            />
            <Environment preset="night" />
          </Canvas>
        </Suspense>
      </div>

      {/* Overlay content */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center px-6">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-4">
            Experimental
          </p>
          <h1 className="text-4xl md:text-5xl font-light text-foreground mb-4">
            Neural Decision Engine
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            A visualization of how CardClutch processes credit card decisions through deterministic rule networks.
          </p>
        </div>
      </div>
    </div>
  );
}
