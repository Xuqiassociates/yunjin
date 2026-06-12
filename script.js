import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const canvas = document.querySelector("#yunjin-canvas");
const openingSection = document.querySelector("#yunjin-opening");

const copyMain = document.querySelector(".opening-copy-main");
const copySecond = document.querySelector(".opening-copy-second");
const copyThird = document.querySelector(".opening-copy-third");
const copyFinal = document.querySelector(".opening-copy-final");
const scrollHint = document.querySelector(".scroll-hint");

const loading = document.querySelector("#loading");
const loadingPercent = document.querySelector("#loading-percent");

/* =========================
   Scene
========================= */

const scene = new THREE.Scene();

const openingColor = new THREE.Color("#e8e1d6");
const laterColor = new THREE.Color("#d9cfc0");

scene.background = openingColor.clone();
scene.fog = new THREE.FogExp2("#e8e1d6", 0.06);

const camera = new THREE.PerspectiveCamera(
  34,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);

camera.position.set(0, 0.75, 3.25);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: "high-performance"
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.28;

/* =========================
   Lights
========================= */

const ambientLight = new THREE.AmbientLight("#fff7ed", 1.45);
scene.add(ambientLight);

const mainLight = new THREE.PointLight("#f4d6aa", 6.4, 18);
mainLight.position.set(2.4, 3.6, 4.2);
scene.add(mainLight);

const sideLight = new THREE.PointLight("#c8a27c", 2.6, 12);
sideLight.position.set(-2.9, 1.4, 2.6);
scene.add(sideLight);

const backLight = new THREE.PointLight("#d8c7b2", 2.1, 14);
backLight.position.set(0, 2.5, -4);
scene.add(backLight);

/* =========================
   Groups
========================= */

const dreamGroup = new THREE.Group();
const threadGroup = new THREE.Group();
const mistGroup = new THREE.Group();
const fabricGroup = new THREE.Group();

scene.add(dreamGroup);
scene.add(threadGroup);
scene.add(mistGroup);
scene.add(fabricGroup);

let loom = null;

/* =========================
   Helpers
========================= */

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function setObjectOpacity(object, opacity) {
  if (!object) return;

  object.traverse((child) => {
    if (child.isMesh && child.material) {
      if (!child.userData.clonedMaterial) {
        child.material = child.material.clone();
        child.userData.clonedMaterial = true;
      }

      child.material.transparent = true;
      child.material.opacity = opacity;
      child.material.depthWrite = opacity > 0.84;
    }
  });
}

/* =========================
   Load GLB Loom
========================= */

const loader = new GLTFLoader();

loader.load(
  "./assets/models/yunjin-loom-optimized.glb",

  (gltf) => {
    loom = gltf.scene;

    loom.position.set(0, -0.72, 0);
    loom.rotation.set(0.04, -0.36, 0);
    loom.scale.set(1.5, 1.5, 1.5);

    loom.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material = child.material.clone();
        child.material.transparent = true;
        child.material.opacity = 0.78;

        if ("roughness" in child.material) {
          child.material.roughness = 0.86;
        }

        if ("metalness" in child.material) {
          child.material.metalness = 0.03;
        }
      }
    });

    dreamGroup.add(loom);

    if (loading) {
      loading.classList.add("is-hidden");
    }

    console.log("Yunjin loom loaded.");
  },

  (xhr) => {
    if (xhr.total && loadingPercent) {
      const percent = Math.round((xhr.loaded / xhr.total) * 100);
      loadingPercent.textContent = `${percent}%`;
    }
  },

  (error) => {
    console.error("GLB loading error:", error);

    if (loading) {
      loading.querySelector("span").textContent = "Loom loading failed";
    }
  }
);

/* =========================
   Silk Threads
========================= */

const threadMaterials = [];

