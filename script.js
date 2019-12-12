window.addEventListener('load', init, false);

// Add a listener to the document.
// Listener listens for event "touchStart".
// When the listener catches the touchStart event, it calls "eventFuncTouchStart", and passes the "event" to it; you most likely wont need this except for overriding the  default "touchStart".
document.addEventListener( 'touchstart', eventFuncTouchStart );

function init() {
  createScene();
  createLights();
  createGlobe();
  createRocket();
  createRocketParticles();
  createClouds();
  treeLoop();
  createParticles();
  animate();
}

var scene, camera, fov, aspect, nearVal, farVal,
    renderer, controls, container, globe, rocket, pivPoint,
    rocket2, particleMesh, dParticleMesh, rParticlesArray = [], globeBox, globeCenter,
    hemLight, ambLight, shadowLight, controls;

// DEBUG SETTINGS:
var invertTouchInputY = true; // Inverts the Y coordinates for touch input.

// GLOBE SETTINGS:
var globeFacesToColour = 150; // The number of random faces to alter colour.
var globeBaseColour = 0x022E0A; // Globes base colour.
var globeAltColour = 0xDDECE1; // An alternative colour randomly applied to a number of faces.

// TREE SETTINGS:
var maxTreeCount = 50;

// CLOUD SETTINGS:
var cloudHeight = 420; // Base cloud height
var cloudHeightVariance = 100; // The height variance (spread) in both directions from cloudHeight
var cloudCount = 40; // Number of clouds to spawn.
var cloudsArray = []; // Array holding the Cloud object (below). 
var cloudMinSize = 25; // Minimum size of a clouds XYZ.
var cloudMaxSize = 75; // Maximum size of a clouds XYZ.
var cloudSpread = 350; // How wide the XZ spread is.
var cloudAnimOffsetMin = 0; // The minimum for animation lerp randomisation.
var cloudAnimOffsetMax = 1; // The maximum for animation lerp randomisation.


// GLOBAL ANIMATION LERP SETTINGS:
var globalLerpValue = 0; // Current value.
var globalLerpBounce = true; // If true, lerp value bounces between 0-1.  If false, value is reset to 0.
var globalLerpReversing = false; // Not to be set manually.
var globalLerpSpeed = 0.01; // increment speed.


// Object for the cloud in order to do lerps based on initial values or with a persistent lerp.
function Cloud(p_object, p_initialSize, p_initialLocation){
	this.object = p_object;
	this.initialSize = p_initialSize;
	this.initialLoc = p_initialLocation;
	this.animationFloat = 0;
	this.animationBounces = true;
	this.animationReversing = false;
} // END - constructor.


// TouchInput Raycaster.
var touchInputRay = new THREE.Raycaster();
// Vector2 for touchInput x/y.
var touchInputPos = new THREE.Vector2();

var rand = (min,max) => min + Math.random()*(max-min);
var map = (val, smin, smax, emin, emax) => (emax-emin)*(val-smin)/(smax-smin) + emin;
var deform = (geo,per) => geo.vertices.forEach(v => {
    v.x += map(Math.random(),0,1,-per,per)
    v.y += map(Math.random(),0,1,-per,per)
    v.z += map(Math.random(),0,1,-per,per)
});


// CONVENIENCE FUNCTIONS.

// Returns a random integer within the provided min-max range.
function randomInt(min, max){
	return Math.floor(Math.random() * (max - min) + min);
} // END - random value.

// Returns a random float within the provided min-max range.
function randomFloat(min, max){
	return Math.random() * (max - min) + min;
} // END - Random value

// Function to clean up 3D Objects from a scene by disposing of geometry and materials before removing the object from scene..
function cleanup3DObject(object){
	object.geometry.dispose();
	object.material.dispose();
	scene.remove(object);
} // END - Cleanup function

// END OF CONVENIENCE FUNCTIONS


function createScene() {
  scene     = new THREE.Scene();
  aspect    = window.innerWidth / window.innerHeight;
  fov       = 60;
  nearVal   = 1;
  farVal    = 950;

  scene.fog = new THREE.Fog(0xff5566, 120, 800);
  camera = new THREE.PerspectiveCamera(fov,aspect,nearVal,farVal);
           camera.position.x = 0;
           camera.position.z = 500;
           camera.position.y = 100;

  renderer = new THREE.WebGLRenderer({alpha: true,antialias: true});
             renderer.setSize(window.innerWidth, window.innerHeight);
             renderer.shadowMap.enabled = true;



  container = document.getElementById('bg');
              container.appendChild(renderer.domElement);

 controls = new THREE.DeviceOrientationControls( camera );// <------------ //for the phone (also a variable in)

  pivPoint = new THREE.Object3D();

}



