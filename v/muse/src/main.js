// main.js — Capybara Clockwork Airship, scene source
// Extracted verbatim from capybara-clockwork-airship.html (second <script> block).
// Depends on: three-r186.min.js  (THREE + THREE.OrbitControls, bundled in the single-file HTML as a base64 data URI)
// Run the single-file HTML directly, or rebuild with: index.html in this src/ folder.
// See ../MODEL.md for the full model breakdown.
(function(){
  "use strict";
  var errBox = document.getElementById('err');
  function showErr(msg){ errBox.style.display='block'; errBox.textContent = 'Something went wrong rendering the scene:\n' + msg; }
  window.addEventListener('error', function(e){ showErr(e.message || String(e.error||e)); });
  window.addEventListener('unhandledrejection', function(e){ showErr(String(e.reason||e)); });

  // Heavy WebGL setup runs after DOMContentLoaded so the page itself
  // becomes interactive immediately; see start() scheduling at the bottom.
  function start(){

  var canvas = document.getElementById('scene');
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8ec3d9);
  scene.fog = new THREE.Fog(0xa8cddd, 28, 62);

  var pmrem = new THREE.PMREMGenerator(renderer);
  if (THREE.RoomEnvironment) {
    scene.environment = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
  }

  var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
  var HOME_POS = new THREE.Vector3(10.5, 4.6, 11.5);
  var HOME_TGT = new THREE.Vector3(0, 1.1, 0);
  camera.position.copy(HOME_POS);

  // OrbitControls ships in the bundled three.min.js; the compact fallback
  // below only runs if that global is ever missing, so orbiting never breaks.
  function FallbackOrbit(camera, dom){
    this.camera=camera; this.domElement=dom; this.target=new THREE.Vector3();
    this.enableDamping=true; this.dampingFactor=0.06; this.minDistance=6; this.maxDistance=32;
    this.maxPolarAngle=Math.PI*0.72; this.autoRotate=false; this.autoRotateSpeed=1.1;
    var sph=new THREE.Spherical(), goal=new THREE.Spherical(), dragging=false, px=0, py=0, pinch=0;
    var self=this;
    function sync(){ var off=camera.position.clone().sub(self.target); sph.setFromVector3(off); goal.copy(sph); }
    sync();
    dom.addEventListener('pointerdown', function(e){ dragging=true; px=e.clientX; py=e.clientY; dom.setPointerCapture(e.pointerId); });
    dom.addEventListener('pointermove', function(e){ if(!dragging) return;
      goal.theta -= (e.clientX-px)*0.005; goal.phi -= (e.clientY-py)*0.005;
      goal.phi=Math.max(0.15, Math.min(self.maxPolarAngle, goal.phi)); px=e.clientX; py=e.clientY; });
    dom.addEventListener('pointerup', function(){ dragging=false; });
    dom.addEventListener('wheel', function(e){ e.preventDefault();
      goal.radius=Math.max(self.minDistance, Math.min(self.maxDistance, goal.radius*(1+Math.sign(e.deltaY)*0.09))); }, { passive:false });
    dom.addEventListener('touchmove', function(e){ if(e.touches.length===2){
      var d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX, e.touches[0].clientY-e.touches[1].clientY);
      if(pinch) goal.radius=Math.max(self.minDistance, Math.min(self.maxDistance, goal.radius*pinch/d));
      pinch=d; } }, { passive:true });
    dom.addEventListener('touchend', function(){ pinch=0; });
    this.update=function(){
      if(self.autoRotate) goal.theta -= self.autoRotateSpeed*0.005;
      sph.theta += (goal.theta-sph.theta)*0.12; sph.phi += (goal.phi-sph.phi)*0.12; sph.radius += (goal.radius-sph.radius)*0.12;
      camera.position.copy(self.target).add(new THREE.Vector3().setFromSpherical(sph));
      camera.lookAt(self.target);
    };
  }
  var OrbitCtor = (typeof THREE.OrbitControls === 'function') ? THREE.OrbitControls : FallbackOrbit;
  var controls = new OrbitCtor(camera, renderer.domElement);
  controls.target.copy(HOME_TGT);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 6;
  controls.maxDistance = 32;
  controls.maxPolarAngle = Math.PI * 0.72;
  controls.autoRotateSpeed = 1.1;

  // ---------- Lights ----------
  var sun = new THREE.DirectionalLight(0xfff1d6, 2.6);
  sun.position.set(10, 14, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left=-12; sun.shadow.camera.right=12; sun.shadow.camera.top=12; sun.shadow.camera.bottom=-12;
  sun.shadow.camera.far=45; sun.shadow.bias=-0.0004;
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0xcfe8f5, 0x6b5a44, 0.85));
  var rim = new THREE.DirectionalLight(0x9fd0ff, 0.9);
  rim.position.set(-10, 5, -9); scene.add(rim);
  var warm = new THREE.PointLight(0xffb45e, 12, 12, 1.8);
  warm.position.set(0,-0.6,2.2); scene.add(warm);

  // ---------- Canvas textures ----------
  function makeCanvas(w,h,draw){
    var c=document.createElement('canvas'); c.width=w; c.height=h;
    draw(c.getContext('2d'), w, h);
    var t=new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy=4;
    return t;
  }
  var balloonTex = makeCanvas(1024,512,function(g,w,h){
    var stripes=['#b8452e','#f3e3c2','#b8452e','#f3e3c2','#2f6f6a','#f3e3c2','#b8452e','#f3e3c2'];
    var sw=w/stripes.length;
    for(var i=0;i<stripes.length;i++){ g.fillStyle=stripes[i]; g.fillRect(i*sw,0,sw+1,h); }
    g.fillStyle='rgba(90,50,20,0.16)';
    for(var y=32;y<h;y+=64) g.fillRect(0,y,w,3);
    g.fillStyle='rgba(255,255,255,0.10)'; g.fillRect(0,0,w,70);
  });
  balloonTex.wrapS = THREE.RepeatWrapping;
  var woodTex = makeCanvas(512,512,function(g,w,h){
    g.fillStyle='#8a5a2e'; g.fillRect(0,0,w,h);
    for(var y=0;y<h;y+=42){
      g.fillStyle='rgba(60,32,10,'+(0.12+Math.random()*0.12)+')'; g.fillRect(0,y,w,3);
      g.fillStyle='rgba(255,220,160,0.08)'; g.fillRect(0,y+4,w,10);
      for(var x=0;x<w;x+=7){ g.fillStyle='rgba(50,28,8,'+(Math.random()*0.10)+')'; g.fillRect(x+Math.sin(y+x)*3, y+6, 2, 30); }
    }
  });
  woodTex.wrapS=woodTex.wrapT=THREE.RepeatWrapping;
  var softTex = makeCanvas(128,128,function(g,w,h){
    var r=g.createRadialGradient(64,64,4,64,64,62);
    r.addColorStop(0,'rgba(255,255,255,0.95)'); r.addColorStop(0.55,'rgba(255,255,255,0.55)'); r.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=r; g.fillRect(0,0,w,h);
  });

  // ---------- Materials ----------
  var M = {
    balloon: new THREE.MeshStandardMaterial({ map:balloonTex, roughness:0.62, metalness:0.02 }),
    wood:    new THREE.MeshStandardMaterial({ map:woodTex, color:0xb98a56, roughness:0.82, metalness:0 }),
    woodDark:new THREE.MeshStandardMaterial({ map:woodTex, color:0x7c4f24, roughness:0.85, metalness:0 }),
    brass:   new THREE.MeshStandardMaterial({ color:0xc9972f, roughness:0.28, metalness:1.0 }),
    brassOld:new THREE.MeshStandardMaterial({ color:0x9a7422, roughness:0.42, metalness:1.0 }),
    copper:  new THREE.MeshStandardMaterial({ color:0xb0662f, roughness:0.35, metalness:1.0 }),
    iron:    new THREE.MeshStandardMaterial({ color:0x3d4448, roughness:0.45, metalness:0.9 }),
    fur:     new THREE.MeshStandardMaterial({ color:0x8d6b48, roughness:0.95, metalness:0 }),
    furLight:new THREE.MeshStandardMaterial({ color:0xa9855e, roughness:0.95, metalness:0 }),
    furDark: new THREE.MeshStandardMaterial({ color:0x5f4630, roughness:0.95, metalness:0 }),
    nose:    new THREE.MeshStandardMaterial({ color:0x2e2119, roughness:0.55, metalness:0 }),
    eye:     new THREE.MeshStandardMaterial({ color:0x14100c, roughness:0.25, metalness:0.1 }),
    leather: new THREE.MeshStandardMaterial({ color:0x6e3f1d, roughness:0.7, metalness:0 }),
    scarf:   new THREE.MeshStandardMaterial({ color:0xc23b2e, roughness:0.85, metalness:0, side:THREE.DoubleSide }),
    cream:   new THREE.MeshStandardMaterial({ color:0xf3e3c2, roughness:0.7, metalness:0 }),
    redFabric:new THREE.MeshStandardMaterial({ color:0xa83a2a, roughness:0.8, metalness:0, side:THREE.DoubleSide }),
    glass:   new THREE.MeshPhysicalMaterial({ color:0xbfe3ef, roughness:0.08, metalness:0.1, transparent:true, opacity:0.45, depthWrite:false, envMapIntensity:1.6 }),
    rope:    new THREE.MeshStandardMaterial({ color:0xc9a86a, roughness:1, metalness:0 }),
    lamp:    new THREE.MeshStandardMaterial({ color:0xffd98a, emissive:0xffa62b, emissiveIntensity:1.6, roughness:0.4 }),
    cloud:   new THREE.MeshStandardMaterial({ color:0xffffff, roughness:1, metalness:0, transparent:true, opacity:0.94 })
  };

  function mesh(geo, mat, x,y,z, parent){
    var m=new THREE.Mesh(geo, mat); m.position.set(x||0,y||0,z||0);
    m.castShadow=true; m.receiveShadow=true; (parent||scene).add(m); return m;
  }
  function cylBetween(a,b,r,mat,parent){
    var dir=new THREE.Vector3().subVectors(b,a); var len=dir.length();
    var m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,8), mat);
    m.position.copy(a).addScaledVector(dir,0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir.clone().normalize());
    m.castShadow=true; (parent||scene).add(m); return m;
  }

  // ---------- Airship ----------
  var ship = new THREE.Group(); scene.add(ship);
  var shipInner = new THREE.Group(); ship.add(shipInner);

  // Balloon
  var balloon = mesh(new THREE.SphereGeometry(1, 56, 36), M.balloon, 0, 3.45, 0, shipInner);
  balloon.scale.set(4.35, 1.62, 1.62);
  // Brass bands around balloon
  [-2.6,-0.9,0.9,2.6].forEach(function(x){
    var r = 1.62 * Math.sqrt(Math.max(0.05, 1 - (x/4.35)*(x/4.35)));
    var band = mesh(new THREE.TorusGeometry(r+0.015, 0.045, 10, 48), M.brassOld, x, 3.45, 0, shipInner);
    band.rotation.y = Math.PI/2;
  });
  // Nose cap + tail cap
  var noseCap = mesh(new THREE.ConeGeometry(0.52, 1.0, 24), M.brass, 4.55, 3.45, 0, shipInner);
  noseCap.rotation.z = -Math.PI/2;
  var tailCap = mesh(new THREE.SphereGeometry(0.34, 20, 14), M.brass, -4.35, 3.45, 0, shipInner);

  // Tail fins (at rear of balloon)
  function fin(w,h,mat){
    var s=new THREE.Shape();
    s.moveTo(0,0); s.lineTo(-w, h*0.28); s.lineTo(-w-0.25, -h*0.1); s.lineTo(-0.3,-h*0.32); s.lineTo(0,0);
    var g=new THREE.ExtrudeGeometry(s,{depth:0.09, bevelEnabled:true, bevelThickness:0.03, bevelSize:0.03, bevelSegments:2});
    return new THREE.Mesh(g, mat);
  }
  var finTop = fin(1.5,1.15,M.redFabric); finTop.position.set(-3.55,4.65,0); finTop.rotation.y=Math.PI/2; finTop.castShadow=true; shipInner.add(finTop);
  var finBot = fin(1.5,1.15,M.redFabric); finBot.position.set(-3.55,2.25,0); finBot.rotation.y=Math.PI/2; finBot.rotation.x=Math.PI; finBot.castShadow=true; shipInner.add(finBot);
  var finL = fin(1.5,1.15,M.redFabric); finL.position.set(-3.55,3.45,0.75); shipInner.add(finL); finL.castShadow=true;
  var finR = fin(1.5,1.15,M.redFabric); finR.position.set(-3.55,3.45,-0.84); finR.rotation.y=Math.PI; shipInner.add(finR); finR.castShadow=true;

  // Gondola hull — boat profile extruded across width
  var hullShape = new THREE.Shape();
  hullShape.moveTo(-2.7, 0.55); hullShape.lineTo(2.55, 0.55);
  hullShape.quadraticCurveTo(2.95, 0.5, 2.75, -0.15);
  hullShape.quadraticCurveTo(2.3, -0.95, 1.2, -1.05);
  hullShape.lineTo(-1.4, -1.05);
  hullShape.quadraticCurveTo(-2.5, -0.95, -2.85, -0.1);
  hullShape.quadraticCurveTo(-2.95, 0.35, -2.7, 0.55);
  var hullGeo = new THREE.ExtrudeGeometry(hullShape, { depth:1.7, bevelEnabled:true, bevelThickness:0.12, bevelSize:0.12, bevelSegments:3, steps:1 });
  hullGeo.translate(0,0,-0.85);
  var hull = new THREE.Mesh(hullGeo, M.wood); hull.position.set(0,-0.55,0); hull.castShadow=true; hull.receiveShadow=true; shipInner.add(hull);
  // Hull trim + deck
  var trim = mesh(new THREE.BoxGeometry(5.55,0.14,2.05), M.brassOld, 0, 0.06, 0, shipInner);
  var deck = mesh(new THREE.BoxGeometry(5.2,0.1,1.78), M.woodDark, 0, 0.02, 0, shipInner);
  // Brass rivet strip
  for(var ri=-5; ri<=5; ri++){ mesh(new THREE.SphereGeometry(0.055,10,8), M.brass, ri*0.48, -0.62, 1.03, shipInner); mesh(new THREE.SphereGeometry(0.055,10,8), M.brass, ri*0.48, -0.62, -1.03, shipInner); }

  // Rigging ropes balloon -> gondola
  [[2.1,1.15,0.72],[2.1,1.15,-0.72],[-2.1,1.15,0.72],[-2.1,1.15,-0.72],[0,0.95,0.8],[0,0.95,-0.8]].forEach(function(p){
    cylBetween(new THREE.Vector3(p[0]*0.82, 2.0, p[2]*0.85), new THREE.Vector3(p[0], 0.05, p[2]), 0.028, M.rope, shipInner);
  });
  // Vertical struts
  [[1.7,0.72],[1.7,-0.72],[-1.7,0.72],[-1.7,-0.72]].forEach(function(p){
    cylBetween(new THREE.Vector3(p[0],1.95,p[1]), new THREE.Vector3(p[0],0.05,p[1]), 0.05, M.woodDark, shipInner);
  });

  // Lanterns on bow and stern
  [[2.75,0.35,0],[-2.8,0.35,0]].forEach(function(p){
    cylBetween(new THREE.Vector3(p[0]*0.92,0.05,0), new THREE.Vector3(p[0],0.55,0), 0.03, M.iron, shipInner);
    var l = mesh(new THREE.SphereGeometry(0.14,16,12), M.lamp, p[0], 0.32, 0, shipInner); l.castShadow=false;
    mesh(new THREE.ConeGeometry(0.17,0.16,12), M.brass, p[0], 0.52, 0, shipInner);
  });

  // Smokestack
  var stack = mesh(new THREE.CylinderGeometry(0.16,0.22,0.95,16), M.copper, -1.85, 0.55, -0.45, shipInner);
  mesh(new THREE.CylinderGeometry(0.26,0.26,0.14,16), M.brass, -1.85, 1.05, -0.45, shipInner);
  mesh(new THREE.CylinderGeometry(0.3,0.36,0.18,16), M.iron, -1.85, 0.1, -0.45, shipInner);

  // ---------- Gears ----------
  function gearGeo(radius, teeth, depth, toothH){
    var s=new THREE.Shape(); var inner=radius-toothH*0.55, outer=radius+toothH*0.55;
    var step=(Math.PI*2)/teeth;
    for(var i=0;i<teeth;i++){
      var a=i*step;
      var pts=[[inner,a],[outer,a+step*0.22],[outer,a+step*0.5],[inner,a+step*0.72]];
      for(var j=0;j<pts.length;j++){
        var r=pts[j][0], ang=pts[j][1], x=Math.cos(ang)*r, y=Math.sin(ang)*r;
        if(i===0&&j===0) s.moveTo(x,y); else s.lineTo(x,y);
      }
    }
    s.closePath();
    var hole=new THREE.Path(); hole.absarc(0,0,radius*0.28,0,Math.PI*2,true); s.holes.push(hole);
    var g=new THREE.ExtrudeGeometry(s,{depth:depth, bevelEnabled:true, bevelThickness:0.02, bevelSize:0.02, bevelSegments:1});
    g.translate(0,0,-depth/2); return g;
  }
  var gears=[];
  function addGear(r, teeth, x,y,z, mat, speed, phase){
    var grp=new THREE.Group(); grp.position.set(x,y,z); shipInner.add(grp);
    var gm=new THREE.Mesh(gearGeo(r,teeth,0.18, r*0.32), mat); gm.castShadow=true; grp.add(gm);
    var hub=mesh(new THREE.CylinderGeometry(r*0.3,r*0.3,0.3,16), M.iron, 0,0,0, grp); hub.rotation.x=Math.PI/2;
    for(var k=0;k<4;k++){ var sp=mesh(new THREE.BoxGeometry(r*1.45, r*0.16, 0.1), mat, 0,0,0, grp); sp.rotation.z=k*Math.PI/4; }
    grp.rotation.z = phase||0;
    gears.push({grp:grp, speed:speed});
    return grp;
  }
  // Exposed clockwork on the camera-facing side of the hull
  addGear(0.52, 10, -0.55, -0.78, 1.06, M.brass,  0.9, 0);
  addGear(0.38, 8,   0.28, -0.86, 1.08, M.copper, -1.24, 0.4);
  addGear(0.30, 8,  -0.28, -0.12, 1.06, M.brassOld, -1.5, 0.9);
  addGear(0.42, 9,   1.15, -0.72, 1.05, M.brass,  1.05, 0.2);
  // One big gear on the far side too, so orbiting reveals clockwork all round
  var gFar = addGear(0.5, 10, -0.2, -0.78, -1.06, M.brass, -0.9, 0.5); gFar.rotation.y = Math.PI;

  // Clock face on hull side
  var clockGrp=new THREE.Group(); clockGrp.position.set(-1.75,-0.55,1.04); shipInner.add(clockGrp);
  mesh(new THREE.CylinderGeometry(0.34,0.34,0.08,28), M.brass, 0,0,0, clockGrp).rotation.x=Math.PI/2;
  var face = mesh(new THREE.CylinderGeometry(0.29,0.29,0.09,28), M.cream, 0,0,0, clockGrp); face.rotation.x=Math.PI/2; face.castShadow=false;
  var hourHand = mesh(new THREE.BoxGeometry(0.045,0.19,0.02), M.iron, 0,0.06,0.06, clockGrp);
  var minHand  = mesh(new THREE.BoxGeometry(0.035,0.26,0.02), M.iron, 0,0.09,0.07, clockGrp);
  hourHand.geometry.translate(0,0.05,0); minHand.geometry.translate(0,0.07,0);

  // ---------- Propeller (stern) ----------
  var prop = new THREE.Group(); prop.position.set(-3.35,-0.55,0); shipInner.add(prop);
  cylBetween(new THREE.Vector3(-2.85,-0.55,0), new THREE.Vector3(-3.35,-0.55,0), 0.09, M.iron, shipInner);
  mesh(new THREE.SphereGeometry(0.17,16,12), M.brass, 0,0,0, prop);
  var bladeGeo = new THREE.SphereGeometry(0.62, 14, 10);
  [0, Math.PI/2].forEach(function(a){
    var bg=new THREE.Group(); bg.rotation.x=a; prop.add(bg);
    var b1=mesh(bladeGeo, M.woodDark, 0, 0.62, 0, bg); b1.scale.set(0.16,1,0.42);
    var b2=mesh(bladeGeo, M.woodDark, 0,-0.62, 0, bg); b2.scale.set(0.16,1,0.42);
    var t1=mesh(new THREE.SphereGeometry(0.13,10,8), M.brass, 0, 1.18, 0, bg); t1.scale.set(0.5,1,1);
    var t2=mesh(new THREE.SphereGeometry(0.13,10,8), M.brass, 0,-1.18, 0, bg); t2.scale.set(0.5,1,1);
  });
  // blades spin around X axis (ship's long axis) via prop.rotation.x in animate()
  // Prop guard ring
  var guard = mesh(new THREE.TorusGeometry(1.32,0.045,10,44), M.brassOld, -3.35,-0.55,0, shipInner);
  guard.rotation.y = Math.PI/2;

  // ---------- Capybara captain ----------
  var capy = new THREE.Group(); capy.position.set(0.85, 0.05, 0); shipInner.add(capy);
  // Body — big rounded loaf, sitting upright
  var body = mesh(new THREE.SphereGeometry(0.78, 28, 22), M.fur, 0, 0.62, 0, capy);
  body.scale.set(1.05, 0.92, 0.88);
  var belly = mesh(new THREE.SphereGeometry(0.6, 24, 18), M.furLight, 0.28, 0.5, 0, capy);
  belly.scale.set(0.85,0.85,0.78);
  // Haunches / feet
  [-0.42,0.42].forEach(function(z){
    var foot = mesh(new THREE.SphereGeometry(0.24,16,12), M.furDark, 0.62, 0.08, z, capy); foot.scale.set(1.35,0.55,0.8);
  });
  // Head — blunt, boxy capybara muzzle (their signature)
  var headGrp = new THREE.Group(); headGrp.position.set(0.42, 1.32, 0); capy.add(headGrp);
  var skull;
  if (THREE.RoundedBoxGeometry) skull = new THREE.Mesh(new THREE.RoundedBoxGeometry(0.78,0.66,0.62, 4, 0.16), M.fur);
  else skull = new THREE.Mesh(new THREE.BoxGeometry(0.78,0.66,0.62), M.fur);
  skull.castShadow=true; headGrp.add(skull);
  var muzzle;
  if (THREE.RoundedBoxGeometry) muzzle = new THREE.Mesh(new THREE.RoundedBoxGeometry(0.5,0.44,0.5, 4, 0.12), M.furLight);
  else muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.5,0.44,0.5), M.furLight);
  muzzle.position.set(0.42,-0.08,0); muzzle.castShadow=true; headGrp.add(muzzle);
  // Nose + mouth line + nostrils
  mesh(new THREE.SphereGeometry(0.13,14,10), M.nose, 0.68, 0.02, 0, headGrp).scale.set(0.7,0.6,1.15);
  [-0.09,0.09].forEach(function(z){ mesh(new THREE.SphereGeometry(0.028,8,8), M.nose, 0.74, 0.06, z, headGrp); });
  var mouth = mesh(new THREE.BoxGeometry(0.02,0.025,0.26), M.nose, 0.68,-0.2,0, headGrp);
  // Eyes (calm, half-lidded — very capybara)
  [-0.27,0.27].forEach(function(z){
    mesh(new THREE.SphereGeometry(0.075,14,12), M.eye, 0.3, 0.14, z, headGrp);
    var lid = mesh(new THREE.SphereGeometry(0.082,14,10), M.fur, 0.3, 0.19, z, headGrp); lid.scale.set(1,0.55,1);
  });
  // Small rounded ears, set high and back
  [-0.24,0.24].forEach(function(z){
    var ear = mesh(new THREE.SphereGeometry(0.13,14,12), M.furDark, -0.22, 0.36, z, headGrp); ear.scale.set(0.75,1,1);
    mesh(new THREE.SphereGeometry(0.07,10,8), M.furLight, -0.18, 0.36, z*1.02, headGrp).scale.set(0.5,1,1);
  });
  // --- Aviator goggles: brass rims, glass lenses, leather strap ---
  var goggles = new THREE.Group(); goggles.position.set(0.34, 0.2, 0); headGrp.add(goggles);
  [-0.185, 0.185].forEach(function(z){
    var rimT = mesh(new THREE.TorusGeometry(0.145, 0.038, 12, 28), M.brass, 0.06, 0, z, goggles);
    rimT.rotation.y = Math.PI/2;
    var lens = mesh(new THREE.CylinderGeometry(0.135,0.135,0.03,24), M.glass, 0.07, 0, z, goggles);
    lens.rotation.z = Math.PI/2; lens.castShadow=false; lens.renderOrder=3;
  });
  var bridge = mesh(new THREE.BoxGeometry(0.05,0.05,0.1), M.brass, 0.06, 0.02, 0, goggles);
  // strap around the head
  var strap = mesh(new THREE.TorusGeometry(0.42, 0.045, 10, 36), M.leather, -0.06, 0, 0, headGrp);
  strap.rotation.y = Math.PI/2; strap.scale.set(1, 1.05, 1.25); strap.position.set(-0.02, 0.2, 0);
  // goggles pushed up slightly? No — worn over eyes, plus a spare lens glint. Keep worn.
  // Leather aviator cap under the strap
  var cap = mesh(new THREE.SphereGeometry(0.44, 24, 16, 0, Math.PI*2, 0, Math.PI*0.52), M.leather, -0.03, 0.1, 0, headGrp);
  cap.scale.set(1,0.9,0.82);

  // Scarf — neck wrap + fluttering tail
  var scarfGrp = new THREE.Group(); scarfGrp.position.set(0.28, 1.02, 0); capy.add(scarfGrp);
  var wrap = mesh(new THREE.TorusGeometry(0.34, 0.11, 12, 28), M.scarf, 0,0,0, scarfGrp);
  wrap.rotation.x = Math.PI/2 - 0.25; wrap.scale.set(1,1.25,1);
  var scarfTail = mesh(new THREE.BoxGeometry(0.85, 0.05, 0.24), M.scarf, -0.55, 0.08, 0.12, scarfGrp);
  scarfTail.geometry.translate(-0.3,0,0); scarfTail.position.set(-0.2,0.1,0.12);

  // Arms reaching forward to the wheel
  [-0.34,0.34].forEach(function(z){
    var arm = cylBetween(new THREE.Vector3(0.35,0.78,z*0.85), new THREE.Vector3(0.98,0.72,z*0.55), 0.11, M.fur, capy);
    var paw = mesh(new THREE.SphereGeometry(0.13,14,10), M.furDark, 1.02, 0.72, z*0.55, capy); paw.scale.set(1.15,0.7,0.9);
  });
  // Little jacket vest
  var vest = mesh(new THREE.SphereGeometry(0.8, 24, 18, 0, Math.PI*2, Math.PI*0.32, Math.PI*0.42), M.leather, 0, 0.62, 0, capy);
  vest.scale.set(1.06,0.93,0.89);

  // ---------- Ship's wheel in front of the captain ----------
  var wheelGrp = new THREE.Group(); wheelGrp.position.set(2.0, 0.62, 0); shipInner.add(wheelGrp);
  cylBetween(new THREE.Vector3(1.95,0.0,0), new THREE.Vector3(2.0,0.55,0), 0.07, M.woodDark, shipInner);
  var wheelSpin = new THREE.Group(); wheelGrp.add(wheelSpin); wheelSpin.position.y=0.12;
  var wheelTilt = new THREE.Group(); wheelTilt.rotation.z = -0.5; wheelSpin.add(wheelTilt);
  var rimW = mesh(new THREE.TorusGeometry(0.42, 0.055, 12, 36), M.woodDark, 0,0,0, wheelTilt);
  rimW.rotation.y = Math.PI/2; // wheel plane is YZ, facing the captain (normal along X)
  mesh(new THREE.SphereGeometry(0.11,14,10), M.brass, 0,0,0, wheelTilt);
  for(var wi=0; wi<6; wi++){
    var a = wi*Math.PI/3;
    var spoke = mesh(new THREE.CylinderGeometry(0.032,0.032,1.06,8), M.wood, 0,0,0, wheelTilt);
    spoke.rotation.x = a; // cylinder along Y rotated in the YZ plane
    var knob = mesh(new THREE.SphereGeometry(0.05,10,8), M.brass, 0, Math.cos(a)*0.53, Math.sin(a)*0.53, wheelTilt);
  }

  // Compass binnacle + map tube + crate cargo
  mesh(new THREE.CylinderGeometry(0.09,0.13,0.4,12), M.brass, 1.55, 0.25, -0.6, shipInner);
  var compassBall = mesh(new THREE.SphereGeometry(0.11,16,12), M.glass, 1.55, 0.5, -0.6, shipInner); compassBall.castShadow=false;
  var tube = mesh(new THREE.CylinderGeometry(0.09,0.09,0.8,12), M.leather, -0.9, 0.25, 0.62, shipInner); tube.rotation.z=1.1;
  mesh(new THREE.BoxGeometry(0.62,0.5,0.62), M.woodDark, -1.6, 0.3, 0.45, shipInner);
  mesh(new THREE.BoxGeometry(0.5,0.4,0.5), M.wood, -1.55, 0.75, 0.45, shipInner).rotation.y=0.4;
  var barrel = mesh(new THREE.CylinderGeometry(0.26,0.26,0.55,16), M.woodDark, -2.25, 0.3, -0.1, shipInner);
  mesh(new THREE.TorusGeometry(0.265,0.025,8,24), M.iron, -2.25, 0.42, -0.1, shipInner).rotation.x=Math.PI/2;
  mesh(new THREE.TorusGeometry(0.265,0.025,8,24), M.iron, -2.25, 0.18, -0.1, shipInner).rotation.x=Math.PI/2;

  // Flag on top of balloon
  var flagPole = cylBetween(new THREE.Vector3(-0.6,4.95,0), new THREE.Vector3(-0.6,5.95,0), 0.03, M.woodDark, shipInner);
  var flagGeo = new THREE.PlaneGeometry(0.95, 0.5, 12, 4); flagGeo.translate(0.475,0,0);
  var flag = new THREE.Mesh(flagGeo, M.scarf); flag.position.set(-0.6,5.7,0); flag.castShadow=true; shipInner.add(flag);
  var flagPos = flagGeo.attributes.position; var flagBase = flagPos.array.slice();

  // ---------- Clouds ----------
  var clouds = new THREE.Group(); scene.add(clouds);
  function makeCloud(x,y,z,s){
    var g=new THREE.Group(); g.position.set(x,y,z);
    var puffs=[[0,0,0,1],[0.9,0.1,0.2,0.72],[-0.85,0.05,-0.1,0.66],[0.3,0.32,-0.3,0.6],[-0.3,0.28,0.35,0.55],[1.5,-0.05,0,0.5],[-1.45,0,0.1,0.48]];
    puffs.forEach(function(p){
      var m=new THREE.Mesh(new THREE.SphereGeometry(p[3], 18, 14), M.cloud);
      m.position.set(p[0],p[1],p[2]); m.scale.y=0.62; g.add(m);
    });
    g.scale.setScalar(s); clouds.add(g); return g;
  }
  var cloudList=[];
  cloudList.push(makeCloud(0,-7.5,0,3.4));
  cloudList.push(makeCloud(-9,-6.5,-6,2.4)); cloudList.push(makeCloud(10,-7,-4,2.7));
  cloudList.push(makeCloud(-13,-4,5,2.0)); cloudList.push(makeCloud(13,-5,6,2.2));
  cloudList.push(makeCloud(-6,-9,8,2.6)); cloudList.push(makeCloud(7,-9.5,-9,2.8));
  cloudList.push(makeCloud(-18,2,-14,3.2)); cloudList.push(makeCloud(18,4,-12,3.6));
  cloudList.push(makeCloud(0,7,-20,4.2)); cloudList.push(makeCloud(-20,-1,10,2.6));
  cloudList.push(makeCloud(21,0,12,2.9)); cloudList.push(makeCloud(5,-6,14,1.9));

  // Distant birds (simple V shapes gliding)
  var birds=new THREE.Group(); scene.add(birds);
  for(var bi=0; bi<5; bi++){
    var bg2=new THREE.Group();
    var matB=new THREE.MeshBasicMaterial({ color:0x2c3e44, side:THREE.DoubleSide });
    var wgeo=new THREE.PlaneGeometry(0.55,0.16); wgeo.translate(0.27,0,0);
    var wl=new THREE.Mesh(wgeo, matB); var wr=new THREE.Mesh(wgeo, matB); wr.rotation.z=Math.PI;
    bg2.add(wl); bg2.add(wr); bg2.userData={wl:wl, wr:wr, off:bi*1.3};
    bg2.position.set(-14+bi*3.2, 5.5+ (bi%3), -10 - bi*1.5);
    birds.add(bg2);
  }

  // ---------- Steam puffs ----------
  var PUFFS=26; var puffGeo=new THREE.BufferGeometry();
  var pPos=new Float32Array(PUFFS*3); var pSeed=[];
  for(var pi=0; pi<PUFFS; pi++){ pSeed.push(Math.random()); }
  puffGeo.setAttribute('position', new THREE.BufferAttribute(pPos,3));
  var puffMat=new THREE.PointsMaterial({ size:0.85, map:softTex, transparent:true, opacity:0.5, depthWrite:false, color:0xffffff, sizeAttenuation:true });
  var puffs=new THREE.Points(puffGeo, puffMat); puffs.frustumCulled=false; shipInner.add(puffs);

  // ---------- UI ----------
  var motionOn = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var btnMotion=document.getElementById('btnMotion');
  var btnRotate=document.getElementById('btnRotate');
  function syncMotionBtn(){ btnMotion.textContent = 'Motion: ' + (motionOn?'On':'Off'); btnMotion.setAttribute('aria-pressed', String(motionOn)); }
  syncMotionBtn();
  btnMotion.addEventListener('click', function(){ motionOn=!motionOn; syncMotionBtn(); });
  btnRotate.addEventListener('click', function(){
    controls.autoRotate=!controls.autoRotate;
    btnRotate.textContent='Auto-orbit: '+(controls.autoRotate?'On':'Off');
    btnRotate.setAttribute('aria-pressed', String(controls.autoRotate));
  });
  document.getElementById('btnReset').addEventListener('click', function(){
    camera.position.copy(HOME_POS); controls.target.copy(HOME_TGT); controls.update();
  });

  // ---------- Resize / framing ----------
  function resize(){
    var w=window.innerWidth, h=window.innerHeight;
    renderer.setSize(w,h,false);
    camera.aspect=w/h;
    // keep the ship filling the frame on narrow screens
    camera.fov = camera.aspect < 0.8 ? 56 : 42;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize); resize();

  // ---------- Animate ----------
  var lastNow=performance.now(), elapsed=0;
  function animate(){
    requestAnimationFrame(animate);
    try{
      var now=performance.now();
      var dt=Math.min((now-lastNow)/1000, 0.05); lastNow=now; elapsed+=dt;
      var t=elapsed;
      var amp = motionOn ? 1 : 0.15;

      ship.position.y = Math.sin(t*0.7)*0.22*amp;
      ship.rotation.z = Math.sin(t*0.5)*0.018*amp;
      ship.rotation.x = Math.sin(t*0.42+1)*0.012*amp;
      shipInner.position.x = Math.sin(t*0.23)*0.15*amp;

      if(motionOn){
        prop.rotation.x -= dt*14;
        gears.forEach(function(g){ g.grp.rotation.z += dt*g.speed; });
        wheelSpin.rotation.x = Math.sin(t*0.6)*0.35;
        hourHand.rotation.z = -t*0.05; minHand.rotation.z = -t*0.6;
        headGrp.rotation.y = Math.sin(t*0.45)*0.14;
        headGrp.rotation.z = Math.sin(t*0.8)*0.03;
        scarfTail.rotation.y = Math.sin(t*6)*0.28; scarfTail.rotation.z = 0.25 + Math.sin(t*4.3)*0.12;
        // flag wave
        for(var i=0;i<flagPos.count;i++){
          var bx=flagBase[i*3];
          flagPos.setZ(i, Math.sin(bx*5 - t*7)*0.09*(bx+0.1));
        }
        flagPos.needsUpdate=true;
        // clouds drift
        cloudList.forEach(function(c,idx){ c.position.x += dt*0.12*((idx%3)-0.6); if(c.position.x>26) c.position.x=-26; });
        // birds flap + glide
        birds.children.forEach(function(b,idx){
          var f=Math.sin(t*6+b.userData.off)*0.55;
          b.userData.wl.rotation.y=0; b.userData.wl.rotation.z=f*0.5;
          b.userData.wr.rotation.z=Math.PI - f*0.5;
          b.position.x += dt*0.7; if(b.position.x>24) b.position.x=-24;
        });
        // steam
        for(var j=0;j<PUFFS;j++){
          var life=((t*0.35 + pSeed[j]) % 1);
          pPos[j*3]   = -1.85 - life*1.6 + Math.sin(life*9+pSeed[j]*20)*0.12;
          pPos[j*3+1] =  1.15 + life*1.7;
          pPos[j*3+2] = -0.45 + Math.cos(life*7+pSeed[j]*14)*0.12;
        }
        puffGeo.attributes.position.needsUpdate=true;
        puffMat.opacity = 0.5;
      } else {
        puffMat.opacity = 0.25;
      }
      controls.update();
      renderer.render(scene,camera);
    }catch(e){ showErr(e.message||String(e)); throw e; }
  }
  animate();
  } // end start()

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(start, 10); });
  } else { setTimeout(start, 10); }
})();
