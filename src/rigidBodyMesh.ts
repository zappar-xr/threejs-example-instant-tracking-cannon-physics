/* eslint-disable no-unused-vars */
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

const randomScale = () => (Math.random() + 0.2) * 0.5;
const boxGeometry = new THREE.BoxBufferGeometry(1, 1, 1);
const sphereGeometry = new THREE.SphereBufferGeometry(1, 20, 20);

/**
 * Creates a mesh and a physics body for a given geometry type.
 *
 * The physics body is added to the world.
 * The mesh is moved to 5 on Y and random x and z.
 * The mesh is assigned a random color and scale.
 *
 * After the mesh is constructed, it destroys itself after a specified time. (default 2s)
 */
class RigidBodyMesh extends THREE.Mesh {
  body : CANNON.Body;

  private shape : CANNON.Shape;

  /**
   * Constructs a new RigidBodyMesh.
   * @param world The world to add the physics body to.
   * @param geometry The geometry to create the mesh from. Can be 'box' or 'sphere'.
   * @param scale The scale of the mesh. Defaults to (Math.random() + 0.2) * 0.5;
   * @param position The position of the mesh. Defaults to Math.random() - 0.2, 5, Math.random()
   * @param lifetime How long to wait before the mesh disposes of itself (ms). Defaults to 2s.
   *
   */
  constructor(
    private world: CANNON.World,
    private geometryType : 'box' | 'sphere' = 'box',
    scale = new THREE.Vector3(randomScale(), randomScale(), randomScale()),
    position = new THREE.Vector3(Math.random() - 0.2, 5, Math.random()),
    lifetime = 2000,
  ) {
    super(geometryType === 'box' ? boxGeometry : sphereGeometry, new THREE.MeshStandardMaterial({
      color: new THREE.Color(Math.random() * 0xffffff),
      metalness: 0.3,
      roughness: 0.4,
    }));

    this.position.copy(position);

    // Use a radius for spheres.
    if (this.geometryType === 'box') {
      this.scale.copy(scale);
      this.shape = new CANNON.Box(new CANNON.Vec3(...scale.multiplyScalar(0.5).toArray()));
    } else {
      this.scale.multiplyScalar(scale.x);
      this.shape = new CANNON.Box(new CANNON.Vec3(scale.x * 0.5, scale.x * 0.5, scale.x * 0.5));
    }

    this.body = new CANNON.Body({
      mass: 5,
      position: new CANNON.Vec3(0, 5, 0),
      shape: this.shape,
      material: new CANNON.Material('default'),
    });

    this.body.position.set(...position.toArray());
    world.addBody(this.body);

    setTimeout(() => {
      this.dispose();
    }, lifetime);
  }

  public dispose() {
    this.geometry?.dispose();
    this.world?.removeBody(this.body);
    this.parent?.remove(this);
  }
}

export default RigidBodyMesh;
