const { FBXLoader } = require('three/examples/jsm/loaders/FBXLoader.js');
const fs = require('fs');

const loader = new FBXLoader();
loader.load('public/models/character/mesh.fbx', (fbx) => {
  console.log('FBX Model loaded');
  console.log('Animations:', fbx.animations.length);
  fbx.animations.forEach((anim, i) => {
    console.log(  []  - Duration: s);
  });
  console.log('Has skeleton:', fbx.skeleton ? 'Yes' : 'No');
  console.log('Children count:', fbx.children.length);
}, undefined, (error) => {
  console.error('Error loading FBX:', error);
});
