'use strict';

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

export let scene;
export let sceneWatarmark;
export let renderer;
export let canvas;
export let camera;
export let controls;
export let renderScale = 1;
export let envMap;
export let ambientLight;
export const IMPORTED_MODELS = [];
export let isModelsLoaded = false;

const TEST_MODE = false;

const scenePropertiesDefault = {
  BACKGROUND_COLOR: 0xffffff,
  MODEL_PATHS: ['./src/models/empty_scene.glb'],
  ENVIRONMENT_MAP: '',
  ENVIRONMENT_MAP_INTENSITY: 0.8,
  SHADOW_TRANSPARENCY: 0.0,
  MODEL_CENTER_POSITION: 0,
};

import { 
  TONE_MAPPING_EXPOSURE,
  AMBIENTLIGHT_INTENSITY,
  ENVIRONMENT_MAP_ROTATEBLE,
  ENVIRONMENT_MAP_ANGLE,
  ENVIRONMENT_MAP_FLIP_X,
} from './settings.js';

let dirLight, dirLightIntencity;

export function Get3DScene() {
  return scene;
}

export function create3DScene(properties = scenePropertiesDefault, loadFunction) {
  if (!properties) { properties = scenePropertiesDefault; }

  const {
    MODEL_PATHS,
    ENVIRONMENT_MAP,
    ENVIRONMENT_MAP_INTENSITY,
    MODEL_CENTER_POSITION,
  } = properties;

  // Init SCENE, canvas, RENDERER
  scene = new THREE.Scene();
  
  if (TEST_MODE) {
    window.scene = scene;
  }

  scene.background = null;
  canvas = document.getElementById('ar_model_view');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, alpha: true });
  renderer.shadowMap.enabled = true;
  renderer.shadowMapSoft = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.setPixelRatio((window.devicePixelRatio ? window.devicePixelRatio : 1) * renderScale);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.physicallyCorrectLights = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = TONE_MAPPING_EXPOSURE;
  renderer.colorManagement = true;
  
  const DIR_LIGHT_INT = 2.0;
  const POINT_LIGHT_INT = 2.0;
  
  // Init CAMERA
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);

  if (ENVIRONMENT_MAP != '') {
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const rgbeLoader = new RGBELoader();

    if (!ENVIRONMENT_MAP_ROTATEBLE) {
      rgbeLoader.load(ENVIRONMENT_MAP, function (texture) {
        envMap = pmremGenerator.fromEquirectangular(texture).texture;
        scene.environment = envMap;
        texture.dispose();
        pmremGenerator.dispose();
      });
    } else {
      rgbeLoader.load(ENVIRONMENT_MAP, function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        const sceneFlipped = new THREE.Scene();
        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(1, 32, 32),
          new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide
          })
        );
        sphere.scale.x = (ENVIRONMENT_MAP_FLIP_X) ? 1 : -1;
        sceneFlipped.add(sphere);
        const angle = THREE.MathUtils.degToRad(ENVIRONMENT_MAP_ANGLE);
        sphere.rotation.y = angle;
        const envMap = pmremGenerator.fromScene(sceneFlipped).texture;
        scene.environment = envMap;
        texture.dispose();
        pmremGenerator.dispose();
      });
    }
  }

  // IMPORT MODELS
  async function importAllModels(array, callback) {
    const loader = new GLTFLoader();

    for (const element of array) {
      const model = await loader.loadAsync(element);
      onLoadModel(model);
    }

    if (callback != null) {
      callback();
    }
  }

  function onLoadModel(gltf) {
    const model = gltf.scene;
    model.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        if (o.material.map) {
          o.material.map.anisotropy = 16;
          o.material.map.needsUpdate = true;
          o.material.needsUpdate = true;
        }

        if (ENVIRONMENT_MAP != '') {
          if (!o.material.envMap) {
            o.material.envMap = scene.environment;
            o.material.envMapIntensity = ENVIRONMENT_MAP_INTENSITY;
          }
        }
      }
    });

    const scale = 1;
    model.scale.set(scale, scale, scale);
    model.position.y = MODEL_CENTER_POSITION;
    IMPORTED_MODELS.push(model);
  }

  function onImportModelSuccessful() {
    for (let i = 0; i < IMPORTED_MODELS.length; i++) {
      IMPORTED_MODELS[i].visible = false;
      scene.add(IMPORTED_MODELS[i]);
    }
    isModelsLoaded = true;
    loadFunction();
  }

  importAllModels(MODEL_PATHS, onImportModelSuccessful);

  //      LIGHTS
  if (ENVIRONMENT_MAP == '') {
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x000000, 16);
    hemiLight.position.set(0, 0, 0);
    scene.add(hemiLight);
  }

  ambientLight = new THREE.AmbientLight(0x404040);
  ambientLight.intensity = AMBIENTLIGHT_INTENSITY;
  scene.add(ambientLight);
  //---------------------------------------------
  const cameraSize = 2;
  dirLightIntencity = DIR_LIGHT_INT;
  dirLight = new THREE.DirectionalLight(0xffffff, dirLightIntencity);
  dirLight.position.set(0, 12, 1.000001);
  dirLight.castShadow = true;
  dirLight.shadow.bias = -0.0005;
  dirLight.shadow.camera.left = -cameraSize;
  dirLight.shadow.camera.right = cameraSize;
  dirLight.shadow.camera.top = cameraSize;
  dirLight.shadow.camera.bottom = -cameraSize;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 50;

  switch (getMobileOperatingSystem()) {
    case 'Android':
      dirLight.shadow.mapSize = new THREE.Vector2(1024, 1024);
      dirLight.shadow.radius = 10;
      dirLight.shadow.blurSamples = 10;
      break;
    case 'iOS':
      dirLight.shadow.mapSize = new THREE.Vector2(2048, 2048);
      dirLight.shadow.radius = 10;
      dirLight.shadow.blurSamples = 10;
      break;
    case 'Windows':
      dirLight.shadow.mapSize = new THREE.Vector2(1024, 1024);
      dirLight.shadow.radius = 20;
      dirLight.shadow.blurSamples = 20;
      break;
    case 'Macintosh':
      dirLight.shadow.mapSize = new THREE.Vector2(1024, 1024);
      dirLight.shadow.radius = 20;
      dirLight.shadow.blurSamples = 20;
      break;
    default:
      dirLight.shadow.mapSize = new THREE.Vector2(1024, 1024);
      dirLight.shadow.radius = 10;
      dirLight.shadow.blurSamples = 10;
      break;
  }

  scene.add(dirLight);

  const pointLight = new THREE.PointLight(0xFFFFFF, POINT_LIGHT_INT);
  pointLight.position.set(0, 5, -5);
  scene.add(pointLight);

  //    CONTROLS
  controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI / 1;
  controls.minPolarAngle = -Math.PI / 1;
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.dampingFactor = 0.2;
  controls.autoRotateSpeed = 3;
  controls.rotateSpeed = 0.4;
  controls.maxDistance = 5;
  controls.minDistance = 0.81;
  controls.autoRotate = false;
  controls.enableZoom = false;

  camera.position.set(0, 0, 2.7);
  controls.target.set(0, 0, 0);

  if (TEST_MODE) {
    controls.enablePan = true;
    controls.minDistance = 0.01;
  }

  controls.addEventListener('end', () => {

    if (TEST_MODE) {
      consoleLogPosition('cameraPosition', camera.position, 3);
    }
  });

  function consoleLogPosition(text = '', pos, num = 2) {
    let k = 1;
  
    for (let i = 0; i < num; i++) {
      k = k * 10;
    }
  
    const x = Math.round(pos.x * k) / k;
    const y = Math.round(pos.y * k) / k;
    const z = Math.round(pos.z * k) / k;
  
    console.log('🚀 ' + text + `: { x: ${x}, y: ${y}, z: ${z} },`);
  }

  // ANIMATE
  let lastTime = 0;
  const fps = 45;
  const interval = 1000 / fps;

  function animate(time) {
    requestAnimationFrame(animate);

    const delta = time - lastTime;
    if (delta < interval) return;
    lastTime = time;

    if (controls.enabled) { controls.update(); }

    renderer.render(scene, camera);

    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }
  }

  function resizeRendererToDisplaySize(renderer) {
    const canvasContainer = document.getElementById('ar_model_viewer');
    const rect = canvasContainer.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const needResize = renderer.domElement.width !== width ||
      renderer.domElement.height !== height;

    if (needResize) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      controls.update();
    }
    return needResize;
  }

  animate();
}

