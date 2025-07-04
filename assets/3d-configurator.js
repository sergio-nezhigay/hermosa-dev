/* eslint-disable no-case-declarations */
/* global gsap, fx, $, dat */

// Created by Marevo (Pavlo Voronin)
// Welcome to our custom script!
// REMEMBER: Theft is wrong not because some ancient text says, 'Thou shalt not steal.'
// It's always bad, robber :)

//#region PUBLIC VALUES


// import {
//   // animateMorph,
//   // ConvertMorphValue,
//   // ChangeGlobalMorph,
// } from './shader-morphs.js';
// import * as THREE from 'three';
import {
  TEXTURES,
  DIMENSIONS,
  BORDERS,
  FRAMES,
} from './settings.js';

// import { interpolateValue } from './utils.js';

// Use the product image URL from settings
const productImageUrl = window.settings?.pictureUrl || window.productImageUrl;

let modelViewer;
let theModel;
let glass;
let holst;
let matting;
let baseFrame;
let holstMaterial;
let isFirstLoading = true;

const clickableObjects = [];

let qrScaned = 0;
let isFirstStart = true;
let is2dMode = true;
let isSceneCreated = false;

const parametersKey = "config";

const settingsFieldsMapping = [
  'dimensionsSet',
  'borderWidth',
  'frameType',
];

const mPerInch = 0.0254;

let currentWidth = 0;
let currentHeight = 0;
let currentMappingWidth = 0;

let imageAspect = 1;
let imageWidth = 0;
let imageHeight = 0;

let availableSizes = [];

let oldHeight = 0;
let oldWidth = 0;

// const textureOffset = new THREE.Vector2(0, 0);

let measurementObject = 'canvas'; // 'canvas' or 'frame'

const MORPH_DATA = {
  canvas: {
    width: {
      min: 0.258,
      max: 1.160,
    },
    height: {
      min: 0.258,
      max: 1.160,
    },
  },
  // frame: {
  //   width: {
  //     min: 0.280,
  //     max: 1.190,
  //   },
  //   height: {
  //     min: 0.279,
  //     max: 1.190,
  //   },
  // },
  border: {
    noFrame: {
      min: 0.028128,
      max: 0.104338,
    },
    withFrame: {
      min: 0.019887,
      max: 0.096097,
    },
  },
}

const defaultSettings = {
  dimensionsSet: 1,
  borderWidth: 2,
  textureScale: 0.95,
  // textureOffsetX: textureOffset.x,
  // textureOffsetY: textureOffset.y,
};

const pictureSettings = {
  dimensionsSet: defaultSettings.dimensionsSet,
  dimensionsQty: 1,
  borderWidth: defaultSettings.borderWidth,
  textureScale: defaultSettings.textureScale,
  // textureOffsetX: defaultSettings.textureOffsetX,
  // textureOffsetY: defaultSettings.textureOffsetY,
  width: 0,
  height: 0,
};

const PRICE_PER_SQ_INCH = 0.25;
let imageAspectRatio;
let imageScaleParameters;

//#endregion

//#region ENCODE/DECODE
const NEED_TO_ENCODE = true;

String.prototype.SEncode = function () {
  if (this == undefined) { return ''; }
  return (NEED_TO_ENCODE)
    ? btoa(unescape(encodeURIComponent(this)))
    : this;
};

String.prototype.SDecode = function () {
  if (this == undefined) { return ''; }
  return (NEED_TO_ENCODE)
    ? decodeURIComponent(escape(atob(this)))
    : this;
};

//#endregion

//#region INIT         //! ************* INIT ******************
start();
function start() {
  // Access the product variants
  if (window.productVariants) {
  } else {
    // If it's not available yet, you can wait for it
    const checkVariants = setInterval(() => {
      if (window.productVariants) {
        clearInterval(checkVariants);
      }

      const productImage = document.getElementById("product-main-image");
      if (productImage) {
        // Fix protocol-relative URLs
        let imageSrc = productImage.src;
        if (imageSrc.startsWith('//')) {
          imageSrc = window.location.protocol + imageSrc;
        }
        if (isFirstLoading) {
          setInitialImage(imageSrc);
          isFirstLoading = false;
        }

        setLoader(true);
        prepareUI();
        readUrlParams();
        $(document).ready(function () { applyUiFromSettings(); });
        is2dMode = true;
      }
    }, 100);
  }
  
  checkChanges();
  isFirstStart = false;
 }

