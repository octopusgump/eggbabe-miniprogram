// 破壳后所有图片路径集中在这里。空字符串代表使用尺寸稳定的代码占位层。
// 完整素材目录与替换规格见 assets/scenes/lifecycle/README.md。
module.exports = {
  expectedPaths: {
    leftLivingBackground: '/assets/scenes/lifecycle/post-hatch/10-background/left-living/left_living.webp',
    centerDeskBackground: '/assets/scenes/lifecycle/post-hatch/10-background/center-desk/center_desk.webp',
    rightDecorBackground: '/assets/scenes/lifecycle/post-hatch/10-background/right-decor/right_decor.webp',
    jadeRabbit: '/assets/scenes/lifecycle/post-hatch/30-character/jade-rabbit/',
    boonKoi: '/assets/scenes/lifecycle/post-hatch/30-character/boon-koi/',
    magicWindow: '/assets/scenes/lifecycle/post-hatch/50-overlays/magic-window/',
    keepsakes: '/assets/scenes/lifecycle/post-hatch/50-overlays/keepsakes/',
    postcards: '/assets/scenes/lifecycle/post-hatch/50-overlays/postcards/',
    moodFaces: '/assets/scenes/lifecycle/post-hatch/50-overlays/mood-faces/'
  },
  POST_HATCH: {
    panoramaFallback: '/assets/scenes/lifecycle/post-hatch/10-background/panorama-three-screen/post_hatch_room_panorama_empty_day_placeholder.png',
    leftLivingBackground: '',
    centerDeskBackground: '',
    rightDecorBackground: '',
    characterPoses: {
      sleep: '', lazy: '', stare: '', tea: '', drawing: '', gaming: '', window: ''
    },
    magicWindow: {
      dali: '/assets/scenes/lifecycle/post-hatch/50-overlays/magic-window/magic_window_dali_with_jade_rabbit_back_placeholder.png',
      beijing: '',
      xishuangbanna: '',
      tokyo: {
        base: '/assets/scenes/lifecycle/post-hatch/50-overlays/magic-window/tokyo-v01/magic_window_tokyo_base_v01.webp',
        clouds: '/assets/scenes/lifecycle/post-hatch/50-overlays/magic-window/tokyo-v01/magic_window_tokyo_clouds_v03.webp',
        koi: '/assets/scenes/lifecycle/post-hatch/50-overlays/magic-window/tokyo-v01/magic_window_tokyo_koi_walk_standard_v02.webp'
      }
    },
    keepsakes: {},
    postcards: {},
    moodFaces: {}
  }
};
