const BASE_ASSET = '/assets/scenes/incubation/webp/egg_base_day.webp';
const SHELL_VERSION = 2;
const BASE_VERSION = 'v2.26-realistic';
const COLOR_ALPHA = 0.32;
const FIXED_STROKE_WIDTH = 0.052;

const COLORS = [
  { token: 'cream', name: '奶油白', value: '#F2EBD8' },
  { token: 'mint', name: '薄荷绿', value: '#BFD9C1' },
  { token: 'mist-blue', name: '雾霭蓝', value: '#B9CDE2' },
  { token: 'blush', name: '柔雾粉', value: '#EBC5C2' },
  { token: 'apricot', name: '杏子黄', value: '#E8D1A8' },
  { token: 'lavender', name: '浅藤紫', value: '#CEC5DD' },
  { token: 'warm-gray', name: '暖云灰', value: '#D4D0C7' }
];

const PATTERNS = [
  { type: 'star', name: '星星', symbol: '✦' },
  { type: 'heart', name: '爱心', symbol: '♡' },
  { type: 'leaf', name: '叶子', symbol: '⌁' }
];

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

function colorByValue(value) {
  return COLORS.find(item => item.value.toLowerCase() === String(value || '').toLowerCase());
}

function colorByToken(token) {
  return COLORS.find(item => item.token === token);
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
      scale: clamp(source.scale || 1, 0.5, 1.5),
      rotation: clamp(source.rotation || 0, -Math.PI, Math.PI)
    };
  }
  if (source.type === 'stroke' && (source.tool === 'brush' || source.tool === 'eraser')) {
    const points = (Array.isArray(source.points) ? source.points : []).slice(0, 300).map(normalizePoint);
    if (!points.length) return null;
    return {
      id: String(source.id || `stroke-${index}`),
      type: 'stroke',
      tool: source.tool,
      color: '#536447',
      width: FIXED_STROKE_WIDTH,
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
    ? source.operations.slice(0, 120).map(normalizeOperation).filter(Boolean)
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

function createSticker(pattern, sequence) {
  const safePattern = PATTERNS.some(item => item.type === pattern) ? pattern : PATTERNS[0].type;
  const index = Math.max(0, Number(sequence) || 0);
  const position = STICKER_POSITIONS[index % STICKER_POSITIONS.length];
  return {
    id: `sticker-${index + 1}`,
    type: 'sticker',
    pattern: safePattern,
    x: position.x,
    y: position.y,
    scale: position.scale,
    rotation: position.rotation
  };
}

function createStroke(tool, points, sequence) {
  return normalizeOperation({
    id: `stroke-${Math.max(0, Number(sequence) || 0) + 1}`,
    type: 'stroke',
    tool: tool === 'eraser' ? 'eraser' : 'brush',
    points
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

function drawStar(context, radius) {
  context.beginPath();
  for (let index = 0; index < 10; index += 1) {
    const angle = -Math.PI / 2 + index * Math.PI / 5;
    const pointRadius = index % 2 === 0 ? radius : radius * 0.43;
    const x = Math.cos(angle) * pointRadius;
    const y = Math.sin(angle) * pointRadius;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.closePath();
  context.fill();
}

function drawHeart(context, radius) {
  const width = radius * 1.8;
  context.beginPath();
  context.moveTo(0, radius * 0.9);
  context.bezierCurveTo(-width, -radius * 0.15, -radius * 0.8, -radius, 0, -radius * 0.35);
  context.bezierCurveTo(radius * 0.8, -radius, width, -radius * 0.15, 0, radius * 0.9);
  context.closePath();
  context.fill();
}

function drawLeaf(context, radius) {
  context.beginPath();
  context.moveTo(-radius, radius * 0.45);
  context.quadraticCurveTo(-radius * 0.35, -radius, radius, -radius * 0.4);
  context.quadraticCurveTo(radius * 0.35, radius, -radius, radius * 0.45);
  context.closePath();
  context.fill();
  context.beginPath();
  context.moveTo(-radius * 0.65, radius * 0.3);
  context.lineTo(radius * 0.65, -radius * 0.25);
  context.stroke();
}

function drawSticker(context, operation, width, height) {
  const radius = Math.min(width, height) * 0.065 * operation.scale;
  context.save();
  context.translate(operation.x * width, operation.y * height);
  context.rotate(operation.rotation);
  context.fillStyle = 'rgba(70,91,62,.58)';
  context.strokeStyle = 'rgba(70,91,62,.42)';
  context.lineWidth = Math.max(1, radius * 0.1);
  context.lineCap = 'round';
  if (operation.pattern === 'heart') drawHeart(context, radius);
  else if (operation.pattern === 'leaf') drawLeaf(context, radius);
  else drawStar(context, radius);
  context.restore();
}

function drawStroke(context, operation, width, height) {
  const points = operation.points || [];
  if (!points.length) return;
  context.save();
  context.globalCompositeOperation = operation.tool === 'eraser' ? 'destination-out' : 'source-over';
  context.strokeStyle = operation.color || '#536447';
  context.fillStyle = operation.color || '#536447';
  context.lineWidth = Math.min(width, height) * FIXED_STROKE_WIDTH;
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
    if (operation.type === 'stroke') drawStroke(context, operation, width, height);
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
  PATTERNS,
  FIXED_STROKE_WIDTH,
  defaultShellArt,
  normalizeShellArt,
  cloneShellArt,
  createSticker,
  createStroke,
  drawEggBase,
  drawEggArt,
  operationSummary
};
