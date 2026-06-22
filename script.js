// Global State
let effects = [];
let filteredEffects = [];
let currentCategory = "全部";
let searchQuery = "";
let activeEffect = null;
let activeViewport = "desktop";

// DOM Elements
const effectsGrid = document.getElementById("effectsGrid");
const categoryTabs = document.getElementById("categoryTabs");
const searchInput = document.getElementById("searchInput");
const btnToggleTheme = document.getElementById("btnToggleTheme");
const totalEffectsCount = document.getElementById("totalEffectsCount");

const playgroundView = document.getElementById("playgroundView");
const mainContainer = document.querySelector(".container");
const playgroundIframe = document.getElementById("playgroundIframe");
const sidebarEffectsList = document.getElementById("sidebarEffectsList");
const btnBackHome = document.getElementById("btnBackHome");

const activeEffectTitle = document.getElementById("activeEffectTitle");
const activeEffectCategory = document.getElementById("activeEffectCategory");
const activeEffectIndex = document.getElementById("activeEffectIndex");

const btnViewportDesktop = document.getElementById("btnViewportDesktop");
const btnViewportTablet = document.getElementById("btnViewportTablet");
const btnViewportMobile = document.getElementById("btnViewportMobile");
const deviceWrapper = document.getElementById("deviceWrapper");
const iframeLoader = document.getElementById("iframeLoader");

const btnRefresh = document.getElementById("btnRefresh");
const btnNewTab = document.getElementById("btnNewTab");

// Initializer
document.addEventListener("DOMContentLoaded", () => {
  // Load data from effects_data.js
  if (typeof EFFECTS_DATA !== "undefined") {
    effects = EFFECTS_DATA;
  } else {
    console.error("EFFECTS_DATA is not defined!");
    return;
  }

  // Update total count
  totalEffectsCount.textContent = effects.length;

  // Initialize Theme
  initTheme();

  // Initialize Categories
  initCategories();

  // Initial Card Render
  filterAndRender();

  // Event Listeners
  searchInput.addEventListener("input", handleSearch);
  btnToggleTheme.addEventListener("click", toggleTheme);
  btnBackHome.addEventListener("click", exitPlayground);

  // Viewport simulators
  btnViewportDesktop.addEventListener("click", () => setViewport("desktop"));
  btnViewportTablet.addEventListener("click", () => setViewport("tablet"));
  btnViewportMobile.addEventListener("click", () => setViewport("mobile"));

  // Iframe utilities
  btnRefresh.addEventListener("click", reloadIframe);
  btnNewTab.addEventListener("click", openInNewTab);

  // Iframe load listener to hide spinner
  playgroundIframe.addEventListener("load", () => {
    iframeLoader.classList.remove("show");
  });
});

// Theme Management
function initTheme() {
  const savedTheme = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  
  if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }
}

