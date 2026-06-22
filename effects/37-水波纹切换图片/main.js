/**
 * Water Wave Distortion Transition Effect
 * Recreated from the official website of Justice Online / Where Winds Meet (燕云十六声 - yysls.cn)
 * Using Three.js and GSAP for smooth displacement transitions.
 */

// Slide metadata definitions
const SLIDES = [
  {
    subtitle: "WHERE WINDS MEET",
    title: "原野苍茫，天地同襟",
    desc: "文心可鉴，知己长存。游侠可继续乘风向东，踏足青州，体验晨昏有书卷、往来皆同窗的求学生活。风卷浮云，十六声起，天下大义于此间汇聚。"
  },
  {
    subtitle: "EXPLORE THE WORLD",
    title: "古道绝壁，大浪淘沙",
    desc: "青砖绿瓦，乱世惊雷。在这一场江湖乱局中，无数武林奇才竞相登场。在古道斜阳中，执剑而立，探寻风中消逝的历史真相。"
  },
  {
    subtitle: "MASTER THE MARTIAL",
    title: "易武奇术，百炼成钢",
    desc: "无拘门派，万法兼容。扇化游龙，枪刺惊鸿，刀破长空。十八般兵器肆意切换，在招式交错间领悟无拘无束的纯正武侠精髓。"
  }
];

// Variables to hold Three.js components and state
let scene, camera, renderer, material, mesh;
let textures = [];
let currentSlideIndex = 0;
let isTransitioning = false;
const imgAspect = 1920 / 1080; // Aspect ratio of bg1/bg2/bg3

// DOM elements
const container = document.getElementById("webgl-container");
const loader = document.getElementById("loader");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const dots = document.querySelectorAll(".dot-btn");
const slideSub = document.getElementById("slide-sub");
const slideTitle = document.getElementById("slide-title");
const slideDesc = document.getElementById("slide-desc");
const infoCard = document.getElementById("slide-info-card");

// Shaders definitions retrieved from yysls.cn
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  
  uniform float progress;
  uniform float intensity;
  
  uniform sampler2D texture1;
  uniform sampler2D texture2;
  uniform sampler2D displacement;
  uniform vec4 resolution; // x: screenWidth, y: screenHeight, z: scaleX, w: scaleY
  
  varying vec2 vUv;
  
  mat2 getRotM(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
  }
  
  const float PI = 3.1415926535;
  const float angle1 = PI * 0.25;    // 45 degrees rotation for texture1 distortion
  const float angle2 = -PI * 0.75;   // -135 degrees rotation for texture2 distortion
  
  void main() {
    // resolution.zw holds scale factors to simulate CSS background-size: cover in WebGL
    vec2 newUV = (vUv - vec2(0.5)) * resolution.zw + vec2(0.5);
    
    // Sample the displacement texture (red & green channels contain noise vectors)
    vec4 disp = texture2D(displacement, newUV);
    vec2 dispVec = vec2(disp.r, disp.g);
    
    // Calculate distorted UV for texture1 (distorts forward as progress increases)
    vec2 distortedPosition1 = newUV + getRotM(angle1) * dispVec * intensity * progress;
    vec4 t1 = texture2D(texture1, distortedPosition1);
    
    // Calculate distorted UV for texture2 (distorts backward as progress moves from 1 to 0)
    vec2 distortedPosition2 = newUV + getRotM(angle2) * dispVec * intensity * (1.0 - progress);
    vec4 t2 = texture2D(texture2, distortedPosition2);
    
    // Linearly mix the distorted frames using progress
    gl_FragColor = mix(t1, t2, progress);
  }