function checkChanges() {
  if (isSceneCreated) {
    changeWidth(pictureSettings.width);
    changeHeight(pictureSettings.height);
    changeborderWidth(pictureSettings.borderWidth);
    // setPictureTiling();
  }

  build2dPicture();
  setTimeout(() => { build2dPicture(); }, 300);

  writeUrlParams();
}

//#region MESH / MATERIAL utils

// const textureLoader = new THREE.TextureLoader();
// textureLoader.setCrossOrigin('anonymous');

function setPictureSettingsFromURL(paramArray, callback = null) {
  qrScaned = parseInt(paramArray.pop());

  settingsFieldsMapping.forEach((key, index) => {
    let value = paramArray[index];
    if (typeof pictureSettings[key] === "boolean") {
      pictureSettings[key] = parseInt(value) === 1;
    }
    else {
      pictureSettings[key] = parseFloat(value);
    }
  });

  if (callback) callback();
}

function readUrlParams(callback = null, url = null) {
  const queryString = url || window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const encodedParams = urlParams.get(parametersKey);

  if (!encodedParams) {
    if (callback) callback();
    return;
  }

  const decodedParams = encodedParams.SDecode();
  const paramArray = decodedParams.split('_');

  if (paramArray.length === 0) {
    if (callback) callback();
    return;
  }

  setPictureSettingsFromURL(paramArray, callback);
}

function writeUrlParams(delay = 0, callback = () => { }) {
  let parametersString = getParametersString();
  if (!parametersString) { return; }

  const updateURLWithParameters = (params) => {
    const url = new URL(window.location.href);
    url.searchParams.set(parametersKey, params);
    history.pushState(null, '', url.toString());
  };

  if (delay === 0) {
    updateURLWithParameters(parametersString);
    callback();
  } else {
    setTimeout(() => {
      parametersString = getParametersString();
      updateURLWithParameters(parametersString);
      callback();
    }, delay);
  }
}

function getParametersString() {
  const splitValue = '_';
  const paramArray = settingsFieldsMapping.map((key) => {
    const value = pictureSettings[key];

    if (typeof value === "boolean") {
      return value ? 1 : 0;
    }
    else {
      return value;
    }
  });

  paramArray.push(qrScaned);

  const parametersValue = paramArray.join(splitValue);
  return parametersValue.SEncode();
}

// function setPictureTiling(inverseY = true) {
//   const texture = TEXTURES.canvas.texture;
//   if (!texture) return;

//   texture.wrapS = THREE.RepeatWrapping;
//   texture.wrapT = THREE.RepeatWrapping;

//   const mappingWidth = currentMappingWidth || 0;
//   // const frameWidthWithMapping = currentWidth - 2 * mappingWidth;
//   // const frameHeightWithMapping = currentHeight - 2 * mappingWidth;
//   const frameWidthWithMapping = 0;
//   const frameHeightWithMapping = 0;

//   if (frameWidthWithMapping <= 0 || frameHeightWithMapping <= 0) return;

//   imageAspect = texture.image.width / texture.image.height;
//   const frameAspect = frameWidthWithMapping / frameHeightWithMapping;
//   const uvScale = 2; // UV scale (usually default is 1, value 2 is just for this canvas 3d model)

//   let repeatX, repeatY;

//   if (imageAspect > frameAspect) { // image is wider than frame
//     repeatX = frameAspect / imageAspect;
//     repeatY = 1;
//   } else { // image is taller than frame
//     repeatX = 1;
//     repeatY = imageAspect / frameAspect;
//   }

//   repeatX *= currentWidth / frameWidthWithMapping;
//   repeatY *= currentHeight / frameHeightWithMapping;

//   repeatX /= uvScale * pictureSettings.textureScale;
//   repeatY /= uvScale * pictureSettings.textureScale;

//   texture.repeat.set(repeatX, repeatY);

//   const maxTextureMoveX = (1 - repeatX * uvScale) / 2;
//   const maxTextureMoveY = (1 - repeatY * uvScale) / 2;

//   const availableMoveX = maxTextureMoveX > 0 ? maxTextureMoveX : 0;
//   const availableMoveY = maxTextureMoveY > 0 ? maxTextureMoveY : 0;

//   pictureSettings.textureOffsetX = Number(THREE.MathUtils.clamp(
//     pictureSettings.textureOffsetX,
//     -availableMoveX,
//     availableMoveX
//   ).toFixed(3));

//   pictureSettings.textureOffsetY = Number(THREE.MathUtils.clamp(
//     pictureSettings.textureOffsetY,
//     -availableMoveY,
//     availableMoveY
//   ).toFixed(3));

