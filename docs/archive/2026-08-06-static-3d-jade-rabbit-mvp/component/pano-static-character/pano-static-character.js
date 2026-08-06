const { createScopedThreejs } = require('threejs-miniprogram');

const GLB_MAGIC = 0x46546C67;
const GLB_JSON_CHUNK = 0x4E4F534A;
const GLB_BINARY_CHUNK = 0x004E4942;
const LOAD_TIMEOUT = 9000;

function clampDimension(value, minimum) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(minimum, Math.round(number)) : minimum;
}

function decodeUtf8(bytes) {
  if (typeof TextDecoder === 'function') return new TextDecoder('utf-8').decode(bytes);
  let text = '';
  for (let index = 0; index < bytes.length; index += 1) text += String.fromCharCode(bytes[index]);
  return decodeURIComponent(escape(text));
}

// MVP 只接受 Tripo 导出的二进制 GLB：一个场景、一个静态网格、内嵌 JPEG 贴图。
// 不支持骨骼、动画、Draco 或外链资源；不匹配时明确报错，绝不静默显示其他角色。
function parseStaticGlb(arrayBuffer) {
  const normalized = toArrayBuffer(arrayBuffer);
  if (!normalized || normalized.byteLength < 20) throw new Error('invalid_glb');
  arrayBuffer = normalized;
  const view = new DataView(arrayBuffer);
  if (view.getUint32(0, true) !== GLB_MAGIC || view.getUint32(4, true) !== 2) throw new Error('unsupported_glb');
  let offset = 12;
  let json = null;
  let binary = null;
  while (offset + 8 <= arrayBuffer.byteLength) {
    const chunkLength = view.getUint32(offset, true);
    const chunkType = view.getUint32(offset + 4, true);
    const chunkStart = offset + 8;
    const chunkEnd = chunkStart + chunkLength;
    if (chunkEnd > arrayBuffer.byteLength) throw new Error('corrupted_glb');
    if (chunkType === GLB_JSON_CHUNK) json = JSON.parse(decodeUtf8(new Uint8Array(arrayBuffer, chunkStart, chunkLength)).trim());
    if (chunkType === GLB_BINARY_CHUNK) binary = arrayBuffer.slice(chunkStart, chunkEnd);
    offset = chunkEnd;
  }
  if (!json || !binary) throw new Error('missing_glb_chunks');
  return { json, binary };
}

