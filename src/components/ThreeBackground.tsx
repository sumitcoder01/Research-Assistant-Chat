import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTheme } from '../hooks/useTheme';

const ThreeBackground: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    // Create particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1000;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 50;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    // Theme-aware particle colors
    const particleColor = resolvedTheme === 'dark' ? 0x60A5FA : 0x3B82F6;
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.02,
      color: particleColor,
      transparent: true,
      opacity: resolvedTheme === 'dark' ? 0.4 : 0.3,
      blending: THREE.AdditiveBlending
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, resolvedTheme === 'dark' ? 0.2 : 0.1);
    scene.add(ambientLight);

    camera.position.z = 30;

    // Animation
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      particlesMesh.rotation.x += 0.0005;
      particlesMesh.rotation.y += 0.001;
      
      // Subtle floating animation
      particlesMesh.position.y = Math.sin(Date.now() * 0.0005) * 0.5;
      
      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [resolvedTheme]);

  const backgroundGradient = resolvedTheme === 'dark' 
    ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)'
    : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ background: backgroundGradient }}
    />
  );
};

export default ThreeBackground;