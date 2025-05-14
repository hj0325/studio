import Head from "next/head";
import { Canvas } from '@react-three/fiber';
import { Image as DreiImage } from '@react-three/drei';
import { useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

const images = [
  '/1.png',
  '/2.png',
  '/3.png',
  '/4.png',
  '/5.png',
  '/6.png',
  '/7.png',
];

// ASSUMPTION: All your images have a 16:9 aspect ratio.
// If not, adjust this value (e.g., 4/3, 1/1 for square, etc.)
const IMAGE_ASPECT_RATIO = 16 / 9;

// Helper function to calculate plane scale for "contain" effect
function calculateImagePlaneScale(viewport, camera, imageAspectRatio) {
  const { width: viewportWidth, height: viewportHeight } = viewport;
  const viewportAspect = viewportWidth / viewportHeight;
  
  // Distance from camera (at z=7) to image plane (at z=0)
  const distance = camera.position.z; 
  
  const visibleHeightAtDistance = 2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const visibleWidthAtDistance = visibleHeightAtDistance * viewportAspect;

  let planeWidth, planeHeight;
  if (visibleWidthAtDistance / visibleHeightAtDistance > imageAspectRatio) {
    // Viewport is wider than image aspect ratio, so image height will fill viewport height
    planeHeight = visibleHeightAtDistance;
    planeWidth = planeHeight * imageAspectRatio;
  } else {
    // Viewport is taller (or same aspect) than image, so image width will fill viewport width
    planeWidth = visibleWidthAtDistance;
    planeHeight = planeWidth / imageAspectRatio;
  }
  return [planeWidth, planeHeight];
}

function ScaledDreiImage({ url, opacity, renderOrder }) {
  const { viewport, camera } = useThree();
  const [planeWidth, planeHeight] = calculateImagePlaneScale(viewport, camera, IMAGE_ASPECT_RATIO);

  return (
    <DreiImage
      url={url}
      position={[0, 0, 0]}
      transparent
      opacity={opacity}
      renderOrder={renderOrder}
      scale={[planeWidth, planeHeight, 1]} // Apply calculated scale
    />
  );
}

function ImagesStack({ current, fading }) {
  return (
    <group>
      {images.map((src, i) => {
        let opacity = 0;
        if (i < current) {
          opacity = 0;
        } else if (i === current) {
          opacity = fading ? 1 - fading : 1;
        } else if (i === current + 1 && fading) {
          opacity = fading;
        }
        return (
          <ScaledDreiImage
            key={src}
            url={src}
            opacity={opacity}
            renderOrder={images.length - i}
          />
        );
      })}
    </group>
  );
}

export default function Home() {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(0);
  const fadeDuration = 400; // ms
  const isTransitioning = useRef(false);

  const handleClick = () => {
    if (isTransitioning.current || current >= images.length - 1) return;
    isTransitioning.current = true;
    let start;
    function animateFade(ts) {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(1, elapsed / fadeDuration);
      setFading(progress);
      if (progress < 1) {
        requestAnimationFrame(animateFade);
      } else {
        setCurrent((c) => c + 1);
        setFading(0);
        isTransitioning.current = false;
      }
    }
    requestAnimationFrame(animateFade);
  };

  return (
    <>
      <Head>
        <title>Click 3D Image Stack</title>
        <meta name="description" content="Click to fade images in 3D" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div
        style={{ width: '100vw', height: '100vh', background: '#050C0C', margin: 0, padding: 0, cursor: 'pointer' }}
        onClick={handleClick}
      >
        <Canvas camera={{ position: [0, 0, 7], fov: 60 }} style={{ background: '#050C0C' }}>
          {/* Adjust lighting if images appear too dark */}
          <ambientLight intensity={1} /> 
          <directionalLight position={[0, 0, 5]} intensity={0.5} />
          <ImagesStack current={current} fading={fading} />
        </Canvas>
      </div>
    </>
  );
}