// Additional functions
export function getMobileOperatingSystem() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;

  if (/Macintosh/i.test(userAgent)) {
    return 'Macintosh';
  }
  if (/Windows/i.test(userAgent) || /Win/i.test(userAgent)) {
    return 'Windows';
  }
  if (/windows phone/i.test(userAgent)) {
    return 'Windows Phone';
  }
  if (/android/i.test(userAgent)) {
    return 'Android';
  }
  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return 'iOS';
  }

  return 'unknown';
}

// Animation functions
export function animateScale(
  model,
  duration = 500,
  startScale = 0,
  endScale = 1,
  timingKeyword = 'ease-in',
  callback = () => springScale(model)
) {
  function timingFunction(progress) {
    switch (timingKeyword) {
      case 'ease-in':
        return progress * progress;
      case 'ease-out':
        return 1 - Math.pow(1 - progress, 2);
      case 'ease-in-out':
        return progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      default:
        return progress;
    }
  }

  let startTime = null;

  function animate(currentTime) {
    if (!startTime) {
      startTime = currentTime;
    }

    const elapsedTime = currentTime - startTime;
    const progress = Math.min(elapsedTime / duration, 1);
    const easedProgress = timingFunction(progress);
    const interpolatedScale = startScale + (endScale - startScale) * easedProgress;
    model.scale.set(interpolatedScale, interpolatedScale, interpolatedScale);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      model.scale.set(endScale, endScale, endScale);
      callback();
    }
  }

  requestAnimationFrame(animate);
}

