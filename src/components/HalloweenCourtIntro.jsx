import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Halloween court-entry intro: thousands of lights spiral in from all around and
// gather into the two halves of a pumpkin, the halves snap together in a flash
// and the light turns into a solid jack-o'-lantern. The camera flies a descending
// orbit like a drone and ends facing the carved face, then "TRICK OR TREAT" pops
// into the middle of the screen.

const INTRO_MS = 6200;
const ORBIT_SECONDS = 4.8;
const START_RADIUS = 9;
const END_RADIUS = 5.4;
const GATHER = { maxDelay: 0.7, travel: 1.5 };
const JOIN = { start: 2.2, duration: 0.7, gap: 1.5 };
const REVEAL = { start: 2.8, duration: 0.7 };
const RIBS = 5;
const Y_SCALE = 0.78;

const ribRadius = theta => 1 - 0.075 * (1 - Math.abs(Math.sin(theta * RIBS)) ** 0.45);
const easeInOutCubic = t => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const clamp01 = value => Math.min(Math.max(value, 0), 1);
const phase = (time, start, duration) => clamp01((time - start) / duration);

// Turns a point on the unit sphere into a point on the ribbed, squashed pumpkin.
function deformPoint(vertex) {
  const radius = ribRadius(Math.atan2(vertex.x, vertex.z));
  vertex.x *= radius;
  vertex.z *= radius;
  vertex.y *= Y_SCALE;
  const distance = Math.hypot(vertex.x, vertex.z);
  vertex.y -= Math.sign(vertex.y) * 0.22 * Math.exp(-distance * distance * 10);
  return vertex;
}

