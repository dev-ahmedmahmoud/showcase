'use client';

export default function Lighting() {
  return (
    <>
      {/* Ambient light for base illumination */}
      <ambientLight intensity={0.3} />
      
      {/* Key light - main illumination */}
      <directionalLight
        position={[5, 10, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      
      {/* RGB Mood Lighting */}
      <pointLight position={[-3, 2, 2]} color="#ff0080" intensity={2} distance={8} decay={2} />
      <pointLight position={[3, 2, -2]} color="#00ff80" intensity={2} distance={8} decay={2} />
      <pointLight position={[0, 2, 3]} color="#0080ff" intensity={2} distance={8} decay={2} />
      
      {/* Fill light from below */}
      <pointLight position={[0, -1, 0]} color="#8080ff" intensity={0.5} distance={10} />
    </>
  );
}
