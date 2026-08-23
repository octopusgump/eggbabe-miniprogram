const BASE_ASSET = require('../config/pre-hatch-assets').PRE_HATCH.eggOnNest;
const SHELL_VERSION = 3;
const BASE_VERSION = 'v3.6-layered-fabric';
const COLOR_ALPHA = 0.32;
const MAX_OPERATIONS = 240;
const BRUSH_REFERENCE_PX = 180;
const BRUSH_MIN_WIDTH = 0.004;
const BRUSH_MAX_WIDTH = 0.3;
const BRUSH_SIZES = [2, 5, 8, 12, 18].map(pixels => ({
  label: `${pixels} px`,
  pixels,
  width: pixels / BRUSH_REFERENCE_PX
}));
const ERASER_MIN_PX = 4;
const ERASER_MAX_PX = 30;
const ERASER_DEFAULT_PX = 15;
const ERASER_SIZES = [6, 10, 15, 22, 30].map(pixels => ({
  label: `${pixels} px`,
  pixels
}));
const ERASER_REFERENCE_PX = 150;
const ERASER_MIN_WIDTH = 0.008;
const ERASER_MAX_WIDTH = 0.3;
const DEFAULT_BRUSH_WIDTH = BRUSH_SIZES[1].width;
const DEFAULT_ERASER_WIDTH = ERASER_DEFAULT_PX / ERASER_REFERENCE_PX;

const COLORS = [
  { token: 'cream', name: '奶油白', value: '#F2EBD8' },
  { token: 'mint', name: '薄荷绿', value: '#BFD9C1' },
  { token: 'mist-blue', name: '雾霭蓝', value: '#B9CDE2' },
  { token: 'blush', name: '柔雾粉', value: '#EBC5C2' },
  { token: 'apricot', name: '杏子黄', value: '#E8D1A8' },
  { token: 'lavender', name: '浅藤紫', value: '#CEC5DD' },
  { token: 'warm-gray', name: '暖云灰', value: '#D4D0C7' }
];

const BRUSH_COLORS = [
  { token: 'forest', name: '森林绿', value: '#526B4D' },
  { token: 'apricot-orange', name: '杏子橙', value: '#D98652' },
  { token: 'lake-blue', name: '湖水蓝', value: '#5F8FA8' },
  { token: 'berry-pink', name: '莓果粉', value: '#C97682' },
  { token: 'grape-purple', name: '葡萄紫', value: '#8573A3' },
  { token: 'mist-sage', name: '雾松绿', value: '#AFC29A' },
  { token: 'butter-yellow', name: '奶油黄', value: '#E6CE73' },
  { token: 'sky-blue', name: '晴空蓝', value: '#9EC7D8' },
  { token: 'wine-red', name: '葡萄酒红', value: '#7B3E52' },
  { token: 'lavender', name: '浅藤紫', value: '#B9ABD2' },
];
const DEFAULT_BRUSH_COLOR = BRUSH_COLORS[0].value;

const PATTERNS = [
  { type: 'star', name: '星星', symbol: '✦' },
  { type: 'heart', name: '爱心', symbol: '♡' },
  { type: 'leaf', name: '叶子', symbol: '⌁' }
];
const PIXEL_STICKERS = {
  star: [
    '0001000',
    '0001000',
    '1101011',
    '0111110',
    '0011100',
    '0110110',
    '1100011'
  ],
  heart: [
    '0110110',
    '1111111',
    '1111111',
    '0111110',
    '0011100',
    '0001000'
  ],
  leaf: [
    '0000110',
    '0001110',
    '0011100',
    '0111000',
    '1110000',
    '0100000'
  ]
};

const STICKER_POSITIONS = [
  { x: 0.38, y: 0.42, scale: 1, rotation: -0.18 },
  { x: 0.62, y: 0.56, scale: 0.86, rotation: 0.2 },
  { x: 0.47, y: 0.7, scale: 0.76, rotation: -0.08 },
  { x: 0.58, y: 0.31, scale: 0.68, rotation: 0.12 },
  { x: 0.32, y: 0.61, scale: 0.72, rotation: -0.28 }
];

function clamp(value, min, max) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(min, Math.min(max, numeric)) : min;
}

function eraserWidthForPixels(pixels, canvasSize) {
  const reference = Math.max(1, Number(canvasSize) || ERASER_REFERENCE_PX);
  return clamp(clamp(pixels, ERASER_MIN_PX, ERASER_MAX_PX) / reference, ERASER_MIN_WIDTH, ERASER_MAX_WIDTH);
}