`;

// Helper to load textures with custom parameters
function loadTexture(url) {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (texture) => {
        // yysls settings: MirroredRepeatWrapping avoids edge bleeding during distortion
        texture.wrapS = THREE.MirroredRepeatWrapping;
        texture.wrapT = THREE.MirroredRepeatWrapping;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        resolve(texture);
      },
      undefined,
      (err) => reject(err)
    );
  });
}

// Initialize WebGL Scene
function initWebGL() {
  // 1. Create Scene
  scene = new THREE.Scene();

  // 2. Create Camera (Orthographic camera to render a 2D fullscreen plane)
  camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -1, 1);

  // 3. Create WebGLRenderer
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });
  
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // 4. Create Shader Material using parameters matching yysls
  material = new THREE.ShaderMaterial({
    uniforms: {
      progress: { value: 0.0 },
      intensity: { value: 0.28 }, // Tweakable distortion intensity
      texture1: { value: textures[0] },
      texture2: { value: textures[0] },
      displacement: { value: textures[3] }, // The displacement map (index 3)
      resolution: { value: new THREE.Vector4() }
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    transparent: true
  });

  // 5. Create a quad mesh filling the screen
  const geometry = new THREE.PlaneGeometry(1, 1);
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Initial calculation of dimensions & resolution
  updateResolution();
}

// Calculate resolution scale to simulate background-size: cover in the shader
function updateResolution() {
  if (!renderer || !material) return;
  
  const w = container.clientWidth;
  const h = container.clientHeight;
  
  renderer.setSize(w, h);
  
  const screenAspect = w / h;
  let scaleX = 1;
  let scaleY = 1;
  
  if (screenAspect > imgAspect) {
    // Screen is wider than image (image needs vertical scaling)
    scaleY = imgAspect / screenAspect;
  } else {
    // Screen is taller than image (image needs horizontal scaling)
    scaleX = screenAspect / imgAspect;
  }
  
  material.uniforms.resolution.value.set(w, h, scaleX, scaleY);
}

// Animate slide transition
function goToSlide(targetIndex) {
  if (isTransitioning || targetIndex === currentSlideIndex) return;
  isTransitioning = true;
  
  // Set textures
  material.uniforms.texture1.value = textures[currentSlideIndex];
  material.uniforms.texture2.value = textures[targetIndex];
  material.uniforms.progress.value = 0.0;
  
  // Update navigation dots active state
  dots.forEach((dot, idx) => {
    if (idx === targetIndex) {
      dot.classList.add("active");
    } else {
      dot.classList.remove("active");
    }
  });

  // 1. WebGL transition progress animation using GSAP
  gsap.to(material.uniforms.progress, {
    value: 1.0,
    duration: 1.4,
    ease: "power2.inOut",
    onComplete: () => {
      // Once transition is complete, update current index and lock release
      currentSlideIndex = targetIndex;
      isTransitioning = false;
    }
  });

  // 2. Elegant fade transition for content card
  gsap.timeline()
    .to(infoCard, {
      opacity: 0,
      x: -20,
      duration: 0.4,
      ease: "power2.out",
      onComplete: () => {
        // Change text values inside the card
        slideSub.textContent = SLIDES[targetIndex].subtitle;
        slideTitle.textContent = SLIDES[targetIndex].title;
        slideDesc.textContent = SLIDES[targetIndex].desc;
      }
    })
    .to(infoCard, {
      opacity: 1,
      x: 0,
      duration: 0.6,
      ease: "power2.out"
    });
}

// Event Listeners setup
function setupEvents() {
  // Resize handler
  window.addEventListener("resize", () => {
    updateResolution();
  });

  // Arrow controls
  prevBtn.addEventListener("click", () => {
    let prevIndex = currentSlideIndex - 1;
    if (prevIndex < 0) prevIndex = SLIDES.length - 1;
    goToSlide(prevIndex);
  });

  nextBtn.addEventListener("click", () => {
    let nextIndex = (currentSlideIndex + 1) % SLIDES.length;
    goToSlide(nextIndex);
  });

  // Pagination Dots controls
  dots.forEach(dot => {
    dot.addEventListener("click", (e) => {
      const idx = parseInt(e.currentTarget.getAttribute("data-index"));
      goToSlide(idx);
    });
  });
}

// Render loop
function animateLoop() {
  requestAnimationFrame(animateLoop);
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// Preload assets & launch
function startDemo() {
  const assetUrls = [
    "bg1.jpg",
    "bg2.jpg",
    "bg3.jpg",
    "displacement.jpg"
  ];

  Promise.all(assetUrls.map(url => loadTexture(url)))
    .then(loadedTextures => {
      textures = loadedTextures;
      
      // Initialize Three.js WebGL scene
      initWebGL();
      
      // Bind event listeners
      setupEvents();
      
      // Start render loop
      animateLoop();
      
      // Fade out loading screen
      loader.classList.add("fade-out");
      console.log("WebGL slider successfully initialized!");
    })
    .catch(err => {
      loader.querySelector(".loader-text").textContent = "资源加载失败...";
      loader.querySelector(".loader-spinner").style.borderTopColor = "#ff4d4d";
      console.error("Failed to load assets for WebGL transition demo:", err);
    });
}

// Run the demo on window load
window.addEventListener("DOMContentLoaded", startDemo);
