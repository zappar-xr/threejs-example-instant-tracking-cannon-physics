import * as CANNON from 'cannon-es';

// Create cannon physics world
const world = new CANNON.World();
// Sweep and Prune broadphase tests bodies on arbitrary axes; meaning,
// we are not checking every object for collision when unnecessary
world.broadphase = new CANNON.SAPBroadphase(world);
// When bodies are going so slow/are not moving, we
// don't want to check for collision unless forced
world.allowSleep = true;
// Set world gravity
world.gravity.set(0, -9.82, 0);

// Materials - reference first
const defaultMaterial = new CANNON.Material('default');

// Then define what happens when these types of material collide
const defaultContactMaterial = new CANNON.ContactMaterial(
  defaultMaterial,
  defaultMaterial,
  {
    friction: 0.1,
    restitution: 0.3,
  },
);
// Then make sure the physics world knows what should happen
world.addContactMaterial(defaultContactMaterial);
// Shapes will always collide with these rules if not explicitly stated otherwise
world.defaultContactMaterial = defaultContactMaterial;

export default world;
