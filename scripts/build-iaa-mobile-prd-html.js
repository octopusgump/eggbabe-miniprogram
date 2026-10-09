#!/usr/bin/env node
/**
 * Builds self-contained mobile IAA PRD HTML (embedded assets).
 * Run: node scripts/build-iaa-mobile-prd-html.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
/** Single canonical self-contained PRD preview (P0–P2, embedded images). Regenerate; do not hand-edit. */
const out = path.join(root, 'docs/主PRD/02_蛋宝宝_IAA陪伴_手机预览.html');
const blocks = require('./iaa-prd-html-blocks');

const assets = {
  starNeutral: 'miniprogram/assets/scenes/lifecycle/post-hatch/40-interaction-fx/companion-star/companion-star-neutral.png',
  starSqueeze: 'miniprogram/assets/scenes/lifecycle/post-hatch/40-interaction-fx/companion-star/companion-star-squeezed.png',
  envelope: 'miniprogram/assets/ui/3d-scene-actions/runtime/ui_3d_scene_message_envelope_96_v01.webp',
  toolbox: 'miniprogram/assets/ui/3d-scene-actions/runtime/ui_3d_scene_toolbox_closed_chest_96_v01.webp',
  stare: 'miniprogram/assets/scenes/lifecycle/post-hatch/30-character/jade-rabbit/stare.webp',
  polarOuting: 'miniprogram/assets/scenes/lifecycle/post-hatch/50-overlays/companion-photos/jade-rabbit_outing_v01.webp',
  polarAfternoon: 'miniprogram/assets/scenes/lifecycle/post-hatch/50-overlays/companion-photos/jade-rabbit_afternoon_v01.webp',
  polarSolar: 'miniprogram/assets/scenes/lifecycle/post-hatch/50-overlays/companion-photos/eggbabe_solar_term_bailu_shared_v01.webp',
  roomDay: 'miniprogram/assets/scenes/lifecycle/post-hatch/10-background/panorama-three-screen/scene-sets/spring_clear_day_post_hatch_panorama_v01.webp',
  eggPre: 'docs/设计素材/视觉验收/egg-rotation-sample-warm-day/runtime-sample/warm-day/preview_front.png',
};

function dataUri(rel) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) throw new Error('Missing asset: ' + rel);
  const buf = fs.readFileSync(p);
  const ext = path.extname(p).slice(1).toLowerCase();
  return `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${buf.toString('base64')}`;
}

const U = Object.fromEntries(Object.entries(assets).map(([k, v]) => [k, dataUri(v)]));