function itemSizeFor(type) {
  return { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[type] || 0;
}

function typedArrayFor(componentType) {
  return {
    5120: Int8Array,
    5121: Uint8Array,
    5122: Int16Array,
    5123: Uint16Array,
    5125: Uint32Array,
    5126: Float32Array
  }[componentType];
}

function accessorArray(parsed, accessorIndex) {
  const accessor = parsed.json.accessors && parsed.json.accessors[accessorIndex];
  const bufferView = accessor && parsed.json.bufferViews && parsed.json.bufferViews[accessor.bufferView];
  const ArrayType = accessor && typedArrayFor(accessor.componentType);
  const itemSize = accessor && itemSizeFor(accessor.type);
  if (!accessor || !bufferView || !ArrayType || !itemSize || bufferView.byteStride) throw new Error('unsupported_accessor');
  const offset = Number(bufferView.byteOffset || 0) + Number(accessor.byteOffset || 0);
  const length = Number(accessor.count || 0) * itemSize;
  if (!length || offset + length * ArrayType.BYTES_PER_ELEMENT > parsed.binary.byteLength) throw new Error('invalid_accessor');
  return { array: new ArrayType(parsed.binary, offset, length), itemSize };
}

function embeddedImageBytes(parsed, textureIndex) {
  const texture = parsed.json.textures && parsed.json.textures[textureIndex];
  const image = texture && parsed.json.images && parsed.json.images[texture.source];
  const bufferView = image && parsed.json.bufferViews && parsed.json.bufferViews[image.bufferView];
  if (!image || !bufferView || image.uri || !/^image\/jpeg$/i.test(image.mimeType || '')) throw new Error('unsupported_texture');
  const start = Number(bufferView.byteOffset || 0);
  const end = start + Number(bufferView.byteLength || 0);
  if (end > parsed.binary.byteLength || end <= start) throw new Error('invalid_texture');
  return parsed.binary.slice(start, end);
}

function setGeometryAttribute(geometry, name, attribute) {
  // threejs-miniprogram 0.0.8 内置的是 Three r108，仅有 addAttribute；
  // 新版 Three.js 则改名为 setAttribute。两者都保留，避免运行环境升级时再断裂。
  if (geometry && typeof geometry.setAttribute === 'function') return geometry.setAttribute(name, attribute);
  if (geometry && typeof geometry.addAttribute === 'function') return geometry.addAttribute(name, attribute);
  throw new Error('geometry_attribute_api_unavailable');
}

function createGeometry(THREE, parsed) {
  const mesh = parsed.json.meshes && parsed.json.meshes[0];
  const primitive = mesh && mesh.primitives && mesh.primitives[0];
  const attributes = primitive && primitive.attributes;
  if (!primitive || primitive.mode && primitive.mode !== 4 || !attributes || attributes.POSITION === undefined || primitive.indices === undefined) throw new Error('unsupported_mesh');
  const geometry = new THREE.BufferGeometry();
  const position = accessorArray(parsed, attributes.POSITION);
  const index = accessorArray(parsed, primitive.indices);
  setGeometryAttribute(geometry, 'position', new THREE.BufferAttribute(position.array, position.itemSize));
  geometry.setIndex(new THREE.BufferAttribute(index.array, index.itemSize));
  if (attributes.NORMAL !== undefined) {
    const normal = accessorArray(parsed, attributes.NORMAL);
    setGeometryAttribute(geometry, 'normal', new THREE.BufferAttribute(normal.array, normal.itemSize));
  }
  if (attributes.TEXCOORD_0 !== undefined) {
    const uv = accessorArray(parsed, attributes.TEXCOORD_0);
    setGeometryAttribute(geometry, 'uv', new THREE.BufferAttribute(uv.array, uv.itemSize));
  }
  geometry.computeBoundingSphere();
  return { geometry, materialIndex: Number(primitive.material || 0) };
}

function fileExtension(mimeType) {
  return /png/i.test(mimeType || '') ? 'png' : 'jpg';
}

function createTexture(canvas, THREE, bytes, mimeType, filename) {
  return new Promise((resolve, reject) => {
    const fileSystem = wx.getFileSystemManager && wx.getFileSystemManager();
    const userPath = wx.env && wx.env.USER_DATA_PATH;
    if (!fileSystem || !userPath || !canvas || !canvas.createImage) {
      reject(new Error('texture_runtime_unavailable'));
      return;
    }
    const filePath = `${userPath}/${filename}.${fileExtension(mimeType)}`;
    fileSystem.writeFile({
      filePath,
      data: bytes,
      success() {
        const image = canvas.createImage();
        image.onload = () => {
          const texture = new THREE.Texture(image);
          texture.flipY = false;
          if (THREE.sRGBEncoding !== undefined) texture.encoding = THREE.sRGBEncoding;
          texture.needsUpdate = true;
          resolve({ texture, filePath });
        };
        image.onerror = () => reject(new Error('texture_decode_failed'));
        image.src = filePath;
      },
      fail() { reject(new Error('texture_file_write_failed')); }
    });
  });
}

function isRemoteUrl(url) {
  return /^https?:\/\//i.test(String(url || ''));
}

function isArrayBuffer(value) {
  return Object.prototype.toString.call(value) === '[object ArrayBuffer]';
}

function toArrayBuffer(value) {
  // 开发者工具可能从另一个运行上下文返回 ArrayBuffer，instanceof 会误判；
  // 部分基础库也会返回 Uint8Array。统一复制出当前上下文的独立 ArrayBuffer。
  let bytes = null;
  if (isArrayBuffer(value)) bytes = new Uint8Array(value);
  else if (value && isArrayBuffer(value.buffer) && Number.isFinite(value.byteLength)) {
    bytes = new Uint8Array(value.buffer, Number(value.byteOffset || 0), Number(value.byteLength));
  }
  if (!bytes) return null;
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function localFileCandidates(url) {
  const source = String(url || '');
  // WXML 静态资源常以 /assets 开头；FileSystemManager 对前导 / 的兼容性不一致。
  // 先试代码包相对路径，再保留原路径兜底。
  const relative = source.replace(/^\/+/, '');
  return [relative, source].filter((path, index, list) => path && list.indexOf(path) === index);
}

function readLocalArrayBuffer(url, onProgress) {
  return new Promise((resolve, reject) => {
    const fileSystem = wx.getFileSystemManager && wx.getFileSystemManager();
    const candidates = localFileCandidates(url);
    if (!fileSystem || !candidates.length) {
      reject(new Error('model_local_reader_unavailable'));
      return;
    }
    let candidateIndex = 0;
    const readNext = () => {
      fileSystem.readFile({
        filePath: candidates[candidateIndex],
        success(result) {
          const value = toArrayBuffer(result && result.data);
          if (value) {
            if (onProgress) onProgress({ loaded: value.byteLength, total: value.byteLength });
            resolve(value);
            return;
          }
          reject(new Error('model_response_not_arraybuffer'));
        },
        fail() {
          candidateIndex += 1;
          if (candidateIndex < candidates.length) readNext();
          else reject(new Error('model_local_read_failed'));
        }
      });
    };
    readNext();
  });
}

function requestRemoteArrayBuffer(url, onProgress) {
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      responseType: 'arraybuffer',
      success(result) {
        const value = toArrayBuffer(result && result.data);
        if (result && result.statusCode >= 200 && result.statusCode < 300 && value) {
          if (onProgress) onProgress({ loaded: value.byteLength, total: value.byteLength });
          resolve(value);
          return;
        }
        reject(new Error('model_remote_response_invalid'));
      },
      fail() { reject(new Error('model_remote_read_failed')); }
    });
  });
}