//   const xOffset = (1 - repeatX) / 2 + pictureSettings.textureOffsetX;
//   const yOffset = (1 - repeatY) / 2 + pictureSettings.textureOffsetY * (inverseY ? -1 : 1);

//   texture.offset.set(xOffset, yOffset);
//   texture.needsUpdate = true;

//   if (holstMaterial) {
//     holstMaterial.map = texture;
//     holstMaterial.needsUpdate = true;
//   }
// }
//#endregion

//#region MAIN ACTIONS //! ********* MAIN ACTIONS **************

function changeHeight(value) {
  currentHeight = value * mPerInch;
  measurementObject = 'canvas';
  // const targetValue = ConvertMorphValue(value * mPerInch, MORPH_DATA[measurementObject].height.min, MORPH_DATA[measurementObject].height.max);
  // animateMorph('height', oldHeight, targetValue);
  oldHeight = targetValue;
}

function changeWidth(value) {
  currentWidth = value * mPerInch;
  measurementObject = 'canvas';
  // const targetValue = ConvertMorphValue(value * mPerInch, MORPH_DATA[measurementObject].width.min, MORPH_DATA[measurementObject].width.max);
  // animateMorph('width', oldWidth, targetValue);
  oldWidth = targetValue;
}

function changeborderWidth(value) {
  if (value == 0) {
    matting.visible = false;
    currentMappingWidth = 0;
  } else {
    matting.visible = true;
    const frameType = (pictureSettings.frameType == '0') ? 'noFrame' : 'withFrame';
    // const targetValue = ConvertMorphValue(value * mPerInch, MORPH_DATA.border[frameType].min, MORPH_DATA.border[frameType].max);
    ChangeGlobalMorph('1-4', targetValue);

    // currentMappingWidth = ConvertMorphValue(+value, 1, 4, MORPH_DATA.border[frameType].min, MORPH_DATA.border[frameType].max);
    pictureSettings.borderWidth = +value;
  }
}

//#endregion

//#region UI FUNCTIONS //! ********* UI FUNCTIONS **************

function prepareUI() {
  // Scroll and common UI functionality
  $(document).ready(function () {
    // Scrolling behaviour
    const $viewer = $('#ar_model_viewer');
    const $menu = $('.summary.entry-summary');
    const $header = $('.header');

    function handleScroll() {
      const scrollPosition = $(window).scrollTop();
      const headerHeight = $header.outerHeight();
      const viewerHeight = $viewer.outerHeight();
      const menuHeight = $menu.outerHeight();
      const menuBottom = $menu.offset().top + menuHeight - scrollPosition;
      
      // if (window.innerWidth > 779) {
      //   if (scrollPosition >= headerHeight) {
      //     $viewer.addClass('fixed');
          
      //     if (menuBottom < viewerHeight) {
      //       $viewer.css('transform', `translateY(${menuBottom - viewerHeight}px)`);
      //     } else {
      //       $viewer.css('transform', 'translateY(0)');
      //     }
      //   } else {
      //     $viewer.removeClass('fixed');
      //     $viewer.css('transform', 'translateY(0)');
      //   }
      // } else {
      //   // Mobile behavior
      //   if (scrollPosition >= headerHeight) {
      //     $viewer.addClass('fixed');
      //     $menu.addClass('bottom');
      //   } else {
      //     $viewer.removeClass('fixed');
      //     $menu.removeClass('bottom');
      //   }
      // }
    }

    $(window).on('scroll', handleScroll);
    $(window).on('resize', handleScroll);

    // Menu header functionality
    $(".ar_filter_header").on("click", function () {
      const $group = $(this).closest(".ar_filter_group");
      $group.toggleClass("closed");

      // $group.children(".ar_filter_options, .ar_filter_suboptions")
      //   .slideToggle(300);
    });
  });

  $(window).resize(function () {
    build2dPicture();
  });

  //! Popup functionality
  $(document).on('click', '.tbl-info-close, .tbl-info-overlay', function () {
    const tblInfo = $('#marevo_popup_container');
    tblInfo.removeClass('active');
    tblInfo.find('.tbl-info-item').removeClass('active');
  });

  //! Menu options functionality
  $(document).ready(function () {
    //* Dimensions
    $(document).on("click", `#${DIMENSIONS.groupId} .option`, function () {
      $(`#${DIMENSIONS.groupId} .option`).removeClass("active");
      $(this).addClass("active");
      const width = $(this).data("width");
      const height = $(this).data("height");
      const price = $(this).data("price");
      $(`#${DIMENSIONS.groupId} .ar_filter_options_result_name_in_header`).text(`${width}" x ${height}"`);

      pictureSettings.width = width;
      pictureSettings.height = height;
      pictureSettings.dimensionsSet = $(this).index();
      pictureSettings.dimensionsQty = $(`#${DIMENSIONS.groupId}`).find(".option").length;

      checkChanges();
    });

    //* Borders
    $(document).on("click", `#${BORDERS.groupId} .option`, function () {
      if ($(this).hasClass("active") && !isFirstStart) { return; }
      $(this).addClass("active");
      $(this).siblings().removeClass("active");
      const selectedElement = $(this).closest(".ar_filter_group");
      const titleBorder = $(this).find('.component_title').text();
      selectedElement.find(".ar_filter_options_result_name_in_header").text(`${titleBorder}`);

      const value = $(this).attr("data-value");
      pictureSettings.borderWidth = value;
      updateDimensionsInUI();
    });

    // * Frames
    $(document).on("click", `#${FRAMES.groupId} .option`, function () {
      if ($(this).hasClass("active") && !isFirstStart) { return; }
      $(this).addClass("active");
      $(this).siblings().removeClass("active");
      const selectedElement = $(this).closest(".ar_filter_group");
      const titleFrame = $(this).find('.component_title').text();
      selectedElement.find(".ar_filter_options_result_name_in_header").text(`${titleFrame}`);
      const value = $(this).attr("data-value");
      pictureSettings.frameType = value;
      updateDimensionsInUI();
    });
  });
}

