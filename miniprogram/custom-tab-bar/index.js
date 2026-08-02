Component({
  data: {
    selected: 0,
    hidden: false,
    items: [
      {
        pagePath: '/pages/home/home',
        text: '蛋宝宝',
        iconPath: '/assets/tab/egg.png',
        selectedIconPath: '/assets/tab/egg-active.png'
      },
      {
        pagePath: '/pages/my/my',
        text: '我的',
        iconPath: '/assets/ui/3d-actions/runtime/ui_3d_profile_egg_cameo_96_v03.png',
        selectedIconPath: '/assets/ui/3d-actions/runtime/ui_3d_profile_egg_cameo_96_v03.png'
      }
    ]
  },

  methods: {
    onSwitch(event) {
      const index = Number(event.currentTarget.dataset.index);
      const item = this.data.items[index];
      if (!item || index === this.data.selected) return;
      wx.switchTab({ url: item.pagePath });
    }
  }
});
