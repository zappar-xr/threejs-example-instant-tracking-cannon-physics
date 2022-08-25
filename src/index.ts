/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */
/* eslint-disable func-names */
/* eslint-disable no-restricted-syntax */
/// Zappar for ThreeJS Examples
/// Cannon Physics

// In this example we aim and drop shapes using Zappar instant world tracking
// and the cannon-es library

import * as THREE from 'three';
import * as ZapparThree from '@zappar/zappar-threejs';
import * as CANNON from 'cannon-es';
import './index.css';
import * as ZapparSplashScreen from '@zappar/splash';

import RigidBodyMesh from './rigidBodyMesh';
import world from './world';

const logo = new URL('../assets/zapworksLogo.png', import.meta.url).href;
const background = new URL('../assets/background.jpg', import.meta.url).href;
const hotspot = new URL('../assets/hotspot.png', import.meta.url).href;


/*
* *** HTML Elements *** *
*/
// Place button
const zapparPlacementUi = document.getElementById('zappar-placement-ui');
// Toggle Button
const dropButton = document.getElementById('drop-Button');

// The SDK is supported on many different browsers, but there are some that
// don't provide camera access. This function detects if the browser is supported
// For more information on support, check out the readme over at
// https://www.npmjs.com/package/@zappar/zappar-threejs
if (ZapparThree.browserIncompatible()) {
  // The browserIncompatibleUI() function shows a full-page dialog that informs the user
  // they're using an unsupported browser, and provides a button to 'copy' the current page
  // URL so they can 'paste' it into the address bar of a compatible alternative.
  ZapparThree.browserIncompatibleUI();

  // If the browser is not compatible, we can avoid setting up the rest of the page
  // so we throw an exception here.
  throw new Error('Unsupported browser');
}

// ZapparThree provides a LoadingManager that shows a progress bar while
// the assets are downloaded. You can use this if it's helpful, or use
// your own loading UI - it's up to you :-)
const manager = new ZapparThree.LoadingManager();

// Construct our ThreeJS renderer and scene as usual
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
document.body.appendChild(renderer.domElement);

// As with a normal ThreeJS scene, resize the canvas if the window resizes
renderer.setSize(window.innerWidth, window.innerHeight);
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Create a Zappar camera that we'll use instead of a ThreeJS camera
const camera = new ZapparThree.Camera();

// On load, find our splash screen and display it
ZapparSplashScreen.showUI(
  {
    onClick: (e) => {
      e.destroy();
      // Request the necessary permission from the user
      ZapparThree.permissionRequestUI().then((granted) => {
        if (granted) {
          camera.start();
          // Hide and show correct parts
          zapparPlacementUi!.style.display = 'block';
        } else {
          ZapparThree.permissionDeniedUI();
        }
      });
    },
    title: 'Universal AR for Three.js',
    subtitle: 'World Tracking Cannon Physics',
    buttonText: 'Tap here to start',
    background,
    logo,
  },
);

// The Zappar component needs to know our WebGL context, so set it like this:
ZapparThree.glContextSet(renderer.getContext());

// Set the background of our scene to be the camera background texture
// that's provided by the Zappar camera
scene.background = camera.backgroundTexture;

// Create an InstantWorldTracker and wrap it in an InstantWorldAnchorGroup for us
// to put our ThreeJS content into
const instantWorldTracker = new ZapparThree.InstantWorldTracker();
const instantWorldAnchorGroup = new ZapparThree.InstantWorldAnchorGroup(
  camera,
  instantWorldTracker,
);

// Add our instant tracker group into the ThreeJS scene
scene.add(instantWorldAnchorGroup);

// Load a comprehensive icon for when users are placing content
const hotspotImage = new THREE.TextureLoader(manager).load(hotspot);

/*
* *** Cannon Physics *** *
* Note that we cannot see the physics world
*/

// Physics Floor
const floorShape = new CANNON.Plane();
const floorBody = new CANNON.Body({
  mass: 0,
  position: new CANNON.Vec3(0, 0, 0),
  shape: floorShape,
});
// Rotate Floorfloor
floorBody.quaternion.setFromAxisAngle(
  // Finding a place to rotate from and then...
  new CANNON.Vec3(-1, 0, 0),
  // ...providing the amount of rotation required
  Math.PI * 0.5,
);
world.addBody(floorBody);

