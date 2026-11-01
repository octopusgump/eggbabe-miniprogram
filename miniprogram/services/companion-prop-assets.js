const catalog = require('./companion-prop-catalog');

const LINE_ROOT = '/assets/keepsakes/turnarounds/line/';
const COLOR_ROOT = '/assets/keepsakes/turnarounds/webp/';
const LEGACY_COLOR_ROOT = '/assets/scenes/lifecycle/post-hatch/50-overlays/keepsakes/turnarounds/webp/';

function lineSketchPath(propId) {
  const id = String(propId || '').trim();
  if (!id) return '';
  return `${LINE_ROOT}${id}.webp`;
}

function coloredPaths(entry) {
  const id = entry && entry.id ? entry.id : '';
  const paths = [];
  if (entry && entry.colorFile) {
    paths.push(`${COLOR_ROOT}${entry.colorFile}`);
    paths.push(`${LEGACY_COLOR_ROOT}${entry.colorFile}`);
  }
  if (id) paths.push(`${COLOR_ROOT}${id}.webp`);
  return paths.filter((value, index, list) => value && list.indexOf(value) === index);
}

function resolveColoredPath(entry) {
  const paths = coloredPaths(entry);
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
  lineSketchPath,
  coloredPaths,
  resolveColoredPath,
  resolveLinePath,
  getProp: catalog.getById
};
