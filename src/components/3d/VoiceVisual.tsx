'use client'
import { Canvas, useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import gsap from 'gsap'
import * as THREE from 'three'
import { useRef, useEffect } from 'react'

export function VoiceAIVisual() {
  return (
    <div className="relative z-10 h-64 md:h-96 lg:h-[500px] transform hover:scale-105 transition-transform duration-500">
      <Canvas>
        <ambientLight intensity={0.6} />
        <pointLight position={[5, 5, 5]} intensity={1.5} />

        {/* Animated waveform bars */}
        <WaveformBars count={20} />

        {/* Floating glowing particles */}
        <ParticleField count={80} />

        {/* Floating text with GSAP */}
        <FloatingText content="📞 Call in progress..." position={[2, 0.5, 0]} delay={0} />
        <FloatingText content="Transcribing..." position={[-2, -0.5, 0]} delay={1} />
        <FloatingText content="Sending notes..." position={[0, 1.5, 0]} delay={2} />

        {/* Flying envelope */}
        <EmailEnvelope position={[0, -2, 0]} />
      </Canvas>
    </div>
  )
}

/* Futuristic voice waveform bars */
function WaveformBars({ count }: { count: number }) {
  const groupRef = useRef<THREE.Group>(null)

  useEffect(() => {
    if (!groupRef.current) return
    groupRef.current.children.forEach((bar, i) => {
      gsap.to(bar.scale, {
        y: () => Math.random() * 3 + 1,
        repeat: -1,
        yoyo: true,
        duration: () => Math.random() * 1.5 + 0.5,
        ease: 'sine.inOut',
        delay: i * 0.1,
      })
    })
  }, [count])

  return (
    <group ref={groupRef} position={[0, -1, 0]}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} position={[i * 0.25 - (count * 0.25) / 2, 0, 0]}>
          <boxGeometry args={[0.15, 1, 0.15]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#3b82f6' : '#16a34a'} />
        </mesh>
      ))}
    </group>
  )
}

/* Particle field (floating glowing dots) */
function ParticleField({ count }: { count: number }) {
  const groupRef = useRef<THREE.Group>(null)

  useEffect(() => {
    if (!groupRef.current) return
    groupRef.current.children.forEach((p, i) => {
      gsap.to(p.position, {
        y: "+=2",
        repeat: -1,
        yoyo: true,
        duration: () => Math.random() * 3 + 2,
        ease: 'sine.inOut',
        delay: Math.random() * 2,
      })
    })
  }, [count])

  return (
    <group ref={groupRef}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh
          key={i}
          position={[
            (Math.random() - 0.5) * 8,
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 6,
          ]}
        >
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color={Math.random() > 0.5 ? '#3b82f6' : '#16a34a'} />
        </mesh>
      ))}
    </group>
  )
}

/* Floating text with GSAP fade/float */
function FloatingText({ content, position, delay }: { content: string; position: [number, number, number]; delay: number }) {
  const ref = useRef<THREE.Group>(null)

  useEffect(() => {
    if (!ref.current) return
    gsap.fromTo(
      ref.current.position,
      { y: position[1] - 1 },
      {
        y: position[1] + 1,
        repeat: -1,
        yoyo: true,
        duration: 3,
        ease: 'sine.inOut',
        delay,
      }
    )
    gsap.fromTo(
      ref.current,
      { opacity: 0 },
      {
        opacity: 1,
        repeat: -1,
        yoyo: true,
        duration: 3,
        delay,
      }
    )
  }, [delay, position])

  return (
    <group ref={ref} position={position}>
      
      <Text fontSize={0.25} color="black" anchorX="center" anchorY="middle">
        {content}
      </Text>
    </group>
  )
}

/* Envelope flying upward with GSAP */
function EmailEnvelope({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null)

  useEffect(() => {
    if (!ref.current) return
    gsap.to(ref.current.position, {
      y: position[1] + 6,
      repeat: -1,
      duration: 5,
      ease: 'power1.inOut',
      yoyo: true,
    })
  }, [position])

  return (
    <group ref={ref} position={position}>
      
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(1.2, 0.8)]} />
        <lineBasicMaterial  />
      </lineSegments>
    </group>
  )
}
