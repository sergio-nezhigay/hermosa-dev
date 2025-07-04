'use strict';

export const BACKGROUND_COLOR = 0xffffff;
export const ENVIRONMENT_MAP_INTENSITY = 3;
export const ENVIRONMENT_MAP_FLIP_X = false;
export const ENVIRONMENT_MAP_ROTATEBLE = true;
export const ENVIRONMENT_MAP_ANGLE = -20;

export const SHADOW_TRANSPARENCY = 0.075;
export const TONE_MAPPING_EXPOSURE = 1.0;
export const MODEL_CENTER_POSITION = 0;
export let AMBIENTLIGHT_INTENSITY = 3;
export let AMBIENTLIGHT_INTENSITY_ANDROID = 7.5;

// export const MODEL_PATHS = ['./frame.glb'];
// export const ENVIRONMENT_MAP = './marevo.hdr';
export const MODEL_PATHS = [window.modelPath]; 
export const ENVIRONMENT_MAP = window.environmentMap;
export const pictureUrl = window.productImageUrl;
export const GUI_TEST = false;

if (typeof window !== 'undefined' && window.settings) {
  window.settings = {
    ...window.settings,
    MODEL_PATHS,
    ENVIRONMENT_MAP,
    pictureUrl,
  };
}

export const pictureVisualSettings = {
  brightness: 0.05, // default 0
  contrast: 0.15,   // default 0
  hue: 0.0,         // default 0
  saturation: 0.05, // default 0
  vibrance: 0.4,    // default 0
};

export const DIMENSIONS = {
  groupId: 'group-0',
};

export const BORDERS = {
  groupId: 'group-1',
  '0': 'option_1-0', // No Border
  '1': 'option_1-1', // 1"
  '2': 'option_1-2', // 2"
  '3': 'option_1-3', // 3"
  '4': 'option_1-4', // 4"
};

export const FRAMES = {
  groupId: 'group-2',
  '0': 'option_2-0', // No Frame
  '1': 'option_2-1', // Black Mat
  '2': 'option_2-2', // Maple Natural
  '3': 'option_2-3', // White
  '4': 'option_2-4', // Natural Oak
  '5': 'option_2-5', // Wallnut
};

export const TEXTURES = {
  canvas: {
    materialNames: ['holst-picture'], // don't change
    texture: null, // don't change
    normal: {  // don't change
      'large': {
        normal: '',
      },
      'small': {
        normal: '',
      },
    },
  }
};
window.color_black
window.color_roughness
window.maple_natural_color
window.maple_natural_roughness
window.color_white
window.natural_oak_color
window.natural_oak_roughness
window.walnut_color
window.walnut_roughness