function createThread(index) {
  const points = [];
  const offset = index * 0.42;

  for (let i = 0; i < 8; i++) {
    const x = -3.25 + i * 0.92;
    const y = Math.sin(i * 0.88 + offset) * 0.32 + (Math.random() - 0.5) * 0.5;
    const z = -1.9 + Math.cos(i * 0.54 + offset) * 0.88;

    points.push(new THREE.Vector3(x, y, z));
  }

  const curve = new THREE.CatmullRomCurve3(points);
  const geometry = new THREE.TubeGeometry(curve, 70, 0.0055, 8, false);

  const palette = [
    "#c99a58",
    "#d8b06b",
    "#b98a54",
    "#8f5d42",
    "#6d7d8a"
  ];

  const material = new THREE.MeshBasicMaterial({
    color: palette[index % palette.length],
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const thread = new THREE.Mesh(geometry, material);

  thread.userData.offset = offset;
  thread.userData.floatSpeed = 0.34 + Math.random() * 0.3;
  thread.userData.rotationSpeed = 0.015 + Math.random() * 0.02;

  threadMaterials.push(material);
  threadGroup.add(thread);
}

for (let i = 0; i < 72; i++) {
  createThread(i);
}

threadGroup.position.set(0, 0.02, 0.04);

/* =========================
   Mist
========================= */

function createMistTexture() {
  const mistCanvas = document.createElement("canvas");
  mistCanvas.width = 256;
  mistCanvas.height = 256;

  const ctx = mistCanvas.getContext("2d");
  const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);

  gradient.addColorStop(0, "rgba(255, 250, 240, 0.26)");
  gradient.addColorStop(0.42, "rgba(222, 205, 182, 0.11)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  return new THREE.CanvasTexture(mistCanvas);
}

const mistTexture = createMistTexture();
const mistMaterials = [];

for (let i = 0; i < 26; i++) {
  const material = new THREE.MeshBasicMaterial({
    map: mistTexture,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const mist = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 3.3), material);

  mist.position.set(
    (Math.random() - 0.5) * 6.2,
    (Math.random() - 0.5) * 2.8,
    -2.6 + Math.random() * 3.8
  );

  mist.rotation.z = Math.random() * Math.PI;
  mist.scale.setScalar(0.7 + Math.random() * 1.85);

  mist.userData.speed = 0.00035 + Math.random() * 0.0007;

  mistMaterials.push(material);
  mistGroup.add(mist);
}

/* =========================
   Fabric Terrain Reveal
   Inspired by Three.js terrain + fog
========================= */

function createFabricTexture() {
  const fabricCanvas = document.createElement("canvas");
  fabricCanvas.width = 1024;
  fabricCanvas.height = 1024;

  const ctx = fabricCanvas.getContext("2d");

  // Warm brocade base
  const bg = ctx.createLinearGradient(0, 0, 1024, 1024);
  bg.addColorStop(0, "#3a1f1d");
  bg.addColorStop(0.28, "#7a3430");
  bg.addColorStop(0.58, "#2f4f67");
  bg.addColorStop(1, "#1a1715");

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1024, 1024);

  // Soft luminous centre, like light falling on fabric
  const glow = ctx.createRadialGradient(520, 420, 40, 520, 420, 520);
  glow.addColorStop(0, "rgba(255, 229, 170, 0.30)");
  glow.addColorStop(0.45, "rgba(220, 170, 95, 0.10)");
  glow.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1024, 1024);

  // Vertical warp threads
  for (let x = 0; x < 1024; x += 8) {
    const strong = x % 40 === 0;

    ctx.strokeStyle = strong
      ? "rgba(238, 199, 112, 0.46)"
      : "rgba(255, 235, 186, 0.09)";

    ctx.lineWidth = strong ? 1.25 : 0.45;

    ctx.beginPath();
    ctx.moveTo(x, 0);

    for (let y = 0; y <= 1024; y += 32) {
      const drift = Math.sin(y * 0.015 + x * 0.03) * 6;
      ctx.lineTo(x + drift, y);
    }

    ctx.stroke();
  }

  // Horizontal weft threads
  for (let y = 0; y < 1024; y += 10) {
    const strong = y % 50 === 0;

    ctx.strokeStyle = strong
      ? "rgba(238, 199, 112, 0.30)"
      : "rgba(255, 235, 186, 0.065)";

    ctx.lineWidth = strong ? 1 : 0.4;

    ctx.beginPath();
    ctx.moveTo(0, y);

    for (let x = 0; x <= 1024; x += 32) {
      const drift = Math.cos(x * 0.014 + y * 0.025) * 5;
      ctx.lineTo(x, y + drift);
    }

    ctx.stroke();
  }

  // Brocade cloud motifs
  for (let i = 0; i < 26; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const r = 34 + Math.random() * 90;

    ctx.strokeStyle = "rgba(236, 195, 105, 0.26)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.ellipse(
      x,
      y,
      r,
      r * 0.38,
      Math.random() * Math.PI,
      0,
      Math.PI * 2
    );
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(
      x + r * 0.35,
      y + r * 0.08,
      r * 0.52,
      r * 0.22,
      Math.random() * Math.PI,
      0,
      Math.PI * 2
    );
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x - r * 0.25, y + r * 0.05, r * 0.2, 0, Math.PI * 1.5);
    ctx.stroke();
  }

  // Fine noise grain
  const image = ctx.getImageData(0, 0, 1024, 1024);
  const data = image.data;

  for (let i = 0; i < data.length; i += 4) {
    const noise = Math.random() * 10 - 5;
    data[i] += noise;
    data[i + 1] += noise;
    data[i + 2] += noise;
  }

  ctx.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(fabricCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;

  return texture;
}

function createFabricTerrainGeometry() {
  const geometry = new THREE.PlaneGeometry(6.2, 3.75, 120, 76);
  const positions = geometry.attributes.position;

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);

    // Micro terrain: fabric waves + woven surface
    const largeWave =
      Math.sin(x * 2.1) * 0.045 +
      Math.cos(y * 3.4) * 0.035;

    const fineThreadWave =
      Math.sin(x * 18.0) * 0.006 +
      Math.cos(y * 22.0) * 0.005;

    const diagonalMemory =
      Math.sin((x + y) * 5.2) * 0.018;

    const edgeSoftening =
      1.0 -
      Math.min(
        0.55,
        Math.abs(x) / 4.2 + Math.abs(y) / 3.2
      );

    const z =
      (largeWave + fineThreadWave + diagonalMemory) *
      edgeSoftening;

    positions.setZ(i, z);
  }

  geometry.computeVertexNormals();
  return geometry;
}