/*
* *** Three.js Content *** *
* Now let's give the physics world representation
*/
// Our viewable floor
const floor = new THREE.Mesh(
  new THREE.BoxBufferGeometry(3.3, 3, 0),
  new THREE.MeshBasicMaterial({
    map: hotspotImage,
    transparent: true,
  }),
);
floor.receiveShadow = true;
floor.position.set(0, 0, 0);
floor.rotateX(-Math.PI / 2);
instantWorldAnchorGroup.add(floor);

// Add lights
const lightGroup = new THREE.Group();

const ambientLight = new THREE.AmbientLight('lightgrey');
const directionalLight = new THREE.DirectionalLight('white', 0.9);
directionalLight.castShadow = true;
directionalLight.position.set(0, 8, 5);

lightGroup.add(ambientLight, directionalLight);
instantWorldAnchorGroup.add(lightGroup);

// Make an array which will house our mesh and body variables
const objectsToUpdate: RigidBodyMesh[] = [];

/*
* This function creates a visual Three.js box shape and adds it to
* the trackerGroup. It also creates the cannon physics set-up for this
* particular item and adds it to the physics world.
*/
const createShape = () => {
  const shapeType = Math.random() > 0.5 ? 'box' : 'sphere';
  const mesh = new RigidBodyMesh(
    world,
    shapeType,
  );

  instantWorldAnchorGroup.add(mesh);
  objectsToUpdate.push(mesh);
};

/*
* *** Rendering *** *
*/
let hasPlaced:boolean = false;
let isPlaying:boolean = false;

// Clock for render function
const clock = new THREE.Clock();
let oldElapsedTime:number = 0;

// Amount of seconds to wait for spawn
let targetTime:number = 0.25;

// Set up our render loop
const render = () => {
  // Request the render function each frame
  requestAnimationFrame(render);
  // Make sure to update the camera frames
  camera.updateFrame(renderer);

  // Creating our own deltaTime to keep things smooth
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - oldElapsedTime;
  oldElapsedTime = elapsedTime;

  /*
    * *** Update physics world start *** *
  */

  /*
    * *** world.step() updates the world physics ***
    * 1/60 - 60fps
    * delta - how much time from previous tick
    * 3 - frame iterations to catch up if delay
    */

  world.step(1 / 60, deltaTime, 3);

  // For every object that is added to the objectsToUpdate array...
  for (const object of objectsToUpdate) {
  // ...the mesh (visible) position should copy the cannon body position...
    object.position.set(...object.body.position.toArray());
    // ...the mesh (visible) rotation should copy the cannon body rotation
    object.quaternion.set(...object.body.quaternion.toArray());
  }

  /*
  * *** Update physics world end *** *
  */

  // If the instant world tracker has not been placed, keep it offset
  if (!hasPlaced) {
    instantWorldTracker.setAnchorPoseFromCameraOffset(0, 0, -7);
    dropButton!.style.display = 'none';
    isPlaying = false;
    dropButton!.innerHTML = 'Start';
  } else {
    dropButton!.style.display = 'block';
  }

  // If we should be dropping
  if (isPlaying) {
    // Reduce target by 1 second
    targetTime -= deltaTime;
    // Then reset the timer
    if (targetTime <= 0) {
      targetTime = 0.25;
      createShape();
    }
  }

  // Make sure we render the scene using our camera
  renderer.render(scene, camera);
};
// Request the render function each frame
requestAnimationFrame(render);

/*
* *** Button Functionality *** *
*/
// Placement functionality
zapparPlacementUi?.addEventListener('click', () => {
  if (!hasPlaced) {
    zapparPlacementUi.innerHTML = 'Reset Place';
    dropButton!.style.bottom = '80px';
    hasPlaced = true;
  } else {
    dropButton!.style.display = 'none';
    zapparPlacementUi.innerHTML = 'Confirm Place';
    hasPlaced = false;
  }
});

// Start/Stop button functionality
dropButton?.addEventListener('click', () => {
  if (isPlaying) {
    dropButton.innerHTML = 'Start';
    isPlaying = false;
  } else {
    dropButton.innerHTML = 'Stop';
    isPlaying = true;
  }
});