function toggleTheme() {
  const isDark = document.body.classList.toggle("dark-mode");
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

// Categories Management
function initCategories() {
  const categoriesSet = new Set(effects.map(eff => eff.category));
  const categories = ["全部", ...Array.from(categoriesSet).sort()];

  categoryTabs.innerHTML = "";
  categories.forEach(cat => {
    const button = document.createElement("button");
    button.className = `category-tab ${cat === currentCategory ? "active" : ""}`;
    button.textContent = cat;
    button.addEventListener("click", () => {
      // Toggle active states
      document.querySelectorAll(".category-tab").forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");
      currentCategory = cat;
      filterAndRender();
    });
    categoryTabs.appendChild(button);
  });
}

// Search
function handleSearch(e) {
  searchQuery = e.target.value.toLowerCase().trim();
  filterAndRender();
}

// Math helper for fallback gradient thumbnails
function getGradientForId(id) {
  const num = parseInt(id) || 1;
  const h1 = (num * 37) % 360;
  const h2 = (num * 37 + 70) % 360;
  return `linear-gradient(135deg, hsl(${h1}, 75%, 60%) 0%, hsl(${h2}, 85%, 40%) 100%)`;
}

// Filtering and Rendering
function filterAndRender() {
  filteredEffects = effects.filter(eff => {
    const matchesCategory = currentCategory === "全部" || eff.category === currentCategory;
    
    // Search in index number, display name, category, or files
    const effIndexStr = eff.id.split("-")[0];
    const matchesSearch = !searchQuery || 
                          eff.name.toLowerCase().includes(searchQuery) ||
                          eff.id.toLowerCase().includes(searchQuery) ||
                          eff.category.toLowerCase().includes(searchQuery) ||
                          effIndexStr.includes(searchQuery);
                          
    return matchesCategory && matchesSearch;
  });

  renderEffectsGrid();
}

function renderEffectsGrid() {
  effectsGrid.innerHTML = "";

  if (filteredEffects.length === 0) {
    effectsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">
        <p style="font-size: 1.2rem; margin-bottom: 0.5rem;">没有找到匹配的 CSS 动效</p>
        <p style="font-size: 0.9rem;">试试更改筛选类别或搜索关键词</p>
      </div>
    `;
    return;
  }

  filteredEffects.forEach(eff => {
    const card = document.createElement("div");
    card.className = "effect-card";
    
    // Extract numerical index
    const indexNum = eff.id.match(/^\d+/) || [""];
    
    // Construct file extension badges
    let fileBadges = "";
    if (eff.has_html || eff.entry_html) fileBadges += `<span class="file-indicator" title="HTML File">H</span>`;
    if (eff.has_css) fileBadges += `<span class="file-indicator" title="CSS File">C</span>`;
    if (eff.has_js) fileBadges += `<span class="file-indicator" title="JS File">J</span>`;

    // Visual media: Image or fallback gradient
    let thumbnailHtml = "";
    if (eff.screenshot) {
      thumbnailHtml = `<img src="${eff.screenshot}" alt="${eff.name}" loading="lazy">`;
    } else {
      const gradient = getGradientForId(eff.id);
      // Get characters for thumbnail
      const initials = eff.name.substring(0, 2);
      thumbnailHtml = `
        <div class="thumbnail-fallback" style="background: ${gradient}">
          <span>${initials}</span>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="card-thumbnail">
        <span class="card-index">#${indexNum}</span>
        <div class="card-files-badge">${fileBadges}</div>
        ${thumbnailHtml}
      </div>
      <div class="card-details">
        <span class="card-category">${eff.category}</span>
        <h2 class="card-title">${eff.name}</h2>
        <div class="card-footer">
          <span>动效目录: ${eff.id}</span>
          <span class="btn-card-action">
            运行预览 
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </span>
        </div>
      </div>
    `;

    // Click handler to open playground
    card.addEventListener("click", () => enterPlayground(eff));
    effectsGrid.appendChild(card);
  });
}

// Playground Modes Transitions
function enterPlayground(effect) {
  activeEffect = effect;
  
  // 1. Swap Views
  mainContainer.style.display = "none";
  playgroundView.style.display = "block";
  document.body.style.overflow = "hidden"; // Disable outer scroll

  // 2. Set Up Details Panel
  updatePlaygroundMetadata();

  // 3. Render Sidebar Switcher List
  renderSidebarList();

  // 4. Load Effect into Iframe
  loadEffectInIframe(effect.entry_path);
}

function updatePlaygroundMetadata() {
  if (!activeEffect) return;
  
  activeEffectTitle.textContent = activeEffect.name;
  activeEffectCategory.textContent = activeEffect.category;
  
  const indexNum = activeEffect.id.match(/^\d+/) || [""];
  activeEffectIndex.textContent = `#${indexNum}`;
}

function renderSidebarList() {
  sidebarEffectsList.innerHTML = "";
  
  // Use currently filtered effects list for easy cycling
  filteredEffects.forEach(eff => {
    const li = document.createElement("li");
    li.className = `sidebar-item ${eff.id === activeEffect.id ? "active" : ""}`;
    
    const indexNum = eff.id.match(/^\d+/) || [""];
    
    li.innerHTML = `
      <span>${eff.name}</span>
      <span class="sidebar-item-index">#${indexNum}</span>
    `;
    
    li.addEventListener("click", () => {
      if (activeEffect.id === eff.id) return;
      
      // Update active styling
      document.querySelectorAll(".sidebar-item").forEach(item => item.classList.remove("active"));
      li.classList.add("active");
      
      // Load new effect
      activeEffect = eff;
      updatePlaygroundMetadata();
      loadEffectInIframe(eff.entry_path);
    });
    
    sidebarEffectsList.appendChild(li);
  });
}

function loadEffectInIframe(path) {
  iframeLoader.classList.add("show");
  // Set source
  if (path) {
    playgroundIframe.src = path;
  } else {
    playgroundIframe.src = "";
    iframeLoader.classList.remove("show");
    alert("该动效未找到有效的 HTML 入口文件！");
  }
}

function exitPlayground() {
  // Stop iframe content
  playgroundIframe.src = "about:blank";
  
  // Swap Views back
  playgroundView.style.display = "none";
  mainContainer.style.display = "block";
  document.body.style.overflow = ""; // Re-enable outer scroll
  
  // Sync page scroll or update grid
  filterAndRender();
}

// Viewport Simulator Controls
function setViewport(size) {
  activeViewport = size;
  
  // Update buttons state
  btnViewportDesktop.classList.remove("active");
  btnViewportTablet.classList.remove("active");
  btnViewportMobile.classList.remove("active");
  
  deviceWrapper.classList.remove("device-desktop", "device-tablet", "device-mobile");
  
  if (size === "desktop") {
    btnViewportDesktop.classList.add("active");
    deviceWrapper.classList.add("device-desktop");
  } else if (size === "tablet") {
    btnViewportTablet.classList.add("active");
    deviceWrapper.classList.add("device-tablet");
  } else if (size === "mobile") {
    btnViewportMobile.classList.add("active");
    deviceWrapper.classList.add("device-mobile");
  }
}

// Iframe Toolbar Utils
function reloadIframe() {
  if (!activeEffect) return;
  iframeLoader.classList.add("show");
  playgroundIframe.src = playgroundIframe.src;
}

function openInNewTab() {
  if (!activeEffect || !activeEffect.entry_path) return;
  window.open(activeEffect.entry_path, "_blank");
}