function brushWidthForPixels(pixels, canvasSize) {
  const reference = Math.max(1, Number(canvasSize) || BRUSH_REFERENCE_PX);
  const safePixels = BRUSH_SIZES.some(item => item.pixels === Number(pixels))
    ? Number(pixels)
    : BRUSH_SIZES[1].pixels;
  return clamp(safePixels / reference, BRUSH_MIN_WIDTH, BRUSH_MAX_WIDTH);
}

function colorByValue(value) {
  return COLORS.find(item => item.value.toLowerCase() === String(value || '').toLowerCase());
}

function colorByToken(token) {
  return COLORS.find(item => item.token === token);
}

function normalizeBrushColor(value) {
  const source = String(value || '').trim();
  if (/^#[0-9a-f]{6}$/i.test(source)) return source.toUpperCase();
  return DEFAULT_BRUSH_COLOR;
}

function defaultShellArt() {
  return {
    version: SHELL_VERSION,
    baseAsset: BASE_ASSET,
    baseVersion: BASE_VERSION,
    colorToken: 'white',
    color: '#FFFFFF',
    colorName: '原生白',
    colorAlpha: 0,
    operations: []
  };
}

function normalizePoint(point) {
  return {
    x: clamp(point && point.x, 0, 1),
    y: clamp(point && point.y, 0, 1)
  };
}

function normalizeOperation(operation, index) {
  const source = operation || {};
  if (source.type === 'sticker' && PATTERNS.some(item => item.type === source.pattern)) {
    return {
      id: String(source.id || `sticker-${index}`),
      type: 'sticker',
      pattern: source.pattern,
      x: clamp(source.x, 0.12, 0.88),
      y: clamp(source.y, 0.12, 0.9),
      scale: 1,
      rotation: 0
    };
  }
  if (source.type === 'stroke' && (source.tool === 'brush' || source.tool === 'eraser')) {
    const points = (Array.isArray(source.points) ? source.points : []).slice(0, 300).map(normalizePoint);
    if (!points.length) return null;
    return {
      id: String(source.id || `stroke-${index}`),
      type: 'stroke',
      tool: source.tool,
      color: normalizeBrushColor(source.color),
      width: source.tool === 'eraser'
        ? clamp(source.width || DEFAULT_ERASER_WIDTH, ERASER_MIN_WIDTH, ERASER_MAX_WIDTH)
        : clamp(source.width || DEFAULT_BRUSH_WIDTH, BRUSH_MIN_WIDTH, BRUSH_MAX_WIDTH),
      points
    };
  }
  return null;
}

function legacyPatternOperation(pattern) {
  const typeMap = { '星星': 'star', '爱心': 'heart', star: 'star', heart: 'heart', leaf: 'leaf', '叶子': 'leaf' };
  const type = typeMap[pattern];
  return type ? createSticker(type, 0) : null;
}

function normalizeShellArt(input) {
  const source = input || {};
  const legacyColor = String(source.color || '').toUpperCase() === '#EDE78E' ? COLORS[0] : null;
  const matchedColor = colorByToken(source.colorToken) || colorByValue(source.color) || legacyColor;
  const fallback = defaultShellArt();
  let operations = Array.isArray(source.operations)
    ? source.operations.slice(0, MAX_OPERATIONS).map(normalizeOperation).filter(Boolean)
    : [];
  if (!operations.length && source.version !== SHELL_VERSION) {
    const legacy = legacyPatternOperation(source.pattern);
    if (legacy) operations = [legacy];
  }
  return {
    version: SHELL_VERSION,
    baseAsset: BASE_ASSET,
    baseVersion: BASE_VERSION,
    colorToken: matchedColor ? matchedColor.token : fallback.colorToken,
    color: matchedColor ? matchedColor.value : fallback.color,
    colorName: matchedColor ? matchedColor.name : fallback.colorName,
    colorAlpha: matchedColor ? COLOR_ALPHA : fallback.colorAlpha,
    operations
  };
}

function cloneShellArt(shell) {
  return JSON.parse(JSON.stringify(normalizeShellArt(shell)));
}

function createSticker(pattern, sequence, point) {
  const safePattern = PATTERNS.some(item => item.type === pattern) ? pattern : PATTERNS[0].type;
  const index = Math.max(0, Number(sequence) || 0);
  const position = STICKER_POSITIONS[index % STICKER_POSITIONS.length];
  const hasPoint = point && Number.isFinite(Number(point.x)) && Number.isFinite(Number(point.y));
  return {
    id: `sticker-${index + 1}`,
    type: 'sticker',
    pattern: safePattern,
    x: hasPoint ? clamp(point.x, 0.12, 0.88) : position.x,
    y: hasPoint ? clamp(point.y, 0.12, 0.9) : position.y,
    scale: 1,
    rotation: 0
  };
}

function createStroke(tool, points, sequence, width, color) {
  const safeTool = tool === 'eraser' ? 'eraser' : 'brush';
  return normalizeOperation({
    id: `stroke-${Math.max(0, Number(sequence) || 0) + 1}`,
    type: 'stroke',
    tool: safeTool,
    points,
    width: width || (safeTool === 'eraser' ? DEFAULT_ERASER_WIDTH : DEFAULT_BRUSH_WIDTH),
    color: safeTool === 'brush' ? normalizeBrushColor(color) : DEFAULT_BRUSH_COLOR
  }, sequence);
}

function hexToRgba(hex, alpha) {
  const value = String(hex || '').replace('#', '');
  const normalized = value.length === 3 ? value.split('').map(char => char + char).join('') : value;
  const parsed = /^[0-9a-f]{6}$/i.test(normalized) ? parseInt(normalized, 16) : 0xF2EBD8;
  return `rgba(${(parsed >> 16) & 255},${(parsed >> 8) & 255},${parsed & 255},${clamp(alpha, 0, 1)})`;
}

function eggPath(context, width, height) {
  context.beginPath();
  context.moveTo(width * 0.5, height * 0.035);
  context.bezierCurveTo(width * 0.28, height * 0.035, width * 0.12, height * 0.29, width * 0.1, height * 0.55);
  context.bezierCurveTo(width * 0.075, height * 0.8, width * 0.24, height * 0.965, width * 0.5, height * 0.975);
  context.bezierCurveTo(width * 0.76, height * 0.965, width * 0.925, height * 0.8, width * 0.9, height * 0.55);
  context.bezierCurveTo(width * 0.88, height * 0.29, width * 0.72, height * 0.035, width * 0.5, height * 0.035);
  context.closePath();
}

function drawFallbackEgg(context, width, height, shell) {
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#FFFDF6');
  gradient.addColorStop(0.62, shell.color);
  gradient.addColorStop(1, '#D9D2C3');
  eggPath(context, width, height);
  context.fillStyle = gradient;
  context.fill();
}

function drawHighlight(context, width, height) {
  context.save();
  context.translate(width * 0.34, height * 0.27);
  context.rotate(0.2);
  const highlight = context.createRadialGradient(0, 0, 0, 0, 0, width * 0.15);
  highlight.addColorStop(0, 'rgba(255,255,255,.72)');
  highlight.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = highlight;
  context.beginPath();
  context.ellipse(0, 0, width * 0.12, height * 0.11, 0, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawEggBase(context, image, width, height, shellInput) {
  const shell = normalizeShellArt(shellInput);
  context.clearRect(0, 0, width, height);
  if (!image) {
    drawFallbackEgg(context, width, height, shell);
    drawHighlight(context, width, height);
    return;
  }
  // The delivered WebP is the visual master: keep its soft highlight, green volume
  // gradient and warm lower shadow intact. User colors are a translucent shell tint,
  // never a replacement gradient.
  context.drawImage(image, 0, 0, width, height);
  if (shell.colorAlpha > 0) {
    context.save();
    context.globalCompositeOperation = 'source-atop';
    context.fillStyle = hexToRgba(shell.color, shell.colorAlpha);
    context.fillRect(0, 0, width, height);
    context.restore();
  }
}

function drawSticker(context, operation, width, height) {
  const pixels = PIXEL_STICKERS[operation.pattern] || PIXEL_STICKERS.star;
  const cellSize = Math.max(2, Math.round(Math.min(width, height) * 0.012));
  const columns = Math.max(...pixels.map(row => row.length));
  const rows = pixels.length;
  const startX = Math.round(operation.x * width - columns * cellSize / 2);
  const startY = Math.round(operation.y * height - rows * cellSize / 2);
  context.save();
  context.fillStyle = 'rgba(70,91,62,.58)';
  pixels.forEach((row, rowIndex) => {
    Array.from(row).forEach((pixel, columnIndex) => {
      if (pixel !== '1') return;
      context.fillRect(startX + columnIndex * cellSize, startY + rowIndex * cellSize, cellSize, cellSize);
    });
  });
  context.restore();
}

function drawPixelStroke(context, operation, width, height) {
  const points = operation.points || [];
  if (!points.length) return;
  const pixelSize = Math.max(1, Math.round(Math.min(width, height) * operation.width));
  context.save();
  context.globalCompositeOperation = 'source-over';
  context.fillStyle = operation.color || '#536447';
  const stamp = point => {
    const x = Math.round(point.x * width - pixelSize / 2);
    const y = Math.round(point.y * height - pixelSize / 2);
    context.fillRect(x, y, pixelSize, pixelSize);
  };
  if (points.length === 1) {
    stamp(points[0]);
  } else {
    points.slice(1).forEach((point, index) => {
      const previous = points[index];
      const startX = previous.x * width;
      const startY = previous.y * height;
      const endX = point.x * width;
      const endY = point.y * height;
      const distance = Math.hypot(endX - startX, endY - startY);
      const steps = Math.max(1, Math.ceil(distance / Math.max(1, pixelSize * 0.55)));
      for (let step = 0; step <= steps; step += 1) {
        const ratio = step / steps;
        stamp({
          x: (startX + (endX - startX) * ratio) / width,
          y: (startY + (endY - startY) * ratio) / height
        });
      }
    });
  }
  context.restore();
}

function drawEraserStroke(context, operation, width, height) {
  const points = operation.points || [];
  if (!points.length) return;
  context.save();
  context.globalCompositeOperation = 'destination-out';
  context.strokeStyle = operation.color || '#536447';
  context.fillStyle = operation.color || '#536447';
  context.lineWidth = Math.min(width, height) * operation.width;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  if (points.length === 1) {
    context.beginPath();
    context.arc(points[0].x * width, points[0].y * height, context.lineWidth / 2, 0, Math.PI * 2);
    context.fill();
  } else {
    context.beginPath();
    context.moveTo(points[0].x * width, points[0].y * height);
    points.slice(1).forEach(point => context.lineTo(point.x * width, point.y * height));
    context.stroke();
  }
  context.restore();
}

function drawEggArt(context, image, width, height, shellInput, activeOperation) {
  const shell = normalizeShellArt(shellInput);
  context.clearRect(0, 0, width, height);
  if (!image) {
    context.save();
    eggPath(context, width, height);
    context.clip();
  }
  shell.operations.concat(activeOperation || []).forEach(operation => {
    if (operation.type === 'sticker') drawSticker(context, operation, width, height);
    if (operation.type === 'stroke' && operation.tool === 'eraser') drawEraserStroke(context, operation, width, height);
    if (operation.type === 'stroke' && operation.tool === 'brush') drawPixelStroke(context, operation, width, height);
  });
  if (!image) {
    context.restore();
    return;
  }
  context.save();
  context.globalCompositeOperation = 'destination-in';
  context.drawImage(image, 0, 0, width, height);
  context.restore();
}

function operationSummary(shellInput) {
  const shell = normalizeShellArt(shellInput);
  const stickers = shell.operations.filter(item => item.type === 'sticker');
  const strokes = shell.operations.filter(item => item.type === 'stroke');
  return {
    color_token: shell.colorToken,
    pattern_ids: Array.from(new Set(stickers.map(item => item.pattern))),
    sticker_count: stickers.length,
    stroke_count: strokes.filter(item => item.tool === 'brush').length,
    used_eraser: strokes.some(item => item.tool === 'eraser')
  };
}

module.exports = {
  BASE_ASSET,
  BASE_VERSION,
  COLORS,
  BRUSH_COLORS,
  DEFAULT_BRUSH_COLOR,
  PATTERNS,
  MAX_OPERATIONS,
  BRUSH_SIZES,
  ERASER_MIN_PX,
  ERASER_MAX_PX,
  ERASER_DEFAULT_PX,
  ERASER_SIZES,
  ERASER_MAX_WIDTH,
  DEFAULT_BRUSH_WIDTH,
  DEFAULT_ERASER_WIDTH,
  brushWidthForPixels,
  eraserWidthForPixels,
  defaultShellArt,
  normalizeShellArt,
  cloneShellArt,
  createSticker,
  createStroke,
  drawEggBase,
  drawEggArt,
  operationSummary
};
