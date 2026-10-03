const assert = require('assert');
const fs = require('fs');
const path = require('path');

const originalComponent = global.Component;
let definition;
global.Component = value => { definition = value; };

try {
  const componentModule = require('../../components/pano-static-character/pano-static-character');
  const helpers = componentModule.__test__;
  const modelPath = path.resolve(__dirname, '../../assets/scenes/lifecycle/post-hatch/30-character/jade-rabbit-3d/runtime/jade_rabbit_sit_floor_v01.glb');
  const model = fs.readFileSync(modelPath);
  const parsed = helpers.parseStaticGlb(model.buffer.slice(model.byteOffset, model.byteOffset + model.byteLength));

  assert.equal(definition.properties.modelUrl.type, String, '组件必须接收 GLB 路径');
  assert.equal(definition.properties.reducedMotion.type, Boolean, '组件必须支持减少动态效果');
  assert.equal(definition.data.modelVisible, false, '模型在绘制完成前必须保持不可见，避免突然跳入 Pano');
  assert.equal(typeof definition.methods.initialize, 'function', '组件必须用 Three.js 初始化 WebGL canvas');
  assert.equal(typeof definition.methods.disposeRenderer, 'function', '组件卸载时必须释放 WebGL 资源');
  assert.equal(typeof definition.methods.fail, 'function', '模型失败时必须通知宿主降级');
  assert.equal(helpers.clampDimension(99, 120), 120, '渲染尺寸必须有下限');
  assert.equal(helpers.clampDimension(192.7, 120), 193, '渲染尺寸必须取整');
  assert.deepEqual(helpers.localFileCandidates('/assets/test.glb'), ['assets/test.glb', '/assets/test.glb'], '代码包资源必须优先使用无前导斜杠的路径读取');
  assert.equal(helpers.isRemoteUrl('https://cdn.example.com/model.glb'), true, 'CDN GLB 必须走网络读取');
  assert.equal(helpers.isRemoteUrl('/assets/test.glb'), false, '代码包 GLB 不得误走网络读取');
  const view = new Uint8Array([71, 76, 66, 0]);
  const normalisedView = helpers.toArrayBuffer(view);
  assert.equal(Object.prototype.toString.call(normalisedView), '[object ArrayBuffer]', 'Uint8Array 必须归一化为 ArrayBuffer');
  assert.deepEqual(Array.from(new Uint8Array(normalisedView)), [71, 76, 66, 0], '归一化不得损坏 GLB 二进制内容');
  const parsedAfterNormalisation = helpers.parseStaticGlb(model.buffer.slice(model.byteOffset, model.byteOffset + model.byteLength));
  assert.equal(parsedAfterNormalisation.json.asset.version, '2.0', '解析器必须在二进制归一化后继续识别 GLB');

  // threejs-miniprogram 固定在 Three r108，只有 addAttribute；必须能创建真实 GLB 的完整几何体。
  const r108Geometry = {
    attributes: {},
    addAttribute(name, attribute) { this.attributes[name] = attribute; return this; },
    setIndex(attribute) { this.index = attribute; return this; },
    computeBoundingSphere() { this.boundingSphereComputed = true; }
  };
  const r108Three = {
    BufferGeometry: function BufferGeometry() { return r108Geometry; },
    BufferAttribute: function BufferAttribute(array, itemSize) { this.array = array; this.itemSize = itemSize; }
  };
  const geometryResult = helpers.createGeometry(r108Three, parsedAfterNormalisation);
  assert.equal(geometryResult.geometry, r108Geometry, 'r108 兼容层必须返回原始几何体');
  assert.equal(r108Geometry.attributes.position.itemSize, 3, 'r108 兼容层必须通过 addAttribute 写入位置');
  assert.equal(r108Geometry.attributes.normal.itemSize, 3, 'r108 兼容层必须通过 addAttribute 写入法线');
  assert.equal(r108Geometry.attributes.uv.itemSize, 2, 'r108 兼容层必须通过 addAttribute 写入 UV');
  assert.equal(r108Geometry.boundingSphereComputed, true, 'r108 兼容层必须继续计算模型边界');

  assert.equal(parsed.json.asset.version, '2.0', '必须解析 GLB 2.0');
  assert.equal(parsed.json.meshes.length, 1, 'MVP 只接收单静态网格');
  const position = helpers.accessorArray(parsed, parsed.json.meshes[0].primitives[0].attributes.POSITION);
  const indices = helpers.accessorArray(parsed, parsed.json.meshes[0].primitives[0].indices);
  assert.equal(position.itemSize, 3, '玉兔顶点位置必须是 VEC3');
  assert.equal(indices.itemSize, 1, '玉兔索引必须是标量');
  assert.equal(helpers.embeddedImageBytes(parsed, 0).byteLength > 1000, true, '玉兔颜色贴图必须来自 GLB 内嵌资源');
  assert.equal(helpers.embeddedImageBytes(parsed, 2).byteLength > 1000, true, '玉兔法线贴图必须来自 GLB 内嵌资源');

  const wxml = fs.readFileSync(path.resolve(__dirname, '../../components/pano-static-character/pano-static-character.wxml'), 'utf8');
  const styles = fs.readFileSync(path.resolve(__dirname, '../../components/pano-static-character/pano-static-character.wxss'), 'utf8');
  const componentConfig = fs.readFileSync(path.resolve(__dirname, '../../components/pano-static-character/pano-static-character.json'), 'utf8');
  assert.equal(wxml.includes('type="webgl"'), true, '必须使用原生 WebGL canvas，而非 XRFrame');
  assert.equal(wxml.includes('<xr-scene'), false, 'MVP 不得继续依赖 XRFrame 场景');
  assert.equal(componentConfig.includes('xr-frame'), false, '组件配置不得继续声明 XRFrame 渲染器');
  const componentSource = fs.readFileSync(path.resolve(__dirname, '../../components/pano-static-character/pano-static-character.js'), 'utf8');
  assert.equal(componentSource.includes('new THREE.FileLoader()'), false, '代码包 GLB 不得依赖旧适配层的 FileLoader');
  assert.equal(componentSource.includes('typeof geometry.addAttribute === \'function\''), true, 'Three r108 必须降级使用 addAttribute');
  assert.equal(componentSource.includes('this.model.scale.set(0.58, 0.58, 0.58)'), true, '玉兔必须以融入场景的小比例展示，而不是填满画布');
  assert.equal(componentSource.includes('this.model.rotation.y = 0'), true, '玉兔必须使用 Tripo 正面朝向，不得翻到侧背');
  assert.equal(wxml.includes("pano-static-character--visible"), true, '模型必须具备独立的就绪淡入状态');
  assert.equal(styles.includes('transition:opacity .26s ease-out,transform .26s ease-out'), true, '模型就绪后必须柔和淡入');

  console.log('静态玉兔 Three.js 组件与 GLB 结构校验通过。');
} finally {
  global.Component = originalComponent;
}
