'use strict';

import { computeMorphedAttributes } from 'three/addons/utils/BufferGeometryUtils.js';

let isWorldposVertexShaderEnabled = true;
let morphs = [];
let globalMorphs = [];

function Shader_ChangeVertexToWorldpos(object) {
  promiseDelayShaderSettings(500, object, () => {
    if (object.isMesh) {
      if (isWorldposVertexShaderEnabled) {
        if (object.material) {
          if (object.material.name.includes("_Z")) {
            object.material.onBeforeCompile = (shader) => {
              shader.vertexShader = shader.vertexShader.replace('#include <uv_vertex>\n', '').replace('#include <worldpos_vertex>', 'vec4 worldPosition = vec4( transformed, 1.0 );\n#ifdef USE_INSTANCING\nworldPosition = instanceMatrix * worldPosition;\n#endif\nworldPosition = modelMatrix * worldPosition;\nvUv = (uvTransform * vec3(worldPosition.xz, 1)).xy;');
            };
          }
          else if (object.material.name.includes("_Y")) {
            object.material.onBeforeCompile = (shader) => {
              shader.vertexShader = shader.vertexShader.replace('#include <uv_vertex>\n', '').replace('#include <worldpos_vertex>', 'vec4 worldPosition = vec4( transformed, 1.0 );\n#ifdef USE_INSTANCING\nworldPosition = instanceMatrix * worldPosition;\n#endif\nworldPosition = modelMatrix * worldPosition;\nvUv = (uvTransform * vec3(worldPosition.xy, 1)).xy;');
            };
          }
          else if (object.material.name.includes("_X")) {
            object.material.onBeforeCompile = (shader) => {
              shader.vertexShader = shader.vertexShader.replace('#include <uv_vertex>\n', '').replace('#include <worldpos_vertex>', 'vec4 worldPosition = vec4( transformed, 1.0 );\n#ifdef USE_INSTANCING\nworldPosition = instanceMatrix * worldPosition;\n#endif\nworldPosition = modelMatrix * worldPosition;\nvUv = (uvTransform * vec3(worldPosition.yz, 1)).xy;');
            };
          }
          object.material.needsUpdate = true;
        }
      }
    }
  });

}

function promiseDelayShaderSettings(time, object, callback) {
  if (time == null) {
    time = 2000;
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('resolved');
      if (object.material.map == null) {
        promiseDelayShaderSettings(time, object, callback);
      } else {
        if (callback != null) {
          callback();
        }
      }
    }, time);
  });
}

export function InitMorphModel(model) {
  // var BufferGeometryUtils_script = document.createElement('script');
  // BufferGeometryUtils_script.setAttribute('src', 'https://cdn.jsdelivr.net/npm/three@0.147/examples/js/utils/BufferGeometryUtils.js');
  // document.body.appendChild(BufferGeometryUtils_script);

  model.traverse((object) => {
    if (object.isMesh) {
      Shader_ChangeVertexToWorldpos(object);
      if (object.morphTargetDictionary != null) {

        for (const [key, value] of Object.entries(object.morphTargetDictionary)) {
          var morph = {
            name: key,
            object: object,
            key: value,
            value: value
          };

          if (!morphs.includes(morph)) {
            morphs.push(morph);
          }
        }
      }
    }
  });

  PrepareGlobalMorphs();
}

function PrepareGlobalMorphs() {
  globalMorphs = [];

  for (let index = 0; index < morphs.length; index++) {
    const morph = morphs[index];

    var hasMorph = false;

    for (let m = 0; m < globalMorphs.length; m++) {
      const globalMorph = globalMorphs[m];
      if (globalMorph.name != morph.name) { continue; }
      hasMorph = true;
      break;
    }

    if (!hasMorph) {
      globalMorphs.push(morph);
    }
  }
}

export function ComputeMorphedAttributes() {
  for (let index = 0; index < morphs.length; index++) {
    const morph = morphs[index];
    var computeMorphedAttributesValue = computeMorphedAttributes(morph.object);
    morph.object.geometry.computeMorphedAttributes = computeMorphedAttributesValue;
  }
}

export function ChangeGlobalMorph(morphName, inputvalue) {
  for (let index = 0; index < morphs.length; index++) {
    const morph = morphs[index];

    if (morph.name != morphName) { continue; }
    if (morph.object == null) { continue; }
    if (!morph.object.isMesh) { continue; }
    if (morph.object.morphTargetInfluences == null) { continue; }

    morph.object.morphTargetInfluences[morph.key] = inputvalue;
  }
}

export function ConvertMorphValue(inputval, srcStart, srcEnd, destStart = 0, destEnd = 1) {
  const result = destStart + (inputval - srcStart) * (destEnd - destStart) / (srcEnd - srcStart);

  return result;
}

// eslint-disable-next-line no-unused-vars
export function animateMorph(morphName, valueStart, valueEnd, callback = () => { }, timeInterval = 300, steps = 10) {
  const stepDuration = timeInterval / steps;
  const stepValue = (valueEnd - valueStart) / steps;
  let currentValue = valueStart;
  let completedSteps = 0;

  for (let i = 1; i <= steps; i++) {
    setTimeout(() => {
      ChangeGlobalMorph(morphName, currentValue);
      currentValue += stepValue;
      completedSteps++;
      if (completedSteps === steps) {
        ChangeGlobalMorph(morphName, valueEnd);
        callback();
      }
    }, i * stepDuration);
  }
}

//#endregion
