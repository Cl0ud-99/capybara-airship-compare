# 水豚时钟木质飞艇 — Capybara Clockwork Airship

## 直接看（不用装任何东西）

解压后，双击打开 `capybara-clockwork-airship.html` 就能看。单文件，Three.js 已内联，不用联网、不用本地服务器。

## 源码在哪里

源码全部包括在压缩包里，不只是成品：

```
capybara-clockwork-airship.html   # 单文件成品（可直接打开）
src/
  index.html                      # 可读版入口，和单文件版效果相同
  main.js                         # 场景源码，510 行：水豚、飞艇、齿轮、动画全在这里
  three-r186.min.js               # Three.js r186（含 OrbitControls）
MODEL.md                          # 模型说明：这是什么模型、每个部件怎么做、齿轮参数表
README.md                         # 本文件
```

想改模型，改 `src/main.js`，然后用浏览器打开 `src/index.html` 看效果。

想自己重新打包单文件：把 `src/three-r186.min.js` 用 base64 嵌进 `src/index.html` 的 script 标签，把 `src/main.js` 内联进去，就是 `capybara-clockwork-airship.html` 的做法。

## 这是什么模型

**不是导入的外部模型文件。** 没有 `.glb / .obj / .fbx`，全部是 Three.js 程序化建模：球体、圆柱、圆环、拉伸体拼出来的。详细部件表、尺寸、材质、齿轮参数见 `MODEL.md`。

一句话概括：戴黄铜飞行员风镜、皮帽、红围巾的水豚船长，双爪搭在舵轮上，驾驶一艘条纹气囊 + 木质吊舱 + 5 个外露黄铜齿轮 + 钟表盘 + 船尾螺旋桨的时钟木质飞艇，飘在 13 朵云和 5 只鸟之间。

## 操作

- 拖动：旋转视角
- 滚轮 / 双指：缩放
- 右键拖动：平移
- 页面按钮：重置视角、自动环绕、动效开关

## 技术

- Three.js r186，WebGLRenderer，抗锯齿，ACESFilmic 色调映射，PCF 阴影
- OrbitControls，距离 6–32，阻尼 0.06
