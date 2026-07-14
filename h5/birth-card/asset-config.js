(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.EggbabeAssetConfig = api;
}(typeof self !== 'undefined' ? self : this, function () {
  const manifest = {
    defaults: {
      YT: { background: '', figure: '', accent: '#D9E7FF', heroStart: '#121934', heroEnd: '#4C315F', fallbackMark: '兔' },
      KOI: { background: '', figure: '', accent: '#F6C989', heroStart: '#1E1220', heroEnd: '#6A2B35', fallbackMark: '鲤' }
    },
    cards: {
      /* 新款式只需增加配置，例如：
      'KOI__好运红白款': {
        background: './assets/posters/KOI__好运红白款.jpg',
        figure: './assets/figures/KOI__好运红白款.png'
      }
      */
    }
  };

  function resolveAssets(card, customManifest) {
    const source = customManifest || manifest;
    const defaults = (source.defaults && source.defaults[card.prototype]) || {};
    const styleKey = card.bgKey || `${card.prototype}__${card.style}`;
    const figureKey = card.figureKey || `${card.prototype}__${card.style}`;
    const styleAssets = (source.cards && source.cards[styleKey]) || {};
    const figureAssets = (source.cards && source.cards[figureKey]) || {};
    const batch = card.limitedBatch || card.limited_batch || '';
    const limitedKey = batch ? `${styleKey}__${batch}` : '';
    const limitedAssets = limitedKey && source.cards ? source.cards[limitedKey] || {} : {};
    return Object.assign({}, defaults, styleAssets, {
      figure: figureAssets.figure || styleAssets.figure || defaults.figure || ''
    }, limitedAssets);
  }

  return { manifest, resolveAssets };
}));
