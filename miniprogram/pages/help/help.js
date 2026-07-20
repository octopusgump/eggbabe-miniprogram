const config = require('../../config/v2');

Page({
  data: {
    cats: { device: true, account: true, chat: true, other: true },
    searchQuery: '',
    searchResults: [],

    deviceFaqs: [
      {
        q: '如何激活我的蛋宝宝？',
        a: `打开小程序后点击「添加蛋宝宝」。当前本地版本输入 ${config.localActivationCode} 体验完整孵化，输入 ${config.localHatchedActivationCode} 直接查看已孵化状态；正式上线后使用购买、活动或好友提供的激活码。`,
        open: false
      },
      {
        q: '孵化进度会让实体装置提前打开吗？',
        a: '不会。实体装置按激活码预设的破壳时间打开；孵化进度只会丰富我的互动反馈、性格倾向和收藏卡内容。',
        open: false
      },
      {
        q: '为什么不能添加第二只蛋宝宝？',
        a: '当前 MVP 是单蛋版本，每个账号最多绑定 1 只。已绑定账号再次输入激活码时不会消耗新激活码。',
        open: false
      },
      {
        q: '装置没有按时打开怎么办？',
        a: '请先保留装置与激活码信息，再点击本页底部「联系客服」联系企业微信客服。客服核实后会处理提前打开、未打开、机械故障或激活码与原型不符等问题，并在需要时协助补发收藏卡。',
        open: false
      }
    ],

    accountFaqs: [
      {
        q: '如何修改昵称 / 头像？',
        a: '进入「我的」→「个人信息」。点击头像区域可更换头像（微信会弹出头像选择面板，第一项即你的微信头像）；点击昵称旁的文字即可修改昵称，最多 16 个字。',
        open: true
      },
      {
        q: '如何注销账号？',
        a: '进入「我的」→「账号」→「注销账号」，按提示阅读风险告知并确认。提交后进入 15 天冷静期，期间重新登录可随时撤销。',
        open: false
      },
      {
        q: '注销后还能重新激活蛋宝宝吗？',
        a: '冷静期结束并完成注销后，原账号资料、蛋宝宝、收藏卡和对话记录会按协议处理。正式发布前需以后端和法务确认的注销规则为准。',
        open: false
      }
    ],

    chatFaqs: [
      {
        q: '为什么现在不能和蛋宝宝对话？',
        a: '文字对话会在我破壳后开放。孵化期可以轻触或长按蛋壳，从首页自由陪伴入口选择想做的事，也可以直接跟我说说话。',
        open: false
      },
      {
        q: '对话记录会保存多久？',
        a: '对话记录会长期保留，作为蛋宝宝记忆与成长的一部分，除非你主动注销账号（注销后将被永久删除）。',
        open: false
      },
      {
        q: '什么是破壳？',
        a: '破壳是我结束孵化、正式苏醒的时刻——从这一刻起，我会开口说话，和你开始真正的陪伴与对话。',
        open: false
      }
    ],

    otherFaqs: [
      {
        q: '如何联系客服？',
        a: '点击本页底部「联系客服」，会跳转至企业微信客服，工作日 9:00–21:00 有专人回复。',
        open: false
      },
      {
        q: '隐私数据如何处理？',
        a: '你的数据仅用于提供蛋宝宝服务，具体收集与使用范围见「我的」→「隐私协议」。你可随时在账号页申请注销以删除全部数据。',
        open: false
      }
    ]
  },

  onToggleCat(e) {
    const cat = e.currentTarget.dataset.cat;
    this.setData({ [`cats.${cat}`]: !this.data.cats[cat] });
  },

  onToggleFaq(e) {
    const { group, index } = e.currentTarget.dataset;
    this.setData({ [`${group}[${index}].open`]: !this.data[group][index].open });
  },

  onSearchInput(event) {
    const searchQuery = String(event.detail.value || '').trim();
    if (!searchQuery) {
      this.setData({ searchQuery: '', searchResults: [] });
      return;
    }
    const groups = ['deviceFaqs', 'accountFaqs', 'chatFaqs', 'otherFaqs'];
    const searchResults = groups
      .flatMap(group => this.data[group] || [])
      .filter(item => `${item.q} ${item.a}`.includes(searchQuery));
    this.setData({ searchQuery, searchResults });
  },

  onContactCS() {
    const customerService = config.customerService || {};
    if (!customerService.corpId || !customerService.url) {
      wx.showToast({ title: '客服参数待运营配置', icon: 'none' });
      return;
    }
    wx.openCustomerServiceChat({
      extInfo: { url: customerService.url },
      corpId: customerService.corpId,
      fail: () => {
        wx.showToast({ title: '暂时无法打开客服，请稍后再试', icon: 'none' });
      }
    });
  }
});
