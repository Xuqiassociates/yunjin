import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const canvas = document.querySelector("#yunjin-canvas");
const openingSection = document.querySelector("#yunjin-opening");

const copyMain = document.querySelector(".opening-copy-main");
const copySecond = document.querySelector(".opening-copy-second");
const copyThird = document.querySelector(".opening-copy-third");
const copyFinal = document.querySelector(".opening-copy-final");
const scrollHint = document.querySelector(".scroll-hint");

/* ========== Basic Three.js Setup ========== */

const scene = new THREE.Scene();
scene.background = new THREE.Color("#030303");
scene.fog = new THREE.Fog("#030303", 3.5, 12);

const camera = new THREE.PerspectiveCamera(
  35,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);

camera.position.set(0, 0.8, 3.2);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

/* ========== Lighting ========== */

const ambientLight = new THREE.AmbientLight("#fff0d0", 1.15);
scene.add(ambientLight);

const keyLight = new THREE.PointLight("#d9a85f", 7, 14);
keyLight.position.set(2.8, 3.4, 3.2);
scene.add(keyLight);

const sideLight = new THREE.PointLight("#7f3a28", 3, 12);
sideLight.position.set(-3, 1.2, 2.5);
scene.add(sideLight);

const blueFill = new THREE.PointLight("#4a607c", 1.4, 10);
blueFill.position.set(0, 2, -3);
scene.add(blueFill);

/* ========== Groups ========== */

const dreamGroup = new THREE.Group();
const threadGroup = new THREE.Group();
const fabricGroup = new THREE.Group();
const mistGroup = new THREE.Group();

scene.add(dreamGroup);
scene.add(threadGroup);
scene.add(fabricGroup);
scene.add(mistGroup);

let loom = null;

/* ========== Helpers ========== */

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

function setModelOpacity(model, opacity) {
  if (!model) return;

  model.traverse((child) => {
    if (child.isMesh && child.material) {
      if (!child.userData.originalMaterial) {
        child.material = child.material.clone();
        child.userData.originalMaterial = child.material;
      }

      child.material.transparent = true;
      child.material.opacity = opacity;
      child.material.depthWrite = opacity > 0.88;
    }
  });
}

/* ========== Load Loom GLB ========== */

const loader = new GLTFLoader();

loader.load(
  "./assets/models/yunjin-loom-optimized.glb",

  (gltf) => {
    loom = gltf.scene;

    loom.position.set(0, -0.65, 0);
    loom.rotation.set(0.05, -0.38, 0);
    loom.scale.set(1.5, 1.5, 1.5);

    loom.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false;
        child.receiveShadow = false;

        if (child.material) {
          child.material = child.material.clone();
          child.material.transparent = true;
          child.material.opacity = 0.82;
        }
      }
    });

    dreamGroup.add(loom);
    console.log("Yunjin loom loaded successfully.");
  },

  () => {
    console.log("Loading Yunjin loom...");
  },

  (error) => {
    console.error("GLB loading error:", error);
  }
);

/* ========== Create Procedural Silk Threads ========== */

const threadMaterials = [];

function createThread(index) {
  const points = [];
  const offset = index * 0.37;

  for (let i = 0; i < 7; i++) {
    const x = -2.8 + i * 0.95;
    const y = Math.sin(i * 0.9 + offset) * 0.35 + (Math.random() - 0.5) * 0.65;
    const z = -1.6 + Math.cos(i * 0.6 + offset) * 0.8 + Math.random() * 0.35;

    points.push(new THREE.Vector3(x, y, z));
  }

  const curve = new THREE.CatmullRomCurve3(points);
  const geometry = new THREE.TubeGeometry(curve, 80, 0.006, 8, false);

  const colors = ["#d6a85a", "#b16b3a", "#874132", "#e8c67a", "#395170"];
  const material = new THREE.MeshBasicMaterial({
    color: colors[index % colors.length],
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData.speed = 0.001 + Math.random() * 0.002;
  mesh.userData.baseY = mesh.position.y;
  mesh.userData.offset = offset;

  threadMaterials.push(material);
  threadGroup.add(mesh);
}

for (let i = 0; i < 70; i++) {
  createThread(i);
}

threadGroup.position.set(0, 0, 0.2);

/* ========== Create Dream Mist ========== */

function createMistTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;

  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(128, 128, 8, 128, 128, 128);

  gradient.addColorStop(0, "rgba(255, 242, 210, 0.24)");
  gradient.addColorStop(0.45, "rgba(194, 155, 99, 0.08)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  return new THREE.CanvasTexture(canvas);
}

const mistTexture = createMistTexture();
const mistMaterials = [];

for (let i = 0; i < 16; i++) {
  const material = new THREE.MeshBasicMaterial({
    map: mistTexture,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const plane = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.8), material);

  plane.position.set(
    (Math.random() - 0.5) * 6,
    (Math.random() - 0.5) * 2.5,
    -1.5 + Math.random() * 2.2
  );

  plane.rotation.z = Math.random() * Math.PI;
  plane.scale.setScalar(0.8 + Math.random() * 1.5);

  mistMaterials.push(material);
  mistGroup.add(plane);
}

/* ========== Create Final Yunjin Fabric Surface ========== */

function createFabricTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;

  const ctx = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, 1024, 1024);
  bg.addColorStop(0, "#13080a");
  bg.addColorStop(0.36, "#411217");
  bg.addColorStop(0.68, "#10233a");
  bg.addColorStop(1, "#060609");

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1024, 1024);

  // fine woven vertical lines
  for (let x = 0; x < 1024; x += 10) {
    ctx.strokeStyle = x % 30 === 0
      ? "rgba(230, 188, 98, 0.32)"
      : "rgba(255, 240, 190, 0.08)";

    ctx.lineWidth = x % 30 === 0 ? 1.2 : 0.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + Math.sin(x * 0.02) * 8, 1024);
    ctx.stroke();
  }

  // fine woven horizontal lines
  for (let y = 0; y < 1024; y += 12) {
    ctx.strokeStyle = y % 36 === 0
      ? "rgba(230, 188, 98, 0.24)"
      : "rgba(255, 240, 190, 0.06)";

    ctx.lineWidth = y % 36 === 0 ? 1 : 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y + Math.cos(y * 0.018) * 6);
    ctx.stroke();
  }

  // brocade-like cloud motifs
  for (let i = 0; i < 18; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const r = 38 + Math.random() * 80;

    ctx.strokeStyle = "rgba(232, 194, 105, 0.24)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.42, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(x + r * 0.35, y + r * 0.1, r * 0.55, r * 0.26, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;

  return texture;
}