const fabricTexture = createFabricTexture();
const fabricGeometry = createFabricTerrainGeometry();

const fabricMaterial = new THREE.MeshStandardMaterial({
  map: fabricTexture,
  transparent: true,
  opacity: 0,
  roughness: 0.76,
  metalness: 0.08,
  side: THREE.DoubleSide
});

const fabric = new THREE.Mesh(fabricGeometry, fabricMaterial);

fabric.position.set(0, 0, -2.25);
fabric.scale.setScalar(0.58);

// A very small tilt helps the fabric catch light
fabric.rotation.x = -0.035;

fabricGroup.add(fabric);

/* =========================
   Scroll Control
========================= */

let scrollProgress = 0;

let targetCameraZ = 3.25;
let targetCameraY = 0.75;

let currentCameraZ = 3.25;
let currentCameraY = 0.75;

function updateScrollProgress() {
  const sectionTop = openingSection.offsetTop;
  const maxScroll = openingSection.offsetHeight - window.innerHeight;
  const localScroll = window.scrollY - sectionTop;

  scrollProgress = clamp(localScroll / maxScroll, 0, 1);

  updateSceneByScroll(scrollProgress);
  updateTextByScroll(scrollProgress);
}

function updateTextByScroll(p) {
  copyMain.classList.toggle("is-visible", p < 0.22);
  copySecond.classList.toggle("is-visible", p >= 0.19 && p < 0.45);
  copyThird.classList.toggle("is-visible", p >= 0.43 && p < 0.72);
  copyFinal.classList.toggle("is-visible", p >= 0.70);

  if (scrollHint) {
    scrollHint.style.opacity = p < 0.07 ? "1" : "0";
  }
}

function updateSceneByScroll(p) {
  const dreamFade = 1 - smoothstep(0.18, 0.58, p);
  const threadFade = smoothstep(0.26, 0.68, p);
  const fabricFade = smoothstep(0.70, 0.96, p);

  scene.background.copy(openingColor).lerp(laterColor, p * 0.65);
  scene.fog.color.copy(scene.background);
  scene.fog.density = lerp(0.07, 0.022, p);

  targetCameraZ = lerp(3.15, 8.35, p);
  targetCameraY = lerp(0.72, 1.18, p);

  dreamGroup.scale.setScalar(lerp(1.55, 0.5, p));
  dreamGroup.position.y = lerp(-0.08, -0.32, p);
  dreamGroup.position.z = lerp(0, -1.35, p);
  dreamGroup.rotation.y = lerp(0, 0.42, p);

  setObjectOpacity(loom, 0.78 * dreamFade);

  threadGroup.rotation.z = lerp(-0.34, 0.015, p);
  threadGroup.rotation.y = lerp(-0.22, 0.04, p);

  threadGroup.scale.set(
    lerp(1.55, 1.02, p),
    lerp(1.38, 0.82, p),
    1
  );

  threadMaterials.forEach((material) => {
    material.opacity = 0.015 + threadFade * 0.48;
  });

  mistMaterials.forEach((material, index) => {
    const variation = index % 3 === 0 ? 1.18 : 0.82;
    material.opacity = lerp(0.23 * variation, 0.028, p);
  });

  fabricMaterial.opacity = fabricFade;
fabric.scale.setScalar(lerp(0.58, 1.22, fabricFade));
fabric.position.z = lerp(-2.1, -2.85, fabricFade);

// final stage: fabric becomes more calm and frontal
fabric.rotation.x = lerp(-0.11, -0.035, fabricFade);
}

/* =========================
   Animation
========================= */

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const elapsed = clock.getElapsedTime();

  currentCameraZ += (targetCameraZ - currentCameraZ) * 0.065;
  currentCameraY += (targetCameraY - currentCameraY) * 0.065;

  camera.position.z = currentCameraZ;
  camera.position.y = currentCameraY;
  camera.lookAt(0, 0, 0);

  if (loom) {
    loom.rotation.y += 0.001;
    loom.position.y += Math.sin(elapsed * 0.55) * 0.00075;
  }

  threadGroup.children.forEach((thread, index) => {
    thread.position.y =
      Math.sin(elapsed * thread.userData.floatSpeed + thread.userData.offset) *
      0.038;

    thread.rotation.y =
      Math.sin(elapsed * 0.16 + index * 0.2) * 0.043;
  });

  mistGroup.children.forEach((mist, index) => {
    mist.rotation.z += mist.userData.speed;
    mist.position.x += Math.sin(elapsed * 0.1 + index) * 0.00075;
    mist.position.y += Math.cos(elapsed * 0.08 + index) * 0.00055;
  });

  fabric.rotation.z = Math.sin(elapsed * 0.12) * 0.006;

  renderer.render(scene, camera);
}

updateScrollProgress();
animate();

window.addEventListener("scroll", updateScrollProgress);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  updateScrollProgress();
});
