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
  const cardView = byId('card-view');
  const profileView = byId('profile-view');

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

  function applyTheme(resolvedAssets) {
    const root = document.documentElement;
    root.style.setProperty('--hero-start', resolvedAssets.heroStart || '#121934');
    root.style.setProperty('--hero-end', resolvedAssets.heroEnd || '#4c315f');
    root.style.setProperty('--accent', resolvedAssets.accent || '#d9e7ff');
    const mark = resolvedAssets.fallbackMark || (card.prototype === 'KOI' ? '鲤' : '兔');
    byId('fallback-mark').textContent = mark;
    byId('profile-mark').textContent = mark;
    byId('birth-card').querySelector('.card-hero').classList.toggle('is-composite', Boolean(resolvedAssets.fullHero));
    setImage(byId('hero-background'), resolvedAssets.background);
    setImage(byId('hero-figure'), resolvedAssets.figure);
  }

  function setView(view, updateHistory) {
    const isProfile = view === 'profile' && card.cardType === 'birth';
    cardView.hidden = isProfile;
    profileView.hidden = !isProfile;
    document.title = isProfile ? `${card.name}的角色档案 · eggbabe` : `${card.name}的${card.cardType === 'collectible' ? '套装收藏卡' : '破壳收藏卡'} · eggbabe`;
    if (updateHistory && window.history && window.history.replaceState) {
      const url = new URL(window.location.href);
      url.searchParams.set('view', isProfile ? 'profile' : 'card');
      window.history.replaceState({}, '', url.toString());
    }
    notifyMiniProgram('h5_birth_card_viewed', { view: isProfile ? 'profile' : 'card', mode: card.mode });
    window.scrollTo(0, 0);
  }

  function render(raw) {
    card = model.normalizeCard(raw);
    assets = assetConfig.resolveAssets(card, runtimeConfig.assetManifest || assetConfig.manifest);
    fillFields(card);
    applyTheme(assets);
    const badge = byId('collect-badge');
    const isCollectible = card.cardType === 'collectible';
    const cardSubtitle = byId('card-subtitle');
    const cardFooter = byId('card-footer');
    byId('birth-card').classList.toggle('is-collectible', isCollectible);
    badge.textContent = isCollectible ? card.collectorLabel : card.collectAttr;
    badge.classList.toggle('is-limited', !isCollectible && card.collectAttr === '限定');
    byId('card-kind').textContent = isCollectible ? 'COLLECTIBLE CARD' : 'BIRTH CARD';
    cardSubtitle.hidden = isCollectible;
    cardFooter.hidden = isCollectible;
    if (isCollectible) {
      byId('card-birthday').textContent = card.birthdayLabel;
      byId('card-constellation').textContent = card.constellationLabel;
    }
    if (!isCollectible) {
      cardSubtitle.textContent = `${card.prototypeLabel} · ${card.style} · ${card.gender}`;
      byId('card-set-line').textContent = '唯一身份收藏卡';
    }
    byId('profile-button').hidden = isCollectible;
    byId('mode-chip').hidden = card.mode !== 'demo';
    loading.hidden = true;
    error.hidden = true;
    content.hidden = false;
    setView(!isCollectible && params.get('view') === 'profile' ? 'profile' : 'card', false);
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
    } catch (posterError) {
      const message = posterError.message === 'MINI_CODE_REQUIRED'
        ? '正式分享图需要先接入真实小程序码。'
        : '长图生成失败，请检查角色素材是否允许跨域读取后重试。';
      byId('action-message').textContent = message;
      byId('action-message').hidden = false;
    } finally {
      button.disabled = false;
      button.textContent = '生成分享长图';
    }
  }

  function closePoster() {
    byId('poster-modal').hidden = true;
    document.body.style.overflow = '';
  }

  function openRename() {
    if (window.wx && window.wx.miniProgram) {
      window.wx.miniProgram.navigateTo({ url: '/pages/nickname/nickname' });
      return;
    }
    byId('profile-action-message').textContent = '请回到蛋宝宝小程序内修改名字。';
    byId('profile-action-message').hidden = false;
  }

  byId('poster-button').addEventListener('click', generatePoster);
  byId('profile-button').addEventListener('click', () => setView('profile', true));
  byId('card-button').addEventListener('click', () => setView('card', true));
  byId('rename-button').addEventListener('click', openRename);
  byId('poster-close').addEventListener('click', closePoster);
  byId('poster-modal').addEventListener('click', event => { if (event.target === byId('poster-modal')) closePoster(); });

  loadCard().then(prepare).catch(loadError => {
    showError(loadError.message === 'INVALID_CARD' ? '这张收藏卡的数据还不完整，请回到小程序重新打开。' : loadError.message);
    notifyMiniProgram('h5_birth_card_failed', { reason: loadError.message || 'UNKNOWN' });
  });
}());