function createLights() {
  hemLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, .53);
  ambLight = new THREE.AmbientLight(0xdc8874, .6);

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
  var globeMat = new THREE.MeshToonMaterial({color:globeBaseColour,transparent:false,flatShading:false});
  globeMat.vertexColors = THREE.FaceColors;
  globeMat.shininess = 15;
  globeMat.reflectivity = 0.1;
  var globeMatTrans = new THREE.MeshPhongMaterial({color:0x68c3c0,transparent:true,opacity:0,flatShading:true});
  deform(globeGeo, 20);
  globe = new THREE.Mesh(globeGeo, globeMat);
  globeClone = new THREE.Mesh(globeGeo, globeMatTrans);

  globe.geometry.computeBoundingBox();
  globeBox = globe.geometry.boundingBox.clone();

  globe.receiveShadow = true;
  globe.position.y = -320;
  globeClone.position.y = -320;

  globeClone.add(pivPoint);
  scene.add(globeClone);
  scene.add(globe);
  globeCenter = new THREE.Vector3();
	globe.getWorldPosition(globeCenter);
  globeControls = new THREE.ObjectControls(camera, renderer.domElement, globe);
  globeControls.setRotationSpeed(0.02); // set zoom speed
  
  // Randomise face colours.
  for (faceIndex = 0; faceIndex < globeFacesToColour; faceIndex++){
	var faceToColour = globe.geometry.faces[randomInt(0, globe.geometry.faces.length)].color.set( globeAltColour );
  } // END - face colour randomisation for loop.
}

function createRocket() {
  var rocketGeo = new THREE.CylinderGeometry(1, 20, 75, 5);
  var rocketMat = new THREE.MeshPhongMaterial({color:0xffffff,flatShading:true,fog: false}); // immune to fog?
  rocket = new THREE.Mesh(rocketGeo, rocketMat);
  rocket.position.set(460, 4, 6);
  pivPoint.add(rocket);

  rocket.position.y += 120;
  //scene.add(rocket);
}

var geoCircleArray = [];
var matCircleArray = [];
var meshCircleArray = [];
var iCircleNumber = 60;

function createRocketParticles() {
  for (var i =0; i<iCircleNumber; i++) {
    geoCircleArray.push( new THREE.SphereGeometry(10, 7,7) );
    matCircleArray.push( new THREE.MeshPhongMaterial({ color: 0x88AA22, transparent: true, opacity: 0.5 }) );
    meshCircleArray.push( new THREE.Mesh(geoCircleArray[i], matCircleArray[i]));
    meshCircleArray[i].position.z = 200;
    meshCircleArray[i].position.x = i;
    meshCircleArray[i].position.set(460, 4, 6);
    pivPoint.add(meshCircleArray[i]);
    //scene.add(meshCircleArray[i]);
  }
}

function createParticles() {
  particles = new THREE.Group();
  scene.add(particles);
  var geometry = new THREE.TetrahedronGeometry(4, 0);
  var icoGeometry = new THREE.IcosahedronBufferGeometry(4);

  for (var i = 0; i < 470; i ++) {
    var particleMaterial = new THREE.MeshPhongMaterial({color:0xffffff, flatShading:true});
    particleMesh = new THREE.Mesh(geometry, particleMaterial);
    particleMesh.position.set((Math.random() - 0.5) * 1000, (Math.random() - 0.5) * 1000, (Math.random() - 0.5) * 1000);
    particleMesh.rotation.set((Math.random() - 0.5) * 1000, (Math.random() - 0.5) * 1000, (Math.random() - 0.5) * 1000);
    particleMesh.updateMatrix();
    particleMesh.matrixAutoUpdate = false;
    particles.add(particleMesh);
  }
  for (var i=0; i < 80; i++) {
    dParticleMesh = new THREE.Mesh(icoGeometry, particleMaterial);
    dParticleMesh.position.set((Math.random() - 0.5) * 1000, (Math.random() - 0.5) * 1000, (Math.random() - 0.5) * 1000);
    dParticleMesh.rotation.set((Math.random() - 0.5) * 1000, (Math.random() - 0.5) * 1000, (Math.random() - 0.5) * 1000);
    dParticleMesh.updateMatrix();
    dParticleMesh.matrixAutoUpdate = false;
    particles.add(dParticleMesh);
  }
}


