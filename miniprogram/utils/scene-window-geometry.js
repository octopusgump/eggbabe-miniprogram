const PANEL_COUNT = 3;

function finitePositive(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function roundPixel(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function validRegion(region) {
  if (!region || typeof region !== 'object') return null;
  const x = Number(region.x);
  const y = Number(region.y);
  const width = finitePositive(region.width);
  const height = finitePositive(region.height);
  if (!Number.isFinite(x) || !Number.isFinite(y) || !width || !height) return null;
  return { id: String(region.id || 'window'), x, y, width, height };
}

function hotspotStyle(left, top, width, height) {
  return [
    `left:${roundPixel(left)}px`,
    `top:${roundPixel(top)}px`,
    `width:${roundPixel(width)}px`,
    `height:${roundPixel(height)}px`
  ].join(';');
}

/**
 * Maps original-image window regions into the three visible panel viewports.
 * The panorama is rendered once into a 3 * panelWidth by panelHeight box with
 * aspectFill and centered object positioning. Returned rectangles are clipped
 * to each panel so every visible part of a window remains tappable.
 */
function mapPanoramaRegions(options) {
  const imageWidth = finitePositive(options && options.imageWidth);
  const imageHeight = finitePositive(options && options.imageHeight);
  const panelWidth = finitePositive(options && options.panelWidth);
  const panelHeight = finitePositive(options && options.panelHeight);
  const regions = Array.isArray(options && options.regions) ? options.regions.map(validRegion).filter(Boolean) : [];
  if (!imageWidth || !imageHeight || !panelWidth || !panelHeight || !regions.length) return [[], [], []];

  const trackWidth = panelWidth * PANEL_COUNT;
  const scale = Math.max(trackWidth / imageWidth, panelHeight / imageHeight);
  const renderedWidth = imageWidth * scale;
  const renderedHeight = imageHeight * scale;
  const offsetX = (trackWidth - renderedWidth) / 2;
  const offsetY = (panelHeight - renderedHeight) / 2;
  const panels = [[], [], []];

  regions.forEach((region, regionIndex) => {
    const renderedLeft = region.x * scale + offsetX;
    const renderedRight = (region.x + region.width) * scale + offsetX;
    const renderedTop = region.y * scale + offsetY;
    const renderedBottom = (region.y + region.height) * scale + offsetY;
    const top = Math.max(0, renderedTop);
    const bottom = Math.min(panelHeight, renderedBottom);
    if (bottom <= top) return;

    panels.forEach((panel, panelIndex) => {
      const panelStart = panelIndex * panelWidth;
      const panelEnd = panelStart + panelWidth;
      const left = Math.max(panelStart, renderedLeft);
      const right = Math.min(panelEnd, renderedRight);
      if (right <= left) return;
      const id = `p${panelIndex}-${region.id}-${regionIndex}`.replace(/[^a-zA-Z0-9_-]/g, '-');
      panel.push({
        id,
        panel: panelIndex,
        style: hotspotStyle(left - panelStart, top, right - left, bottom - top)
      });
    });
  });

  return panels;
}

/** Maps panel-local image regions for accepted 941 x 1672 scene slices. */
function mapPanelRegions(options) {
  const panelWidth = finitePositive(options && options.panelWidth);
  const panelHeight = finitePositive(options && options.panelHeight);
  const panelsMeta = Array.isArray(options && options.panels) ? options.panels : [];
  if (!panelWidth || !panelHeight) return [[], [], []];

  return [0, 1, 2].map(panelIndex => {
    const meta = panelsMeta[panelIndex] || {};
    const imageWidth = finitePositive(meta.imageWidth);
    const imageHeight = finitePositive(meta.imageHeight);
    const regions = Array.isArray(meta.windowRegions) ? meta.windowRegions.map(validRegion).filter(Boolean) : [];
    if (!imageWidth || !imageHeight || !regions.length) return [];
    const scale = Math.max(panelWidth / imageWidth, panelHeight / imageHeight);
    const offsetX = (panelWidth - imageWidth * scale) / 2;
    const offsetY = (panelHeight - imageHeight * scale) / 2;
    return regions.reduce((result, region, regionIndex) => {
      const left = Math.max(0, region.x * scale + offsetX);
      const right = Math.min(panelWidth, (region.x + region.width) * scale + offsetX);
      const top = Math.max(0, region.y * scale + offsetY);
      const bottom = Math.min(panelHeight, (region.y + region.height) * scale + offsetY);
      if (right <= left || bottom <= top) return result;
      const id = `p${panelIndex}-${region.id}-${regionIndex}`.replace(/[^a-zA-Z0-9_-]/g, '-');
      result.push({ id, panel: panelIndex, style: hotspotStyle(left, top, right - left, bottom - top) });
      return result;
    }, []);
  });
}

function windowGestureThreshold(panelWidth) {
  return Math.max(8, finitePositive(panelWidth) * .02);
}

function shouldActivateWindowGesture(options) {
  const source = options || {};
  const threshold = windowGestureThreshold(source.panelWidth);
  const dx = Math.abs(Number(source.endX) - Number(source.startX));
  const dy = Math.abs(Number(source.endY) - Number(source.startY));
  const elapsedMs = Number(source.elapsedMs);
  return !source.moved && Number.isFinite(dx) && Number.isFinite(dy) && dx <= threshold && dy <= threshold && Number.isFinite(elapsedMs) && elapsedMs >= 0 && elapsedMs <= 500;
}

module.exports = { mapPanoramaRegions, mapPanelRegions, windowGestureThreshold, shouldActivateWindowGesture };
