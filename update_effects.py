import os
import json

# Define the category keyword mapping
CATEGORIES = {
    "导航": "导航 & 菜单",
    "菜单": "导航 & 菜单",
    "背景": "背景 & 氛围特效",
    "雪": "背景 & 氛围特效",
    "烟花": "背景 & 氛围特效",
    "泡泡": "背景 & 氛围特效",
    "粒子": "背景 & 氛围特效",
    "雨": "背景 & 氛围特效",
    "波浪": "背景 & 氛围特效",
    "卡片": "卡片 & 图片展示",
    "画廊": "卡片 & 图片展示",
    "堆叠": "卡片 & 图片展示",
    "扭曲": "卡片 & 图片展示",
    "图片": "卡片 & 图片展示",
    "照片": "卡片 & 图片展示",
    "翻书": "卡片 & 图片展示",
    "折叠": "卡片 & 图片展示",
    "翻转": "卡片 & 图片展示",
    "倾斜": "卡片 & 图片展示",
    "水波": "卡片 & 图片展示",
    "文本": "文字 & 排版",
    "文案": "文字 & 排版",
    "快闪": "文字 & 排版",
    "打字": "文字 & 排版",
    "文字": "文字 & 排版",
    "按钮": "交互 & 按钮",
    "线路": "交互 & 按钮",
    "玻璃": "交互 & 按钮",
    "悬停": "交互 & 按钮",
    "水滴": "交互 & 按钮",
    "边框": "交互 & 按钮",
    "3D": "动画 & 视觉效果",
    "立方体": "动画 & 视觉效果",
    "飞鸟": "动画 & 视觉效果",
}

def get_category(name):
    for kw, cat in CATEGORIES.items():
        if kw in name:
            return cat
    return "其他动效"

def main():
    workspace_dir = os.path.dirname(os.path.abspath(__file__))
    effects_dir = os.path.join(workspace_dir, "effects")
    
    if not os.path.exists(effects_dir):
        print(f"Error: 'effects' directory not found in {workspace_dir}!")
        return

    effects_list = []
    
    # Sort items numerically if they start with numbers
    def sort_key(name):
        parts = name.split('-', 1)
        if parts[0].isdigit():
            return (0, int(parts[0]), name)
        # Try finding float numbers (like 17.波浪遮罩)
        import re
        float_match = re.match(r'^(\d+\.?\d*)', name)
        if float_match:
            try:
                return (0, float(float_match.group(1)), name)
            except ValueError:
                pass
        return (1, 0, name)

    items = sorted(os.listdir(effects_dir), key=sort_key)
    
    for item in items:
        item_path = os.path.join(effects_dir, item)
        if not os.path.isdir(item_path) or item.startswith('.') or item == '示例效果':
            continue
            
        files = os.listdir(item_path)
        
        # 1. Detect HTML files and entry point
        html_files = [f for f in files if f.lower().endswith('.html')]
        if not html_files:
            print(f"Warning: No HTML entry found in {item}, skipping...")
            continue
            
        entry_html = "index.html" if "index.html" in html_files else html_files[0]
        
        # 2. Check structure
        has_html = "index.html" in files
        has_css = "style.css" in files
        has_js = "script.js" in files
        
        # 3. Find images inside folder
        images = [f for f in files if f.lower().endswith(('.png', '.jpg', '.jpeg', '.svg', '.gif'))]
        
        # 4. Resolve category
        category = get_category(item)
        
        # 5. Resolve screenshot in '示例效果' folder
        screenshot_path = ""
        screenshots_dir = os.path.join(effects_dir, "示例效果")
        if os.path.exists(screenshots_dir):
            screenshot_name = f"{item}.png"
            exact_screenshot = os.path.join(screenshots_dir, screenshot_name)
            if os.path.exists(exact_screenshot):
                screenshot_path = f"effects/示例效果/{screenshot_name}"
            else:
                # Do a fuzzy check (case/separator insensitive)
                try:
                    all_screenshots = os.listdir(screenshots_dir)
                    for s in all_screenshots:
                        s_norm = s.replace('-', '').replace(' ', '').replace('_', '').lower()
                        item_norm = item.replace('-', '').replace(' ', '').replace('_', '').replace('.', '').lower()
                        if s_norm.startswith(item_norm) or item_norm.startswith(s_norm.split('.')[0]):
                            screenshot_path = f"effects/示例效果/{s}"
                            break
                except Exception:
                    pass

        # 6. Append to list
        display_name = item.split('-', 1)[-1] if '-' in item else item
        effects_list.append({
            "id": item,
            "name": display_name,
            "dir": item,
            "category": category,
            "files": files,
            "has_html": has_html,
            "has_css": has_css,
            "has_js": has_js,
            "images": images,
            "entry_html": entry_html,
            "entry_path": f"effects/{item}/{entry_html}",
            "screenshot": screenshot_path
        })

    # Save to effects_data.js
    js_content = f"const EFFECTS_DATA = {json.dumps(effects_list, ensure_ascii=False, indent=2)};"
    js_path = os.path.join(workspace_dir, "effects_data.js")
    
    with open(js_path, "w", encoding="utf-8") as f:
        f.write(js_content)
        
    print(f"Successfully scanned {len(effects_list)} effects.")
    print(f"Regenerated effects_data.js at: {js_path}")

if __name__ == "__main__":
    main()