function createClouds(){

	for( var cloudIndex = 0; cloudIndex < cloudCount; ++cloudIndex){
//	console.log("Creating cloud: " + cloudIndex);
		var cloud3DObj = new THREE.Object3D();
		// Create the cloud object, with randomised xyz size and xyz loops. 
		var cloudSize = new THREE.Vector3(randomInt(cloudMinSize, cloudMaxSize), randomInt(cloudMinSize, cloudMaxSize), randomInt(cloudMinSize, cloudMaxSize) );
		var cloudGeo = new THREE.BoxGeometry(cloudSize.x, cloudSize.y, cloudSize.z,
											 randomInt(2, 6),
											 randomInt(2, 6), 
											 randomInt(2, 6));
		// Randomise the geographical jitter for each cloud.
		deform(cloudGeo, randomFloat(1, 20));
		var cloudMaterial = new THREE.MeshToonMaterial( {color:'#FFFFFF',transparent:true, opacity: 0.9,flatShading:false} );
	
		var cloudMesh = new THREE.Mesh(cloudGeo, cloudMaterial);
		cloud3DObj.add(cloudMesh);
		// Position the cloud using the height variance and spread.
		cloud3DObj.position.y = cloudHeight + randomInt(-cloudHeightVariance, cloudHeightVariance);
		cloud3DObj.position.x = randomInt(-cloudSpread, cloudSpread);
		cloud3DObj.position.z = randomInt(-cloudSpread, cloudSpread);
		
		
		var worldPos = new THREE.Vector3();
		cloudMesh.getWorldPosition(worldPos);
		var cloudObject = new Cloud(cloud3DObj, cloudSize, worldPos);
		cloudObject.animationFloat = randomFloat(cloudAnimOffsetMin, cloudAnimOffsetMax); // Randomise the animation float to provide variance in clouds.
		cloudsArray.push(cloudObject);
		scene.add(cloud3DObj);
	} // END - create cloud forloop.
	 
} // END - create clouds.



var cloudSmallestSize = new THREE.Vector3(0.25,0.25,0.25);
var cloudNormalSize = new THREE.Vector3(1,1,1);

function cloudAnimation(cloudItem){
	cloudItem.object.rotation.y += -0.0016;
	
	updateObjectLerp(cloudItem);
	
	cloudItem.object.scale.lerpVectors(cloudSmallestSize, cloudNormalSize, cloudItem.animationFloat);

} // END - cloud animation

//var quaternion = new THREE.Quaternion();
//quaternion.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), Math.PI / 2 );
//
//var vector = new THREE.Vector3( 1, 0, 0 );
//vector.applyQuaternion( quaternion );


function createTree(x , y, z){ //holds all of the below as a function
	//treeTrunk the brown trunk of the tree
	var g1 = new THREE.CylinderGeometry( 0.6, 0.6, 4.5, 20);   ///(top, bottom, size, shapeish)
	var m1 = new THREE.MeshToonMaterial({color:0x603B14,transparent:false,flatShading:false});
	m1.shininess = 7;
//	var m1 = new THREE.MeshBasicMaterial( {color: 0x603B14} );
	var treeTrunk = new THREE.Mesh( g1, m1 );
	//treeTrunk.rotation.y = globeBox.getCenter[2];
	//treeLower- the green part of the tree creation
	var g2 = new THREE.CylinderGeometry(0.1, 2.9, 7, 20); // You had the sizes the wrong way around, didn't need to -7 the scale.
	var m2 = new THREE.MeshToonMaterial({color:0x358C47,transparent:false,flatShading:false});
	m2.shininess = 5;
	var treeLower = new THREE.Mesh( g2, m2 );
	
	// Set position of tree parts.
	treeLower.position.x=0;
	treeLower.position.y=6.0;   //-920 for big view //6.0 works with ghetto set up
	treeLower.position.z=0;   //250   //0 works with my ghetto set up
	//add tree meshes
	scene.add( treeTrunk );
	scene.add(treeLower);
	//scales the trees up to be seen better.
	treeTrunk.scale.x = 6;
	treeTrunk.scale.y = 6;
	treeTrunk.scale.z = 6;
	// define parent-child relationships
	treeLower.parent = treeTrunk;
	treeTrunk.position.x = x;
	treeTrunk.position.y = y;
	treeTrunk.position.z = z;
	treeTrunk.parent = globe;
	var rotation = new THREE.Quaternion();
	rotation.setFromUnitVectors(globe.up, treeTrunk.position.clone().normalize());
	treeTrunk.quaternion.copy(rotation);
	
	// Enable shadows.
	treeTrunk.castShadow = true;
	treeLower.castShadow = true;

	// Sets the name so the raycast can query against it.
	treeLower.name = "tree";
	treeTrunk.name = "tree";
}


