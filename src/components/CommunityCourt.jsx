/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const TAG_FONT = '"Noto Sans Thai", "Leelawadee UI", Tahoma, Arial, sans-serif';
const CHARACTER_RADIUS = 0.2;
const OWN_WALK_SPEED = 1.7;
const OWN_RUN_SPEED = 3.4;
const FOLLOW_DISTANCE = 4.5;
const FOLLOW_HEIGHT = 0.6;

const genderBadge =gender => {
  if (gender === 'หญิง') return { symbol: '♀', colors: ['#ff4fa3'] };
  if (gender === 'เพศทางเลือก') return { symbol: '⚧', colors: ['#ff4d6d', '#ffd60a', '#2ee59d', '#3fa9ff'] };
  return { symbol: '♂', colors: ['#2fb8ff'] };
};

const makeMaterial = (color, roughness = 0.75) => new THREE.MeshStandardMaterial({ color, roughness });
const avatarSeed = avatar => String(avatar.id || avatar.ownerId || avatar.name || 'avatar').split('').reduce((total, character) => total + character.charCodeAt(0), 0);

// Procedural fallback body, built facing +z so it matches uploaded GLB avatars.
const createAvatarBody = avatar => {
  const group = new THREE.Group();
  group.scale.setScalar(0.39);
  const shirt = makeMaterial(avatar.shirt || '#3c83ee');
  const pants = makeMaterial(avatar.pants || '#293d9a');
  const skin = makeMaterial(avatar.skin || '#f1af7d');
  const hair = makeMaterial(avatar.hair || '#18243f');
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.72, 5, 12), shirt);
  body.position.y = 1.3;
  group.add(body);
  if (avatar.outfit === 'เสื้อเชิ้ต + กระโปรง') {
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.68, 0.38, 16), pants);
    skirt.position.y = 0.98;
    group.add(skirt);
  }
  if (avatar.outfit === 'เสื้อแจ็กเก็ต + กางเกงขายาว') {
    const jacket = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.78, 0.5), shirt);
    jacket.position.y = 1.32;
    group.add(jacket);
  }
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), skin);
  head.position.y = 2.12;
  group.add(head);
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.29, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), hair);
  hairCap.position.y = 2.2;
  group.add(hairCap);
  if (avatar.face === 'happy') {
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.018, 6, 12, Math.PI), makeMaterial(0x8b4a53));
    smile.position.set(0, 2.06, 0.27);
    smile.rotation.x = -Math.PI / 2;
    group.add(smile);
  }
  if (avatar.hairStyle === 'ponytail') {
    const ponytail = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), hair);
    ponytail.position.set(0, 2.18, -0.28);
    group.add(ponytail);
  }
  [-1, 1].forEach(direction => {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.55, 4, 8), pants);
    leg.position.set(direction * 0.14, 0.6, 0);
    leg.userData.limb = 'leg';
    group.add(leg);
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), makeMaterial(avatar.shoes || 0xf8fbff, 0.45));
    shoe.scale.set(1.25, 0.55, 1.7);
    shoe.position.set(direction * 0.16, 0.2, 0.06);
    shoe.userData.limb = 'leg';
    group.add(shoe);
  });
  [-1, 1].forEach(direction => {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.44, 4, 8), skin);
    arm.position.set(direction * 0.42, 1.42, 0);
    arm.rotation.z = direction * 0.55;
    arm.userData.limb = 'arm';
    group.add(arm);
  });
  group.traverse(object => { if (object.isMesh) object.castShadow = true; });
  return group;
};

const roundedRect = (context, x, y, width, height, radius) => {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
};

