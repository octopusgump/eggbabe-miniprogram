Component({
  properties: {
    text: { type: String, value: '' },
    tone: { type: String, value: 'info' },
    visible: { type: Boolean, value: false },
    /** pill-fill：铺满宿主（如「再看一眼」gate 覆盖层），不换行约束放宽 */
    layout: { type: String, value: '' }
  }
});