function loadArrayBuffer(url, onProgress) {
  return isRemoteUrl(url) ? requestRemoteArrayBuffer(url, onProgress) : readLocalArrayBuffer(url, onProgress);
}

function disposeMaterial(material) {
  if (!material) return;
  ['map', 'normalMap', 'roughnessMap', 'metalnessMap'].forEach(key => {
    if (material[key] && material[key].dispose) material[key].dispose();
  });
  if (material.dispose) material.dispose();
}

Component({
  properties: {
    modelUrl: { type: String, value: '' },
    width: { type: Number, value: 190 },
    height: { type: Number, value: 270 },
    pixelRatio: { type: Number, value: 1 },
    reducedMotion: { type: Boolean, value: false }
  },
  data: {
    renderWidth: 190,
    renderHeight: 270,
    renderVisible: true,
    modelVisible: false
  },
  lifetimes: {
    attached() {
      this.destroyed = false;
      this.loadTimeout = setTimeout(() => this.fail('timeout'), LOAD_TIMEOUT);
    },
    ready() { this.initialize(); },
    detached() {
      this.destroyed = true;
      clearTimeout(this.loadTimeout);
      clearTimeout(this.appearanceTimer);
      this.stopRenderLoop();
      this.disposeRenderer();
    }
  },
  observers: {
    'width, height, pixelRatio': function(width, height, pixelRatio) {
      const ratio = Math.max(1, Math.min(2, Number(pixelRatio) || 1));
      const renderWidth = clampDimension(Number(width) * ratio, 120);
      const renderHeight = clampDimension(Number(height) * ratio, 160);
      this.setData({ renderWidth, renderHeight });
      if (this.renderer && this.camera) this.resize(renderWidth, renderHeight);
    },
    reducedMotion: function() {
      if (this.renderer && this.scene && this.camera) this.renderOnce();
    }
  },
  methods: {
    initialize() {
      if (!this.data.modelUrl || this.destroyed) return this.fail('missing_model');
      this.createSelectorQuery().select('#pano-static-character-canvas').node().exec(result => {
        if (this.destroyed) return;
        const canvas = result && result[0] && result[0].node;
        if (!canvas) return this.fail('canvas_unavailable');
        try {
          this.canvas = canvas;
          this.THREE = createScopedThreejs(canvas);
          this.renderer = new this.THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: false });
          this.renderer.setClearColor(0x000000, 0);
          if (this.renderer.outputEncoding !== undefined && this.THREE.sRGBEncoding !== undefined) this.renderer.outputEncoding = this.THREE.sRGBEncoding;
          this.scene = new this.THREE.Scene();
          this.camera = new this.THREE.PerspectiveCamera(29, 1, 0.01, 20);
          this.camera.position.set(0, 0.02, 2.15);
          this.camera.lookAt(new this.THREE.Vector3(0, -0.05, 0));
          // 让白色毛发留住纹理，并贴合这套窗边 Pano 的暖而不刺眼的光感。
          this.ambientLight = new this.THREE.HemisphereLight(0xFFF6E8, 0x6B5949, 0.68);
          this.keyLight = new this.THREE.DirectionalLight(0xFFE0B5, 0.56);
          this.keyLight.position.set(-1.7, 2.4, 2.8);
          this.fillLight = new this.THREE.DirectionalLight(0xDCE8DC, 0.14);
          this.fillLight.position.set(1.8, 0.8, 1.5);
          this.scene.add(this.ambientLight, this.keyLight, this.fillLight);
          this.resize(this.data.renderWidth, this.data.renderHeight);
          this.triggerEvent('scene-ready');
          this.loadModel();
        } catch (error) {
          this.fail(`renderer_init_failed:${error && error.message || 'unknown'}`);
        }
      });
    },
    resize(width, height) {
      if (!this.renderer || !this.camera) return;
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    },
    loadModel() {
      loadArrayBuffer(this.data.modelUrl, () => this.triggerEvent('progress'))
        .then(buffer => {
          const parsed = parseStaticGlb(buffer);
          const source = createGeometry(this.THREE, parsed);
          const material = parsed.json.materials && parsed.json.materials[source.materialIndex] || {};
          const pbr = material.pbrMetallicRoughness || {};
          const textureIndexes = [
            pbr.baseColorTexture && pbr.baseColorTexture.index,
            material.normalTexture && material.normalTexture.index
          ].filter(index => index !== undefined && index !== null);
          const timestamp = Date.now();
          return Promise.all(textureIndexes.map((index, order) => {
            const image = parsed.json.images[parsed.json.textures[index].source];
            return createTexture(this.canvas, this.THREE, embeddedImageBytes(parsed, index), image.mimeType, `eggbabe-3d-rabbit-${timestamp}-${order}`);
          })).then(textures => ({ source, material, pbr, textureIndexes, textures }));
        })
        .then(payload => this.mountModel(payload))
        .catch(error => this.fail(error && error.message || 'model_load_failed'));
    },
    mountModel(payload) {
      if (this.destroyed || !this.scene) return;
      const { source, material, textureIndexes, textures } = payload;
      const baseTextureIndex = material.pbrMetallicRoughness && material.pbrMetallicRoughness.baseColorTexture && material.pbrMetallicRoughness.baseColorTexture.index;
      const normalTextureIndex = material.normalTexture && material.normalTexture.index;
      const textureFor = index => {
        const found = textureIndexes.indexOf(index);
        return found >= 0 ? textures[found].texture : null;
      };
      const meshMaterial = new this.THREE.MeshStandardMaterial({
        map: textureFor(baseTextureIndex),
        normalMap: textureFor(normalTextureIndex),
        color: 0xFFF9EC,
        roughness: 0.94,
        metalness: 0.0
      });
      this.tempTexturePaths = textures.map(item => item.filePath);
      this.model = new this.THREE.Mesh(source.geometry, meshMaterial);
      // Tripo 的正面已朝向默认相机；不再翻转成侧背。缩小后保持脚底落在画布阴影上。
      this.model.rotation.y = 0;
      this.model.scale.set(0.58, 0.58, 0.58);
      this.model.position.set(0, -0.32, 0);
      this.scene.add(this.model);
      clearTimeout(this.loadTimeout);
      this.loaded = true;
      this.renderOnce();
      if (!this.data.reducedMotion) this.startRenderLoop();
      // 底图已先就绪，模型自身再轻轻出现，避免 WebGL 首帧突然跳入画面。
      this.appearanceTimer = setTimeout(() => {
        if (this.destroyed || !this.loaded) return;
        this.setData({ modelVisible: true }, () => this.triggerEvent('ready'));
      }, this.data.reducedMotion ? 0 : 40);
    },
    renderOnce() {
      if (!this.renderer || !this.scene || !this.camera || this.destroyed) return;
      this.renderer.render(this.scene, this.camera);
    },
    startRenderLoop() {
      this.stopRenderLoop();
      if (!this.canvas || !this.canvas.requestAnimationFrame || this.data.reducedMotion) return;
      this.renderStartedAt = Date.now();
      const frame = () => {
        if (this.destroyed || !this.loaded || this.data.reducedMotion) return;
        const wave = Math.sin((Date.now() - this.renderStartedAt) / 5200 * Math.PI * 2);
        // 仅微调环境光与主光，角色网格没有位移、旋转或骨骼动画。
        this.ambientLight.intensity = 0.68 + wave * 0.02;
        this.keyLight.intensity = 0.56 + wave * 0.04;
        this.renderOnce();
        this.frameId = this.canvas.requestAnimationFrame(frame);
      };
      this.frameId = this.canvas.requestAnimationFrame(frame);
    },
    stopRenderLoop() {
      if (this.canvas && this.canvas.cancelAnimationFrame && this.frameId) this.canvas.cancelAnimationFrame(this.frameId);
      this.frameId = null;
    },
    fail(reason) {
      if (this.failed || this.destroyed) return;
      this.failed = true;
      clearTimeout(this.loadTimeout);
      clearTimeout(this.appearanceTimer);
      this.setData({ modelVisible: false });
      this.stopRenderLoop();
      this.triggerEvent('error', { reason: String(reason || 'unknown') });
    },
    disposeRenderer() {
      if (this.model) {
        if (this.model.geometry && this.model.geometry.dispose) this.model.geometry.dispose();
        disposeMaterial(this.model.material);
      }
      if (this.renderer && this.renderer.dispose) this.renderer.dispose();
      const fileSystem = typeof wx !== 'undefined' && wx.getFileSystemManager && wx.getFileSystemManager();
      (this.tempTexturePaths || []).forEach(filePath => fileSystem && fileSystem.unlink({ filePath, fail() {} }));
      this.model = null;
      this.renderer = null;
      this.scene = null;
      this.camera = null;
    }
  }
});

module.exports.__test__ = { parseStaticGlb, accessorArray, embeddedImageBytes, createGeometry, setGeometryAttribute, clampDimension, isRemoteUrl, localFileCandidates, toArrayBuffer };
