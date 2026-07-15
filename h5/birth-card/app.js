(function () {
  const model = window.EggbabeCardModel;
  const assetConfig = window.EggbabeAssetConfig;
  const posterRenderer = window.EggbabePosterRenderer;
  const params = new URLSearchParams(window.location.search);
  const runtimeConfig = window.EGGBABE_H5_CONFIG || {};
  let card = null;
  let assets = null;

  const byId = id => document.getElementById(id);
  const loading = byId('loading');
  const error = byId('error');
  const content = byId('content');

  function notifyMiniProgram(eventName, properties) {
    if (!window.wx || !window.wx.miniProgram) return;
    window.wx.miniProgram.postMessage({ data: Object.assign({ event_name: eventName, card_id: card ? card.cardId : '' }, properties || {}) });
  }

  function showError(message) {
    loading.hidden = true;
    content.hidden = true;
    error.hidden = false;
    byId('error-message').textContent = message || '请回到小程序稍后再试。';
  }

  function setImage(image, src, onFailure) {
    if (!src) {
      image.hidden = true;
      return;
    }
    image.onload = () => { image.hidden = false; };
    image.onerror = () => {
      image.hidden = true;
      if (onFailure) onFailure();
    };
    image.src = src;
  }

  function fillFields(value) {
    document.querySelectorAll('[data-field]').forEach(node => {
      const next = value[node.dataset.field];
      node.textContent = next === undefined || next === null || next === '' ? '—' : String(next);
    });
  }

  function fitCardSignature() {
    const dataSection = document.querySelector('#birth-card .card-data-section');
    const signature = document.querySelector('#birth-card .card-signature');
    if (!dataSection || !signature) return;
    const minSignatureFontSize = 10;
    let fontSize = 14.4;
    signature.style.fontSize = `${fontSize}px`;
    while (dataSection.scrollHeight > dataSection.clientHeight && fontSize > minSignatureFontSize) {
      fontSize = Math.max(minSignatureFontSize, Number((fontSize - .8).toFixed(1)));
      signature.style.fontSize = `${fontSize}px`;
    }
  }

  function applyTheme(resolvedAssets) {
    const mark = resolvedAssets.fallbackMark || (card.prototype === 'KOI' ? '鲤' : '兔');
    byId('fallback-mark').textContent = mark;
    byId('card-avatar-mark').textContent = mark;
    setImage(byId('hero-background'), resolvedAssets.background);
    setImage(byId('hero-figure'), resolvedAssets.figure);
    setImage(byId('card-avatar-image'), card.avatarUrl || resolvedAssets.figure);
  }

  function validSelfHostedFontUrl(value) {
    const raw = String(value || '').trim();
    if (!raw || /^(?:data|javascript):/i.test(raw)) return '';
    if (/^https:\/\//i.test(raw)) return raw;
    if (/^(?:\.\/|\/)/.test(raw)) return raw;
    return '';
  }

  function loadFont(family, source, options) {
    const url = validSelfHostedFontUrl(source);
    if (!url || typeof FontFace === 'undefined' || !document.fonts) return;
    const config = options || {};
    const face = new FontFace(family, `url("${url}") format("${config.format || 'woff2'}")`, {
      display: 'swap',
      style: 'normal',
      weight: config.weight || '400'
    });
    if (config.lazy) {
      document.fonts.add(face);
      return;
    }
    face.load().then(loaded => {
      document.fonts.add(loaded);
      if (config.loadedClass) document.documentElement.classList.add(config.loadedClass);
    }).catch(() => {});
  }

  function loadSelfHostedFonts(name) {
    const template = String(runtimeConfig.nameFontUrlTemplate || '');
    const nameFontUrl = template
      ? template.replace('{text}', encodeURIComponent(String(name || '')))
      : String(runtimeConfig.nameFontUrl || '');
    loadFont('ZCOOL KuaiLe', nameFontUrl, { format: /\.ttf(?:\?|$)/i.test(nameFontUrl) ? 'truetype' : 'woff2' });
    loadFont('Google Sans', runtimeConfig.googleSansFontUrl, {
      format: /\.ttf(?:\?|$)/i.test(runtimeConfig.googleSansFontUrl || '') ? 'truetype' : 'woff2',
      loadedClass: 'has-google-sans',
      weight: '400 700'
    });
    loadFont(
      'Noto Sans SC',
      runtimeConfig.notoSansScFontUrl,
      {
        format: /\.ttf(?:\?|$)/i.test(runtimeConfig.notoSansScFontUrl || '') ? 'truetype' : 'woff2',
        lazy: true,
        weight: '100 900'
      }
    );
  }

  function render(raw) {
    card = model.normalizeCard(raw);
    assets = assetConfig.resolveAssets(card, runtimeConfig.assetManifest || assetConfig.manifest);
    loadSelfHostedFonts(card.name);
    fillFields(card);
    applyTheme(assets);
    const badge = byId('collect-badge');
    const isCollectible = card.cardType === 'collectible';
    byId('birth-card').classList.toggle('is-collectible', isCollectible);
    byId('collect-context').hidden = !isCollectible;
    badge.hidden = !isCollectible;
    badge.textContent = isCollectible ? card.collectorLabel : '';
    byId('card-birthday').textContent = card.birthdayLabel;
    byId('card-constellation').textContent = card.constellationLabel;
    byId('mode-chip').hidden = card.mode !== 'demo';
    loading.hidden = true;
    error.hidden = true;
    content.hidden = false;
    document.title = `${card.name}的收藏卡 · eggbabe`;
    notifyMiniProgram('h5_birth_card_viewed', { view: 'card', mode: card.mode });
    fitCardSignature();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitCardSignature).catch(() => {});
  }

  function parseInjectedCard() {
    const injected = params.get('card_data');
    if (!injected) return null;
    try { return JSON.parse(injected); }
    catch (parseError) { throw new Error('卡片数据格式不正确'); }
  }

  async function loadAssetManifest() {
    if (runtimeConfig.assetManifest) return runtimeConfig.assetManifest;
    const manifestUrl = runtimeConfig.assetManifestUrl || '';
    if (!manifestUrl) return assetConfig.manifest;
    const response = await fetch(manifestUrl, { cache: 'no-store', credentials: 'omit' });
    if (!response.ok) throw new Error('卡面素材配置读取失败');
    const manifest = await response.json();
    if (!manifest || !manifest.defaults || !manifest.cards) throw new Error('卡面素材配置格式不正确');
    return manifest;
  }

  async function loadCard() {
    const injected = parseInjectedCard();
    if (injected && injected.mode === 'demo') return injected;
    if (params.get('preview') === '1' || params.get('preview') === 'collectible') {
      const sample = params.get('preview') === 'collectible' ? './sample/collectible-card.json' : './sample/card.json';
      const response = await fetch(sample, { cache: 'no-store' });
      if (!response.ok) throw new Error('预览数据读取失败');
      return response.json();
    }
    const cardId = params.get('card_id');
    const apiBase = runtimeConfig.apiBase || '';
    if (!cardId || !apiBase) throw new Error('缺少收藏卡编号或数据服务地址');
    const endpoint = `${String(apiBase).replace(/\/$/, '')}/cards/${encodeURIComponent(cardId)}?mode=${encodeURIComponent(params.get('mode') || 'live')}`;
    const response = await fetch(endpoint, { cache: 'no-store', credentials: 'omit', headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('收藏卡数据暂时不可用');
    const payload = await response.json();
    const result = payload.card || payload.data || payload;
    const returnedId = String(result.card_id || result.id || result._id || '');
    const requestedMode = params.get('mode') === 'demo' ? 'demo' : 'live';
    if (returnedId !== cardId || result.mode !== requestedMode) throw new Error('收藏卡身份校验失败');
    return result;
  }

  async function prepare(raw) {
    runtimeConfig.assetManifest = await loadAssetManifest();
    render(raw);
  }

  async function generatePoster() {
    const button = byId('poster-button');
    button.disabled = true;
    button.textContent = '正在生成…';
    try {
      byId('action-message').hidden = true;
      const dataUrl = await posterRenderer.generatePoster(card, assets);
      byId('poster-image').src = dataUrl;
      byId('poster-download').href = dataUrl;
      byId('poster-modal').hidden = false;
      document.body.style.overflow = 'hidden';
      notifyMiniProgram('h5_birth_card_poster_generated', { mode: card.mode });
      notifyMiniProgram('h5_birth_card_save_poster', { mode: card.mode, data_url: dataUrl });
    } catch (posterError) {
      const message = posterError.message === 'MINI_CODE_REQUIRED'
        ? '分享图需要先接入真实小程序码。'
        : (posterError.message === 'SHARE_CODE_REQUIRED' ? '分享图需要先准备一个未使用的个人激活码。' : '长图生成失败，请检查角色素材是否允许跨域读取后重试。');
      byId('action-message').textContent = message;
      byId('action-message').hidden = false;
    } finally {
      button.disabled = false;
      button.textContent = '保存分享长图';
    }
  }

  function closePoster() {
    byId('poster-modal').hidden = true;
    document.body.style.overflow = '';
  }

  byId('poster-button').addEventListener('click', generatePoster);
  byId('poster-close').addEventListener('click', closePoster);
  byId('poster-modal').addEventListener('click', event => { if (event.target === byId('poster-modal')) closePoster(); });

  loadCard().then(prepare).catch(loadError => {
    showError(loadError.message === 'INVALID_CARD' ? '这张收藏卡的数据还不完整，请回到小程序重新打开。' : loadError.message);
    notifyMiniProgram('h5_birth_card_failed', { reason: loadError.message || 'UNKNOWN' });
  });
}());
