# Skybound Capybara / 云端水豚号

一个完全自包含的 Three.js 互动场景：戴着黄铜飞行护目镜的水豚，驾驶一艘木质发条飞艇穿行在金色黄昏的云海上。

## 直接预览

双击 **`capybara-airship.html`**，或将它拖进现代浏览器。

- 不需要服务器
- 不需要联网
- Three.js r170 与 OrbitControls 已全部内嵌在这个单一 HTML 文件中

操作：

- **拖动**：环绕观察飞艇
- **滚轮 / 双指捏合**：缩放
- 停止操作片刻后，镜头会缓慢自动环绕

## 包内文件

```
skybound-capybara-airship/
├── capybara-airship.html          # 可直接打开的单文件成品
├── preview.png                    # 场景预览图
├── README.md
├── THIRD_PARTY_NOTICES.txt        # Three.js MIT 许可说明
└── source/
    ├── build.py                   # 本地打包脚本
    ├── scene.js                   # Three.js 场景、模型、动画源码
    ├── template.html              # HTML / CSS / UI 模板
    └── vendor/
        ├── three.module.min.js    # Three.js r170
        └── OrbitControls.js       # 轨道控制器
```

## 从源码重新构建

需要 Python 3.9+（只使用标准库）。在包根目录运行：

```bash
python source/build.py
```

脚本会把 `source/scene.js`、`source/template.html` 以及 vendor 目录中的 Three.js 模块重新内嵌，并覆盖根目录的 `capybara-airship.html`。

## 实现要点

- 程序化木质、帆布纹理（CanvasTexture）
- 手工建模的水豚、护目镜、围巾及发条飞艇
- 黄铜齿轮、推进器、锅炉、灯光和蒸汽粒子动画
- 雾化天空、分层云海、漂浮尘埃
- OrbitControls 带阻尼、缩放手势和空闲自动环绕
- 桌面与竖屏移动端自适应构图
