// 配置参数（对应 Vue 组件的 props）
const config = {
  padding: 120, // 磁铁吸引范围
  disabled: false, // 是否禁用
  magnetStrength: 3, // 磁铁强度（数值越大，跟随效果越弱）
  activeTransition: "transform 0.2s ease-out", // 激活时的过渡效果
  inactiveTransition: "transform 0.6s ease-in-out", // 非激活时的过渡效果
};

// 获取 DOM 元素
const magnetWrapper = document.getElementById("magnetWrapper");
const magnetInner = document.getElementById("magnetInner");

// 状态管理
let isActive = false;
let position = { x: 0, y: 0 };

// 鼠标移动处理函数
function handleMouseMove(e) {
  if (!magnetWrapper || config.disabled) return;

  // 获取元素的位置和尺寸信息
  const rect = magnetWrapper.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  // 计算鼠标与元素中心的距离
  const distX = Math.abs(centerX - e.clientX);
  const distY = Math.abs(centerY - e.clientY);

  // 判断鼠标是否在吸引范围内
  if (
    distX < rect.width / 2 + config.padding &&
    distY < rect.height / 2 + config.padding
  ) {
    // 激活状态：计算偏移量
    isActive = true;
    const offsetX = (e.clientX - centerX) / config.magnetStrength;
    const offsetY = (e.clientY - centerY) / config.magnetStrength;
    position = { x: offsetX, y: offsetY };

    // 应用激活状态的过渡效果
    magnetInner.style.transition = config.activeTransition;
  } else {
    // 非激活状态：重置位置
    isActive = false;
    position = { x: 0, y: 0 };

    // 应用非激活状态的过渡效果
    magnetInner.style.transition = config.inactiveTransition;
  }

  // 应用 transform
  magnetInner.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
}

// 监听鼠标移动事件
window.addEventListener("mousemove", handleMouseMove);

// 页面卸载时清理事件监听器（虽然单页应用可能不需要，但这是最佳实践）
window.addEventListener("beforeunload", () => {
  window.removeEventListener("mousemove", handleMouseMove);
});
