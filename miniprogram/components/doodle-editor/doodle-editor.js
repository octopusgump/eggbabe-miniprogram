const doodleDefinition = require('../../pages/doodle/doodle-definition');

const lifecycleNames = new Set(['data', 'onLoad', 'onReady', 'onShow', 'onHide', 'onUnload']);
const methods = Object.keys(doodleDefinition).reduce((result, key) => {
  if (!lifecycleNames.has(key)) result[key] = doodleDefinition[key];
  return result;
}, {});

Component({
  properties: {
    embedded: { type: Boolean, value: false }
  },
  data: doodleDefinition.data,
  lifetimes: {
    attached() {
      doodleDefinition.onLoad.call(this);
      doodleDefinition.onShow.call(this);
    },
    ready() {
      doodleDefinition.onReady.call(this);
    },
    detached() {
      doodleDefinition.onUnload.call(this);
    }
  },
  pageLifetimes: {
    show() {
      doodleDefinition.onShow.call(this);
    },
    hide() {
      doodleDefinition.onHide.call(this);
    }
  },
  methods
});