const createNameTag = avatar => {
  const name = (avatar.name || 'ผู้เล่น').slice(0, 22);
  const description = (avatar.description || '').slice(0, 36);
  const nameFont = `800 92px ${TAG_FONT}`;
  const descriptionFont = `600 70px ${TAG_FONT}`;
  const measure = document.createElement('canvas').getContext('2d');
  measure.font = nameFont;
  const nameWidth = measure.measureText(name).width;
  measure.font = descriptionFont;
  const descriptionWidth = description ? measure.measureText(description).width : 0;
  const badgeSize = 96;
  const gap = 24;
  const padX = 48;
  const margin = 24;
  const boxWidth = Math.ceil(Math.max(nameWidth + gap + badgeSize, descriptionWidth) + padX * 2);
  const boxHeight = description ? 270 : 160;
  const canvas = document.createElement('canvas');
  canvas.width = boxWidth + margin * 2;
  canvas.height = boxHeight + margin * 2;
  const context = canvas.getContext('2d');

  roundedRect(context, margin, margin, boxWidth, boxHeight, 44);
  context.fillStyle = 'rgba(15, 23, 42, 0.84)';
  context.fill();
  context.lineWidth = 5;
  context.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  context.stroke();

  context.textBaseline = 'middle';
  context.font = nameFont;
  context.fillStyle = '#ffffff';
  const nameY = margin + 82;
  context.fillText(name, margin + padX, nameY);

  // Gender badge sits right after the name, glowing so it reads on any background.
  const badge = genderBadge(avatar.gender);
  const badgeX = margin + padX + nameWidth + gap + badgeSize / 2;
  let badgeFill = badge.colors[0];
  if (badge.colors.length > 1) {
    badgeFill = context.createLinearGradient(badgeX - badgeSize / 2, nameY - badgeSize / 2, badgeX + badgeSize / 2, nameY + badgeSize / 2);
    badge.colors.forEach((color, index) => badgeFill.addColorStop(index / (badge.colors.length - 1), color));
  }
  context.save();
  context.shadowColor = badge.colors[0];
  context.shadowBlur = 28;
  context.beginPath();
  context.arc(badgeX, nameY, badgeSize / 2, 0, Math.PI * 2);
  context.fillStyle = badgeFill;
  context.fill();
  context.restore();
  context.lineWidth = 5;
  context.strokeStyle = '#ffffff';
  context.stroke();
  context.font = `900 68px ${TAG_FONT}`;
  context.textAlign = 'center';
  context.fillStyle = '#ffffff';
  context.fillText(badge.symbol, badgeX, nameY + 4);
  context.textAlign = 'left';

  if (description) {
    context.font = descriptionFont;
    context.fillStyle = '#fde68a';
    context.fillText(description, margin + padX, margin + 200);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  const tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false }));
  const worldHeight = description ? 0.66 : 0.4;
  tag.scale.set(worldHeight * (canvas.width / canvas.height), worldHeight, 1);
  tag.center.set(0.5, 0);
  tag.position.y = 1.02;
  tag.renderOrder = 10;
  tag.userData.isTag = true;
  return tag;
};

const disposeObject = root => {
  root.traverse(object => {
    if (object.geometry) object.geometry.dispose();
    if (object.material) {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach(material => { material.map?.dispose(); material.dispose(); });
    }
  });
};

const isBlocked = (world, x, z) => {
  const bounds = world.walkBounds;
  if (x < bounds.min.x || x > bounds.max.x || z < bounds.min.z || z > bounds.max.z) return true;
  return world.obstacles.some(box => x > box.min.x - CHARACTER_RADIUS && x < box.max.x + CHARACTER_RADIUS && z > box.min.z - CHARACTER_RADIUS && z < box.max.z + CHARACTER_RADIUS);
};

// Moves per axis so characters slide along walls instead of stopping dead.
const moveWithCollision = (world, position, dx, dz) => {
  const stuck = isBlocked(world, position.x, position.z);
  let moved = false;
  if (dx && (stuck || !isBlocked(world, position.x + dx, position.z))) { position.x += dx; moved = true; }
  if (dz && (stuck || !isBlocked(world, position.x, position.z + dz))) { position.z += dz; moved = true; }
  return moved;
};

const findFreeSpot = (world, seed) => {
  const bounds = world.walkBounds;
  let state = seed || 1;
  const random = () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const spread = attempt < 30 ? 0.45 : 1;
    const x = THREE.MathUtils.lerp(bounds.min.x, bounds.max.x, 0.5 + (random() - 0.5) * spread);
    const z = THREE.MathUtils.lerp(bounds.min.z, bounds.max.z, 0.5 + (random() - 0.5) * spread);
    if (!isBlocked(world, x, z)) return new THREE.Vector3(x, world.floorY, z);
  }
  return new THREE.Vector3(0, world.floorY, 0);
};

const turnTowards = (current, target, amount) => {
  const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + difference * Math.min(amount, 1);
};

// Third-person framing: look at the character from slightly above, keeping the current horizontal angle.
const focusOnCharacter = (world, character) => {
  const target = character.position.clone().add(new THREE.Vector3(0, FOLLOW_HEIGHT, 0));
  const direction = world.camera.position.clone().sub(world.controls.target);
  direction.y = 0;
  if (direction.lengthSq() < 0.0001) direction.set(0, 0, 1);
  direction.normalize().setY(0.55).normalize();
  world.cameraGoal = { target, position: target.clone().addScaledVector(direction, FOLLOW_DISTANCE) };
};

