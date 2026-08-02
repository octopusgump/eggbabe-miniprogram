const assert = require('assert');

const weatherCanvas = require('../../utils/window-weather-canvas');

const gradient = { addColorStop() {} };
const context = new Proxy({}, {
  get(target, key) {
    if (!(key in target)) {
      target[key] = ['createLinearGradient', 'createRadialGradient'].includes(key)
        ? () => gradient
        : () => {};
    }
    return target[key];
  },
  set(target, key, value) {
    target[key] = value;
    return true;
  }
});

const size = { width: 375, height: 667 };
const particles = weatherCanvas.createParticles(size.width, size.height);
assert.equal(particles.length, 48, '首页与全屏窗外必须使用同一稳定粒子集');

['sunny', 'cloudy', 'rain', 'snow', 'fog', 'storm', 'afterRain', 'postSnow', 'wind'].forEach(weather => {
  assert.doesNotThrow(() => weatherCanvas.drawFrame(
    context,
    size,
    particles,
    { weather, season: 'autumn', period: 'day' },
    { timestamp: 4200, reducedMotion: true, clipGlass: false }
  ), `${weather} 弱动效代表帧必须可稳定绘制`);
});

assert.equal(weatherCanvas.needsAnimation({ weather: 'sunny', season: 'spring', period: 'night' }, false), false, '无动态元素的晴夜不应维持动画循环');
assert.equal(weatherCanvas.needsAnimation({ weather: 'storm', season: 'summer', period: 'night' }, false), true, '雷雨夜必须维持天气动画循环');

let iceLineCount = 0;
const iceContext = new Proxy({}, {
  get(target, key) {
    if (!(key in target)) {
      if (key === 'lineTo') target[key] = () => { iceLineCount += 1; };
      else if (['createLinearGradient', 'createRadialGradient'].includes(key)) target[key] = () => gradient;
      else target[key] = () => {};
    }
    return target[key];
  },
  set(target, key, value) { target[key] = value; return true; }
});
weatherCanvas.drawFrame(
  iceContext,
  size,
  particles,
  { weather: 'postSnow', season: 'winter', period: 'night' },
  { timestamp: 4200, reducedMotion: true, clipGlass: false }
);
assert.equal(iceLineCount > 0, true, '雪后夜间必须绘制稳定可见的冰晶微光，不得空跑动画循环');

console.log('日常窗外共享 Canvas 天气绘制校验通过。');