const css = `
body{font-family:-apple-system,"PingFang SC",sans-serif;margin:0;background:#f4f1ea;color:#2a332e;line-height:1.65;font-size:15px}
header{background:linear-gradient(135deg,#2f4f3f,#4a7c59);color:#fff;padding:16px 16px 14px}
header h1{margin:0;font-size:18px}header p{margin:6px 0 0;font-size:13px;opacity:.92}
nav{position:sticky;top:0;z-index:5;background:#f4f1eaee;backdrop-filter:blur(6px);padding:8px 12px;display:flex;gap:8px;overflow-x:auto;font-size:12px;border-bottom:1px solid #ddd5c8;flex-wrap:wrap}
nav a{color:#2a332e;text-decoration:none;font-weight:600;white-space:nowrap;padding:4px 8px;background:#fff;border-radius:999px;border:1px solid #e0d8cc}
.block-head{background:#3d6b52;color:#fff;padding:10px 16px;font-size:16px;font-weight:700;margin:0}
.sub{padding:14px 16px;border-bottom:1px solid #e8e0d4;background:#fffdf8}
.sub h3{margin:0 0 10px;font-size:16px;color:#3d6b52}
.sub h4{margin:14px 0 6px;font-size:14px;color:#2a332e}
.flex{display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start}
.flex .col-text{flex:1;min-width:280px}
.flex .col-pic{flex:0 1 300px}
.tag{display:inline-block;font-size:11px;font-weight:700;padding:2px 6px;border-radius:4px;margin:2px 4px 2px 0}
.s{background:#e8f4ec;color:#2d5a3d}.u{background:#fff4e6;color:#8a4b00}.d{background:#eef6ff;color:#1e4a8a}.p{background:#fceef0;color:#8b2e3c}
table{width:100%;border-collapse:collapse;font-size:13px;margin:8px 0}th,td{border:1px solid #ddd5c8;padding:8px;vertical-align:top}th{background:#ebe4d8;text-align:left}
.phone{border-radius:18px;border:3px solid #222;overflow:hidden;max-width:280px;margin:0 auto;background:#111;position:relative;box-shadow:0 8px 24px rgba(0,0,0,.12)}
.phone img{display:block;width:100%}
.room{height:200px;object-fit:cover}
.hud{position:absolute;top:10px;left:10px;background:rgba(255,253,248,.95);padding:6px 10px;border-radius:8px;font-size:12px;font-weight:700;display:flex;align-items:center;gap:4px;box-shadow:0 2px 8px rgba(0,0,0,.12)}
.hud img{width:22px;height:22px}
.cap{font-size:12px;color:#5c6b62;margin-top:8px;text-align:center;line-height:1.4}
.cap strong{color:#2a332e}
.flow{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0;font-size:12px;font-weight:600}
.flow span{background:#eef5ef;border:1px solid #b8d4be;padding:6px 8px;border-radius:8px}
.flow .arr{color:#3d6b52;align-self:center;padding:0 2px}
ol.steps{margin:8px 0;padding-left:1.2rem}ol.steps li{margin-bottom:8px}
.note{font-size:13px;color:#5c6b62;background:#f0ebe3;padding:10px 12px;border-radius:8px;margin-top:10px}
.callout{font-size:13px;padding:10px 12px;border-radius:8px;margin-top:10px;border-left:3px solid}
.callout-slim{background:#e8f4ec;border-color:#7cb892}.callout-undef{background:#fff4e6;border-color:#e6a23c}
.polaroid{background:#fff;padding:8px 8px 18px;box-shadow:0 2px 8px rgba(0,0,0,.1);max-width:150px}
.row2{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
.compare .phone{max-width:200px}.compare .room,.compare img.room{height:160px}
footer{padding:16px;font-size:12px;color:#5c6b62;text-align:center}
`;

