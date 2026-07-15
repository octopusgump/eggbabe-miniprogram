(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.EggbabePosterRenderer = api;
}(typeof self !== 'undefined' ? self : this, function () {
  const WIDTH = 1080;
  const CARD_HEIGHT = 1920;
  const HEIGHT = 2160;
  const CARD_INSET = 54;
  const SECTION_GAP = 24;
  const TITLE_HEIGHT = Math.round(CARD_HEIGHT * 0.15);
  const ILLUSTRATION_HEIGHT = Math.round((WIDTH - CARD_INSET * 2) * 5 / 4);
  const DATA_HEIGHT = CARD_HEIGHT - CARD_INSET * 2 - TITLE_HEIGHT - ILLUSTRATION_HEIGHT - SECTION_GAP * 2;
  const CJK_FONT = '"PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif';
  const LATIN_FONT = '"Google Sans", "Helvetica Neue", Arial, sans-serif';
  const NAME_FONT = '"ZCOOL KuaiLe", "PingFang SC", "Noto Sans SC", sans-serif';

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

  function drawTitle(context, card, avatar) {
    context.fillStyle = '#FFFCF4';
    context.fillRect(CARD_INSET, CARD_INSET, WIDTH - CARD_INSET * 2, TITLE_HEIGHT);
    context.fillStyle = '#3C2D24';
    const avatarX = CARD_INSET + 16;
    const avatarY = CARD_INSET + 54;
    roundedRect(context, avatarX, avatarY, 116, 136, 56);
    context.save();
    context.clip();
    context.fillStyle = '#F4F7EC';
    context.fillRect(avatarX, avatarY, 116, 136);
    if (avatar) drawCover(context, avatar, avatarX, avatarY, 116, 136);
    context.restore();
    context.font = `400 74px ${NAME_FONT}`;
    context.textAlign = 'center';
    context.fillText(card.name, WIDTH / 2, CARD_INSET + 112, 560);
    context.fillStyle = '#788078';
    context.font = `400 26px ${CJK_FONT}`;
    context.fillText(card.prototypeLabel, WIDTH / 2, CARD_INSET + 156);
    if (card.cardType === 'collectible') {
      context.font = `400 21px ${CJK_FONT}`;
      context.fillText(`${card.setName} · ${card.cardTitle}`, WIDTH / 2, CARD_INSET + 196, 580);
    }
    if (card.cardType === 'collectible') {
      const badgeWidth = 160;
      const badgeHeight = 60;
      const badgeX = WIDTH - CARD_INSET - badgeWidth;
      const badgeY = CARD_INSET + (TITLE_HEIGHT - badgeHeight) / 2;
      roundedRect(context, badgeX, badgeY, badgeWidth, badgeHeight, badgeHeight / 2);
      context.fillStyle = '#F1F1EA';
      context.fill();
      context.fillStyle = '#526054';
      context.font = `600 28px ${LATIN_FONT}`;
      context.fillText(card.collectorLabel, badgeX + badgeWidth / 2, badgeY + 39);
    }
  }

  function drawIllustration(context, card, assets, background, figure) {
    const x = CARD_INSET;
    const y = CARD_INSET + TITLE_HEIGHT + SECTION_GAP;
    const width = WIDTH - CARD_INSET * 2;
    const height = ILLUSTRATION_HEIGHT;
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
    if (figure) drawCover(context, figure, x, y, width, height);
    else {
      context.fillStyle = 'rgba(63,90,71,.3)';
      context.font = '400 330px serif';
      context.textAlign = 'center';
      context.fillText(assets.fallbackMark || (card.prototype === 'KOI' ? '鲤' : '兔'), WIDTH / 2, y + height * .68);
    }
    context.restore();
  }

  function drawCardData(context, card) {
    const x = CARD_INSET;
    const y = CARD_INSET + TITLE_HEIGHT + SECTION_GAP + ILLUSTRATION_HEIGHT + SECTION_GAP;
    const width = WIDTH - CARD_INSET * 2;
    const height = DATA_HEIGHT;
    const gap = 16;
    const cellWidth = (width - gap) / 2;
    const rowHeight = 66;
    const cells = [
      ['生日', card.birthdayLabel], ['星座', card.constellationLabel],
      ['性别', card.genderSymbol], ['血型', `${card.bloodType} 型`]
    ];
    cells.forEach((cell, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const left = x + column * (cellWidth + gap);
      const top = y + row * (rowHeight + 12);
      roundedRect(context, left, top, cellWidth, rowHeight, 20);
      context.fillStyle = '#F6F6F0';
      context.fill();
      context.fillStyle = '#7A807A';
      context.font = `400 24px ${CJK_FONT}`;
      context.textAlign = 'left';
      context.fillText(cell[0], left + 22, top + 42);
      context.fillStyle = '#2D251F';
      context.font = `600 27px ${CJK_FONT}`;
      context.textAlign = 'right';
      context.fillText(cell[1], left + cellWidth - 22, top + 42, cellWidth - 112);
    });
    const mbtiY = y + (rowHeight + 12) * 2;
    roundedRect(context, x + width * .24, mbtiY, width * .52, 60, 20);
    context.fillStyle = '#F6F6F0';
    context.fill();
    context.fillStyle = '#7A807A';
    context.font = `400 24px ${LATIN_FONT}`;
    context.textAlign = 'left';
    context.fillText('MBTI', x + width * .24 + 24, mbtiY + 39);
    context.fillStyle = '#2D251F';
    context.font = `600 29px ${LATIN_FONT}`;
    context.textAlign = 'right';
    context.fillText(card.mbti, x + width * .76 - 24, mbtiY + 39);
    context.fillStyle = '#536057';
    context.font = `400 28px ${NAME_FONT}`;
    context.textAlign = 'center';
    context.fillText(`“${card.signature}”`, WIDTH / 2, Math.min(y + height - 16, mbtiY + 112), width - 80);
  }

  async function generatePoster(card, assets, canvas) {
    if (!card.miniProgramCodeUrl) throw new Error('MINI_CODE_REQUIRED');
    if (!card.shareCode) throw new Error('SHARE_CODE_REQUIRED');
    const target = canvas || document.createElement('canvas');
    target.width = WIDTH;
    target.height = HEIGHT;
    const context = target.getContext('2d');
    const [background, figure, avatar, miniCode] = await Promise.all([
      loadImage(assets.background), loadImage(assets.figure), loadImage(card.avatarUrl || assets.figure), loadImage(card.miniProgramCodeUrl)
    ]);
    if (!miniCode) throw new Error('MINI_CODE_REQUIRED');
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) await document.fonts.ready;

    context.fillStyle = '#FFFDF7';
    context.fillRect(0, 0, WIDTH, HEIGHT);
    drawTitle(context, card, avatar);
    drawIllustration(context, card, assets, background, figure);
    drawCardData(context, card);

    context.fillStyle = '#EEF1E9';
    context.fillRect(0, CARD_HEIGHT, WIDTH, HEIGHT - CARD_HEIGHT);
    context.fillStyle = '#3F5A47';
    context.font = `600 30px ${CJK_FONT}`;
    context.textAlign = 'left';
    context.fillText('eggbabe 收藏卡', 66, CARD_HEIGHT + 70);
    context.fillStyle = '#667168';
    context.font = `500 24px ${LATIN_FONT}`;
    context.fillText(card.code, 66, CARD_HEIGHT + 124, 700);
    context.fillStyle = '#3F5A47';
    context.font = `600 23px ${CJK_FONT}`;
    context.fillText(`分享码 ${card.shareCode}`, 66, CARD_HEIGHT + 164, 700);
    context.font = `400 21px ${CJK_FONT}`;
    context.fillStyle = '#667168';
    context.fillText(card.mode === 'demo' ? '展会体验 · 不进入正式收藏与统计' : '识别小程序码后输入分享码，遇见你的蛋宝宝', 66, CARD_HEIGHT + 206, 700);
    drawContain(context, miniCode, WIDTH - 210, CARD_HEIGHT + 28, 150, 150);
    return target.toDataURL('image/png', 1);
  }

  return { WIDTH, HEIGHT, CARD_HEIGHT, CARD_INSET, SECTION_GAP, TITLE_HEIGHT, ILLUSTRATION_HEIGHT, DATA_HEIGHT, drawCardData, generatePoster };
}));
