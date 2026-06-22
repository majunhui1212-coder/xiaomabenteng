class RollingGallery {
  constructor(container, options = {}) {
    this.container = container;
    this.track = container.querySelector("#galleryTrack");

    // 配置选项
    this.autoplay = options.autoplay !== false;
    this.pauseOnHover = options.pauseOnHover !== false;
    this.images = options.images || this.getDefaultImages();
    this.autoplayInterval = options.autoplayInterval || 2000;
    this.dragFactor = options.dragFactor || 0.15;
    this.momentumFactor = options.momentumFactor || 0.05;

    // 状态变量
    this.rotateY = 0;
    this.isDragging = false;
    this.isHovered = false;
    this.dragStartX = 0;
    this.dragStartRotation = 0;
    this.autoplayTimer = null;
    this.autoplayTimeout = null;
    this.hoverTimeout = null;
    this.resizeTimeout = null;
    this.animationFrame = null;
    this.targetRotateY = 0;
    this.currentRotateY = 0;
    this.isAnimating = false;

    // 常量
    this.FACE_COUNT = 10;
    this.cylinderWidth = window.innerWidth <= 640 ? 1100 : 1800;
    this.faceWidth = (this.cylinderWidth / 10) * 1.5;
    this.radius = this.cylinderWidth / (2 * Math.PI);

    // 初始化
    this.init();
  }

  getDefaultImages() {
    return [
      // "../assets/images/banner1.jpg",
      // "../assets/images/banner2.jpg",
      // "../assets/images/banner3.jpg",
      // "../assets/images/banner4.jpg",
      // "../assets/images/banner5.jpg",
      // "../assets/images/banner6.jpg",
      // "../assets/images/banner7.jpg",
      // "../assets/images/banner8.jpg",
      // "../assets/images/banner9.jpg",
      // "../assets/images/banner1.jpg", // 循环使用，确保有足够的图片
      "https://images.unsplash.com/photo-1528181304800-259b08848526?q=80&w=3870&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?q=80&w=3870&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=3456&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1495103033382-fe343886b671?q=80&w=3870&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506781961370-37a89d6b3095?q=80&w=3264&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1599576838688-8a6c11263108?q=80&w=3870&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1494094892896-7f14a4433b7a?q=80&w=3870&auto=format&fit=crop",
      "https://plus.unsplash.com/premium_photo-1664910706524-e783eed89e71?q=80&w=3869&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1503788311183-fa3bf9c4bc32?q=80&w=3870&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1585970480901-90d6bb2a48b5?q=80&w=3774&auto=format&fit=crop",
    ];
  }

  init() {
    this.renderImages();
    this.setupEventListeners();
    this.updateTrackStyle();
    this.currentRotateY = this.rotateY;
    this.targetRotateY = this.rotateY;
    this.updateTransform();

    if (this.autoplay) {
      // 延迟启动自动播放，让初始渲染完成
      setTimeout(() => {
        this.startAutoplay();
      }, 500);
    }
  }

  renderImages() {
    // 确保有足够的图片
    const displayImages = this.getDisplayImages();
    this.track.innerHTML = "";

    displayImages.forEach((url, index) => {
      const item = document.createElement("div");
      item.className = "gallery-item";
      item.style.width = `${this.faceWidth}px`;
      item.style.transform = `rotateY(${
        index * (360 / this.FACE_COUNT)
      }deg) translateZ(${this.radius}px)`;

      const img = document.createElement("img");
      img.src = url;
      img.alt = `Gallery image ${index + 1}`;
      img.loading = "lazy";
      img.decoding = "async";

      // 图片加载错误处理
      img.onerror = function () {
        console.warn(`图片加载失败: ${url}`);
        this.style.display = "none";
      };

      // 确保图片加载完成后正确显示
      img.onload = function () {
        // 图片加载成功后的处理
      };

      item.appendChild(img);
      this.track.appendChild(item);
    });
  }

  getDisplayImages() {
    if (this.images.length >= this.FACE_COUNT) {
      return this.images;
    }

    const repeatedImages = [];
    const repetitions = Math.ceil(this.FACE_COUNT / this.images.length);

    for (let i = 0; i < repetitions; i++) {
      repeatedImages.push(...this.images);
    }

    return repeatedImages.slice(0, this.FACE_COUNT);
  }

  updateTrackStyle() {
    this.track.style.width = `${this.cylinderWidth}px`;
  }

  updateTransform(immediate = false) {
    if (immediate || this.isDragging) {
      // 拖拽时立即更新，无过渡
      this.track.classList.add("dragging");
      this.rotateY = this.targetRotateY;
      this.currentRotateY = this.rotateY;
      this.track.style.transform = `rotateY(${this.rotateY}deg)`;
    } else {
      // 非拖拽时使用平滑过渡（使用 CSS transition）
      this.track.classList.remove("dragging");
      this.targetRotateY = this.rotateY;
      this.currentRotateY = this.rotateY;
      // 直接设置 transform，CSS transition 会自动处理平滑过渡
      this.track.style.transform = `rotateY(${this.rotateY}deg)`;
    }
  }

  smoothAnimate() {
    if (this.isAnimating) return;

    this.isAnimating = true;
    const startRotateY = this.currentRotateY;
    const endRotateY = this.targetRotateY;
    const startTime = performance.now();
    const duration = 1200; // 动画持续时间（毫秒），与 CSS transition 一致

    const animate = (currentTime) => {
      if (this.isDragging) {
        this.isAnimating = false;
        return;
      }

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // 使用缓动函数
      const easeProgress = this.easeOutCubic(progress);
      this.currentRotateY =
        startRotateY + (endRotateY - startRotateY) * easeProgress;
      this.track.style.transform = `rotateY(${this.currentRotateY}deg)`;

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        this.currentRotateY = endRotateY;
        this.isAnimating = false;
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  setupEventListeners() {
    // 鼠标事件
    this.track.addEventListener("mousedown", this.handleMouseDown.bind(this));
    this.container.addEventListener(
      "mouseenter",
      this.handleMouseEnter.bind(this)
    );
    this.container.addEventListener(
      "mouseleave",
      this.handleMouseLeave.bind(this)
    );

    // 触摸事件（移动端支持）
    this.track.addEventListener(
      "touchstart",
      this.handleTouchStart.bind(this),
      { passive: true }
    );

    // 窗口大小改变
    window.addEventListener("resize", this.handleResize.bind(this), {
      passive: true,
    });
  }

  handleMouseDown(e) {
    this.isDragging = true;
    this.dragStartX = e.clientX;
    this.dragStartRotation = this.rotateY;

    this.stopAutoplay();

    document.addEventListener("mousemove", this.handleMouseMove);
    document.addEventListener("mouseup", this.handleMouseUp);

    e.preventDefault();
  }

  handleMouseMove = (e) => {
    if (!this.isDragging) return;

    const deltaX = e.clientX - this.dragStartX;
    const rotationDelta = deltaX * this.dragFactor;
    this.targetRotateY = this.dragStartRotation + rotationDelta;
    this.rotateY = this.targetRotateY;
    this.updateTransform(true);
  };

  handleMouseUp = (e) => {
    if (!this.isDragging) return;

    this.isDragging = false;

    const deltaX = e.clientX - this.dragStartX;
    const velocity = deltaX * this.momentumFactor;
    this.rotateY += velocity;
    this.currentRotateY = this.rotateY;
    this.updateTransform();

    document.removeEventListener("mousemove", this.handleMouseMove);
    document.removeEventListener("mouseup", this.handleMouseUp);

    this.stopAutoplay();

    if (this.autoplay) {
      if (this.pauseOnHover && this.isHovered) {
        return;
      } else {
        this.autoplayTimeout = setTimeout(() => {
          if (!this.isDragging && (!this.pauseOnHover || !this.isHovered)) {
            this.startAutoplay();
          }
        }, 1500);
      }
    }
  };

  handleTouchStart(e) {
    if (e.touches.length !== 1) return;

    this.isDragging = true;
    this.dragStartX = e.touches[0].clientX;
    this.dragStartRotation = this.rotateY;

    this.stopAutoplay();

    document.addEventListener("touchmove", this.handleTouchMove, {
      passive: true,
    });
    document.addEventListener("touchend", this.handleTouchEnd);

    e.preventDefault();
  }

  handleTouchMove = (e) => {
    if (!this.isDragging || e.touches.length !== 1) return;

    const deltaX = e.touches[0].clientX - this.dragStartX;
    const rotationDelta = deltaX * this.dragFactor;
    this.targetRotateY = this.dragStartRotation + rotationDelta;
    this.rotateY = this.targetRotateY;
    this.updateTransform(true);
  };

  handleTouchEnd = (e) => {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.currentRotateY = this.rotateY;

    document.removeEventListener("touchmove", this.handleTouchMove);
    document.removeEventListener("touchend", this.handleTouchEnd);

    this.stopAutoplay();

    if (this.autoplay) {
      this.autoplayTimeout = setTimeout(() => {
        if (!this.isDragging && (!this.pauseOnHover || !this.isHovered)) {
          this.startAutoplay();
        }
      }, 1500);
    }
  };

  handleMouseEnter() {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }

    this.hoverTimeout = setTimeout(() => {
      this.isHovered = true;

      if (this.autoplay && this.pauseOnHover && !this.isDragging) {
        this.stopAutoplay();
      }
    }, 50);
  }

  handleMouseLeave() {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }

    this.hoverTimeout = setTimeout(() => {
      this.isHovered = false;

      if (this.autoplay && this.pauseOnHover && !this.isDragging) {
        this.stopAutoplay();
        this.autoplayTimeout = setTimeout(() => {
          if (this.autoplay && !this.isDragging && !this.isHovered) {
            this.startAutoplay();
          }
        }, 100);
      }
    }, 50);
  }

  handleResize() {
    if (this.resizeTimeout) return;

    this.resizeTimeout = setTimeout(() => {
      const isSmall = window.innerWidth <= 640;
      this.cylinderWidth = isSmall ? 1100 : 1800;
      this.faceWidth = (this.cylinderWidth / 10) * 1.5;
      this.radius = this.cylinderWidth / (2 * Math.PI);

      this.updateTrackStyle();
      this.renderImages();
      this.updateTransform();

      this.resizeTimeout = null;
    }, 100);
  }

  startAutoplay() {
    if (
      !this.autoplay ||
      this.isDragging ||
      (this.pauseOnHover && this.isHovered)
    ) {
      return;
    }

    this.stopAutoplay();

    // 一张张切换，每次切换后停顿
    const rotationStep = 360 / this.FACE_COUNT;
    const animationDuration = 1200; // CSS transition 持续时间（毫秒）
    const pauseDuration = this.autoplayInterval - animationDuration; // 停顿时间

    const switchToNext = () => {
      if (this.isDragging || (this.pauseOnHover && this.isHovered)) {
        return;
      }

      // 更新目标旋转角度（切换一张图片）
      this.rotateY -= rotationStep;

      // 使用平滑动画切换（CSS transition 会自动处理）
      this.updateTransform();

      // 等待动画完成 + 停顿时间后再切换下一张
      const totalWaitTime = animationDuration + Math.max(pauseDuration, 1500); // 至少停顿 1.5 秒
      this.autoplayTimer = setTimeout(() => {
        if (!this.isDragging && (!this.pauseOnHover || !this.isHovered)) {
          switchToNext();
        }
      }, totalWaitTime);
    };

    // 开始第一张切换
    switchToNext();
  }

  stopAutoplay() {
    if (this.autoplayTimer) {
      if (typeof this.autoplayTimer === "number") {
        // 可能是 requestAnimationFrame 的 ID
        if (this.autoplayTimer > 1000000) {
          // requestAnimationFrame 返回的 ID 通常很大
          cancelAnimationFrame(this.autoplayTimer);
        } else {
          // setTimeout 返回的 ID
          clearTimeout(this.autoplayTimer);
        }
      } else {
        clearInterval(this.autoplayTimer);
      }
      this.autoplayTimer = null;
    }
    if (this.autoplayTimeout) {
      clearTimeout(this.autoplayTimeout);
      this.autoplayTimeout = null;
    }
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  destroy() {
    this.stopAutoplay();
    this.isAnimating = false;
    window.removeEventListener("resize", this.handleResize);
    document.removeEventListener("mousemove", this.handleMouseMove);
    document.removeEventListener("mouseup", this.handleMouseUp);
    document.removeEventListener("touchmove", this.handleTouchMove);
    document.removeEventListener("touchend", this.handleTouchEnd);

    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }
}

// 初始化画廊
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("galleryContainer");

  // 自定义图片数组（可选）
  const customImages = [
    // 可以替换为你自己的图片URL
  ];

  const gallery = new RollingGallery(container, {
    autoplay: true, // 自动播放
    pauseOnHover: true, // 悬停暂停
    autoplayInterval: 3500, // 自动播放间隔（毫秒）- 每张图片停留时间，包含切换动画时间
    images: customImages.length > 0 ? customImages : undefined, // 使用默认图片
  });

  // 页面卸载时清理
  window.addEventListener("beforeunload", () => {
    gallery.destroy();
  });
});
