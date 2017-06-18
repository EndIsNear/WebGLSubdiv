window.addEventListener('load', initialize);

var geometriesNames = [
    'tetrahedron',
    'cube',
    'sphere',
    'icosahedron',
    'dodecahedron'
];

var materialNames = [
    'phongFlat',
    'phongSmooth',
    'lambert'
];

var params = {
    geometry: 'tetrahedron',
    subdivAmount: 0,
    material: 'phongFlat',
    meshColor: '#ff8000',
    surface: true,
    wireColor: '#ffffff',
    wireframe: true
};

var crnParams = {
    subdivAmount: 0,
    originalGeometry: null,
    currentGeometry: null,
    mesh: null,
    wireMesh: null,
    wireMat: null,
    meshColor: new THREE.Color(parseInt(params.meshColor.replace('#', '0x'))),
    wireColor: new THREE.Color(parseInt(params.wireColor.replace('#', '0x'))),
    material: params.material,
};

var geometries = [];
var materials = [];

var guiControls;

var renderer;
var scene;
var camera;

var width, height;



function changeMeshGeometry() {
    scene.remove(crnParams.mesh);
    scene.remove(crnParams.wireMesh);
    createDefaultGeometry();
}

function changeMeshMaterial(){
    crnParams.mesh.material = materials[params.material];
    crnParams.material = params.material;
    crnParams.mesh.material.needsUpdate = true;
}

function changeMeshColor() {
    crnParams.meshColor = new THREE.Color(parseInt(params.meshColor.replace('#', '0x')));
    materials['phongFlat'].color = crnParams.meshColor;
    materials['phongSmooth'].color = crnParams.meshColor;
    materials['lambert'].color = crnParams.meshColor;
    crnParams.mesh.material.needsUpdate = true;
}

function changeMeshSurface() {
    crnParams.mesh.visible = params.surface;
}

function changeWireMeshColor() {
    crnParams.wireColor = new THREE.Color(parseInt(params.wireColor.replace('#', '0x')));
    crnParams.wireMat.color = crnParams.wireColor;
    crnParams.wireMat.needsUpdate = true;
}

function changeMeshWireframe() {
    crnParams.wireMesh.visible = params.wireframe;
}

function initGui() {
    gui = new dat.GUI();
    gui.add(params, 'geometry', geometriesNames).onChange(changeMeshGeometry);
    //gui.add(params, 'subdivAmount');
    gui.add(params, 'material', materialNames).onChange(changeMeshMaterial);
    gui.addColor(params, 'meshColor').name('color').onChange(changeMeshColor);
    gui.add(params, 'surface').onChange(changeMeshSurface);
    gui.addColor(params, 'wireColor').name('wire color').onChange(changeWireMeshColor);
    gui.add(params, 'wireframe').onChange(changeMeshWireframe);
}

function createInitialGeoms() {
    geometries['tetrahedron'] = new THREE.TetrahedronGeometry(4);
    geometries['cube'] = new THREE.BoxGeometry(4, 4, 4);
    geometries['sphere'] = new THREE.SphereGeometry(4, 16, 9);
    geometries['icosahedron'] = new THREE.IcosahedronGeometry(4);
    geometries['dodecahedron'] = new THREE.DodecahedronGeometry(4);
}

function createMaterials() {
    var commonPhongParams = {
        color: crnParams.meshColor,
        shininess: 40,
        specular: 0x222222
    };
    materials['phongFlat'] = new THREE.MeshPhongMaterial(commonPhongParams);
    materials['phongFlat'].shading = THREE.FlatShading;
    materials['phongSmooth'] = new THREE.MeshPhongMaterial(commonPhongParams);
    materials['phongSmooth'].shading = THREE.SmoothShading;
    materials['lambert'] = new THREE.MeshLambertMaterial({color: crnParams.meshColor});
    // create the wireframe material
    crnParams.wireMat = new THREE.MeshBasicMaterial({
        color: crnParams.wireColor,
        wireframe: true
    });
}


function createDefaultGeometry() {
    crnParams.currentGeometry = geometries[params.geometry];
    crnParams.subdivAmount = 0;
    crnParams.mesh = new THREE.Mesh(
        crnParams.currentGeometry,
        crnParams.material
    );
    changeMeshMaterial();
    scene.add(crnParams.mesh);
    // create the wireframe mesh
    crnParams.wireMesh = new THREE.Mesh(
        crnParams.currentGeometry,
        crnParams.wireMat
    );
    scene.add(crnParams.wireMesh);
}


function initialize() {
    width = window.innerWidth;
    height = window.innerHeight;

    // Get the DOM element to attach to
    const container = document.querySelector('#container');

    // Create a WebGL renderer, camera and a scene
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 45, width / height, 0.1, 40);
    camera.position.z = 15;
    scene.add(camera);

    window.addEventListener( 'resize', onWindowResize, false );

    initGui();

    // Attach the renderer-supplied DOM element.
    container.appendChild(renderer.domElement);

    // create a point light
    var pointLight = new THREE.PointLight(0xFFFFFF);
    pointLight.position.x = 10;
    pointLight.position.y = 50;
    pointLight.position.z = 130;
    scene.add(pointLight);


    createInitialGeoms();
    createMaterials();
    createDefaultGeometry();


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
}