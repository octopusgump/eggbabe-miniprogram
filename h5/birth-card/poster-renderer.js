(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.EggbabePosterRenderer = api;
}(typeof self !== 'undefined' ? self : this, function () {
  const WIDTH = 1080;
  const HEIGHT = 1920;

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

  async function generatePoster(card, canvas) {
    if (!card.miniProgramCodeUrl) throw new Error('MINI_CODE_REQUIRED');
    const target = canvas || document.createElement('canvas');
    target.width = WIDTH;
    target.height = HEIGHT;
    const context = target.getContext('2d');
    const [illustration, miniCode] = await Promise.all([
      loadImage(card.illustrationUrl),
      loadImage(card.miniProgramCodeUrl)
    ]);
    if (!illustration) throw new Error('ILLUSTRATION_REQUIRED');
    if (!miniCode) throw new Error('MINI_CODE_REQUIRED');
    context.fillStyle = '#FFFDF7';
    context.fillRect(0, 0, WIDTH, HEIGHT);
    context.fillStyle = '#3F5A47';
    context.textAlign = 'center';
    context.font = '500 34px "PingFang SC", sans-serif';
    context.fillText('eggbabe', WIDTH / 2, 70);
    context.fillStyle = '#28332B';
    context.font = '600 76px "PingFang SC", sans-serif';
    context.fillText(card.displayName, WIDTH / 2, 170, 880);
    context.fillStyle = '#EEF3E7';
    context.fillRect(70, 230, 940, 1120);
    drawContain(context, illustration, 70, 230, 940, 1120);
    const rows = [
      ['原型', `${card.prototypeLabel} · ${card.style}`],
      ['破壳日期', card.hatchedAtLabel],
      ['身份编号', card.identityCode],
      ['来源批次', card.sourceBatch || '—']
    ];
    context.textAlign = 'left';
    rows.forEach((row, index) => {
      const y = 1425 + index * 74;
      context.fillStyle = '#7A817A';
      context.font = '400 28px "PingFang SC", sans-serif';
      context.fillText(row[0], 90, y);
      context.textAlign = 'right';
      context.fillStyle = '#2D352F';
      context.font = '500 30px "PingFang SC", sans-serif';
      context.fillText(row[1], 820, y, 590);
      context.textAlign = 'left';
    });
    drawContain(context, miniCode, 850, 1540, 150, 150);
    context.fillStyle = '#768076';
    context.textAlign = 'center';
    context.font = '400 24px "PingFang SC", sans-serif';
    context.fillText('一枚实体蛋的一份身份与纪念档案', WIDTH / 2, 1840);
    return target.toDataURL('image/png', 1);
  }

  return { WIDTH, HEIGHT, generatePoster };
}));