function treeLoop(){
	for(var tree= 0; tree < maxTreeCount; tree++) {
		// Get the number of faces to use as maximum value: globe.geometry.faces.length;
		// Get a random vertex to slap a tree on.
//		var randomVert = Math.floor(Math.random() * (globe.geometry.vertices.length) );
		var randomVert = randomInt( 0 ,(globe.geometry.vertices.length) );

		createTree( globe.geometry.vertices[randomVert].getComponent(0),
					globe.geometry.vertices[randomVert].getComponent(1),
					globe.geometry.vertices[randomVert].getComponent(2));
					// https://threejs.org/docs/#api/en/math/Vector3.getComponent  Get component0/1/2 gets x y z of the vertex.
	} // END - For loop to create trees. 
}


// The actual function that gets called whenever the event listener is triggered.
function eventFuncTouchStart( event ) {
    // Not needed because the event target holder is passive.  Uncommenting will prompt errors about this.
	// event.preventDefault();

	// Variable to hold the x and y input coordinates.
	// The mathematical operations normalise the input; so that the value is between -1 and 1 in a float format.
	// Both x and y are " *-1" to invert them, seems like a bug.
	touchInputPos.x = ( (event.touches[0].clientX / window.innerWidth ) * 2 - 1);
	if(invertTouchInputY){
		touchInputPos.y = ( (event.touches[0].clientY / window.innerHeight ) * 2 - 1) *-1; 
	}else{
		touchInputPos.y = ( (event.touches[0].clientY / window.innerHeight ) * 2 - 1); 
	}
	
	// Debug logging to show the raw & normalised positions of input, incase there's bugs with desktop testing (seems to be!).
	// event.touches[0] gets the FIRST finger touch, since devices are capable of multi-touch input.
	console.log("NormX | RawX: " + touchInputPos.x + " | " + event.touches[0].clientX +  "\n"
				+ "NormY | RawY: " + touchInputPos.y + " | " + event.touches[0].clientY );
	
	// Sets the ray to use the scene camera & input position
	touchInputRay.setFromCamera(touchInputPos, camera);
	
	// Gets all the objects that the ray intersects.
	var intersectedObjects = touchInputRay.intersectObjects(scene.children);
	// Debug log how many objects were hit.
	console.log("Objects hit: " + intersectedObjects.length);
	
	// Iterate over the intersected objects.
	for (var index = 0; index < intersectedObjects.length; index++){
		console.log("Object #" + index);
//		intersectedObjects[index].object.material.color.set( 0xff0000 );
		if(intersectedObjects[index].object.name == "tree"){
			// Convenience variable to shorten typing within the loop.
			var hitObject = intersectedObjects[index].object;
			console.log("ITS A TREE! :D ");

			// In order to completely remove the tree, the parent and children have to be checked.
			// If there is a child, and its name is tree, the hit object was the treetop.
			if( hitObject.children.length == 1 && hitObject.children[0].name == "tree" ){
				cleanup3DObject(hitObject.children[0]);
			} // END if child name is tree.

			// If there is a parent, and its name is tree, the hit object was the trunk.
			if( (typeof hitObject.parent !== 'undefined') && hitObject.parent.name == "tree"){
				cleanup3DObject(hitObject.parent);
			} // END - if parent object is tree.

			// Remove the hit object.
			cleanup3DObject(hitObject);

		} // END - if intersected object is a tree.
	} // END - Iteration loop.
} // END - eventFuncTouchStart





