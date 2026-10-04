function savePolaroid(page, photo) {
  return new Promise((resolve, reject) => {
    wx.createSelectorQuery().in(page).select('#polaroid-canvas').fields({ node: true }).exec(results => {
      const canvas = results && results[0] && results[0].node;
      if (!canvas) return reject(new Error('CANVAS_NOT_READY'));
      canvas.width = 1024; canvas.height = 1200;
      const ctx = canvas.getContext('2d');
      const image = canvas.createImage();
      image.onerror = reject;
      image.onload = () => {
        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, 1024, 1200);
        const side = Math.min(image.width, image.height);
        ctx.drawImage(image, (image.width-side)/2, (image.height-side)/2, side, side, 40, 40, 944, 944);
        ctx.fillStyle = '#35483C'; ctx.font = '26px sans-serif';
        ctx.fillText(photo.line || '', 40, 1050, 944);
        ctx.fillStyle = '#8A9089'; ctx.font = '22px sans-serif'; ctx.fillText(photo.date || '', 40, 1110);
        wx.canvasToTempFilePath({ canvas, fileType: 'png', success: result => wx.saveImageToPhotosAlbum({ filePath: result.tempFilePath, success: resolve, fail: reject }), fail: reject }, page);
      };
      image.src = photo.image;
    });
  });
}
module.exports = { savePolaroid };
