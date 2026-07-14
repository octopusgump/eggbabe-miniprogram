(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.EggbabeAssetConfig = api;
}(typeof self !== 'undefined' ? self : this, function () {
  const manifest = {
    defaults: {
      YT: { background: '', figure: '', accent: '#D9E7E4', heroStart: '#EAF3F4', heroEnd: '#ECE7F5', fallbackMark: '兔' },
      KOI: { background: '', figure: '', accent: '#F6D8C9', heroStart: '#F8E8D8', heroEnd: '#F2DFD9', fallbackMark: '鲤' }
    },
    cards: {
      'YT__watercolor__hi': { figure: './assets/figures/YT__watercolor__hi__v01.jpg', fullHero: true },
      'YT__watercolor__salute': { figure: './assets/figures/YT__watercolor__salute__v01.jpg', fullHero: true },
      'YT__watercolor__dance': { figure: './assets/figures/YT__watercolor__dance__v01.jpg', fullHero: true },
      'YT__watercolor__box': { figure: './assets/figures/YT__watercolor__box__v01.jpg', fullHero: true },
      'YT__watercolor__cycle': { figure: './assets/figures/YT__watercolor__cycle__v01.jpg', fullHero: true },
      'YT__watercolor__newspaper': { figure: './assets/figures/YT__watercolor__newspaper__v01.jpg', fullHero: true },
      'YT__watercolor__meditate': { figure: './assets/figures/YT__watercolor__meditate__v01.jpg', fullHero: true },
      'YT__watercolor__skateboard': { figure: './assets/figures/YT__watercolor__skateboard__v01.jpg', fullHero: true },
      'YT__watercolor__chemistry': { figure: './assets/figures/YT__watercolor__chemistry__v01.jpg', fullHero: true },
      'YT__watercolor__bath': { figure: './assets/figures/YT__watercolor__bath__v01.jpg', fullHero: true },
      'KOI__watercolor__bath-tub': { figure: './assets/figures/KOI__watercolor__bath-tub__v01.png', fullHero: true },
      'KOI__watercolor__beach-chair': { figure: './assets/figures/KOI__watercolor__beach-chair__v01.png', fullHero: true },
      'KOI__watercolor__diving-goggles': { figure: './assets/figures/KOI__watercolor__diving-goggles__v01.png', fullHero: true },
      'KOI__watercolor__flag': { figure: './assets/figures/KOI__watercolor__flag__v01.png', fullHero: true },
      'KOI__watercolor__holding-fish': { figure: './assets/figures/KOI__watercolor__holding-fish__v01.png', fullHero: true },
      'KOI__watercolor__running': { figure: './assets/figures/KOI__watercolor__running__v01.png', fullHero: true },
      'KOI__watercolor__scooter': { figure: './assets/figures/KOI__watercolor__scooter__v01.png', fullHero: true },
      'KOI__watercolor__standing': { figure: './assets/figures/KOI__watercolor__standing__v01.png', fullHero: true },
      'KOI__watercolor__umbrella-walk': { figure: './assets/figures/KOI__watercolor__umbrella-walk__v01.png', fullHero: true },
      'KOI__watercolor__watering-plant': { figure: './assets/figures/KOI__watercolor__watering-plant__v01.png', fullHero: true }
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
    return Object.assign({}, defaults, styleAssets, figureAssets, {
      figure: figureAssets.figure || styleAssets.figure || defaults.figure || ''
    }, limitedAssets);
  }

  return { manifest, resolveAssets };
}));