function applyUiFromSettings() {
  // const optionBorder = $(`.${BORDERS[pictureSettings.borderWidth]}`);
  // console.log('optionBorder == ', BORDERS);
  // optionBorder.trigger('click');

  // const optionFrame = $(`.${FRAMES[pictureSettings.frameType]}`);
  // optionFrame.trigger('click');
}

function setLoader(value, className = 'loader') {
  if (value) {
    $(`.${className}`).css('display', 'flex');
  } else {
    $(`.${className}`).css('display', 'none');
  }
}

async function updateDimensionsInUI() {
  await calculateSizes(
    imageWidth,
    imageHeight,
    pictureSettings.borderWidth,
    pictureSettings.frameType != 0
  );

  const $optionsContainer = $(`#${DIMENSIONS.groupId} .ar_filter_options`);
  $optionsContainer.empty();

  availableSizes.forEach((size, index) => {
    const width = parseFloat(size.width);
    const height = parseFloat(size.height);
    const area = width * height;
    const price = parseFloat(size.price);

    const $option = $('<div>')
      .attr('id', `option_0-${index}`)
      .addClass(`option option_0-${index}`)
      .attr('data-width', width)
      .attr('data-height', height)
      .attr('data-price', price)
      .attr('data-scale', size.imageScale);

    const $title = $('<div>')
      .addClass('component_title')
      .text(`${width}" x ${height}"`);
    const $price = $('<span>')
      .addClass('component_price')
      .text(`$${price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`);

    $option.append($title, $price);
    $optionsContainer.append($option);
  });

  setTimeout(() => {
    $(`#option_0-${pictureSettings.dimensionsSet}`).trigger('click');
    $(`#option_1-${pictureSettings.borderWidth}`).addClass('active');
  }, 0);
}

function loadImage(imageSrc) {
  if (imageSrc.includes("square")) {
    return "square";
  } else if (imageSrc.includes("landscape")) {
    return "landscape";
  } else {
    return "portrait";
  }
  // return new Promise((resolve, reject) => {
  //   const img = new Image();
  //   img.src = imageSrc;
  //   img.onload = () => resolve(img);
  //   img.onerror = (error) => reject(error);
  // });
}

async function setInitialImage(imageSrc) {
  try {
    imageScaleParameters = await loadImage(imageSrc);
    updateDimensionsInUI();
    setLoader(false);
  } catch (error) {
    console.error("Image loading error:", error);
  }
}

