# S.S. Capybara — Clockwork Wooden Airship (Three.js Single-File Package)

- **生成模型 / AI Model**: Gemini
- **引擎与依赖 / Engine**: Three.js `r169` (`OrbitControls`, ES Module ImportMap via jsDelivr CDN)
- **入口文件 / Entry File**: `capybara_airship.html`

---

## 一、运行方式 (How to Run)

1. 解压压缩包后，直接用现代浏览器（Chrome / Edge / Safari / Firefox）打开 `capybara_airship.html`（需联网加载 Three.js CDN 模块）。
2. 如浏览器安全策略限制本地 `file://` 协议加载 ES Module，可在解压目录运行：
   ```bash
   python -m http.server 8000
   ```
   随后访问 `http://localhost:8000/capybara_airship.html`。

---

## 二、3D 模型与结构清单 (3D Model Breakdown)

### 1. 水豚机长 (`capybaraGroup`)
- **身形与头部**：程序化粗毛贴图（`CanvasTexture`），桶状敦实躯干、方顶扁吻部、深色鼻垫与宽间距鼻孔、半睁慵懒眼睑、后置圆耳，双前爪搭在舵轮上。
- **飞行员护目镜 (`gogglesGroup`)**：对称朝前外张的黄铜铆钉镜筒、皮革垫圈、琥珀色高反光清漆镜片（`MeshPhysicalMaterial`）、黄铜鼻梁桥、绕头皮革绑带与后脑黄铜扣。
- **动态围巾 (`scarfSegments`)**：领口围巾结 + 11 节铰链式深红布段 + 金色流苏，随节流阀推力实时改变波频与摆幅。

### 2. 发条木质飞艇 (`airshipRoot` — S.S. Capybara)
- **放样木板船舱 (`gondolaGroup`)**：参数化放样木质船体（外船壳 + 内衬 + 甲板 + 龙骨）、外侧弧形木肋、黄铜舷边铆钉、船艏斜桅与黄铜护栏。
- **驾驶舱内饰 (`cockpitGroup`)**：铆钉皮革座椅、红木仪表台与后倾曲面风挡、3 个实时摆针黄铜仪表（`PSI` / `ALT` / `KTS`）、联动实体推力杆、8 辐条舵轮与联动船尾舵。
- **铜质锅炉与烟囱 (`boilerGroup`)**：卧式铆接铜锅炉、动态火光燃烧室（`PointLight` + `emissiveIntensity`）、黄铜烟囱与 16 组上升扩散蒸汽粒子。
- **啮合反转侧翼齿轮组 (`animatedGears`)**：左右两舷各 3 组对称齿形挤出齿轮（16 齿 / 10 齿 / 12 齿），按节圆半径与精确相位角啮合，角速度严格满足反转齿比。
- **船尾发条钥匙 (`windupKeyGroup`)**：复古黄铜发条旋钮，随发条传动同步匀速转动。
- **外伸木质螺旋桨 (`propellers` & `blurDiscs`)**：黄铜桁架支臂、铜整流罩、双叶红木螺旋桨与随推力渐变透明度的动态模糊盘。
- **飞艇气囊与索具 (`envelopeGroup`)**：车削成型（`LatheGeometry`）奶油/酒红拼接帆布气囊、黄铜中腰纹饰与加强肋环、4 片十字稳定尾翼与交叉张紧悬吊索具。

### 3. 天空环境与交互 HUD
- **环境**：自定义 GLSL 黄金时刻天空穹顶、PCF 柔影平行光、24 组漂浮体积云团、22 条高速风痕。
- **控制**：`OrbitControls` 阻尼交互；右上角可折叠黄铜羊皮纸 HUD 支持 3 组相机预设（快捷键 `1`/`2`/`3`）、推力滑块（`0%–100%`）及播放/暂停（快捷键 `Space`）。
