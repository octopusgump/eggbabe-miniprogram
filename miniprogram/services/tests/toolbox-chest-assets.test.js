const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const runtime = path.resolve(__dirname, '../../assets/ui/3d-scene-actions/runtime');
const files = [
  'ui_3d_scene_toolbox_closed_chest_96_v02_p8_v01.png',
  'ui_3d_scene_toolbox_open_chest_96_v01_p8_v01.png'
].map(name => path.join(runtime, name));

const py = path.join(__dirname, '_toolbox_chest_alpha_check.py');
fs.writeFileSync(
  py,
  `from PIL import Image
import sys
for name in sys.argv[1:]:
  im = Image.open(name).convert('RGBA')
  a = im.getpixel((0, 0))[3]
  assert a < 16, f'{name} corner alpha={a}, expected transparent PNG'
print('ok')
`
);

try {
  execFileSync('python3', [py, ...files], { encoding: 'utf8' });
} finally {
  fs.unlinkSync(py);
}

console.log('百宝箱合盖/开盖 runtime 透明底校验通过。');
