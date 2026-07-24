(function () {
  const model = window.EggbabeCardModel;
  const posterRenderer = window.EggbabePosterRenderer;
  const runtimeConfig = window.EGGBABE_H5_CONFIG || {};
  const params = new URLSearchParams(window.location.search);
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');
  const content = document.getElementById('content');
  let card = null;

  function byId(id) { return document.getElementById(id); }

  function notify(eventName, extra) {
    if (window.wx && wx.miniProgram) wx.miniProgram.postMessage({ data: Object.assign({ event_name: eventName }, extra || {}) });
  }

  function showError(message) {
    loading.hidden = true;
    content.hidden = true;
    error.hidden = false;
    byId('error-message').textContent = message;
  }

  function render(raw) {
    card = model.normalizeCard(raw);
    document.querySelectorAll('[data-field]').forEach(node => {
      node.textContent = card[node.dataset.field] || '—';
    });
    const mark = card.prototype === 'KOI' ? '鲤' : '兔';
    byId('card-avatar-mark').textContent = mark;
    byId('source-row').hidden = !card.sourceBatch;
    const image = byId('hero-figure');
    image.onerror = () => showError('固定插画暂时不可用，请稍后重试。');
    image.src = card.illustrationUrl;
    image.hidden = false;
    loading.hidden = true;
    error.hidden = true;
    content.hidden = false;
    document.title = `${card.displayName}的收藏卡 · eggbabe`;
    notify('h5_birth_card_viewed', { card_id: card.cardId });
  }

  async function loadCard() {
    const cardId = params.get('card_id');
    const apiBase = runtimeConfig.apiBase || '';
    if (!cardId || params.get('mode') !== 'live' || !apiBase) throw new Error('缺少收藏卡编号或数据服务地址');
    const endpoint = `${String(apiBase).replace(/\/$/, '')}/cards/${encodeURIComponent(cardId)}?mode=live`;
    const response = await fetch(endpoint, { cache: 'no-store', credentials: 'omit', headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('收藏卡数据暂时不可用');
    const payload = await response.json();
    const result = payload.card || payload.data || payload;
    if (String(result.card_id || result.id || '') !== cardId || result.mode !== 'live') throw new Error('收藏卡身份校验失败');
    return result;
  }

  async function generatePoster() {
    const button = byId('poster-button');
    button.disabled = true;
    try {
      byId('action-message').hidden = true;
      const dataUrl = await posterRenderer.generatePoster(card);
      byId('poster-image').src = dataUrl;
      byId('poster-download').href = dataUrl;
      byId('poster-modal').hidden = false;
      notify('h5_birth_card_save_poster', { card_id: card.cardId, data_url: dataUrl });
    } catch (posterError) {
      byId('action-message').textContent = posterError.message === 'MINI_CODE_REQUIRED' ? '分享图需要服务端提供真实小程序码。' : '长图生成失败，请稍后重试。';
      byId('action-message').hidden = false;
    } finally {
      button.disabled = false;
    }
  }

  byId('poster-button').addEventListener('click', generatePoster);
  byId('poster-close').addEventListener('click', () => { byId('poster-modal').hidden = true; });
  loadCard().then(render).catch(loadError => {
    showError(loadError.message === 'INVALID_CARD' ? '这张收藏卡的数据还不完整，请回到小程序重新打开。' : loadError.message);
    notify('h5_birth_card_failed', { reason: loadError.message || 'UNKNOWN' });
  });
}());