const block1 = `
<div class="block-head" id="b1">阅读块 1 · §1 产品概述 → §2 项目边界 → §3 主流程</div>

<section class="sub" id="b1-1">
  <h3>§1 产品概述</h3>
  <div class="flex">
    <div class="col-text">
      <p>让用户与宠物完成一件小事，得到明确反馈，留下回忆，并期待下一次相处。</p>
      <p><strong>核心闭环</strong></p>
      <div class="flow">
        <span>今日陪伴</span><span class="arr">→</span><span>获得星星</span><span class="arr">→</span><span>明日期待</span><span class="arr">→</span><span>纪念册</span><span class="arr">→</span><span>下一次活动</span>
      </div>
      <p>体验保持简单：不做复杂养成面板、排名、人民币充值或星星抽奖。</p>
      <h4>五个概念</h4>
      <table>
        <tr><th>概念</th><th>用户看到</th><th>含义</th></tr>
        <tr><td>星星</td><td>可用余额</td><td>陪伴获得；可兑换纪念内容或参加活动；不涉及人民币</td></tr>
        <tr><td>一起 X 天</td><td>累计有效陪伴日数</td><td>同一天最多 +1；间断不清零；消费星星不减少天数</td></tr>
        <tr><td>回忆</td><td>照片、真实作品</td><td>已留下的共同经历</td></tr>
        <tr><td>活动</td><td>可参与的小事</td><td>用户实际选择或创作，得到对应结果</td></tr>
        <tr><td>明天呢？</td><td>下一次相处的线索</td><td>不是领奖励，也不是「进入聊天」文字按钮</td></tr>
      </table>
      <p><strong>单个事件闭环</strong>（COO 2026-10-04）：事情发生 → 用户参与 → 宠物回应 → 获得结果 → （可选）后续延续。</p>
      <p>事件四类：<strong>日常陪伴、共同创作、外出牵挂、特别活动</strong>。随机惊喜是事件内额外反馈，不另建复杂分类。</p>
      <p class="callout callout-slim"><span class="tag s">可精简</span> COO 日期脚注可删；四类事件名保留。</p>
      <p class="callout callout-undef"><span class="tag u">待定义</span> 「后续延续」跨日内容与作品挂房间 — 目标已写，链路未完工。</p>
    </div>
    <div class="col-pic">
      <div class="phone">
        <img class="room" src="${U.roomDay}" alt="破壳后生活空间"/>
        <div class="hud"><img src="${U.starNeutral}" alt=""/>24 · 一起 3 天</div>
        <img src="${U.envelope}" alt="信" style="position:absolute;left:12px;bottom:12px;width:44px;height:44px"/>
      </div>
      <p class="cap"><strong>图 1-1</strong> 闭环发生处：破壳后房间 · 左上星星与天数 · 左下信件（示意数据）</p>
    </div>
  </div>
</section>

<section class="sub" id="b1-2">
  <h3>§2.1 生命周期 · 只在破壳后生效</h3>
  <div class="flex">
    <div class="col-text">
      <table>
        <tr><th>阶段</th><th>IAA 闭环</th><th>说明</th></tr>
        <tr><td><strong>破壳前</strong>（孵化小房间）</td><td><strong>不参与</strong></td><td>左上不展示陪伴星星；「画画」= 画蛋壳，不走信件发星</td></tr>
        <tr><td><strong>破壳后</strong>（生活空间）</td><td><strong>完整闭环</strong></td><td>星星 + 一起 X 天；左下信件；百宝箱→纪念册；「一起画」</td></tr>
      </table>
      <p class="note"><code>companion_started_at</code> 用于<strong>环境计算</strong>（破壳前季节等），<strong>不等于</strong>「累计有效陪伴日数」（须完成当日核心动作才 +1）。</p>
      <p class="callout callout-undef"><span class="tag u">待定义</span> 若未来「破壳前预攒星」需单独立项；当前 PRD 与代码均为破壳后。</p>
    </div>
    <div class="col-pic compare">
      <div class="row2">
        <div>
          <div class="phone"><img class="room" src="${U.eggPre}" alt="破壳前" style="height:160px;object-fit:cover"/></div>
          <p class="cap"><strong>图 2-1a</strong> 破壳前 · 无 IAA 余额</p>
        </div>
        <div>
          <div class="phone"><img class="room" src="${U.roomDay}" alt="破壳后" style="height:160px;object-fit:cover"/></div>
          <p class="cap"><strong>图 2-1b</strong> 破壳后 · 完整闭环</p>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="sub" id="b1-3">
  <h3>§2.2 项目边界 · 交付与不做</h3>
  <div class="flex">
    <div class="col-text">
      <p><strong>确认的产品目标 ≠ 已经交付的功能。</strong></p>
      <table>
        <tr><th>范围</th><th>状态</th><th>说明</th></tr>
        <tr><td>信件、明日角色、画画双份奖励、纪念册、窗边茶会</td><td><span class="tag d">前端已合并</span></td><td>本地模拟；按规则与验收清单核对</td></tr>
        <tr><td>星星阶梯与有效陪伴日数</td><td><span class="tag d">前端已合并</span></td><td>真实账户 / 服务端 → CTO</td></tr>
        <tr><td>兑换照片、随机惊喜、轻答题、旅行、带码分享</td><td><span class="tag u">方向已确认</span></td><td>未完整交付；见决策清单</td></tr>
        <tr><td>共同经历 / 长期喜好</td><td><span class="tag u">产品目标</span></td><td>模型与记忆 → CTO；不得冒充已接入</td></tr>
        <tr><td>道具、更多活动</td><td>第二期</td><td>不在本轮</td></tr>
      </table>
      <p><strong>本轮不做</strong>：人民币充值、星星抽奖、排行榜、复杂成长面板、GIF 角色、「它记得的喜好」设置列表。</p>
      <p><strong>保留</strong>：完整聊天；<strong>外出时不能聊天</strong>（明日角色也不出现）。</p>
      <p class="callout callout-slim"><span class="tag s">可精简</span> COO/CTO/CEO/法务分工行可移 footnote。</p>
    </div>
    <div class="col-pic">
      <img src="${U.starNeutral}" width="100" style="display:block;margin:0 auto 8px"/>
      <img src="${U.starSqueeze}" width="100" style="display:block;margin:0 auto"/>
      <p class="cap"><strong>图 2-2</strong> 陪伴星星造型（破壳后 HUD 与收星反馈共用）</p>
    </div>
  </div>
</section>

<section class="sub" id="b1-4">
  <h3>§3 主流程（破壳后生活空间）</h3>
  <div class="flex">
    <div class="col-text">
      <ol class="steps">
        <li>进入房间：左上 <strong>星星余额 + 一起 X 天</strong>；左下信件；当天首次进入有轻量到信提示（<strong>不自动弹信</strong>）。</li>
        <li>点击信封读信：了解今日小事。</li>
        <li>完成核心动作：普通日一次选择；创作日「一起画」并导出；外出日回应纸条；特别活动按各自流程。</li>
        <li>在结算点展示 <strong>+X 星</strong> 与宠物回应；同类每日额度不重复发放。</li>
        <li>用户主动点 <strong>「明天呢？」</strong>：看线索；在家时宠物探出，点角色进完整聊天。</li>
        <li>有照片或作品时点 <strong>「收下」</strong> 进纪念册；收下不决定是否已发星。</li>
        <li>百宝箱 → 纪念册 → <strong>回忆 / 活动</strong> 切换。</li>
      </ol>
      <p class="callout callout-undef"><span class="tag u">待定义</span> 每日信件正文来源（当前 mock，非正式生成）。</p>
    </div>
    <div class="col-pic">
      <div class="phone">
        <img class="room" src="${U.roomDay}" alt=""/>
        <img src="${U.toolbox}" alt="百宝箱" style="position:absolute;right:12px;bottom:12px;width:44px;height:44px"/>
        <img src="${U.envelope}" alt="信" style="position:absolute;left:12px;bottom:12px;width:44px;height:44px"/>
      </div>
      <p class="cap"><strong>图 3-1</strong> 步骤 1 与 7：左下信 · 右下百宝箱（纪念册入口）</p>
      <div class="polaroid" style="margin:12px auto 0"><img src="${U.polarOuting}" width="140" alt="回忆"/></div>
      <p class="cap"><strong>图 3-2</strong> 步骤 6：收下后进入纪念册的回忆（拍立得示例）</p>
    </div>
  </div>
</section>

<section class="sub" id="b1-5">
  <h3>§3.2 内容扩充原则</h3>
  <div class="flex">
    <div class="col-text">
      <ul>
        <li>以<strong>内容变化</strong>为主，逐步增加新玩法（如画云、画树；再轻答题、旅行准备等）。</li>
        <li>用户选择至少改变<strong>当次回应</strong>；部分事件改变回忆或后续小事。</li>
        <li>随机惊喜附着在已确认的基础结果之上，不另建复杂分类。</li>
        <li>当前<strong>不授权</strong>远程模型、用户画像或真实记忆服务。</li>
      </ul>
      <p class="callout callout-slim"><span class="tag s">可精简</span> 本段可压成三条 bullet 放在 §3 末尾。</p>
      <p class="callout callout-undef"><span class="tag u">待定义</span> 内容由谁制作、如何供给、如何避免重复 — 仍待确认。</p>
    </div>
    <div class="col-pic">
      <img src="${U.stare}" width="120" style="display:block;margin:0 auto"/>
      <p class="cap"><strong>图 3-3</strong> 「明天呢？」在家时角色探出（静态 stare，非 GIF）</p>
    </div>
  </div>
</section>
`;