function calculateSizes(imgWidth, imgHeight, borderWidth = 0, isFrameSet = false) {
  let maxSize = { width: 0, height: 0 };
  const LANDSCAPE_MAX_WIDTH = 79;  // inches
  const LANDSCAPE_MAX_HEIGHT = 48; // inches
  const PORTRAIT_MAX_WIDTH = 48;   // inches
  const PORTRAIT_MAX_HEIGHT = 79;  // inches
  const FRAME_WIDTH = isFrameSet ? 2 : 0; // 1 inch on each side, total 2 inches

  const aspectRatio = imgWidth / imgHeight;
  const isLandscape = aspectRatio > 1;

  let imageScale = imageScaleParameters;
  
  const totalBorderWidth = borderWidth * 2;
  const totalBorderHeight = borderWidth * 2;
  const totalFrameWidth = FRAME_WIDTH;
  const totalFrameHeight = FRAME_WIDTH;
  const totalExtraWidth = totalBorderWidth + totalFrameWidth;
  const totalExtraHeight = totalBorderHeight + totalFrameHeight;

  const maxPrintWidth = isLandscape ? LANDSCAPE_MAX_WIDTH : PORTRAIT_MAX_WIDTH;
  const maxPrintHeight = isLandscape ? LANDSCAPE_MAX_HEIGHT : PORTRAIT_MAX_HEIGHT;
  const maxImageWidth = maxPrintWidth - totalExtraWidth;
  const maxImageHeight = maxPrintHeight - totalExtraHeight;
  let scale = Math.min(maxImageWidth / imgWidth, maxImageHeight / imgHeight);
  let maxImageWidthInches = (imgWidth * scale).toFixed(1);
  let maxImageHeightInches = (imgHeight * scale).toFixed(1);

  maxSize.width = (parseFloat(maxImageWidthInches) + totalExtraWidth).toFixed(1);
  maxSize.height = (parseFloat(maxImageHeightInches) + totalExtraHeight).toFixed(1);

  // const shortSidePixels = isLandscape ? imgHeight : imgWidth;
  // const longSidePixels = isLandscape ? imgWidth : imgHeight;
  // const increments = [12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78, 79];
  const sizeOptions = [];

  // increments.forEach(totalShortSide => {
  //   const imageShortSide = totalShortSide - totalExtraHeight;
  //   if (imageShortSide <= 0) return;

  //   const scaleFactor = imageShortSide / shortSidePixels;
  //   const imageLongSide = (longSidePixels * scaleFactor).toFixed(1);

  //   const imageWidth = isLandscape ? imageLongSide : imageShortSide;
  //   const imageHeight = isLandscape ? imageShortSide : imageLongSide;

  //   const totalWidth = (parseFloat(imageWidth) + totalExtraWidth).toFixed(1);
  //   const totalHeight = (parseFloat(imageHeight) + totalExtraHeight).toFixed(1);

  //   // Check whether it is fed to the maximum size
  //   if (totalWidth <= maxPrintWidth && totalHeight <= maxPrintHeight) {
  //     const size = {
  //       imageWidth: imageWidth,    // Image size without border and frame
  //       imageHeight: imageHeight,
  //       width: totalWidth,         // Full size with border and frame
  //       height: totalHeight,
  //     };
  //     sizeOptions.push(size);
  //   }
  // });

  // Add the maximum size if it is not yet turned on
  const lastSize = sizeOptions[sizeOptions.length - 1];
  if (!lastSize || (lastSize.width !== maxSize.width || lastSize.height !== maxSize.height)) {
    sizeOptions.push({
      imageWidth: maxImageWidthInches,
      imageHeight: maxImageHeightInches,
      width: maxSize.width,
      height: maxSize.height,
      isMax: true,
    });
  }

  // filter duplicates and sort the area
  const filteredSizes = sizeOptions
    .filter((size, index, self) =>
      index === self.findIndex(s => s.width === size.width && s.height === size.height))
    .sort((a, b) => (parseFloat(a.width) * parseFloat(a.height)) - (parseFloat(b.width) * parseFloat(b.height)));

  availableSizes = [];
  availableSizes.push(...filteredSizes);

  let sizePairs = [];
  if (imageScale === "square") {
    sizePairs = [
      { width: 25, height: 25, imageWidth: 25 - totalExtraWidth, imageHeight: 25 - totalExtraHeight, imageScale: "small", price: 1200 },
      { width: 30, height: 30, imageWidth: 30 - totalExtraWidth, imageHeight: 30 - totalExtraHeight, imageScale: "medium", price: 1600 },
      { width: 40, height: 40, imageWidth: 40 - totalExtraWidth, imageHeight: 40 - totalExtraHeight, imageScale: "large", price: 2000 },
    ];
  } else if (imageScale === "landscape") {
    sizePairs = [
      { width: 54, height: 36, imageWidth: 54 - totalExtraWidth, imageHeight: 36 - totalExtraHeight, imageScale: "small", price: 2000 },
      { width: 60, height: 40, imageWidth: 60 - totalExtraWidth, imageHeight: 40 - totalExtraHeight, imageScale: "medium", price: 2500 },
      { width: 66, height: 44, imageWidth: 66 - totalExtraWidth, imageHeight: 44 - totalExtraHeight, imageScale: "large", price: 3000 },
    ];
  } else if (imageScale === "portrait") {
    sizePairs = [
      { width: 36, height: 54, imageWidth: 36 - totalExtraWidth, imageHeight: 54 - totalExtraHeight, imageScale: "small", price: 2000 },
      { width: 40, height: 60, imageWidth: 40 - totalExtraWidth, imageHeight: 60 - totalExtraHeight, imageScale: "medium", price: 2500 },
      { width: 44, height: 66, imageWidth: 44 - totalExtraWidth, imageHeight: 66 - totalExtraHeight, imageScale: "large", price: 3000 },
    ];
  }

  availableSizes = sizePairs.sort((a, b) =>
    (parseFloat(a.width) * parseFloat(a.height)) - (parseFloat(b.width) * parseFloat(b.height))
  );
}