const viewDirections = {
  overview: new THREE.Vector3(0.7, 0.55, 1).normalize(),
  badminton: new THREE.Vector3(0, 0.42, 1).normalize(),
  futsal: new THREE.Vector3(1, 0.45, 0.7).normalize(),
  basketball: new THREE.Vector3(-1, 0.42, 0.7).normalize(),
  rest: new THREE.Vector3(0, 0.4, -1).normalize(),
};

const applyView = (world, view) => {
  world.view = view;
  if (!world.modelLoaded) return;
  const direction = viewDirections[view] || viewDirections.overview;
  const target = new THREE.Vector3(0, world.focusHeight, 0);
  world.cameraGoal = { target, position: direction.clone().multiplyScalar(world.framedDistance) };
};

function Joystick({ inputRef }) {
  const baseRef = useRef(null);
  const pointerRef = useRef(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const update = event => {
    const bounds = baseRef.current.getBoundingClientRect();
    const maxDistance = bounds.width / 2 - 26;
    let dx = event.clientX - (bounds.left + bounds.width / 2);
    let dy = event.clientY - (bounds.top + bounds.height / 2);
    const distance = Math.hypot(dx, dy);
    if (distance > maxDistance) {
      dx *= maxDistance / distance;
      dy *= maxDistance / distance;
    }
    setKnob({ x: dx, y: dy });
    inputRef.current = { x: dx / maxDistance, y: dy / maxDistance };
  };
  const release = event => {
    if (pointerRef.current !== event.pointerId) return;
    pointerRef.current = null;
    setKnob({ x: 0, y: 0 });
    inputRef.current = { x: 0, y: 0 };
  };

  return (
    <div className="pointer-events-auto absolute bottom-5 left-5 z-20 flex select-none flex-col items-center gap-1.5">
      <div
        ref={baseRef}
        role="slider"
        aria-label="จอยสติ๊กเดิน ลากเพื่อเดิน"
        aria-valuenow={0}
        onPointerDown={event => {
          event.preventDefault();
          pointerRef.current = event.pointerId;
          event.currentTarget.setPointerCapture(event.pointerId);
          update(event);
        }}
        onPointerMove={event => { if (pointerRef.current === event.pointerId) update(event); }}
        onPointerUp={release}
        onPointerCancel={release}
        className="relative h-32 w-32 cursor-grab touch-none rounded-full border-2 border-white/25 bg-slate-950/60 shadow-xl backdrop-blur-sm active:cursor-grabbing"
      >
        <div className="pointer-events-none absolute inset-4 rounded-full border border-dashed border-white/20" />
        <div
          className={`pointer-events-none absolute left-1/2 top-1/2 h-14 w-14 rounded-full bg-gradient-to-br from-emerald-300 to-emerald-500 shadow-lg ring-4 ring-white/30 ${knob.x || knob.y ? '' : 'transition-transform duration-150'}`}
          style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
        />
      </div>
      <span className="rounded-full bg-slate-950/70 px-2.5 py-1 text-[11px] font-bold text-white/85">ลากเพื่อเดิน · WASD</span>
    </div>
  );
}

export default function CommunityCourt({ avatars = [], view = 'overview', ownerId, onAvatarSelect }) {
  const mountRef = useRef(null);
  const worldRef = useRef(null);
  const joystickRef = useRef({ x: 0, y: 0 });
  const selectRef = useRef(onAvatarSelect);

  useEffect(() => { selectRef.current = onAvatarSelect; }, [onAvatarSelect]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdff4f0);
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 8.5, 15.5);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));
    renderer.shadowMap.enabled = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    mount.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.enablePan = true;
    controls.screenSpacePanning = true;
    controls.minDistance = 1.5;
    controls.maxDistance = 18;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.target.set(0, 1, 0);
    controls.update();

    const world = {
      scene,
      camera,
      controls,
      characters: new Map(),
      obstacles: [],
      walkBounds: new THREE.Box3(new THREE.Vector3(-11, 0, -11), new THREE.Vector3(11, 0, 11)),
      cameraBounds: null,
      floorY: 0,
      focusHeight: 1,
      framedDistance: 15,
      modelLoaded: false,
      cameraGoal: null,
      view: 'overview',
      modelLoader: new GLTFLoader(),
      maxAnisotropy: renderer.capabilities.getMaxAnisotropy(),
    };
    worldRef.current = world;
    controls.addEventListener('start', () => { world.cameraGoal = null; });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerStart = null;
    const handlePointerDown = event => { pointerStart = { x: event.clientX, y: event.clientY }; };
    const handlePointerUp = event => {
      if (!pointerStart || Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 8) return;
      const bounds = mount.getBoundingClientRect();
      pointer.set(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -((event.clientY - bounds.top) / bounds.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects([...world.characters.values()], true)[0];
      let target = hit?.object;
      while (target && !target.userData.avatarData) target = target.parent;
      if (target?.userData.avatarData) selectRef.current?.(target.userData.avatarData);
    };
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);

    const keys = new Set();
    const keyMap = { KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', ShiftLeft: 'run', ShiftRight: 'run' };
    const isTyping = event => /^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName) || event.target?.isContentEditable;
    const handleKeyDown = event => {
      if (isTyping(event) || !keyMap[event.code]) return;
      if (event.code.startsWith('Arrow')) event.preventDefault();
      keys.add(keyMap[event.code]);
    };
    const handleKeyUp = event => { if (keyMap[event.code]) keys.delete(keyMap[event.code]); };
    const handleBlur = () => keys.clear();
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    scene.add(new THREE.HemisphereLight(0xfaf9ed, 0x24737b, 2.4));
    const sunlight = new THREE.DirectionalLight(0xffefd0, 3.1);
    sunlight.position.set(-4, 9, 6);
    sunlight.castShadow = true;
    scene.add(sunlight);

    let disposed = false;
    world.modelLoader.load('/models/gym.glb', gltf => {
      if (disposed) return;
      const model = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const scale = 30 / (Math.max(size.x, size.y, size.z) || 1);
      model.scale.setScalar(scale);
      model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
      model.traverse(object => {
        if (!object.isMesh) return;
        object.castShadow = true;
        object.receiveShadow = true;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach(material => {
          if (!material) return;
          material.roughness = material.roughness ?? 0.72;
          if (material.map) material.map.anisotropy = world.maxAnisotropy;
        });
      });
      scene.add(model);
      model.updateMatrixWorld(true);

      // Collision: every mesh standing on the floor at character height is an obstacle.
      // Huge meshes (floor, ceiling, outer shell) are skipped; the flat ones define the floor height.
      const worldBox = new THREE.Box3().setFromObject(model);
      const worldSize = worldBox.getSize(new THREE.Vector3());
      const footprint = worldSize.x * worldSize.z;
      const meshBoxes = [];
      model.traverse(object => { if (object.isMesh) meshBoxes.push(new THREE.Box3().setFromObject(object)); });
      const isHuge = box => (box.max.x - box.min.x) * (box.max.z - box.min.z) > footprint * 0.2;
      world.floorY = meshBoxes.filter(box => isHuge(box) && box.max.y < 1.2 && box.max.y - box.min.y < 1).reduce((highest, box) => Math.max(highest, box.max.y), 0);
      world.obstacles = meshBoxes.filter(box => !isHuge(box) && box.max.y > world.floorY + 0.12 && box.min.y < world.floorY + 0.9);
      world.walkBounds = new THREE.Box3(
        new THREE.Vector3(worldBox.min.x + 0.6, 0, worldBox.min.z + 0.6),
        new THREE.Vector3(worldBox.max.x - 0.6, 0, worldBox.max.z - 0.6),
      );
      world.cameraBounds = new THREE.Box3(
        new THREE.Vector3(-worldSize.x * 0.45, 0.2, -worldSize.z * 0.45),
        new THREE.Vector3(worldSize.x * 0.45, worldSize.y * 0.72, worldSize.z * 0.45),
      );
      const modelSize = Math.max(worldSize.x, worldSize.y, worldSize.z);
      world.framedDistance = Math.max(modelSize * 0.34, 3.5);
      world.focusHeight = Math.max(worldSize.y * 0.18, 0.8);
      controls.minDistance = Math.max(modelSize * 0.03, 1.2);
      controls.maxDistance = Math.max(modelSize * 0.58, 12);
      world.modelLoaded = true;
      world.characters.forEach(character => {
        if (isBlocked(world, character.position.x, character.position.z)) character.position.copy(findFreeSpot(world, avatarSeed(character.userData.avatarData)));
        character.position.y = world.floorY;
      });
      applyView(world, world.view);
      const direction = viewDirections[world.view] || viewDirections.overview;
      camera.position.copy(direction.clone().multiplyScalar(world.framedDistance));
      controls.target.set(0, world.focusHeight, 0);
      controls.update();
      world.cameraGoal = null;
      const ownCharacter = [...world.characters.values()].find(character => character.userData.isOwn);
      if (ownCharacter) focusOnCharacter(world, ownCharacter);
    }, undefined, error => console.warn('Community world model fallback:', error));

    const resize = () => {
      const width = mount.clientWidth || 800;
      const height = mount.clientHeight || 360;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    const timer = new THREE.Timer();
    timer.connect(document);
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    const move = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const followTarget = new THREE.Vector3();
    let frameId;
    const animate = () => {
      timer.update();
      const delta = Math.min(timer.getDelta(), 0.05);
      const elapsed = timer.getElapsed();

      const stick = joystickRef.current;
      const inputX = THREE.MathUtils.clamp(stick.x + (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0), -1, 1);
      const inputY = THREE.MathUtils.clamp(stick.y + (keys.has('down') ? 1 : 0) - (keys.has('up') ? 1 : 0), -1, 1);
      const inputStrength = Math.min(Math.hypot(inputX, inputY), 1);
      const hasInput = inputStrength > 0.1;
      if (hasInput) {
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        right.crossVectors(forward, up).normalize();
        move.copy(forward).multiplyScalar(-inputY).addScaledVector(right, inputX).normalize();
      }
      const running = keys.has('run') || inputStrength > 0.85;

      let ownMoved = null;
      world.characters.forEach(character => {
        const data = character.userData;
        let moving = false;
        if (data.isOwn) {
          if (hasInput) {
            const speed = (running ? OWN_RUN_SPEED : OWN_WALK_SPEED) * inputStrength;
            moveWithCollision(world, character.position, move.x * speed * delta, move.z * speed * delta);
            data.heading = turnTowards(data.heading, Math.atan2(move.x, move.z), delta * 12);
            data.activity = running ? 'run' : 'walk';
            moving = true;
            ownMoved = character;
          } else {
            data.activity = 'idle';
          }
        } else {
          data.activityTimer -= delta;
          if (data.activityTimer <= 0) {
            const activities = ['walk', 'walk', 'run', 'sit', 'dance', 'warmup', 'idle'];
            data.activity = activities[Math.floor(Math.random() * activities.length)];
            data.activityTimer = 3 + Math.random() * 5;
          }
          if (data.activity === 'walk' || data.activity === 'run') {
            const speed = data.walkSpeed * (data.activity === 'run' ? 1.8 : 1);
            const moved = moveWithCollision(world, character.position, Math.sin(data.wanderHeading) * speed * delta, Math.cos(data.wanderHeading) * speed * delta);
            if (!moved) data.wanderHeading += Math.PI * (0.5 + Math.random());
            data.heading = turnTowards(data.heading, data.wanderHeading, delta * 6);
            moving = true;
          }
        }
        character.rotation.y = data.heading;
        character.position.y = world.floorY;
        if (data.body.visible) {
          const swing = data.activity === 'run' ? 14 : 8;
          data.body.children.forEach(child => {
            if (child.userData.limb === 'leg') child.rotation.x = moving || data.activity === 'dance' || data.activity === 'warmup' ? Math.sin(elapsed * swing) * (data.activity === 'dance' ? 0.35 : data.activity === 'warmup' ? 0.2 : 0.3) : 0;
            if (child.userData.limb === 'arm' && data.activity === 'dance') child.rotation.x = Math.sin(elapsed * 5) * 0.5;
          });
        }
        if (data.mixer) {
          data.action.paused = !moving && data.activity !== 'dance';
          data.action.timeScale = data.activity === 'run' ? 1.7 : 1;
          data.mixer.update(delta);
        }
      });
      // Walking: the camera trails the avatar at third-person distance.
      if (ownMoved) {
        world.cameraGoal = null;
        const blend = 1 - Math.exp(-delta * 6);
        const offset = camera.position.clone().sub(controls.target);
        followTarget.copy(ownMoved.position).setY(ownMoved.position.y + FOLLOW_HEIGHT);
        controls.target.lerp(followTarget, blend);
        offset.setLength(THREE.MathUtils.lerp(offset.length(), FOLLOW_DISTANCE, blend));
        camera.position.copy(controls.target).add(offset);
      }

      // No avatar of our own yet: the stick glides the camera around instead.
      if (hasInput && !ownMoved && ![...world.characters.values()].some(character => character.userData.isOwn)) {
        const step = move.clone().multiplyScalar((running ? 6 : 3.5) * inputStrength * delta);
        camera.position.add(step);
        controls.target.add(step);
        world.cameraGoal = null;
      }

      if (world.cameraGoal) {
        const blend = 1 - Math.exp(-delta * 3.5);
        camera.position.lerp(world.cameraGoal.position, blend);
        controls.target.lerp(world.cameraGoal.target, blend);
        if (camera.position.distanceTo(world.cameraGoal.position) < 0.02) world.cameraGoal = null;
      }

      const bounds = world.cameraBounds;
      if (bounds) {
        const offset = camera.position.clone().sub(controls.target);
        controls.target.clamp(bounds.min, bounds.max);
        if (offset.length() > controls.maxDistance) offset.setLength(controls.maxDistance);
        camera.position.copy(controls.target).add(offset);
      }
      controls.update();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      observer.disconnect();
      timer.dispose?.();
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      controls.dispose();
      disposeObject(scene);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      worldRef.current = null;
    };
  }, []);

  useEffect(() => {
    const world = worldRef.current;
    if (world) applyView(world, view);
  }, [view]);

  useEffect(() => {
    const world = worldRef.current;
    if (!world) return;
    const ids = new Set(avatars.map(avatar => avatar.id));
    world.characters.forEach((character, id) => {
      if (ids.has(id)) return;
      world.scene.remove(character);
      disposeObject(character);
      world.characters.delete(id);
    });
    avatars.forEach(avatar => {
      const isOwn = Boolean(ownerId) && avatar.ownerId === ownerId;
      const existing = world.characters.get(avatar.id);
      if (existing) {
        existing.userData.avatarData = avatar;
        existing.userData.isOwn = isOwn;
        return;
      }
      const seed = avatarSeed(avatar);
      const character = new THREE.Group();
      const body = createAvatarBody(avatar);
      character.add(body);
      character.add(createNameTag(avatar));
      const heading = (seed % 360) * (Math.PI / 180);
      character.userData = {
        avatarData: avatar,
        isOwn,
        body,
        heading,
        wanderHeading: heading,
        walkSpeed: 0.25 + (seed % 35) / 100,
        activity: 'walk',
        activityTimer: 3 + Math.random() * 5,
      };
      character.position.copy(findFreeSpot(world, seed));
      world.scene.add(character);
      world.characters.set(avatar.id, character);

      // A freshly created own avatar: glide the camera over to it.
      if (isOwn && world.modelLoaded) focusOnCharacter(world, character);

      if (avatar.model) {
        world.modelLoader.load(avatar.model, gltf => {
          if (world.characters.get(avatar.id) !== character) return;
          const uploadedAvatar = gltf.scene;
          const avatarBounds = new THREE.Box3().setFromObject(uploadedAvatar);
          const avatarSize = avatarBounds.getSize(new THREE.Vector3());
          const avatarCenter = avatarBounds.getCenter(new THREE.Vector3());
          const avatarScale = 0.78 / Math.max(avatarSize.y, avatarSize.x, avatarSize.z, 0.01);
          uploadedAvatar.scale.setScalar(avatarScale);
          uploadedAvatar.position.set(-avatarCenter.x * avatarScale, -avatarBounds.min.y * avatarScale, -avatarCenter.z * avatarScale);
          uploadedAvatar.traverse(object => {
            if (!object.isMesh) return;
            object.castShadow = true;
            object.receiveShadow = true;
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach(material => { if (material?.map) material.map.anisotropy = world.maxAnisotropy; });
          });
          body.visible = false;
          character.add(uploadedAvatar);
          if (gltf.animations?.length) {
            const mixer = new THREE.AnimationMixer(uploadedAvatar);
            const walkingClip = gltf.animations.find(clip => /walk|run|locomotion/i.test(clip.name)) || gltf.animations[0];
            character.userData.mixer = mixer;
            character.userData.action = mixer.clipAction(walkingClip).play();
          }
        }, undefined, error => console.warn('Avatar model fallback:', error));
      }
    });
  }, [avatars, ownerId]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div ref={mountRef} className="absolute inset-0" aria-label="สนามชุมชน 3 มิติ" />
      <Joystick inputRef={joystickRef} />
    </div>
  );
}