const fabricTexture = createFabricTexture();

const fabricMaterial = new THREE.MeshBasicMaterial({
  map: fabricTexture,
  transparent: true,
  opacity: 0,
  depthWrite: false
});

const fabric = new THREE.Mesh(
  new THREE.PlaneGeometry(5.6, 3.4, 40, 40),
  fabricMaterial
);

fabric.position.set(0, 0, -1.2);
fabric.rotation.set(0, 0, 0);
fabric.scale.set(0.55, 0.55, 0.55);

fabricGroup.add(fabric);

/* ========== Scroll Progress ========== */

let scrollProgress = 0;

function updateScrollProgress() {
  const maxScroll = openingSection.offsetHeight - window.innerHeight;
  scrollProgress = clamp(window.scrollY / maxScroll, 0, 1);

  updateSceneByScroll(scrollProgress);
  updateTextByScroll(scrollProgress);
}

function updateTextByScroll(p) {
  copyMain.classList.toggle("is-visible", p < 0.22);
  copySecond.classList.toggle("is-visible", p >= 0.20 && p < 0.47);
  copyThird.classList.toggle("is-visible", p >= 0.46 && p < 0.73);
  copyFinal.classList.toggle("is-visible", p >= 0.72);

  if (scrollHint) {
    scrollHint.style.opacity = p < 0.08 ? "1" : "0";
  }
}

function updateSceneByScroll(p) {
  const dreamFade = 1 - smoothstep(0.22, 0.62, p);
  const threadFade = smoothstep(0.24, 0.66, p);
  const fabricFade = smoothstep(0.68, 0.96, p);

  // Zoom out: camera moves backwards as user scrolls
  camera.position.z = lerp(3.0, 7.8, p);
  camera.position.y = lerp(0.65, 1.15, p);
  camera.lookAt(0, 0, 0);

  // Dream group becomes smaller and fades away
  dreamGroup.scale.setScalar(lerp(1.45, 0.58, p));
  dreamGroup.position.y = lerp(-0.05, -0.25, p);
  dreamGroup.rotation.y = lerp(0, 0.34, p);

  setModelOpacity(loom, 0.86 * dreamFade);

  // Threads appear and slowly settle into woven order
  threadGroup.rotation.z = lerp(-0.28, 0.02, p);
  threadGroup.scale.set(
    lerp(1.5, 1.0, p),
    lerp(1.4, 0.82, p),
    1
  );

  threadMaterials.forEach((material) => {
    material.opacity = 0.05 + threadFade * 0.52;
  });

  // Mist clears as the user wakes from the dream
  mistMaterials.forEach((material) => {
    material.opacity = lerp(0.2, 0.02, p);
  });

  // Final brocade surface reveal
  fabricMaterial.opacity = fabricFade;
  fabric.scale.setScalar(lerp(0.55, 1.15, fabricFade));
  fabric.position.z = lerp(-1.4, -1.9, fabricFade);
}

/* ========== Animation Loop ========== */

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const elapsed = clock.getElapsedTime();

  if (loom) {
    loom.rotation.y += 0.0012;
    loom.position.y += Math.sin(elapsed * 0.7) * 0.0008;
  }

  threadGroup.children.forEach((thread, index) => {
    thread.position.y =
      Math.sin(elapsed * 0.45 + thread.userData.offset) * 0.035;

    thread.rotation.y =
      Math.sin(elapsed * 0.18 + index) * 0.04;
  });

  mistGroup.children.forEach((mist, index) => {
    mist.rotation.z += 0.0005 + index * 0.000015;
    mist.position.x += Math.sin(elapsed * 0.12 + index) * 0.0008;
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