const { extraCss, block2, block3, block4, blockP2 } = blocks(U);

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>蛋宝宝 IAA 陪伴 PRD · 手机预览</title>
<style>${css}${extraCss}</style>
</head>
<body>
<header>
<h1>蛋宝宝 · IAA 陪伴 PRD</h1>
<p>阅读块 1–4 + 附录 P2 · 单文件内嵌图 · 手机 Safari / Chrome 打开</p>
</header>
<nav>
<a href="#b1">块1</a><a href="#b1-1">§1</a><a href="#b1-2">§2.1</a><a href="#b1-3">§2.2</a><a href="#b1-4">§3</a><a href="#b1-5">§3.2</a>
<a href="#b2">块2 §5</a><a href="#b3">块3 §4</a><a href="#b4">块4 §6–7</a><a href="#album-memories">纪念册</a><a href="#p2">附录</a>
</nav>
${block1}
${block2}
${block3}
${block4}
${blockP2}
<footer>生成：<code>node scripts/build-iaa-mobile-prd-html.js</code> · Canonical：02_蛋宝宝_IAA陪伴_PRD_v1.0.md · 本地模拟 ≠ 已发布</footer>
</body>
</html>`;

fs.writeFileSync(out, html);
const mb = (fs.statSync(out).size / 1024 / 1024).toFixed(2);
console.log('Wrote', out, mb, 'MB');
