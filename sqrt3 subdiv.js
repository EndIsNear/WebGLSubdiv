window.addEventListener('load', initialize);

var renderer;
var scene;
var camera;

var width, height;

function initialize() {
    width = window.innerWidth;
    height = window.innerHeight;

    // Get the DOM element to attach to
    const container = document.querySelector('#container');

    // Create a WebGL renderer, camera and a scene
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 45, width / height, 0.1, 1000);
    scene.add(camera);


    window.addEventListener( 'resize', onWindowResize, false );

    // Attach the renderer-supplied DOM element.
    container.appendChild(renderer.domElement);

    // create a point light
    var pointLight = new THREE.PointLight(0xFFFFFF);
    pointLight.position.x = 10;
    pointLight.position.y = 50;
    pointLight.position.z = 130;
    scene.add(pointLight);

    // create the sphere's material
    var sphereMaterial = new THREE.MeshLambertMaterial({ color: 0xCC00CC });

    // Create a new sphere geometry 
    var sphere = new THREE.Mesh(new THREE.SphereGeometry( 50, 16, 16), sphereMaterial);
    sphere.position.z = -300;

    // Finally, add the sphere to the scene.
    scene.add(sphere);
    requestAnimationFrame(update);
}

function update () {
  renderer.render(scene, camera);
  requestAnimationFrame(update);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
    render();
}