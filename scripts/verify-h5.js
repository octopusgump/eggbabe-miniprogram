const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const model = require('../h5/birth-card/card-model');
const bridge = require('../miniprogram/services/birth-card-h5');

const raw = {
  card_id: 'card-1',
  egg_id: 'egg-1',
  mode: 'live',
  prototype: 'YT',
  style: '月白桂花款',
  display_name: '我的蛋宝宝',
  hatched_at: '2026-07-24T02:00:00.000Z',
  identity_code: 'EGG-YT-20260724-000001',
  source_batch: 'BATCH-01',
  illustration_key: 'YT__moon_white',
  illustration_url: 'https://cdn.eggbabe.com/cards/yt-moon-white.webp',
  mini_program_code_url: 'https://cdn.eggbabe.com/codes/card-1.png'
};
const card = model.normalizeCard(raw);
assert.equal(card.displayName, '我的蛋宝宝');
assert.equal(card.hatchedAtLabel, '2026年7月24日');
assert.equal(card.identityCode, raw.identity_code);
assert.throws(() => model.normalizeCard(Object.assign({}, raw, { mode: 'demo' })), /INVALID_CARD/, '正式 H5 必须拒绝 demo 数据');
assert.throws(() => model.normalizeCard(Object.assign({}, raw, { identity_code: '' })), /INVALID_CARD/, '身份编号缺失时不得渲染假卡');
assert.throws(() => model.normalizeCard(Object.assign({}, raw, { illustration_url: '' })), /INVALID_CARD/, '固定插画缺失时不得渲染通用替代画面');

const pet = { id: 'egg-1', prototype: '玉兔', name: '', collectionCard: raw };
const bridged = bridge.toH5Card(pet);
assert.equal(bridged.mode, 'live');
assert.equal(bridged.display_name, '我的蛋宝宝');
const url = bridge.buildH5Url('https://eggbabe.com/card', bridged, 'https://api.eggbabe.com');
assert.equal(url, 'https://eggbabe.com/card?card_id=card-1&mode=live');
assert.equal(bridge.buildH5Url('http://eggbabe.com/card', bridged, 'https://api.eggbabe.com'), '');
assert.equal(bridge.buildH5Url('https://eggbabe.com/card', bridged, ''), '');

const html = read('h5/birth-card/index.html');
['displayName', 'prototypeLabel', 'style', 'hatchedAtLabel', 'identityCode', 'sourceBatch'].forEach(field => {
  assert.equal(html.includes(`data-field="${field}"`), true, `H5 缺少 ${field}`);
});
assert.equal(/MBTI|血型|性别|星座|稀有/.test(html), false, '收藏卡不得显示旧角色随机属性');

const app = read('h5/birth-card/app.js');
assert.equal(/card_data|preview|Math\.random/.test(app), false, 'H5 只能按 card_id 读取 live 已确定数据');
assert.equal(app.includes('window.EGGBABE_H5_CONFIG'), true, 'H5 必须读取部署时填写的运行配置');
assert.equal(app.includes("params.get('mode') !== 'live'"), true, 'H5 必须固定校验 live');
assert.equal(app.includes('result.mode !== \'live\''), true, 'H5 必须复核服务端环境');

const poster = read('h5/birth-card/poster-renderer.js');
assert.equal(poster.includes("if (!card.miniProgramCodeUrl) throw new Error('MINI_CODE_REQUIRED')"), true, '分享图必须包含真实小程序码');
assert.equal(poster.includes('SHARE_CODE_REQUIRED'), false, '收藏卡分享不再依赖带权益的分享码');
assert.equal(/Math\.random|new Date\(/.test(poster), false, '分享图不得生成业务结果');

const native = read('miniprogram/pages/collection-card/collection-card.wxml');
assert.equal(native.includes('cardView.identity_code'), true, '原生兜底必须显示身份编号');
assert.equal(native.includes('cardView.source_batch'), true, '原生兜底必须显示来源批次');
const nativeLogic = read('miniprogram/pages/collection-card/collection-card.js');
assert.equal(native.includes('src="{{illustrationSrc}}"') && nativeLogic.includes('illustrationSrc: cardView.illustration_url'), true, '原生兜底必须显示服务端固定插画，并支持独立加载状态');
assert.equal(nativeLogic.includes('loadPosterAsset'), true, '原生分享图必须加载服务端固定素材');
assert.equal(nativeLogic.includes('mini_program_code_url'), true, '原生分享图必须绘制服务端小程序码');
assert.equal(nativeLogic.includes('drawPetAvatar'), false, '固定插画失败时不得导出通用角色替代图');
assert.equal(/cardView\.mbti|cardView\.blood|cardView\.gender|sceneCard/.test(native), false, '原生兜底不得显示旧随机属性或系列卡');

console.log('收藏卡 H5 确定性渲染与原生兜底校验通过。');
