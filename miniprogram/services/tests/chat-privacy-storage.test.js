const assert = require('assert');

const originalWx = global.wx;
const originalPage = global.Page;
const storage = new Map();

global.wx = {
  getAccountInfoSync() { return { miniProgram: { envVersion: 'develop' } }; },
  getStorageSync(key) { return storage.get(key); },
  setStorageSync(key, value) { storage.set(key, value); },
  removeStorageSync(key) { storage.delete(key); }
};

const petStore = require('../../utils/pet-store');
assert.equal(petStore.normalizePrototype('KOI'), '锦鲤', '服务端 KOI 代码必须映射为锦鲤头像');
assert.equal(petStore.normalizePrototype('boon-koi'), '锦鲤', '服务端 boon-koi 名称必须映射为锦鲤头像');
assert.equal(petStore.normalizePrototype('YT'), '玉兔', '服务端 YT 代码必须映射为玉兔头像');
assert.equal(petStore.normalizePrototype('jade-rabbit'), '玉兔', '服务端 jade-rabbit 名称必须映射为玉兔头像');
assert.equal(petStore.normalizePrototype(''), '玉兔', '缺失原型时必须使用玉兔正式头像，不能显示空白蛋');
petStore.saveUser({ id: 'privacy-user', nickname: '测试用户' });
petStore.savePet({
  id: 'privacy-egg',
  ownerId: 'privacy-user',
  mode: 'demo',
  lifecycleStage: 'HATCHED',
  messages: [{ text: '不得落入本机的旧聊天正文' }]
});

const petStorageKey = Array.from(storage.keys()).find(key => key.includes('ordinary_pet'));
assert.equal(Boolean(petStorageKey), true, '测试必须找到本机实体蛋缓存');
assert.equal(Object.prototype.hasOwnProperty.call(storage.get(petStorageKey), 'messages'), false, 'savePet 必须丢弃任何聊天正文字段');

const legacyPet = Object.assign({}, storage.get(petStorageKey), {
  messages: [{ text: '历史版本遗留的聊天正文' }]
});
storage.set(petStorageKey, legacyPet);
const migratedPet = petStore.getPet();
assert.equal(Object.prototype.hasOwnProperty.call(migratedPet, 'messages'), false, '读取旧缓存时必须从返回对象移除聊天正文');
assert.equal(Object.prototype.hasOwnProperty.call(storage.get(petStorageKey), 'messages'), false, '读取旧缓存时必须立即回写清理聊天正文');

let chatPage;
global.Page = definition => { chatPage = definition; };
require('../../pages/chat/chat');
const postHatch = require('../post-hatch-companion');
const originalSendSceneMessage = postHatch.sendSceneMessage;
const crisisText = '这是一条只用于测试的危机表达正文';
postHatch.sendSceneMessage = (pet, snapshot, text, clientMessageId) => Promise.resolve({
  ok: true,
  mode: 'live',
  resultType: 'CRISIS_REPLY',
  requestId: clientMessageId,
  messageId: 'privacy-crisis-reply',
  userMessageId: 'privacy-crisis-user',
  clientMessageId,
  userCreatedAt: '2026-08-10T12:00:00+08:00',
  createdAt: '2026-08-10T12:00:01+08:00',
  text: '服务端审核后的安全文本。',
  safety: 'crisis',
  fallbackUsed: false
});

function flush() { return new Promise(resolve => setImmediate(resolve)); }

(async () => {
  try {
    const context = Object.assign({}, chatPage, {
      pageActive: true,
      data: Object.assign({}, chatPage.data, {
        pet: migratedPet,
        snapshot: { currentState: { key: 'reading' }, chatAccess: { status: 'available' } },
        chatAvailable: true,
        messages: [],
        draft: crisisText,
        canSend: true,
        busy: false
      }),
      setData(patch, callback) {
        Object.assign(this.data, patch);
        if (callback) callback();
      }
    });
    chatPage.onSend.call(context);
    await flush();
    assert.equal(context.data.messages.some(item => item.id === 'privacy-crisis-reply'), true, '危机安全文本必须仍可按服务端结果展示');
    const persisted = JSON.stringify(Array.from(storage.entries()));
    assert.equal(persisted.includes(crisisText), false, '危机正文不得进入任何本机持久化数据');
    assert.equal(persisted.includes('privacy-crisis-reply'), false, '已确认聊天消息 ID 和正文不得进入 pet 或 analytics 本机缓存');
    assert.equal(persisted.includes('"crisis"'), false, '危机标签不得进入持久化 analytics 队列');
    console.log('聊天正文、危机标签与旧缓存清理边界校验通过。');
  } finally {
    postHatch.sendSceneMessage = originalSendSceneMessage;
    global.wx = originalWx;
    global.Page = originalPage;
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