export function springScale(model, duration = 500, oscillations = 1, callback = () => { }) {
  const startTime = performance.now();
  const startScale = model.scale.x;
  const dampingFactor = 0.1;
  const maxAmplitude = 0.2 * startScale;

  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const angularFrequency = oscillations * Math.PI * 2 / duration;
    const amplitude = maxAmplitude * Math.pow(dampingFactor, elapsed / duration);
    const phase = angularFrequency * elapsed;
    const currentScale = startScale + amplitude * Math.sin(phase);

    model.scale.set(currentScale, currentScale, currentScale);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      model.scale.set(startScale, startScale, startScale);
      callback();
    }
  }

  requestAnimationFrame(animate);
}

export function createPaintingAnimation(paintingMesh, amplitude = 0.1, frequency = 0.001) {
  let initialRotation = paintingMesh.rotation.y;
  let isAnimating = false;
  let animationId = null;

  function animate() {
    if (!isAnimating) return;

    const time = performance.now();
    const newRotation = initialRotation + Math.sin(time * frequency) * amplitude;
    paintingMesh.rotation.y = newRotation;

    animationId = requestAnimationFrame(animate);
  }

  function startAnimation() {
    if (!isAnimating) {
      isAnimating = true;
      animate();
    }
  }

  function stopAnimation() {
    isAnimating = false;
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    paintingMesh.rotation.y = initialRotation;
  }

  return {
    start: startAnimation,
    stop: stopAnimation,
    toggle: () => {
      if (isAnimating) {
        stopAnimation();
      } else {
        startAnimation();
      }
    }
  };
}

window.ThreeDScene = {
  create3DScene,
  IMPORTED_MODELS,
  scene,
  ambientLight,
  getMobileOperatingSystem,
  controls,
  camera,
  renderer,
};

