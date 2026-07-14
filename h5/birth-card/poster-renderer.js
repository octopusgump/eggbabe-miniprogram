(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.EggbabePosterRenderer = api;
}(typeof self !== 'undefined' ? self : this, function () {
  const WIDTH = 1080;
  const CARD_HEIGHT = 1440;
  const HEIGHT = 1680;
  const TITLE_HEIGHT = Math.round(CARD_HEIGHT * 0.14);
  const ILLUSTRATION_HEIGHT = Math.round(CARD_HEIGHT * 0.54);
  const DATA_HEIGHT = CARD_HEIGHT - TITLE_HEIGHT - ILLUSTRATION_HEIGHT;

  function loadImage(src) {
    if (!src || typeof Image === 'undefined') return Promise.resolve(null);
    return new Promise(resolve => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = src;
    });
  }

  function drawContain(context, image, x, y, width, height) {
    const scale = Math.min(width / image.width, height / image.height);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    context.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
  }

  function drawCover(context, image, x, y, width, height) {
    const scale = Math.max(width / image.width, height / image.height);
    const sourceWidth = width / scale;
    const sourceHeight = height / scale;
    context.drawImage(image, (image.width - sourceWidth) / 2, (image.height - sourceHeight) / 2, sourceWidth, sourceHeight, x, y, width, height);
  }

  function roundedRect(context, x, y, width, height, radius) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.arcTo(x + width, y, x + width, y + height, radius);
    context.arcTo(x + width, y + height, x, y + height, radius);
    context.arcTo(x, y + height, x, y, radius);
    context.arcTo(x, y, x + width, y, radius);
    context.closePath();
  }

  function drawTitle(context, card) {
    context.fillStyle = '#FFFCF4';
    context.fillRect(0, 0, WIDTH, TITLE_HEIGHT);
    context.fillStyle = '#EFC84B';
    context.font = '52px sans-serif';
    context.textAlign = 'center';
    context.fillText('★', 112, 122);
    context.fillText('★', WIDTH - 112, 122);
    context.fillStyle = '#65705F';
    context.font = '600 22px sans-serif';
    context.fillText('eggbabe', WIDTH / 2, 48);
    context.fillStyle = '#3C2D24';
    context.font = '400 84px "ZCOOL KuaiLe", "PingFang SC", sans-serif';
    context.fillText(card.name, WIDTH / 2, 142, 680);
    if (card.cardType === 'collectible') {
      roundedRect(context, WIDTH - 184, TITLE_HEIGHT - 62, 128, 42, 21);
      context.fillStyle = '#F1F1EA';
      context.fill();
      context.fillStyle = '#526054';
      context.font = '600 20px sans-serif';
      context.fillText(card.collectorLabel, WIDTH - 120, TITLE_HEIGHT - 33);
    }
  }

  function drawIllustration(context, card, assets, background, figure) {
    const x = 54;
    const y = TITLE_HEIGHT;
    const width = WIDTH - 108;
    const height = ILLUSTRATION_HEIGHT - 24;
    roundedRect(context, x, y, width, height, 34);
    context.save();
    context.clip();
    const gradient = context.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, '#EAF3F4');
    gradient.addColorStop(.58, '#F5F0DD');
    gradient.addColorStop(1, '#ECE7F5');
    context.fillStyle = gradient;
    context.fillRect(x, y, width, height);
    if (background) drawCover(context, background, x, y, width, height);
    if (figure) drawContain(context, figure, x, y, width, height);
    else {
      context.fillStyle = 'rgba(63,90,71,.3)';
      context.font = '400 330px serif';
      context.textAlign = 'center';
      context.fillText(assets.fallbackMark || (card.prototype === 'KOI' ? '鲤' : '兔'), WIDTH / 2, y + height * .68);
    }
    context.restore();
  }

  function drawCollectibleStats(context, card) {
    const x = 64;
    const y = TITLE_HEIGHT + ILLUSTRATION_HEIGHT + 30;
    const width = WIDTH - 128;
    const height = DATA_HEIGHT - 66;
    const rowHeight = height / 3;
    const styles = {
      mbti: { icon: '人', fill: '#DDE9B8', stroke: '#8DA85D' },
      constellation: { icon: '★', fill: '#F2D2DF', stroke: '#BD7796' },
      birthday: { icon: '礼', fill: '#DDD9F2', stroke: '#8176B5' }
    };
    const rows = card.statRows.map(row => Object.assign({}, row, styles[row.key]));
    roundedRect(context, x, y, width, height, 32);
    context.strokeStyle = '#94AB61';
    context.lineWidth = 4;
    context.stroke();
    rows.forEach((row, index) => {
      const top = y + rowHeight * index;
      if (index) {
        context.beginPath();
        context.moveTo(x, top);
        context.lineTo(x + width, top);
        context.strokeStyle = '#A7B978';
        context.lineWidth = 3;
        context.stroke();
      }
      const centerY = top + rowHeight / 2;
      context.beginPath();
      context.arc(x + 72, centerY, 36, 0, Math.PI * 2);
      context.fillStyle = row.fill;
      context.fill();
      context.strokeStyle = row.stroke;
      context.lineWidth = 3;
      context.stroke();
      context.fillStyle = '#2D251F';
      context.font = '600 28px sans-serif';
      context.textAlign = 'center';
      context.fillText(row.icon, x + 72, centerY + 10);
      context.font = '600 38px sans-serif';
      context.textAlign = 'left';
      context.fillText(row.label, x + 136, centerY + 13);
      context.textAlign = 'right';
      context.fillText(row.value, x + width - 38, centerY + 13);
    });
  }

  async function generatePoster(card, assets, canvas) {
    if (!card.miniProgramCodeUrl) throw new Error('MINI_CODE_REQUIRED');
    const target = canvas || document.createElement('canvas');
    target.width = WIDTH;
    target.height = HEIGHT;
    const context = target.getContext('2d');
    const [background, figure, miniCode] = await Promise.all([
      loadImage(assets.background), loadImage(assets.figure), loadImage(card.miniProgramCodeUrl)
    ]);
    if (!miniCode) throw new Error('MINI_CODE_REQUIRED');
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) await document.fonts.ready;

    context.fillStyle = '#FFFDF7';
    context.fillRect(0, 0, WIDTH, HEIGHT);
    drawTitle(context, card);
    drawIllustration(context, card, assets, background, figure);
    drawCollectibleStats(context, card);

    context.fillStyle = '#EEF1E9';
    context.fillRect(0, CARD_HEIGHT, WIDTH, HEIGHT - CARD_HEIGHT);
    context.fillStyle = '#3F5A47';
    context.font = '600 30px sans-serif';
    context.textAlign = 'left';
    context.fillText('eggbabe 收藏卡', 66, CARD_HEIGHT + 70);
    context.fillStyle = '#667168';
    context.font = '500 24px monospace';
    context.fillText(card.code, 66, CARD_HEIGHT + 124, 700);
    context.font = '400 21px sans-serif';
    context.fillText(card.mode === 'demo' ? '展会体验 · 不进入正式收藏与统计' : '长按识别小程序码，遇见你的蛋宝宝', 66, CARD_HEIGHT + 174, 700);
    drawContain(context, miniCode, WIDTH - 210, CARD_HEIGHT + 28, 150, 150);
    return target.toDataURL('image/png', 1);
  }

  return { WIDTH, HEIGHT, CARD_HEIGHT, TITLE_HEIGHT, ILLUSTRATION_HEIGHT, DATA_HEIGHT, drawCollectibleStats, generatePoster };
}));