// Kept in function to keep animate clean.
function updateGlobalLerpValue(){
	// Perform clamping or bouncing of lerp value.
	// If lerp value is LESS than 0...
	if(globalLerpValue < 0){
		// Snap value back to 0, and set reversing value to false.
		globalLerpReversing = false;
		globalLerpValue = 0;
	} // END - if global lerp is reversing.
	// Else, if the value is GREATER than 1...
	else if ( globalLerpValue > 1 ){
		if(globalLerpBounce){
			// Snap back to 1 and enable reversing.
			globalLerpReversing = true;
			globalLerpValue = 1;
		} // END - reverse enabled
		// Else, lerp bounce is disabled, so just snap the value that's greater than 1 back to 0.
		else{ // LERP BOUNCE DISABLED.
			// Snap value back to 0.
			globalLerpValue = 0;
		} // END - If lerp bounce is DISABLED
	} // END - if else.
	
	// Inc/Decrement the lerp value depending on if lerp Reverse is true or false.
	if(globalLerpReversing){
		// bounce is enabled, so count DOWN using speed.
		globalLerpValue -= globalLerpSpeed;
	} else{
		// Counting up normally using speed.
		globalLerpValue += globalLerpSpeed;
	} // END - if/else lerp reversing.
	
//	console.log("LERP: " + globalLerpValue);
} // END - update lerp value.



// A modified updateGlobalLerpValue to take an object which contains compatable object subtypes (lerp/animatable).
function updateObjectLerp( objectToModify ){
	// Perform clamping or bouncing of lerp value.
	if(objectToModify.animationFloat < 0){
		// Snap value back to 0, and set reversing value to false.
		objectToModify.animationReversing = false;
		objectToModify.animationFloat = 0;
	} // END - if global lerp is reversing.
	// If value is greater than 1.
	else if ( objectToModify.animationFloat > 1 ){
		// Check to see if global bouncing is enabled.
		if(objectToModify.animationBounces){
			// Snap back to 1 and enable reversing.
			objectToModify.animationReversing = true;
			objectToModify.animationFloat = 1;
		} // END - reverse enabled
		else{ // LERP BOUNCE DISABLED.
			// Snap value back to 0.
			objectToModify.animationFloat = 0;
		} // END - If lerp bounce is DISABLED
	} // END - if else.
	
	if(objectToModify.animationReversing){
		// bounce is enabled, so count DOWN using speed.
		objectToModify.animationFloat -= globalLerpSpeed;
	} else{
		// Counting up normally.
		objectToModify.animationFloat += globalLerpSpeed;
	} // END - if/else lerp reversing.
} // END - update lerp value.






var iframe = 0;

function animate() {
  globe.rotation.z     +=   0.005;
  pivPoint.rotation.z  +=   0.015;
	pivPoint.rotation.y  +=   0.005;
  rocket.rotation.y    +=   0.03;
  particles.rotation.z +=   0.001;
  particles.rotation.x +=   0.0001;
  particles.rotation.y +=   0.0001;

  // if (rParticlesArray.length <= 90) {
  //   makeParts();
  // }
  // for (var i = 0;i<rParticlesArray.length;i++) {
  //     var pArray = rParticlesArray.indexOf(i);
  //     rParticlesArray[i].material.opacity -= 0.008;
  //     if (rParticlesArray[i].material.opacity <= 0) {
  //        rParticlesArray[i].position.x = 0;
  //        rParticlesArray[i].position.y = 0;
  //        rParticlesArray[i].material.opacity = 1;
  //     }
      //rParticlesArray[i].position.x += (0.2 + rand(-0.1, 3) / 4) * 2;
      //rParticlesArray[i].position.y += (0.2 + rand(-0.1, 3) / 4) * 2;
    //}
	//globe.rotation.x += 0.002;
	controls.update();//    <----------------  NEED this to update the phone position
	requestAnimationFrame(animate);
	updateGlobalLerpValue();
	cloudsArray.forEach(cloudAnimation);
	for (var i =0; i<iCircleNumber; i++){
		meshCircleArray[i].position.y = Math.sin(iframe/400 + i*10) * 2;
	}
	iframe ++;
	renderer.render(scene, camera);
}
