// 顶点着色器
const vertexShader = `
      precision highp float;
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

// 片段着色器
const fragmentShader = `
      precision highp float;

      uniform float iTime;
      uniform vec3  iResolution;
      uniform float animationSpeed;

      uniform bool enableTop;
      uniform bool enableMiddle;
      uniform bool enableBottom;

      uniform int topLineCount;
      uniform int middleLineCount;
      uniform int bottomLineCount;

      uniform float topLineDistance;
      uniform float middleLineDistance;
      uniform float bottomLineDistance;

      uniform vec3 topWavePosition;
      uniform vec3 middleWavePosition;
      uniform vec3 bottomWavePosition;

      uniform vec2 iMouse;
      uniform bool interactive;
      uniform float bendRadius;
      uniform float bendStrength;
      uniform float bendInfluence;

      uniform bool parallax;
      uniform float parallaxStrength;
      uniform vec2 parallaxOffset;

      uniform vec3 lineGradient[8];
      uniform int lineGradientCount;

      const vec3 BLACK = vec3(0.0);
      const vec3 PINK  = vec3(233.0, 71.0, 245.0) / 255.0;
      const vec3 BLUE  = vec3(47.0,  75.0, 162.0) / 255.0;

      mat2 rotate(float r) {
        return mat2(cos(r), sin(r), -sin(r), cos(r));
      }

      vec3 background_color(vec2 uv) {
        vec3 col = vec3(0.0);

        float y = sin(uv.x - 0.2) * 0.3 - 0.1;
        float m = uv.y - y;

        col += mix(BLUE, BLACK, smoothstep(0.0, 1.0, abs(m)));
        col += mix(PINK, BLACK, smoothstep(0.0, 1.0, abs(m - 0.8)));
        return col * 0.5;
      }

      vec3 getLineColor(float t, vec3 baseColor) {
        if (lineGradientCount <= 0) {
          return baseColor;
        }

        vec3 gradientColor;

        if (lineGradientCount == 1) {
          gradientColor = lineGradient[0];
        } else {
          float clampedT = clamp(t, 0.0, 0.9999);
          float scaled = clampedT * float(lineGradientCount - 1);
          int idx = int(floor(scaled));
          float f = fract(scaled);
          int idx2 = min(idx + 1, lineGradientCount - 1);

          vec3 c1 = lineGradient[idx];
          vec3 c2 = lineGradient[idx2];

          gradientColor = mix(c1, c2, f);
        }

        return gradientColor * 0.5;
      }

      float wave(vec2 uv, float offset, vec2 screenUv, vec2 mouseUv, bool shouldBend) {
        float time = iTime * animationSpeed;

        float x_offset   = offset;
        float x_movement = time * 0.1;
        float amp        = sin(offset + time * 0.2) * 0.3;
        float y          = sin(uv.x + x_offset + x_movement) * amp;

        if (shouldBend) {
          vec2 d = screenUv - mouseUv;
          float influence = exp(-dot(d, d) * bendRadius);
          float bendOffset = (mouseUv.y - screenUv.y) * influence * bendStrength * bendInfluence;
          y += bendOffset;
        }

        float m = uv.y - y;
        return 0.0175 / max(abs(m) + 0.01, 1e-3) + 0.01;
      }

      void mainImage(out vec4 fragColor, in vec2 fragCoord) {
        vec2 baseUv = (2.0 * fragCoord - iResolution.xy) / iResolution.y;
        baseUv.y *= -1.0;

        if (parallax) {
          baseUv += parallaxOffset;
        }

        vec3 col = vec3(0.0);

        vec3 b = lineGradientCount > 0 ? vec3(0.0) : background_color(baseUv);

        vec2 mouseUv = vec2(0.0);
        if (interactive) {
          mouseUv = (2.0 * iMouse - iResolution.xy) / iResolution.y;
          mouseUv.y *= -1.0;
        }

        if (enableBottom) {
          for (int i = 0; i < bottomLineCount; ++i) {
            float fi = float(i);
            float t = fi / max(float(bottomLineCount - 1), 1.0);
            vec3 lineCol = getLineColor(t, b);

            float angle = bottomWavePosition.z * log(length(baseUv) + 1.0);
            vec2 ruv = baseUv * rotate(angle);
            col += lineCol * wave(
              ruv + vec2(bottomLineDistance * fi + bottomWavePosition.x, bottomWavePosition.y),
              1.5 + 0.2 * fi,
              baseUv,
              mouseUv,
              interactive
            ) * 0.2;
          }
        }

        if (enableMiddle) {
          for (int i = 0; i < middleLineCount; ++i) {
            float fi = float(i);
            float t = fi / max(float(middleLineCount - 1), 1.0);
            vec3 lineCol = getLineColor(t, b);

            float angle = middleWavePosition.z * log(length(baseUv) + 1.0);
            vec2 ruv = baseUv * rotate(angle);
            col += lineCol * wave(
              ruv + vec2(middleLineDistance * fi + middleWavePosition.x, middleWavePosition.y),
              2.0 + 0.15 * fi,
              baseUv,
              mouseUv,
              interactive
            );
          }
        }

        if (enableTop) {
          for (int i = 0; i < topLineCount; ++i) {
            float fi = float(i);
            float t = fi / max(float(topLineCount - 1), 1.0);
            vec3 lineCol = getLineColor(t, b);

            float angle = topWavePosition.z * log(length(baseUv) + 1.0);
            vec2 ruv = baseUv * rotate(angle);
            ruv.x *= -1.0;
            col += lineCol * wave(
              ruv + vec2(topLineDistance * fi + topWavePosition.x, topWavePosition.y),
              1.0 + 0.2 * fi,
              baseUv,
              mouseUv,
              interactive
            ) * 0.1;
          }
        }

        fragColor = vec4(col, 1.0);
      }

      void main() {
        vec4 color = vec4(0.0);
        mainImage(color, gl_FragCoord.xy);
        gl_FragColor = color;
      }
    `;

const MAX_GRADIENT_STOPS = 8;

// 将十六进制颜色转换为Vector3
function hexToVec3(hex) {
  let value = hex.trim();
  if (value.startsWith("#")) {
    value = value.slice(1);
  }

  let r = 255,
    g = 255,
    b = 255;

  if (value.length === 3) {
    r = parseInt(value[0] + value[0], 16);
    g = parseInt(value[1] + value[1], 16);
    b = parseInt(value[2] + value[2], 16);
  } else if (value.length === 6) {
    r = parseInt(value.slice(0, 2), 16);
    g = parseInt(value.slice(2, 4), 16);
    b = parseInt(value.slice(4, 6), 16);
  }

  return new THREE.Vector3(r / 255, g / 255, b / 255);
}

// FloatingLines 类
class FloatingLines {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      enabledWaves: options.enabledWaves || ["top", "middle", "bottom"],
      lineCount: options.lineCount || 6,
      lineDistance: options.lineDistance || 5,
      topWavePosition: options.topWavePosition || {
        x: 10.0,
        y: 0.5,
        rotate: -0.4,
      },
      middleWavePosition: options.middleWavePosition || {
        x: 5.0,
        y: 0.0,
        rotate: 0.2,
      },
      bottomWavePosition: options.bottomWavePosition || {
        x: 2.0,
        y: -0.7,
        rotate: -1,
      },
      animationSpeed: options.animationSpeed || 1,
      interactive: options.interactive !== false,
      bendRadius: options.bendRadius || 5.0,
      bendStrength: options.bendStrength || -0.5,
      mouseDamping: options.mouseDamping || 0.05,
      parallax: options.parallax !== false,
      parallaxStrength: options.parallaxStrength || 0.2,
      linesGradient: options.linesGradient || [],
    };

    this.targetMouse = new THREE.Vector2(-1000, -1000);
    this.currentMouse = new THREE.Vector2(-1000, -1000);
    this.targetInfluence = 0;
    this.currentInfluence = 0;
    this.targetParallax = new THREE.Vector2(0, 0);
    this.currentParallax = new THREE.Vector2(0, 0);

    this.raf = null;
    this.ro = null;
    this.setup();
  }

  getLineCount(waveType) {
    if (typeof this.options.lineCount === "number")
      return this.options.lineCount;
    if (!this.options.enabledWaves.includes(waveType)) return 0;
    const index = this.options.enabledWaves.indexOf(waveType);
    return Array.isArray(this.options.lineCount)
      ? this.options.lineCount[index] ?? 6
      : 6;
  }

  getLineDistance(waveType) {
    if (typeof this.options.lineDistance === "number")
      return this.options.lineDistance;
    if (!this.options.enabledWaves.includes(waveType)) return 0.1;
    const index = this.options.enabledWaves.indexOf(waveType);
    return Array.isArray(this.options.lineDistance)
      ? this.options.lineDistance[index] ?? 0.1
      : 0.1;
  }

  setup() {
    const topLineCount = this.options.enabledWaves.includes("top")
      ? this.getLineCount("top")
      : 0;
    const middleLineCount = this.options.enabledWaves.includes("middle")
      ? this.getLineCount("middle")
      : 0;
    const bottomLineCount = this.options.enabledWaves.includes("bottom")
      ? this.getLineCount("bottom")
      : 0;

    const topLineDistance = this.options.enabledWaves.includes("top")
      ? this.getLineDistance("top") * 0.01
      : 0.01;
    const middleLineDistance = this.options.enabledWaves.includes("middle")
      ? this.getLineDistance("middle") * 0.01
      : 0.01;
    const bottomLineDistance = this.options.enabledWaves.includes("bottom")
      ? this.getLineDistance("bottom") * 0.01
      : 0.01;

    this.scene = new THREE.Scene();

    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.camera.position.z = 1;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    this.container.appendChild(this.renderer.domElement);

    this.uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector3(1, 1, 1) },
      animationSpeed: { value: this.options.animationSpeed },

      enableTop: { value: this.options.enabledWaves.includes("top") },
      enableMiddle: {
        value: this.options.enabledWaves.includes("middle"),
      },
      enableBottom: {
        value: this.options.enabledWaves.includes("bottom"),
      },

      topLineCount: { value: topLineCount },
      middleLineCount: { value: middleLineCount },
      bottomLineCount: { value: bottomLineCount },

      topLineDistance: { value: topLineDistance },
      middleLineDistance: { value: middleLineDistance },
      bottomLineDistance: { value: bottomLineDistance },

      topWavePosition: {
        value: new THREE.Vector3(
          this.options.topWavePosition.x,
          this.options.topWavePosition.y,
          this.options.topWavePosition.rotate
        ),
      },
      middleWavePosition: {
        value: new THREE.Vector3(
          this.options.middleWavePosition.x,
          this.options.middleWavePosition.y,
          this.options.middleWavePosition.rotate
        ),
      },
      bottomWavePosition: {
        value: new THREE.Vector3(
          this.options.bottomWavePosition.x,
          this.options.bottomWavePosition.y,
          this.options.bottomWavePosition.rotate
        ),
      },

      iMouse: { value: new THREE.Vector2(-1000, -1000) },
      interactive: { value: this.options.interactive },
      bendRadius: { value: this.options.bendRadius },
      bendStrength: { value: this.options.bendStrength },
      bendInfluence: { value: 0 },

      parallax: { value: this.options.parallax },
      parallaxStrength: { value: this.options.parallaxStrength },
      parallaxOffset: { value: new THREE.Vector2(0, 0) },

      lineGradient: {
        value: Array.from(
          { length: MAX_GRADIENT_STOPS },
          () => new THREE.Vector3(1, 1, 1)
        ),
      },
      lineGradientCount: { value: 0 },
    };

    if (this.options.linesGradient && this.options.linesGradient.length > 0) {
      const stops = this.options.linesGradient.slice(0, MAX_GRADIENT_STOPS);
      this.uniforms.lineGradientCount.value = stops.length;

      stops.forEach((hex, i) => {
        const color = hexToVec3(hex);
        this.uniforms.lineGradient.value[i].set(color.x, color.y, color.z);
      });
    }

    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    });

    this.geometry = new THREE.PlaneGeometry(2, 2);
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);

    this.clock = new THREE.Clock();

    this.setSize();

    if (typeof ResizeObserver !== "undefined") {
      this.ro = new ResizeObserver(() => this.setSize());
      this.ro.observe(this.container);
    }

    if (this.options.interactive) {
      this.renderer.domElement.addEventListener("pointermove", (e) =>
        this.handlePointerMove(e)
      );
      this.renderer.domElement.addEventListener("pointerleave", () =>
        this.handlePointerLeave()
      );
    }

    this.renderLoop();
  }

  setSize() {
    const width = this.container.clientWidth || 1;
    const height = this.container.clientHeight || 1;

    this.renderer.setSize(width, height, false);

    const canvasWidth = this.renderer.domElement.width;
    const canvasHeight = this.renderer.domElement.height;
    this.uniforms.iResolution.value.set(canvasWidth, canvasHeight, 1);
  }

  handlePointerMove(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const dpr = this.renderer.getPixelRatio();

    this.targetMouse.set(x * dpr, (rect.height - y) * dpr);
    this.targetInfluence = 1.0;

    if (this.options.parallax) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const offsetX = (x - centerX) / rect.width;
      const offsetY = -(y - centerY) / rect.height;
      this.targetParallax.set(
        offsetX * this.options.parallaxStrength,
        offsetY * this.options.parallaxStrength
      );
    }
  }

  handlePointerLeave() {
    this.targetInfluence = 0.0;
  }

  renderLoop() {
    this.uniforms.iTime.value = this.clock.getElapsedTime();

    if (this.options.interactive) {
      this.currentMouse.lerp(this.targetMouse, this.options.mouseDamping);
      this.uniforms.iMouse.value.copy(this.currentMouse);

      this.currentInfluence +=
        (this.targetInfluence - this.currentInfluence) *
        this.options.mouseDamping;
      this.uniforms.bendInfluence.value = this.currentInfluence;
    }

    if (this.options.parallax) {
      this.currentParallax.lerp(this.targetParallax, this.options.mouseDamping);
      this.uniforms.parallaxOffset.value.copy(this.currentParallax);
    }

    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(() => this.renderLoop());
  }

  updateOptions(newOptions) {
    Object.assign(this.options, newOptions);
    this.destroy();
    this.setup();
  }

  destroy() {
    if (this.raf) {
      cancelAnimationFrame(this.raf);
    }
    if (this.ro) {
      this.ro.disconnect();
    }
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.removeEventListener(
        "pointermove",
        this.handlePointerMove
      );
      this.renderer.domElement.removeEventListener(
        "pointerleave",
        this.handlePointerLeave
      );
    }
    if (this.geometry) this.geometry.dispose();
    if (this.material) this.material.dispose();
    if (this.renderer) this.renderer.dispose();
    if (
      this.renderer &&
      this.renderer.domElement &&
      this.renderer.domElement.parentElement
    ) {
      this.renderer.domElement.parentElement.removeChild(
        this.renderer.domElement
      );
    }
  }
}

// 初始化
let floatingLines;

function init() {
  const container = document.getElementById("floatingLinesContainer");

  floatingLines = new FloatingLines(container, {
    enabledWaves: ["top", "middle", "bottom"],
    lineCount: 6,
    lineDistance: 5,
    animationSpeed: 1,
    interactive: true,
    bendRadius: 5.0,
    bendStrength: -0.5,
    mouseDamping: 0.05,
    parallax: true,
    parallaxStrength: 0.2,
    linesGradient: [],
  });

  // 绑定控制面板事件
  setupControls();
}

function setupControls() {
  // 启用/禁用波浪
  document.getElementById("enableTop").addEventListener("change", (e) => {
    const enabledWaves = floatingLines.options.enabledWaves;
    if (e.target.checked && !enabledWaves.includes("top")) {
      enabledWaves.push("top");
    } else if (!e.target.checked) {
      const index = enabledWaves.indexOf("top");
      if (index > -1) enabledWaves.splice(index, 1);
    }
    floatingLines.updateOptions({ enabledWaves: [...enabledWaves] });
  });

  document.getElementById("enableMiddle").addEventListener("change", (e) => {
    const enabledWaves = floatingLines.options.enabledWaves;
    if (e.target.checked && !enabledWaves.includes("middle")) {
      enabledWaves.push("middle");
    } else if (!e.target.checked) {
      const index = enabledWaves.indexOf("middle");
      if (index > -1) enabledWaves.splice(index, 1);
    }
    floatingLines.updateOptions({ enabledWaves: [...enabledWaves] });
  });

  document.getElementById("enableBottom").addEventListener("change", (e) => {
    const enabledWaves = floatingLines.options.enabledWaves;
    if (e.target.checked && !enabledWaves.includes("bottom")) {
      enabledWaves.push("bottom");
    } else if (!e.target.checked) {
      const index = enabledWaves.indexOf("bottom");
      if (index > -1) enabledWaves.splice(index, 1);
    }
    floatingLines.updateOptions({ enabledWaves: [...enabledWaves] });
  });

  // 动画速度
  const speedSlider = document.getElementById("animationSpeed");
  const speedValue = document.getElementById("speedValue");
  speedSlider.addEventListener("input", (e) => {
    const value = parseFloat(e.target.value);
    speedValue.textContent = value.toFixed(1);
    floatingLines.uniforms.animationSpeed.value = value;
  });

  // 交互模式
  document.getElementById("interactive").addEventListener("change", (e) => {
    floatingLines.updateOptions({ interactive: e.target.checked });
  });

  // 弯曲半径
  const bendRadiusSlider = document.getElementById("bendRadius");
  const bendRadiusValue = document.getElementById("bendRadiusValue");
  bendRadiusSlider.addEventListener("input", (e) => {
    const value = parseFloat(e.target.value);
    bendRadiusValue.textContent = value.toFixed(1);
    floatingLines.uniforms.bendRadius.value = value;
  });

  // 弯曲强度
  const bendStrengthSlider = document.getElementById("bendStrength");
  const bendStrengthValue = document.getElementById("bendStrengthValue");
  bendStrengthSlider.addEventListener("input", (e) => {
    const value = parseFloat(e.target.value);
    bendStrengthValue.textContent = value.toFixed(1);
    floatingLines.uniforms.bendStrength.value = value;
  });

  // 视差效果
  document.getElementById("parallax").addEventListener("change", (e) => {
    floatingLines.updateOptions({ parallax: e.target.checked });
  });

  // 视差强度
  const parallaxStrengthSlider = document.getElementById("parallaxStrength");
  const parallaxStrengthValue = document.getElementById(
    "parallaxStrengthValue"
  );
  parallaxStrengthSlider.addEventListener("input", (e) => {
    const value = parseFloat(e.target.value);
    parallaxStrengthValue.textContent = value.toFixed(2);
    floatingLines.uniforms.parallaxStrength.value = value;
    floatingLines.options.parallaxStrength = value;
  });

  // 线条数量
  document.getElementById("lineCount").addEventListener("change", (e) => {
    const value = parseInt(e.target.value);
    floatingLines.updateOptions({ lineCount: value });
  });

  // 线条间距
  document.getElementById("lineDistance").addEventListener("change", (e) => {
    const value = parseInt(e.target.value);
    floatingLines.updateOptions({ lineDistance: value });
  });

  // 渐变色
  document.getElementById("linesGradient").addEventListener("change", (e) => {
    const value = e.target.value.trim();
    if (value) {
      const colors = value
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c);
      floatingLines.updateOptions({ linesGradient: colors });
    } else {
      floatingLines.updateOptions({ linesGradient: [] });
    }
  });
}

// 页面加载完成后初始化
window.addEventListener("load", init);
