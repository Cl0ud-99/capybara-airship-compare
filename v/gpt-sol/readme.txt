水豚机长 · 发条飞艇

打开方式
1. 完整解压这个 ZIP。
2. 双击根目录的 index.html，或双击 launcher.cmd。
3. 使用支持 WebGL 2 的现代浏览器（Chrome、Edge 或 Firefox）。

index.html 是独立的单文件 HTML，已内嵌 Three.js、OrbitControls、全部场景代码与样式。
只需要这一个 HTML 就能运行，可以复制到别的文件夹或电脑。
打开页面无需网络，无需安装 Node.js，也无需启动服务器。

操作
拖动：旋转视角。
滚轮：拉近 / 拉远。
右键拖动：平移。
手机：单指旋转，双指缩放 / 平移。
双击画面、点击「归位」或聚焦画布后按 0：返回全景。
全景 / 机长 / 发条：切换到相应视角。
暂停：定格飞艇、齿轮、螺旋桨、围巾和云层，再点「继续」恢复。
巡览：自动绕飞艇旋转；再次点击停止。
全屏：进入或退出全屏（桌面浏览器支持时）。

源码与修改
work/scene.js：船体、木纹、驾驶台、钟表动力、吊索、云层、灯光、交互和动画。
work/capybara.js：水豚机长、护目镜、飞行帽、围巾。
work/balloon.js：飞艇气囊、布纹、木圈、绳缝、CAPY 标识。
work/template.html：界面、配色、响应式布局。
work/three.module.min.js：Three.js 0.170.0 官方库。
work/OrbitControls.js：同版本官方轨道控制器。
work/build.mjs：把以上内容组合成独立 HTML。
work/THREE-LICENSE.txt：Three.js 的 MIT 许可证。

重新生成
只有修改源码后的重新生成需要 Node.js 18 或更新版本。
安装好 Node.js 后，双击根目录的「重新生成.cmd」。
脚本会生成 outputs/index.html，并更新根目录 index.html。
也可以在解压后的根目录执行 node work/build.mjs，再把 outputs/index.html 复制到根目录。
整个生成过程不下载依赖，不需要 npm install。
index.html 本身也包含所有源码，可以直接用文本编辑器查看。

所有模型与纹理均由代码生成，未使用外部模型、图片或字体。
如果 Windows 阻止下载的 ZIP，可以右键 ZIP → 属性 → 解除锁定，然后再完整解压。