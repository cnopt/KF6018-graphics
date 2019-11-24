window.addEventListener('load', init, false);

function init() {
  createScene();
  createLights();
  createGlobe();

  animate();
}

var scene, camera, fov, aspect, nearVal, farVal,
    renderer, container, globe, hemLight, ambLight,
    shadowLight;

function createScene() {
  scene     = new THREE.Scene();
  aspect    = window.innerWidth / window.innerHeight;
  fov       = 60;
  nearVal   = 1;
  farVal    = 950;
  scene.fog = new THREE.Fog(0xf7d9aa, 120, 360);
  camera = new THREE.PerspectiveCamera(fov,aspect,nearVal,farVal);
           camera.position.x = 0;
           camera.position.z = 240;
           camera.position.y = 100;

  renderer = new THREE.WebGLRenderer({alpha: true,antialias: true});
             renderer.setSize(window.innerWidth, window.innerHeight);
             renderer.shadowMap.enabled = true;

  container = document.getElementById('bg');
              container.appendChild(renderer.domElement);
}



function createLights() {
  hemLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, .43);
  ambLight = new THREE.AmbientLight(0xdc8874, .5);

  shadowLight = new THREE.DirectionalLight(0xffffff, .9);
  shadowLight.position.set(150, 350, 350);
  shadowLight.castShadow = true;
  shadowLight.shadow.camera.left = -400;
  shadowLight.shadow.camera.right = 400;
  shadowLight.shadow.camera.top = 400;
  shadowLight.shadow.camera.bottom = -400;
  shadowLight.shadow.camera.near = 1;
  shadowLight.shadow.camera.far = 1000;
  shadowLight.shadow.mapSize.width = 2048;
  shadowLight.shadow.mapSize.height = 2048;

  scene.add(ambLight);
  scene.add(hemLight);
  scene.add(shadowLight);
}


Globe = function() {
  // var globeGeo = new THREE.CylinderGeometry(600, 600, 800, 80, 10);
  //     globeGeo.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
  //     globeGeo.mergeVertices();
  var globeGeo = new THREE.OctahedronGeometry(420,3)

  var globeMat = new THREE.MeshPhongMaterial({color:0x68c3c0,transparent:true,opacity:.8,flatShading:true});
  this.mesh = new THREE.Mesh(globeGeo, globeMat);
  this.mesh.receiveShadow = true;
}

function createGlobe() {
  globe = new Globe();
  globe.mesh.position.y = -360;
  scene.add(globe.mesh);
}




function animate() {
  renderer.render(scene, camera);
  globe.mesh.rotation.z += 0.003;
  requestAnimationFrame(animate);
}
