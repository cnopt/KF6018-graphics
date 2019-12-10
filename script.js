window.addEventListener('load', init, false);

function init() {
  createScene();
  createLights();
  createGlobe();
  createClouds();
//  createTree(0,415,100); //x, y, z positions
  //createTree(100,0,500);
  //createTree(0,-415,-100);
  treeLoop();
  animate();
}

var scene, camera, fov, aspect, nearVal, farVal,
    renderer, container, globe, hemLight, ambLight,
    shadowLight, globeBox;
    
var globeCenter;

//deforms the verticies of the world
var map = (val, smin, smax, emin, emax) => (emax-emin)*(val-smin)/(smax-smin) + emin;
var jitter = (geo,per) => geo.vertices.forEach(v => {
    v.x += map(Math.random(),0,1,-per,per)
    v.y += map(Math.random(),0,1,-per,per)
    v.z += map(Math.random(),0,1,-per,per)
});

function createScene() {
  scene     = new THREE.Scene();
  aspect    = window.innerWidth / window.innerHeight;
  fov       = 60; //og 60   //640 for me to work with
  nearVal   = 1;  //og 1
  farVal    = 100000; //og 950
  //scene.fog = new THREE.Fog(0xf7d9aa, 120, 360);
  camera = new THREE.PerspectiveCamera(fov,aspect,nearVal,farVal);
           
		   camera.position.x = 0;  //og = 0  - 360 works too
           camera.position.y = 0; //og 100  //-0 for me
           camera.position.z = 2000; //og 240   //750 for me

  renderer = new THREE.WebGLRenderer({alpha: true,antialias: true});
             renderer.setSize(window.innerWidth, window.innerHeight);
             renderer.shadowMap.enabled = true;

  rendererRight = new THREE.WebGLRenderer({alpha: true,antialias: true});
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



function createGlobe() {
  var globeGeo = new THREE.OctahedronGeometry(360,3)
  var globeMat = new THREE.MeshPhongMaterial({color:0x68c3c0,transparent:true,opacity:.3,flatShading:true});
 // console.log(globeGeo.vertices[0]);
 // console.log(globeGeo.vertices[1]);

  jitter(globeGeo, 14);
  globe = new THREE.Mesh(globeGeo, globeMat);

  globe.geometry.computeBoundingBox();
  globeBox = globe.geometry.boundingBox.clone();
  //globeBox.getCenter();

  globe.receiveShadow = true;
  globe.position.y = -320;
  scene.add(globe);
  
  // Done this way to stop console error spamming.
	globeCenter = new THREE.Vector3();
	globe.getWorldPosition(globeCenter);
}

function createClouds() {
  var cloudObj = new THREE.Object3D();
  var cloudGeo = new THREE.BoxGeometry(42,42,42);
  jitter(cloudGeo, 2);
  var cloudMat = new THREE.MeshPhongMaterial({color:0xffffff});

  var numBlox = 3+Math.floor(Math.random()*3);
  for (var i = 0;i<numBlox;i++) {
    var m = new THREE.Mesh(cloudGeo,cloudMat);
    m.position.x = i*26;
    m.position.y = Math.random() * 10;
    m.position.z = Math.random() * 10;
    m.rotation.z = Math.random() * Math.PI * 2;
    m.rotation.y = Math.random() * Math.PI * 2;

    var s = .1 + Math.random() * .9;
    m.scale.set(s,s,s);
    cloudObj.add(m);
  }
  cloudObj.position.y += 620;
  scene.add(cloudObj);
  cloudObj.parent = globe;
}

var quaternion = new THREE.Quaternion();
quaternion.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), Math.PI / 2 );

var vector = new THREE.Vector3( 1, 0, 0 );
vector.applyQuaternion( quaternion );

////////////////////////////////////////////
function createTree(x , y, z){ //holds all of the below as a function
	//treeTrunk the brown trunk of the tree
	var g1 = new THREE.CylinderGeometry( 0.6, 0.6, 4.5, 20);   ///(top, bottom, size, shapeish)
	var m1 = new THREE.MeshBasicMaterial( {color: 0x603B14} );
	var treeTrunk = new THREE.Mesh( g1, m1 );

	//treeTrunk.rotation.y = globeBox.getCenter[2]; 

	//treeLower- the green part of the tree creation
	var g2 = new THREE.CylinderGeometry(2.9, 0.01, -7, 20);   
	var m2 = new THREE.MeshBasicMaterial( {color: 0x38761D} );
	var treeLower = new THREE.Mesh( g2, m2 );


	// Set position of tree parts.
	treeLower.position.x=0;
	treeLower.position.y=6.0;   //-920 for big view //6.0 works with ghetto set up
	treeLower.position.z=0;   //250   //0 works with my ghetto set up

	//add tree meshes
	scene.add( treeTrunk );
	scene.add(treeLower);

	//scales the trees up to be seen better.
	treeTrunk.scale.x = 7;
	treeTrunk.scale.y = 7;
	treeTrunk.scale.z = 7;


	// define parent-child relationships
	treeLower.parent = treeTrunk;
	treeTrunk.position.x = x;
	treeTrunk.position.y = y;  
	treeTrunk.position.z = z; 
	treeTrunk.parent = globe;

	var rotation = new THREE.Quaternion();
	rotation.setFromUnitVectors(globe.up, treeTrunk.position.clone().normalize());

	treeTrunk.quaternion.copy(rotation);

}

function treeLoop(){
	for(var tree= 0; tree<50; tree++) {
		// Get the number of faces to use as maximum value: globe.geometry.faces.length;
	
		// Get a random vertex to slap a tree on.
		var randomVert = Math.floor(Math.random() * (globe.geometry.vertices.length) );
	//	console.log("Random face Num: " + randomVert);
	
  	createTree( globe.geometry.vertices[randomVert].getComponent(0),
  				globe.geometry.vertices[randomVert].getComponent(1),
  				globe.geometry.vertices[randomVert].getComponent(2));
			// https://threejs.org/docs/#api/en/math/Vector3.getComponent  Get component0/1/2 gets x y z of the vertex.

  }
}


////////////////////////////////////////


function animate() {
  renderer.render(scene, camera);
  globe.rotation.z += 0.003;
  //cloudMat.rotation.z += -0.003;
  requestAnimationFrame(animate);
}