function pumpkinGeometry() {
  const geometry = new THREE.SphereGeometry(1, 96, 64);
  const position = geometry.attributes.position;
  const vertex = new THREE.Vector3();
  for (let i = 0; i < position.count; i += 1) {
    deformPoint(vertex.fromBufferAttribute(position, i));
    position.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

// z of the pumpkin's front surface at (x, y), so the face can hug the ribs.
function surfaceZ(x, y) {
  let z = 1;
  for (let i = 0; i < 4; i += 1) {
    const radius = ribRadius(Math.atan2(x, z));
    z = Math.sqrt(Math.max(0, radius * radius * (1 - (y / Y_SCALE) ** 2) - x * x));
  }
  return z;
}

const FACE = { left: -0.68, right: 0.68, top: 0.55, bottom: -0.62 };
const FACE_SHAPES = [
  [[-0.52, 0.1], [-0.16, 0.1], [-0.34, 0.42]],
  [[0.52, 0.1], [0.16, 0.1], [0.34, 0.42]],
  [[-0.09, -0.05], [0.09, -0.05], [0, 0.1]],
  [[-0.55, -0.16], [-0.43, -0.26], [-0.32, -0.17], [-0.16, -0.3], [0, -0.21], [0.16, -0.3], [0.32, -0.17], [0.43, -0.26], [0.55, -0.16],
    [0.44, -0.38], [0.22, -0.49], [0, -0.51], [-0.22, -0.49], [-0.44, -0.38]],
];

const insidePolygon = (x, y, polygon) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

function faceTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 410;
  const ctx = canvas.getContext('2d');
  const toCanvas = ([x, y]) => [
    ((x - FACE.left) / (FACE.right - FACE.left)) * canvas.width,
    ((FACE.top - y) / (FACE.top - FACE.bottom)) * canvas.height,
  ];
  const glow = ctx.createRadialGradient(256, 200, 10, 256, 200, 260);
  glow.addColorStop(0, '#fff7c2');
  glow.addColorStop(0.5, '#ffd34d');
  glow.addColorStop(1, '#ff8a1f');
  ctx.fillStyle = glow;
  ctx.shadowColor = '#ff8a1f';
  [36, 16, 0].forEach(blur => {
    ctx.shadowBlur = blur;
    FACE_SHAPES.forEach(shape => {
      ctx.beginPath();
      shape.map(toCanvas).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.fill();
    });
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function faceGeometry() {
  const geometry = new THREE.PlaneGeometry(FACE.right - FACE.left, FACE.top - FACE.bottom, 80, 70);
  geometry.translate((FACE.left + FACE.right) / 2, (FACE.top + FACE.bottom) / 2, 0);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    position.setZ(i, surfaceZ(position.getX(i), position.getY(i)) + 0.012);
  }
  return geometry;
}

function glowDotTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.3, 'rgba(255,220,150,0.8)');
  gradient.addColorStop(1, 'rgba(255,160,60,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

// Light particles: each one starts somewhere around the scene and spirals in to a
// point on the pumpkin (surface in orange, carved face in yellow, stem in green),
// first as two separate halves that then slide together.
function buildLights(track, glowTexture) {
  const targets = [];
  const colors = [];
  const add = (point, color) => { targets.push(point); colors.push(color); };
  const orange = new THREE.Color(0xff8a2a);
  const yellow = new THREE.Color(0xffe066);
  const green = new THREE.Color(0x86efac);

  for (let i = 0; i < 2600; i += 1) add(deformPoint(new THREE.Vector3().randomDirection()), orange);
  while (targets.length < 3200) {
    const x = FACE.left + Math.random() * (FACE.right - FACE.left);
    const y = FACE.bottom + Math.random() * (FACE.top - FACE.bottom);
    if (FACE_SHAPES.some(shape => insidePolygon(x, y, shape))) add(new THREE.Vector3(x, y, surfaceZ(x, y) + 0.02), yellow);
  }
  for (let i = 0; i < 160; i += 1) {
    const along = Math.random();
    const angle = Math.random() * Math.PI * 2;
    const width = 0.11 - along * 0.05;
    add(new THREE.Vector3(0.02 + Math.cos(angle) * width + along * 0.1, 0.51 + along * 0.42, Math.sin(angle) * width), green);
  }

  const count = targets.length;
  const starts = new Float32Array(count * 3);
  const delays = new Float32Array(count);
  const positions = new Float32Array(count * 3);
  const colorArray = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 5 + Math.random() * 7;
    starts.set([Math.cos(angle) * radius, -0.5 + Math.random() * 7, Math.sin(angle) * radius], i * 3);
    delays[i] = Math.random() * GATHER.maxDelay;
    colors[i].toArray(colorArray, i * 3);
  }

  const geometry = track(new THREE.BufferGeometry());
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
  const material = track(new THREE.PointsMaterial({
    size: 0.07, map: glowTexture, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;

  const start = new THREE.Vector3();
  const update = (time, revealAmount) => {
    const apart = 1 - easeInOutCubic(phase(time, JOIN.start, JOIN.duration));
    for (let i = 0; i < count; i += 1) {
      const target = targets[i];
      const progress = easeInOutCubic(phase(time, delays[i], GATHER.travel));
      start.fromArray(starts, i * 3).applyAxisAngle(THREE.Object3D.DEFAULT_UP, (1 - progress) * 2.4);
      const side = target.x < 0 ? -1 : 1;
      positions[i * 3] = start.x + (target.x + side * JOIN.gap * apart - start.x) * progress;
      positions[i * 3 + 1] = start.y + (target.y - start.y) * progress;
      positions[i * 3 + 2] = start.z + (target.z - start.z) * progress;
    }
    geometry.attributes.position.needsUpdate = true;
    material.opacity = 1 - 0.85 * revealAmount;
  };

  return { points, update };
}

function buildScene(scene, disposables) {
  const track = item => { disposables.push(item); return item; };

  scene.fog = new THREE.Fog(0x12081a, 10, 26);
  scene.add(new THREE.HemisphereLight(0x8b5cf6, 0x1a0b12, 0.9));
  const moon = new THREE.DirectionalLight(0xc4b5fd, 1.6);
  moon.position.set(-4, 7, 3);
  moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024);
  moon.shadow.camera.left = -4;
  moon.shadow.camera.right = 4;
  moon.shadow.camera.top = 4;
  moon.shadow.camera.bottom = -4;
  scene.add(moon);
  const rim = new THREE.PointLight(0xff6a00, 6, 9, 2);
  rim.position.set(0, 1.4, -2.6);
  scene.add(rim);
  const candle = new THREE.PointLight(0xff8a1f, 10, 7, 2);
  candle.position.set(0, 0.9, 1.6);
  scene.add(candle);

  const ground = new THREE.Mesh(
    track(new THREE.CircleGeometry(14, 64)),
    track(new THREE.MeshStandardMaterial({ color: 0x1b0f24, roughness: 1 })),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // The solid pumpkins start invisible and fade in once the lights have gathered.
  const bodyGeometry = track(pumpkinGeometry());
  const bodyMaterial = track(new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.55, metalness: 0.05, transparent: true, opacity: 0 }));
  const stemMaterial = track(new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.8, transparent: true, opacity: 0 }));
  const shadowCasters = [];

  const pumpkin = new THREE.Group();
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  shadowCasters.push(body);
  pumpkin.add(body);

  const stem = new THREE.Mesh(track(new THREE.CylinderGeometry(0.06, 0.11, 0.42, 12)), stemMaterial);
  stem.position.set(0.02, 0.72, 0);
  stem.rotation.z = -0.25;
  shadowCasters.push(stem);
  pumpkin.add(stem);

  const vine = new THREE.Mesh(track(new THREE.TorusGeometry(0.16, 0.022, 8, 32, Math.PI * 1.4)), stemMaterial);
  vine.position.set(-0.16, 0.6, 0.05);
  vine.rotation.set(Math.PI / 2.4, 0.3, 0.4);
  pumpkin.add(vine);

  const faceMaterial = track(new THREE.MeshBasicMaterial({
    map: track(faceTexture()), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  pumpkin.add(new THREE.Mesh(track(faceGeometry()), faceMaterial));
  pumpkin.position.y = 0.78;
  scene.add(pumpkin);

  [[-2.4, -1.2, 0.42, 0.6], [2.2, -1.6, 0.36, 2.1], [-1.7, 2.1, 0.32, 4], [2.6, 1.4, 0.46, 5.2], [0.4, -3, 0.3, 1.2]]
    .forEach(([x, z, scale, spin]) => {
      const small = new THREE.Mesh(bodyGeometry, bodyMaterial);
      small.scale.setScalar(scale);
      small.position.set(x, Y_SCALE * scale, z);
      small.rotation.y = spin;
      shadowCasters.push(small);
      scene.add(small);
    });

  const glowTexture = track(glowDotTexture());
  const fireflyPositions = new Float32Array(140 * 3);
  for (let i = 0; i < 140; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 1.6 + Math.random() * 5;
    fireflyPositions.set([Math.cos(angle) * radius, 0.2 + Math.random() * 2.6, Math.sin(angle) * radius], i * 3);
  }
  const fireflyGeometry = track(new THREE.BufferGeometry());
  fireflyGeometry.setAttribute('position', new THREE.BufferAttribute(fireflyPositions, 3));
  const fireflies = new THREE.Points(fireflyGeometry, track(new THREE.PointsMaterial({
    color: 0xffb347, size: 0.12, map: glowTexture, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false,
  })));
  scene.add(fireflies);

  const lights = buildLights(track, glowTexture);
  lights.points.position.y = pumpkin.position.y;
  scene.add(lights.points);

  // Burst of light when the two halves meet.
  const flash = new THREE.Sprite(track(new THREE.SpriteMaterial({
    map: glowTexture, color: 0xffb347, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
  })));
  flash.position.set(0, pumpkin.position.y, 0);
  scene.add(flash);

  const animate = time => {
    const reveal = easeInOutCubic(phase(time, REVEAL.start, REVEAL.duration));
    bodyMaterial.opacity = reveal;
    stemMaterial.opacity = reveal;
    bodyMaterial.depthWrite = reveal > 0.95;
    shadowCasters.forEach(mesh => { mesh.castShadow = reveal > 0.4; });
    const burst = Math.max(0, 1 - Math.abs(time - (JOIN.start + JOIN.duration)) / 0.45);
    flash.material.opacity = burst;
    flash.scale.setScalar(2 + burst * 5);
    lights.update(time, reveal);
    return { reveal, burst };
  };

  return { candle, faceMaterial, fireflies, animate };
}

// eslint-disable-next-line react/prop-types
export default function HalloweenCourtIntro({ courtName, onDone }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(() => onDone(true), reduceMotion ? 1500 : INTRO_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return undefined; // No WebGL: the title and background still show.
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 60);
    const disposables = [];
    const { candle, faceMaterial, fireflies, animate } = buildScene(scene, disposables);
    const target = new THREE.Vector3(0, 0.75, 0);

    // Wider lens on portrait phones, and pull back only as far as needed to keep the pumpkin in frame.
    let fit = 1;
    const resize = () => {
      const { clientWidth: width, clientHeight: height } = mount;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.fov = camera.aspect < 1 ? 56 : 40;
      camera.updateProjectionMatrix();
      const visibleWidth = 2 * END_RADIUS * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
      fit = Math.max(1, 2.8 / visibleWidth);
    };
    resize();
    window.addEventListener('resize', resize);

    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      const time = clock.getElapsedTime();
      const t = easeInOutCubic(Math.min(time / ORBIT_SECONDS, 1));
      const angle = -Math.PI * 1.25 * (1 - t) + Math.sin(Math.max(0, time - ORBIT_SECONDS) * 0.6) * 0.18;
      const radius = START_RADIUS * (1 - t) + END_RADIUS * fit * t;
      const height = 4.6 - 3.2 * t + Math.sin(time * 2.2) * 0.04;
      camera.position.set(Math.sin(angle) * radius, height, Math.cos(angle) * radius);
      camera.lookAt(target);

      const { reveal, burst } = animate(time);
      const flicker = 0.85 + Math.sin(time * 23) * 0.06 + Math.sin(time * 37) * 0.05;
      candle.intensity = 10 * flicker * reveal + 30 * burst;
      faceMaterial.opacity = Math.min(1, flicker + 0.1) * reveal;
      fireflies.rotation.y = time * 0.05;
      fireflies.position.y = Math.sin(time * 0.8) * 0.08;

      renderer.render(scene, camera);
    });

    return () => {
      window.removeEventListener('resize', resize);
      renderer.setAnimationLoop(null);
      disposables.forEach(item => item.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div className="hw-intro pointer-events-none absolute inset-0 overflow-hidden bg-[radial-gradient(ellipse_at_50%_20%,#2a1238_0%,#12081a_55%,#06030a_100%)]" aria-hidden="true">
      <div className="absolute right-[12%] top-[7%] h-14 w-14 rounded-full bg-orange-100 shadow-[0_0_40px_12px_rgba(253,186,116,0.35)]" />
      <div ref={mountRef} className="absolute inset-0" />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
        <div className="hw-title whitespace-nowrap text-[2.6rem] font-black tracking-[0.06em] text-orange-400 md:text-7xl">
          TRICK <span className="text-purple-300">OR</span> TREAT
        </div>
        <p className="hw-subtitle mt-4 text-sm text-white/80">กำลังเข้าสู่ {courtName}</p>
      </div>
    </div>
  );
}