async function build2dPicture() {
  let width = pictureSettings.width;
  let height = pictureSettings.height;
  const borderWidth = pictureSettings.borderWidth;

  let scaleCoeff = 1;
  let isLandscape = imageWidth > imageHeight;

  // scaleCoeff = interpolateValue(
  //   pictureSettings.dimensionsSet,
  //   0,
  //   pictureSettings.dimensionsQty - 1,
  //   1.2,
  //   1.7,
  // ) || 1;

  // const container = $("#picture-container");
  // // container.empty();

  // // const frameSrc = './src/frames';
  // // // isLandscape = width > height;
  // const aspectRatio = width / height;
  // const picture_container = document.getElementById("picture-container");
  // console.log("isLandscape == ", isLandscape);
  // console.log("imageWidth imageHeight == ", imageWidth, imageHeight);
  // picture_container.style.width = isLandscape ? `calc(70% * ${scaleCoeff})` : `calc((100% - ${2 * borderWidth}px))`;
  // picture_container.style.height = isLandscape ? `calc((100% - ${2 * borderWidth}px))` : `calc(70% * ${scaleCoeff})`;

  // picture_container.style.objectFit = "containe";

  // const wrapper = $("<div>").css({
  //   position: "relative",
  //   display: "flex",
  //   justifyContent: "center",
  //   alignItems: "center",
  //   width: isLandscape ? "100%" : "80%",
  //   height: isLandscape ? "auto" : "auto",
  //   maxWidth: "100%",
  //   maxHeight: "100%",
  //   margin: "auto",
  // });

  // const picWrapper = $("<div>").css({
  //   position: "relative",
  //   width: isLandscape ? `calc(50% * ${scaleCoeff})` : `calc((80% - ${2 * borderWidth}px))`,
  //   height: isLandscape ? `calc((80% - ${2 * borderWidth}px))` : `calc(50% * ${scaleCoeff})`,
  //   // width: isLandscape ? `calc(50% * ${scaleCoeff})` : `calc((90% - ${2 * borderWidth}px) / ${aspectRatio})`,
  //   // height: isLandscape ? `calc((90% - ${2 * borderWidth}px) / ${aspectRatio} * ${scaleCoeff})` : `calc(50% * ${scaleCoeff})`,
  //   maxWidth: "100%",
  //   maxHeight: "100%",
  //   background: "#efefef",
  //   boxSizing: "border-box",
  //   display: "flex",
  //   justifyContent: "center",
  //   alignItems: "center",
  // });

  // console.log("productImageUrl ===== ", productImageUrl);
  // const image = $("<img>").attr("id", "product-main-image").attr("onclick", "openModal()").attr("src", productImageUrl).css({
  //   width: "100%",
  //   height: "100%",
  //   objectFit: "cover",
  // });

  // picWrapper.append(image);
  // wrapper.append(picWrapper);
  // container.append(wrapper);

  // let picWrapperWidth = picWrapper.outerWidth();
  // let picWrapperHeight = picWrapper.outerHeight();
  // let frameThickness = isLandscape ? picWrapperWidth / width : picWrapperHeight / height;

  // picWrapper.css({
  //   padding: `${frameThickness * borderWidth}px`,
  // });
}
