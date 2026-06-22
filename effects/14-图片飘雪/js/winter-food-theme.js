/**
 * 扬州冬日美食专题页面 JavaScript
 * 实现雪花飘落、热气效果和轮播图功能
 */

(function () {
  "use strict";

  // 等待 DOM 加载完成
  document.addEventListener("DOMContentLoaded", function () {
    initSnowEffect();
    initSteamEffect();
    initScrollAnimation();
    initScrollToTop();
    // 轮播图初始化已移至 public.js
  });

  /**
   * 初始化雪花飘落效果
   */
  function initSnowEffect() {
    const snowContainer = document.getElementById("snowContainer");
    if (!snowContainer) return;

    const snowCount = 50; // 雪花数量

    for (let i = 0; i < snowCount; i++) {
      createSnowflake(snowContainer);
    }
  }

  /**
   * 创建单个雪花
   */
  function createSnowflake(container) {
    const snowflake = document.createElement("div");
    snowflake.className = "snowflake";

    // 随机大小
    const size = Math.random() * 5 + 3; // 3-8px
    snowflake.style.width = size + "px";
    snowflake.style.height = size + "px";

    // 随机位置
    const startX = Math.random() * 100;
    snowflake.style.left = startX + "%";

    // 随机下落速度
    const duration = Math.random() * 3 + 2; // 2-5秒
    snowflake.style.animationDuration = duration + "s";

    // 随机延迟
    const delay = Math.random() * 2;
    snowflake.style.animationDelay = delay + "s";

    container.appendChild(snowflake);
  }

  /**
   * 初始化热气效果
   */
  function initSteamEffect() {
    const steamContainer = document.getElementById("steamContainer");
    if (!steamContainer) return;

    const steamCount = 8; // 热气数量

    for (let i = 0; i < steamCount; i++) {
      createSteam(steamContainer, i);
    }
  }

  /**
   * 创建单个热气
   */
  function createSteam(container, index) {
    const steam = document.createElement("div");
    steam.className = "steam";

    // 随机位置（在底部区域）
    const startX = 20 + Math.random() * 60; // 20%-80%
    steam.style.left = startX + "%";
    steam.style.bottom = "10%";

    // 随机大小
    const width = Math.random() * 40 + 30; // 30-70px
    steam.style.width = width + "px";
    steam.style.height = width * 1.5 + "px";

    // 随机动画时长
    const duration = Math.random() * 2 + 3; // 3-5秒
    steam.style.animationDuration = duration + "s";

    // 随机延迟
    const delay = index * 0.5 + Math.random() * 1;
    steam.style.animationDelay = delay + "s";

    // 随机透明度
    const opacity = Math.random() * 0.3 + 0.4; // 0.4-0.7
    steam.style.opacity = opacity;

    container.appendChild(steam);
  }

  /**
   * 初始化滚动入场动画
   */
  function initScrollAnimation() {
    // 检查是否支持 Intersection Observer
    if (typeof IntersectionObserver === "undefined") {
      // 降级方案：直接显示所有元素
      const elements = document.querySelectorAll(
        ".section, .section-title, .intro-content, .food-carousel, .food-grid, .food-item"
      );
      elements.forEach(function (el) {
        el.classList.add("animate-in");
      });
      return;
    }

    // 创建 Intersection Observer
    const observerOptions = {
      threshold: 0.15, // 当元素 15% 可见时触发
      rootMargin: "0px 0px -50px 0px", // 提前 50px 触发
    };

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in");
          // 如果是 food-grid，需要为子元素添加动画
          if (entry.target.classList.contains("food-grid")) {
            const items = entry.target.querySelectorAll(".food-item");
            items.forEach(function (item) {
              item.classList.add("animate-in");
            });
          }
          // 停止观察已触发的元素
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // 观察所有需要动画的元素
    const sections = document.querySelectorAll(".section");
    sections.forEach(function (section) {
      observer.observe(section);
    });

    const sectionTitles = document.querySelectorAll(".section-title");
    sectionTitles.forEach(function (title) {
      observer.observe(title);
    });

    const introContents = document.querySelectorAll(".intro-content");
    introContents.forEach(function (content) {
      observer.observe(content);
    });

    const foodCarousels = document.querySelectorAll(".food-carousel");
    foodCarousels.forEach(function (carousel) {
      observer.observe(carousel);
    });

    const foodGrids = document.querySelectorAll(".food-grid");
    foodGrids.forEach(function (grid) {
      observer.observe(grid);
    });
  }

  /**
   * 初始化回到顶部按钮
   */
  function initScrollToTop() {
    const scrollToTopBtn = document.getElementById("scrollToTop");
    if (!scrollToTopBtn) return;

    // 滚动距离阈值（超过这个距离才显示按钮）
    const scrollThreshold = 300;

    // 滚动事件处理
    function handleScroll() {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;

      if (scrollY > scrollThreshold) {
        scrollToTopBtn.classList.add("show");
      } else {
        scrollToTopBtn.classList.remove("show");
      }
    }

    // 点击回到顶部
    scrollToTopBtn.addEventListener("click", function (e) {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });

    // 监听滚动事件
    window.addEventListener("scroll", handleScroll);

    // 初始检查
    handleScroll();
  }
})();
