const catalog = require('./companion-prop-catalog');

const LINE_ROOT = '/assets/keepsakes/turnarounds/line/';
const COLOR_ROOT = '/assets/keepsakes/turnarounds/webp/';
const LEGACY_COLOR_ROOT = '/assets/scenes/lifecycle/post-hatch/50-overlays/keepsakes/turnarounds/webp/';
const LEGACY_PNG_ROOT = '/assets/scenes/lifecycle/post-hatch/50-overlays/keepsakes/turnarounds/png/';

function squareCardFileName(colorFile) {
  const name = String(colorFile || '');
  if (!name.includes('four_view')) return '';
  return name
    .replace(/_four_view_3d_v2\.webp$/i, '_card_square_3d_transparent_v01.png')
    .replace(/_four_view_3d\.webp$/i, '_card_square_3d_transparent_v01.png')
    .replace(/_four_view_3d_v2\.png$/i, '_card_square_3d_transparent_v01.png')
    .replace(/_four_view_3d\.png$/i, '_card_square_3d_transparent_v01.png');
}

function coloredPaths(entry) {
  const id = entry && entry.id ? entry.id : '';
  const paths = [];
  if (entry && entry.colorFile) {
    const square = squareCardFileName(entry.colorFile);
    if (square) {
      paths.push(`${LEGACY_PNG_ROOT}${square}`);
      paths.push(`${COLOR_ROOT}${square}`);
    }
    if (entry.colorFile.includes('card_square')) {
      paths.push(`${COLOR_ROOT}${entry.colorFile}`);
      paths.push(`${LEGACY_PNG_ROOT}${entry.colorFile}`);
      paths.push(`${LEGACY_COLOR_ROOT}${entry.colorFile}`);
    }
    paths.push(`${COLOR_ROOT}${entry.colorFile}`);
    paths.push(`${LEGACY_COLOR_ROOT}${entry.colorFile}`);
  }
  if (id) paths.push(`${COLOR_ROOT}${id}.webp`);
  return paths.filter((value, index, list) => value && list.indexOf(value) === index);
}

function lineSketchPath(propId) {
  const id = String(propId || '').trim();
  if (!id) return '';
  return `${LINE_ROOT}${id}.webp`;
}

function resolveColoredPath(entry, options) {
  const paths = coloredPaths(entry);
  if (options && options.fsExists) {
    const found = paths.find(item => options.fsExists(item));
    return found || paths[0] || '';
  }
  return paths[0] || '';
}

function resolveLinePath(entry) {
  if (!entry || !entry.id) return '';
  return lineSketchPath(entry.id);
}

module.exports = {
  LINE_ROOT,
  COLOR_ROOT,
  LEGACY_COLOR_ROOT,
  LEGACY_PNG_ROOT,
  lineSketchPath,
  coloredPaths,
  resolveColoredPath,
  resolveLinePath,
  getProp: catalog.getById
};
