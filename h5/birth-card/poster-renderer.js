(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.EggbabePosterRenderer = api;
}(typeof self !== 'undefined' ? self : this, function () {
  const WIDTH = 1080;
  const HEIGHT = 1920;
  const HERO_HEIGHT = Math.round(HEIGHT * 0.7);

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

  function drawCover(context, image, x, y, width, height) {
    const scale = Math.max(width / image.width, height / image.height);
    const sourceWidth = width / scale;
    const sourceHeight = height / scale;
    context.drawImage(image, (image.width - sourceWidth) / 2, (image.height - sourceHeight) / 2, sourceWidth, sourceHeight, x, y, width, height);
  }

  function drawContain(context, image, x, y, width, height) {
    const scale = Math.min(width / image.width, height / image.height);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    context.drawImage(image, x + (width - drawWidth) / 2, y + height - drawHeight, drawWidth, drawHeight);
  }

  function drawRoundedRect(context, x, y, width, height, radius) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.arcTo(x + width, y, x + width, y + height, radius);
    context.arcTo(x + width, y + height, x, y + height, radius);
    context.arcTo(x, y + height, x, y, radius);
    context.arcTo(x, y, x + width, y, radius);
    context.closePath();
  }

  function drawFallbackFigure(context, card, assets) {
    const gradient = context.createRadialGradient(WIDTH / 2, HERO_HEIGHT * 0.48, 20, WIDTH / 2, HERO_HEIGHT * 0.52, 370);
    gradient.addColorStop(0, assets.accent || '#EDE78E');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 180, WIDTH, HERO_HEIGHT - 180);
    context.fillStyle = 'rgba(255,255,255,.93)';
    context.font = '600 340px sans-serif';
    context.textAlign = 'center';
    context.fillText(assets.fallbackMark || (card.prototype === 'KOI' ? '鲤' : '兔'), WIDTH / 2, 930);
  }

  function drawStat(context, label, value, x, y) {
    context.fillStyle = '#898B86';
    context.font = '400 28px sans-serif';
    context.fillText(label, x, y);
    context.fillStyle = '#1B211C';
    context.font = '600 38px sans-serif';
    context.fillText(value, x, y + 48);
  }

  function drawCollectibleStats(context, card) {
    const x = 72;
    const y = HERO_HEIGHT + 155;
    const width = 700;
    const rowHeight = 104;
    const rowStyles = {
      mbti: { icon: '人', fill: '#DDE9B8', stroke: '#8DA85D' },
      constellation: { icon: '★', fill: '#F2D2DF', stroke: '#BD7796' },
      birthday: { icon: '礼', fill: '#DDD9F2', stroke: '#8176B5' }
    };
    const rows = card.statRows.map(row => Object.assign({}, row, rowStyles[row.key]));
    drawRoundedRect(context, x, y, width, rowHeight * rows.length, 30);
    context.strokeStyle = '#94AB61';
    context.lineWidth = 4;
    context.stroke();
    rows.forEach((row, index) => {
      const rowTop = y + rowHeight * index;
      if (index) {
        context.beginPath();
        context.moveTo(x, rowTop);
        context.lineTo(x + width, rowTop);
        context.strokeStyle = '#A7B978';
        context.lineWidth = 3;
        context.stroke();
      }
      const iconX = x + 52;
      const centerY = rowTop + rowHeight / 2;
      context.beginPath();
      context.arc(iconX, centerY, 30, 0, Math.PI * 2);
      context.fillStyle = row.fill;
      context.fill();
      context.strokeStyle = row.stroke;
      context.lineWidth = 3;
      context.stroke();
      context.fillStyle = '#172018';
      context.font = '600 25px sans-serif';
      context.textAlign = 'center';
      context.fillText(row.icon, iconX, centerY + 9);
      context.font = '600 30px sans-serif';
      context.textAlign = 'left';
      context.fillText(row.label, x + 102, centerY + 10);
      context.textAlign = 'right';
      context.fillText(row.value, x + width - 28, centerY + 10);
    });
    context.textAlign = 'left';
  }

  function drawCodePlaceholder(context, x, y, size) {
    context.fillStyle = '#F0F0EA';
    context.fillRect(x, y, size, size);
    context.strokeStyle = '#667268';
    context.lineWidth = 6;
    context.strokeRect(x + 12, y + 12, size - 24, size - 24);
    context.fillStyle = '#667268';
    context.font = '500 22px sans-serif';
    context.textAlign = 'center';
    context.fillText('小程序码', x + size / 2, y + size / 2 - 4);
    context.fillText('待接入', x + size / 2, y + size / 2 + 28);
  }

  async function generatePoster(card, assets, canvas) {
    const isCollectible = card.cardType === 'collectible';
    if (card.mode === 'live' && !card.miniProgramCodeUrl) throw new Error('MINI_CODE_REQUIRED');
    const target = canvas || document.createElement('canvas');
    target.width = WIDTH;
    target.height = HEIGHT;
    const context = target.getContext('2d');
    const [background, figure, miniCode] = await Promise.all([
      loadImage(assets.background), loadImage(assets.figure), loadImage(card.miniProgramCodeUrl)
    ]);
    if (card.mode === 'live' && !miniCode) throw new Error('MINI_CODE_REQUIRED');

    const heroGradient = context.createLinearGradient(0, 0, WIDTH, HERO_HEIGHT);
    heroGradient.addColorStop(0, assets.heroStart || '#131A34');
    heroGradient.addColorStop(1, assets.heroEnd || '#553059');
    context.fillStyle = heroGradient;
    context.fillRect(0, 0, WIDTH, HERO_HEIGHT);
    if (background) drawCover(context, background, 0, 0, WIDTH, HERO_HEIGHT);
    const depthGradient = context.createLinearGradient(0, 0, 0, HERO_HEIGHT);
    depthGradient.addColorStop(0, 'rgba(5,8,20,.16)');
    depthGradient.addColorStop(.62, 'rgba(5,8,20,0)');
    depthGradient.addColorStop(1, 'rgba(5,8,20,.55)');
    context.fillStyle = depthGradient;
    context.fillRect(0, 0, WIDTH, HERO_HEIGHT);
    if (figure && assets.fullHero) drawContain(context, figure, 0, 0, WIDTH, HERO_HEIGHT);
    else if (figure) drawContain(context, figure, 90, 180, 900, HERO_HEIGHT - 180);
    else drawFallbackFigure(context, card, assets);

    context.textAlign = 'left';
    context.fillStyle = '#FFFFFF';
    context.font = '600 46px sans-serif';
    context.fillText('eggbabe', 72, 92);
    context.font = '400 24px sans-serif';
    context.fillStyle = 'rgba(255,255,255,.72)';
    context.fillText(card.cardType === 'collectible' ? 'COLLECTIBLE CARD' : 'BIRTH CARD', 74, 130);
    context.font = '600 28px sans-serif';
    const badgeText = isCollectible ? card.collectorLabel : card.collectAttr;
    const badgeWidth = isCollectible ? 150 : (card.collectAttr === '限定' ? 128 : 110);
    drawRoundedRect(context, WIDTH - badgeWidth - 70, 56, badgeWidth, 64, 32);
    context.fillStyle = card.collectAttr === '限定' ? '#F1D384' : 'rgba(255,255,255,.88)';
    context.fill();
    context.fillStyle = '#263229';
    context.textAlign = 'center';
    context.fillText(badgeText, WIDTH - badgeWidth / 2 - 70, 98);

    context.fillStyle = '#FFFDF7';
    context.fillRect(0, HERO_HEIGHT, WIDTH, HEIGHT - HERO_HEIGHT);
    context.textAlign = 'left';
    context.fillStyle = '#172018';
    context.font = '600 68px sans-serif';
    context.fillText(card.name, 72, HERO_HEIGHT + 105);
    if (!isCollectible) {
      context.font = '500 28px sans-serif';
      context.fillStyle = '#687069';
      context.fillText(`${card.prototypeLabel} · ${card.style} · ${card.gender}`, 74, HERO_HEIGHT + 154);
    }

    if (isCollectible) drawCollectibleStats(context, card);
    else {
      const statsY = HERO_HEIGHT + 230;
      drawStat(context, '生日', card.birthday, 74, statsY);
      drawStat(context, '星座', card.constellation, 390, statsY);
      drawStat(context, 'MBTI', card.mbti, 730, statsY);
    }

    if (!isCollectible) {
      context.strokeStyle = '#E6E5DE';
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(74, HERO_HEIGHT + 350);
      context.lineTo(WIDTH - 74, HERO_HEIGHT + 350);
      context.stroke();
      context.font = '500 27px sans-serif';
      context.fillStyle = '#4D5C50';
      context.fillText('唯一身份收藏卡', 74, HERO_HEIGHT + 410);
      context.font = '500 25px monospace';
      context.fillStyle = '#242B25';
      context.fillText(card.code, 74, HERO_HEIGHT + 482);
      context.font = '400 22px sans-serif';
      context.fillStyle = '#8C918D';
      context.fillText(card.mode === 'demo' ? '展会体验卡 · 不进入正式收藏' : '唯一身份收藏卡', 74, HERO_HEIGHT + 524);
    }
    if (miniCode) drawContain(context, miniCode, WIDTH - 206, HERO_HEIGHT + 370, 138, 138);
    else drawCodePlaceholder(context, WIDTH - 206, HERO_HEIGHT + 370, 138);

    return target.toDataURL('image/png', 1);
  }

  return { WIDTH, HEIGHT, HERO_HEIGHT, generatePoster };
}));
