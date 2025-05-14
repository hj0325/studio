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
  '/5.png',
  '/6.png',
];

// ASSUMPTION: All your images have a 16:9 aspect ratio.
// If not, adjust this value (e.g., 4/3, 1/1 for square, etc.)
const IMAGE_ASPECT_RATIO = 16 / 9;
const LAYER_DEPTH_SPACING = 2; // Defines the Z-spacing between image layers
const FLAME_Z_POSITION = 0.01; // Slightly in front of the foremost stack image (at z=0)

// Helper function to calculate plane scale for "contain" effect
function calculateImagePlaneScale(viewport, camera, imageAspectRatio, imageZPosition) {
  const { width: viewportWidth, height: viewportHeight } = viewport;
  const viewportAspect = viewportWidth / viewportHeight;
  
  const distance = camera.position.z - imageZPosition; // Distance from camera to this specific image plane
  
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

function ScaledDreiImage({ url, opacity, renderOrder, zPosition }) {
  const { viewport, camera } = useThree();
  const [planeWidth, planeHeight] = calculateImagePlaneScale(viewport, camera, IMAGE_ASPECT_RATIO, zPosition);

  return (
    <DreiImage
      url={url}
      position={[0, 0, zPosition]}
      transparent
      opacity={opacity}
      renderOrder={renderOrder}
      scale={[planeWidth, planeHeight, 1]}
    />
  );
}

// New component for the fixed flame.png overlay
function FixedOverlayImage({ url, zPosition, baseRenderOrder }) {
  const { viewport, camera } = useThree();
  const [planeWidth, planeHeight] = calculateImagePlaneScale(viewport, camera, IMAGE_ASPECT_RATIO, zPosition);

  return (
    <DreiImage
      url={url}
      position={[0, 0, zPosition]}
      transparent // Assuming flame.png might have transparency
      opacity={1}   // Always visible
      renderOrder={baseRenderOrder + 10} // Ensure it's on top of other images
      scale={[planeWidth, planeHeight, 1]}
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
        } else if (i === current + 1 && fading > 0) {
          opacity = fading;
        }
        
        const zPosition = -i * LAYER_DEPTH_SPACING; // Calculate z-depth for layering

        return (
          <ScaledDreiImage
            key={src}
            url={src}
            opacity={opacity}
            renderOrder={images.length - i}
            zPosition={zPosition}
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
        <title>Click 3D Image Layers with Overlay</title>
        <meta name="description" content="Click to fade layered images, with a fixed overlay" />
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
          <FixedOverlayImage url="/flame.png" zPosition={FLAME_Z_POSITION} baseRenderOrder={images.length} />
        </Canvas>
      </div>
    </>
  );
}
