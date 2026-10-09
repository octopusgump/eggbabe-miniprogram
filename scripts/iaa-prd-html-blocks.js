/** @param {Record<string,string>} U data URIs */
module.exports = function blocks(U) {
  const extraCss = `
.album-page{background:#FAFAF8;border:1px solid #E5E3DF;border-radius:12px;padding:14px;margin:14px 0}
.album-title{font-size:17px;font-weight:700;margin:0 0 10px;color:#1A1A1A}
.album-tabs{display:flex;gap:28px;font-size:15px;margin-bottom:8px}
.album-tab{color:#5C5C5C;padding:8px 0}.album-tab--on{color:#002900;text-decoration:underline;text-underline-offset:8px;font-weight:600}
.memory-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:10px}
.mcell{aspect-ratio:1;border:1px solid #E5E3DF;border-radius:10px;background:#FFF;overflow:hidden;position:relative;box-shadow:0 3px 10px rgba(0,0,0,.06)}
.mcell--sel{border:3px solid #9DB65B}.mcell--lock{box-shadow:0 4px 12px rgba(0,0,0,.08)}
.mcell img{width:100%;height:100%;object-fit:cover;display:block}
.mcell-polaroid{padding:10px 8px 16px;background:#FFF}.mcell-polaroid::before{content:'';position:absolute;top:4px;left:50%;transform:translateX(-50%);width:8px;height:8px;border-radius:50%;background:#C4BDB3;z-index:2}
.mcell-lock-dim{position:absolute;inset:0;background:rgba(36,40,38,.44);z-index:1}
.mcell-lock{position:absolute;inset:0;z-index:2;display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px}
.mcell-cap{text-align:center;font-size:11px;color:#8C8C88;margin-top:4px;font-weight:600}
.expand-panel{margin-top:14px;padding:14px;background:#FFFDF8;border-top:1px solid #E5E3DF;border-radius:0 0 10px 10px}
.expand-panel .btn-dark{display:block;margin-top:12px;padding:12px;text-align:center;background:#002900;color:#fff;border-radius:999px;font-weight:600;font-size:14px}
.act-row{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border:1px solid #E5E3DF;border-radius:14px;background:#FFFDF8;margin-top:10px;font-size:15px;color:#35483C}
.act-row span:last-child{color:#5C5C5C;font-size:13px}
.modal-mock{margin:14px 0;padding:16px;background:rgba(29,34,30,.08);border-radius:14px}
.modal-card{background:#FFFDF8;border-radius:14px;padding:20px 16px 16px;position:relative;color:#35483C;font-size:14px}
.modal-card .x{position:absolute;top:4px;right:8px;font-size:24px;color:#666}
.tea-opt{display:flex;gap:10px;margin:12px 0}
.tea-opt span{flex:1;text-align:center;padding:10px;border:2px solid #E5E3DF;border-radius:12px;background:#FFFDF8}
.tea-opt span.on{border-color:#5C765B;background:#EDF2E6}
.appendix{font-size:13px}
.appendix li{margin-bottom:6px}
`;

  const albumMemoriesMock = `
<div class="album-page" id="album-memories">
  <p class="album-title">纪念册</p>
  <div class="album-tabs"><span class="album-tab album-tab--on">回忆</span><span class="album-tab">活动</span></div>
  <p class="note" style="margin-top:8px">三列方格 · 点格在下方内联展开（非全屏）</p>
  <div class="memory-grid">
    <div><div class="mcell mcell--sel mcell-polaroid"><img src="${U.polarOuting}" alt="待收下"/></div><p class="mcell-cap">待收下 · 排最前</p></div>
    <div><div class="mcell mcell-polaroid"><img src="${U.polarSolar}" alt=""/></div></div>
    <div><div class="mcell"><div style="padding:8px;background:#FFFDF8;height:100%"><img src="${U.polarAfternoon}" style="object-fit:contain;height:100%"/></div></div></div>
    <div><div class="mcell mcell--lock"><img src="${U.polarOuting}" style="filter:blur(8px) saturate(.7);transform:scale(1.1)"/><div class="mcell-lock-dim"></div><div class="mcell-lock">🔒</div></div><p class="mcell-cap">暗格 · 待解锁</p></div>
    <div><div class="mcell mcell-polaroid"><img src="${U.polarOuting}" alt=""/></div></div>
    <div><div class="mcell" style="background:#F3F0E8"></div></div>
  </div>
  <div class="expand-panel">
    <div class="polaroid" style="max-width:220px;margin:0 auto"><img src="${U.polarOuting}" width="200" alt="展开"/></div>
    <p style="text-align:center;font-size:13px;color:#727A73;margin:8px 0">9 月 1 日 · 来自 · 小纸条</p>
    <span class="btn-dark">收下</span>
    <span class="btn-dark" style="background:#5C5C5C;margin-top:8px">关闭</span>
  </div>
  <p class="cap"><strong>Layout · 回忆页</strong> 空态：「还没有共同纪念…」· 加载/失败态见 PRD 验收</p>
</div>`;

  const albumActivitiesMock = `
<div class="album-page" id="album-activities">
  <p class="album-title">纪念册</p>
  <div class="album-tabs"><span class="album-tab">回忆</span><span class="album-tab album-tab--on">活动</span></div>
  <div class="act-row"><span>窗边茶会</span><span>首次免费</span></div>
  <div class="act-row"><span>兑换照片</span><span>10 星</span></div>
  <div class="act-row"><span>旅行</span><span>40 星</span></div>
  <p class="callout callout-undef"><span class="tag p">待实现/展示</span> 旅行仅详情展示，<strong>不可参加</strong>（PRD §7.4）</p>
  <div class="modal-mock"><div class="modal-card">
    <span class="x">×</span><strong>兑换照片</strong>
    <p style="color:#727A73;margin:10px 0">午后的光刚好，给你留一张我的照片。</p>
    <p>10 星</p>
    <p class="callout-undef" style="margin:8px 0;padding:8px"><span class="tag u">待定义</span> 兑换前<strong>不展示</strong>完整图/缩略图/模糊预览</p>
    <span class="btn-dark">确认兑换</span>
  </div></div>
  <div class="modal-mock"><div class="modal-card">
    <span class="x">×</span><strong>窗边茶会</strong>
    <p style="color:#727A73">需花费 20 星 · 或首次免费</p>
    <div class="tea-opt"><span class="on">清茶</span><span>花茶</span></div>
    <p style="color:#727A73;font-size:13px">「那就慢慢喝一杯清茶，看看窗外。」</p>
    <span class="btn-dark">确认 · 需花费 20 星</span>
    <p class="cap" style="margin-top:10px">第二层：结果图 +「一起在窗边喝了一杯茶。」+ 收下 → 回到回忆页</p>
  </div></div>
</div>`;

  const block2 = `
<div class="block-head" id="b2">阅读块 2 · §5 星星与有效陪伴日</div>
<section class="sub" id="b2-1"><h3>§5.1 基础阶梯</h3>
<p>按累计有效陪伴日；当天<strong>首次结算</strong>冻结基数。</p>
<table><tr><th>有效日</th><th>基础星</th><th>有效日</th><th>基础星</th></tr>
<tr><td>1–2</td><td>10</td><td>21–29</td><td>14</td></tr>
<tr><td>3–6</td><td>11</td><td>30–44</td><td>15</td></tr>
<tr><td>7–13</td><td>12</td><td>45–59</td><td>16</td></tr>
<tr><td>14–20</td><td>13</td><td>60–89</td><td>17</td></tr>
<tr><td colspan="2"></td><td>90+</td><td>18</td></tr></table>
<p>未记有效日前首次结算按「已有有效日 + 今天」算基数。不生息、不按余额计息。</p>
<p class="callout callout-undef"><span class="tag u">待定义</span> 随机 +3 等是否计入 36 封顶 — 见 §7.5.1 / 附录</p>
</section>
<section class="sub" id="b2-2"><h3>§5.2 结算点</h3>
<table><tr><th>动作</th><th>星星</th><th>有效日</th></tr>
<tr><td>读信、关信、点「明天呢？」</td><td>无</td><td>无</td></tr>
<tr><td>完成普通核心动作</td><td>基础×1（当日）</td><td>首次有效 +1</td></tr>
<tr><td>一起画 · 画布就绪</td><td>基础×1（与普通共用额度）</td><td>无</td></tr>
<tr><td>画好了 · 导出成功</td><td>额外=冻结基数</td><td>首次有效 +1</td></tr>
<tr><td>收下作品</td><td>无</td><td>无</td></tr>
<tr><td>茶会确认完成 · 有照片</td><td>无基础奖</td><td>与普通/画画共用每日一次 +1</td></tr></table>
<p>常规日最多 <strong>2 份基数 · 封顶 36</strong>。日界 Asia/Shanghai；花星不减累计日数。</p>
<p class="callout callout-slim"><span class="tag s">可精简</span> 「前 7 有效日 76 星 / 茶会+旅行 60」算术 — 见 canonical §5.2</p>
<div class="flex"><div class="col-pic"><div class="phone"><img class="room" src="${U.roomDay}"/><div class="award-mock" style="position:absolute;top:30px;left:50%;transform:translateX(-50%);text-align:center"><img src="${U.starNeutral}" width="64"/><div style="color:#c99200;font-weight:800">+11</div></div></div>
<p class="cap">图 5-1 信纸上方 +X（示意）</p></div></div>
</section>
<section class="sub" id="b2-3"><h3>§5.3 星星反馈</h3>
<ul><li>信纸上方真实 +X，~2s 大星挤压；不新开奖励窗</li><li>关信后左上余额轻量回应，不重播声震</li><li>信纸装饰光点 ≠ 实际收入</li><li>减弱动效 → 静态数值；静音不影响结算</li></ul>
<p class="callout callout-undef"><span class="tag u">待定义</span> 模型不得口头承诺规则外奖励 — 审核/CTO</p>
</section>`;

  const block3 = `
<div class="block-head" id="b3">阅读块 3 · §4 房间与信件</div>
<section class="sub" id="b3-1"><h3>§4.1 房间入口</h3>
<ul><li>左上：星星 + 一起 X 天 + 时钟（破壳后无独立心情入口）</li><li>左下：圆形信封；未读红点，<strong>打开即消</strong></li><li>右下：设置；上百宝箱 → 首项纪念册</li><li>首次可收藏：轻量引导百宝箱，无多步教学</li></ul>
</section>
<section class="sub" id="b3-2"><h3>§4.2 到信提示</h3>
<p>每日首次：左下按钮内纸飞机→信封 ~1s；不自动开信。音效 ~0.28s，遵循静音。</p>
<p class="callout callout-undef"><span class="tag u">待定义</span> 真机到信动效+音效 — COO 手机验收待完成</p>
</section>
<section class="sub" id="b3-3"><h3>§4.3 信纸</h3>
<p>居中浮层；展示今日内容、动作、回应、「明天呢？」。<strong>废止</strong>陪伴/聊天分栏、「进入聊天」按钮。</p>
<blockquote style="margin:10px 0;padding:10px;background:#f0ebe3;border-radius:8px;font-size:14px">
外出示例：「我去看看风把叶子吹到了哪里…」· 操作：替它收好纸条 · 回应：你把纸条压在杯子旁边…
</blockquote>
<p class="callout callout-undef"><span class="tag u">待定义</span> 每日信件正文池（当前 mock）</p>
</section>
<section class="sub" id="b3-4"><h3>§4.4 明天呢？与聊天</h3>
<table><tr><th>场景</th><th>行为</th></tr>
<tr><td>点「明天呢？」</td><td>不发星、不加日；完成后不自动展开</td></tr>
<tr><td>在家</td><td>线索 + 角色探出 ~1s（静态）→ 点进聊天</td></tr>
<tr><td>外出</td><td>仅线索；无角色；不能聊</td></tr>
<tr><td>在家但有聊天限制</td><td>角色可见；点击说明限制</td></tr>
<tr><td>重进 / 从聊天返回</td><td>保留展开；次日重置</td></tr></table>
<div class="flex"><div class="col-pic"><div class="phone"><img class="room" src="${U.roomDay}"/><img src="${U.stare}" style="position:absolute;right:6px;bottom:48px;width:86px"/></div></div></div>
</section>`;

  const block4 = `
<div class="block-head" id="b4">阅读块 4 · §6 一起画 · §7 纪念册与活动</div>
<section class="sub" id="b4-1"><h3>§6 一起画（破壳后）</h3>
<p><strong>路径</strong>：信邀 → 一起画 → 画布就绪（发未领基础奖）→ 创作 → 画好了导出 → 额外奖+有效日 → 信纸见作品 → 可选收下。</p>
<ul><li>至少一笔真实非橡皮笔迹；空白/仅贴纸/仅擦除不算</li><li>不评分、不限时；不假装看懂未解释的画面</li><li>中途退出：保留开始奖与运行内草稿；不发完成奖</li><li>导出失败可重试；跨日恢复旧稿不自动发今日基础奖</li><li>破壳前蛋壳流程不变；陪伴作品<strong>不</strong>写入蛋壳</li></ul>
<p class="callout callout-undef"><span class="tag u">待定义</span> 关小程序后草稿/作品持久化 — CTO</p>
</section>
<section class="sub" id="b4-2"><h3>§7.1 纪念册结构 + Layout</h3>
<p>顶栏仅两词：<strong>回忆</strong>｜<strong>活动</strong>。刚完成内容可直接收下，不得再花星买一遍。</p>
${albumMemoriesMock}
${albumActivitiesMock}
</section>
<section class="sub" id="b4-3"><h3>§7.2 星星两种用途 · 兑换照片</h3>
<p>A 兑换指定纪念内容（首版仅照片）· B 共同活动（茶会已交付前端）</p>
<ul><li>入口：百宝箱 → 纪念册 → 活动 → 兑换照片</li><li>主题：宠物的窗边午后 · 10 星 · 兑换前仅配文+价格</li><li>准备成功才扣星；已拥有不重复扣；余额不足「星星还不够」</li></ul>
<p><span class="tag p">待实现</span> 样张与揭晓交互验收未完成</p>
</section>
<section class="sub" id="b4-4"><h3>§7.3 窗边茶会</h3>
<ol><li>首次免费；选茶后须再点确认才结算</li><li>完成才扣 20 星；开始/中途退出不扣</li><li>外出不能新开始；已有进度可继续</li><li>计有效日、不发基础星；与普通/画画共用每日一次</li></ol>
<p><span class="tag d">已交付前端</span> 运行内 mock · 非手机视觉终验收</p>
</section>
<section class="sub" id="b4-5"><h3>§7.4 后续方向（摘要）</h3>
<ul><li>轻答题 · 旅行 40 星 · 随机惊喜 · 带码分享 — <span class="tag u">待定义</span> 见决策清单</li></ul>
</section>`;

  const blockP2 = `
<div class="block-head" id="p2">附录 · P2 长规则 / 关系 / 实现 / 验收（摘要）</div>
<section class="sub appendix" id="p2-1"><h3>§7.5 随机惊喜（不进正文细则，仅索引）</h3>
<table><tr><th>主题</th><th>状态</th><th>去哪里</th></tr>
<tr><td>画画小回礼 +3、首次必送、33%</td><td><span class="tag u">部分 mock</span></td><td>主 PRD §7.5.1</td></tr>
<tr><td>纸条照片、节气 24 张、去重/待收下</td><td><span class="tag u">待定义/分批素材</span></td><td>§7.5.2 · 24节气任务书</td></tr>
<tr><td>茶会/纸条随机回礼</td><td><span class="tag u">待定义</span></td><td>主 PRD §7.5 队列</td></tr></table>
</section>
<section class="sub appendix" id="p2-2"><h3>§8 关系与输入原则</h3>
<ul><li>每次一个核心动作；不要求每天说话</li><li>「今天不想画」≠「不喜欢画」</li><li>长期喜好须用户明确；无喜好列表设置页</li><li>真实记忆 → CTO · <span class="tag u">待定义</span></li></ul>
<p class="callout callout-slim"><span class="tag s">可精简</span> 对外 PRD 可半页原则</p>
</section>
<section class="sub appendix" id="p2-3"><h3>§9 数据与实现（摘要）</h3>
<p>当前<strong>本地模拟</strong>；不承诺重启/跨设备持久化（除到信等 UI 状态）。</p>
<table><tr><th>字段</th><th>含义</th></tr>
<tr><td>balance / companionDays</td><td>星星余额 / 累计有效日</td></tr>
<tr><td>dailyBasis</td><td>当日冻结基数</td></tr>
<tr><td>effectiveDone</td><td>当天是否已记有效陪伴</td></tr>
<tr><td>collectedMemories</td><td>已收藏照片/作品</td></tr></table>
<p class="callout callout-slim"><span class="tag s">可精简</span> 完整字段见技术交接 · 非产品正文</p>
</section>
<section class="sub appendix" id="p2-4"><h3>§10 验收清单（29 条 · 标题级）</h3>
<ol class="appendix"><li>入口与信件 8 条（HUD、到信、信纸、明天呢？）</li><li>奖励与画画 12 条（阶梯边界、画画额度、跨日）</li><li>茶会与纪念册 7 条</li><li>交付限制：不把 mock 当真实账户；旅行单独验收</li></ol>
<p>全文：<code>docs/验收审核/02_IAA陪伴_信件画画茶会验收清单.md</code></p>
</section>
<section class="sub appendix" id="p2-5"><h3>§11–12 · 来源与废止</h3>
<p>废止：自动开信、双分栏、跨房间飞机信、GIF 角色、进茶会即扣费、旧小数收益等。</p>
<p>Canonical：<strong>02_蛋宝宝_IAA陪伴_PRD_v1.0.md</strong> · 本地模拟 ≠ 已发布小程序</p>
</section>`;

  return { extraCss, block2, block3, block4, blockP2 };
};
