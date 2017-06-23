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
    Subdivide:function(){ changeSubdivAmount(); },
    geometry: 'tetrahedron',
    material: 'phongFlat',
    meshColor: '#ff8000',
    surface: true,
    wireColor: '#ffffff',
    wireframe: true
};

var crnParams = {
    subdivAmount: 0,
    geometry: null,
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
var stats;

var renderer;
var scene;
var camera;
var controls;

var width, height;

function addFace(faces, faceCnt, a, b ,c) {
		faces[faceCnt] = a;
        faces[faceCnt + 1] = b;
        faces[faceCnt + 2] = c;
}

//subdivide
function subdivide(geometry) {
    var vertices = geometry.getAttribute('position').array;
    var faces = geometry.getIndex().array;
    var newVertCnt = 0;
    var newFacesCnt = 0;
    var newGeometry = new THREE.BufferGeometry();
    var newVertices = new Float32Array(vertices.length + faces.length);
    var newFaces = new Uint32Array(faces.length * 3);
    // copy original geometry
    for (; newVertCnt < vertices.length; ++newVertCnt) {
        newVertices[newVertCnt] = vertices[newVertCnt];
    }
    // for (; newFacesCnt < faces.length; ++newFacesCnt) {
        // newFaces[newFacesCnt] = faces[newFacesCnt];
    // }

	//array of neighbours for every old vertex
    var adjVertices = new Array();
    for (var i = 0; i < vertices.length/3; ++i) {
        adjVertices[i] = new Array();
    }
	
    //add new vertices
    for (var i = 0; i < faces.length / 3; ++i) {
        //calculate new vertex
        newVertices[newVertCnt + 0] = (vertices[faces[i * 3] * 3 + 0] + vertices[faces[i * 3 + 1] * 3 + 0] + vertices[faces[i * 3 + 2] * 3 + 0]) / 3;
        newVertices[newVertCnt + 1] = (vertices[faces[i * 3] * 3 + 1] + vertices[faces[i * 3 + 1] * 3 + 1] + vertices[faces[i * 3 + 2] * 3 + 1]) / 3;
        newVertices[newVertCnt + 2] = (vertices[faces[i * 3] * 3 + 2] + vertices[faces[i * 3 + 1] * 3 + 2] + vertices[faces[i * 3 + 2] * 3 + 2]) / 3;
		
		adjVertices[faces[i * 3 + 0]].push(newVertCnt/3);
		adjVertices[faces[i * 3 + 1]].push(newVertCnt/3);
		adjVertices[faces[i * 3 + 2]].push(newVertCnt/3);

		// addFace(newFaces, newFacesCnt, faces[i * 3], faces[i * 3 + 1], newVertCnt/3);
        // newFacesCnt+=3;
		
		// addFace(newFaces, newFacesCnt, faces[i * 3 + 1], faces[i * 3 + 2], newVertCnt/3);
        // newFacesCnt+=3;

		// addFace(newFaces, newFacesCnt, faces[i * 3 + 2], faces[i * 3], newVertCnt/3);

        newVertCnt+=3;
    }
	
	//“perturbe” old vertices
    for (var i = 0; i < adjVertices.length; ++i) {
		var crnSize = adjVertices[i].length;
		var alpha = (4 - Math.cos((Math.PI * 2) / crnSize)) * (1 / 9);
		
		var newVertex = new THREE.Vector3();
		for(var j = 0; j < crnSize; ++j) {
			newVertex.x += newVertices[adjVertices[i][j] * 3 + 0];
			newVertex.y += newVertices[adjVertices[i][j] * 3 + 1];
			newVertex.z += newVertices[adjVertices[i][j] * 3 + 2];
		}
		newVertex.multiplyScalar(alpha/crnSize);
		newVertex.x += vertices[i * 3 + 0] * (1 - alpha);
		newVertex.y += vertices[i * 3 + 1] * (1 - alpha);
		newVertex.z += vertices[i * 3 + 2] * (1 - alpha);
		
		newVertices[i * 3 + 0] = newVertex.x;
		newVertices[i * 3 + 1] = newVertex.y;
		newVertices[i * 3 + 2] = newVertex.z;
    }
	
	//here have to flip some edges
	//all old faces are useless now should connect every "old vertex" to its new Neighbors
	for (var oldVertexIdx = 0; oldVertexIdx < adjVertices.length; ++oldVertexIdx) {
		var idxOfFace = adjVertices[oldVertexIdx][0] - vertices.length / 3;

		var searchingFor = -1;
		var crnVert = adjVertices[oldVertexIdx][0];
		var startVert = crnVert;
		for(var i = 0; i < 3; ++i) {
			if(faces[idxOfFace * 3 + i] != oldVertexIdx) {
				searchingFor = faces[idxOfFace * 3 + i];
				break;
			} 
		}
		
		for(var i = 1; i < adjVertices[oldVertexIdx].length ;) {
			var found = false;
			//we found all faces just connect the last one
			if(adjVertices[oldVertexIdx].length == 1) {
				addFace(newFaces, newFacesCnt, oldVertexIdx, crnVert, startVert);
				newFacesCnt +=3;
				break;
			}
			
			idxOfFace = adjVertices[oldVertexIdx][i] - vertices.length / 3;
			var j = 0;
			for(; j < 3; ++j) {
				if(faces[idxOfFace * 3 + j] == searchingFor) {
					addFace(newFaces, newFacesCnt, oldVertexIdx, crnVert, adjVertices[oldVertexIdx][i]);
					newFacesCnt +=3;
					for(var k = 0; k < 3; ++k) {
						var tmp = faces[idxOfFace * 3 + k]
						if(tmp != oldVertexIdx && tmp != searchingFor) {
							searchingFor = tmp;
							crnVert = adjVertices[oldVertexIdx][i];
							break;
						}
					}
					
					//remove the founded and start searching from the begining
					adjVertices[oldVertexIdx].splice(i, 1);
					i = 0;
					found = true;
					break;
				}
			}
			if(!found) i++;
		}
	}

    newGeometry.addAttribute('position', new THREE.BufferAttribute(newVertices, 3));
    newGeometry.setIndex(new THREE.BufferAttribute(newFaces, 1));
    newGeometry.computeBoundingSphere();
    //newGeometry.computeVertexNormals();
    crnParams.geometry.dispose();
    crnParams.geometry = newGeometry;
    crnParams.mesh.geometry = newGeometry;
    crnParams.wireMesh.geometry = newGeometry;
}

function createBufferedIndexedGeomFromNormalGeometry(geometry) {
    var vertices = geometry.vertices;
    var faces = geometry.faces;
    var newVertCnt = 0;
    var newFacesCnt = 0;
    var newGeometry = new THREE.BufferGeometry();
    var newVertices = new Float32Array(vertices.length * 3);
    var newFaces = new Uint32Array(faces.length * 3);
    // copy original geometry
    for (; newVertCnt < vertices.length; ++newVertCnt) {
        newVertices[newVertCnt * 3] = vertices[newVertCnt].x;
        newVertices[newVertCnt * 3 + 1] = vertices[newVertCnt].y;
        newVertices[newVertCnt * 3 + 2] = vertices[newVertCnt].z;
    }
    var indices = new Uint32Array(faces.length * 3);
    for (; newFacesCnt < faces.length; ++newFacesCnt) {
        newFaces[newFacesCnt * 3] = faces[newFacesCnt].a;
        newFaces[newFacesCnt * 3 + 1] = faces[newFacesCnt].b;
        newFaces[newFacesCnt * 3 + 2] = faces[newFacesCnt].c;
    }

    newGeometry.addAttribute('position', new THREE.BufferAttribute(newVertices, 3));
    newGeometry.setIndex(new THREE.BufferAttribute(newFaces, 1));
    newGeometry.computeBoundingSphere();
    newGeometry.computeVertexNormals();
    return newGeometry;
}

function changeMeshGeometry() {
    scene.remove(crnParams.mesh);
    scene.remove(crnParams.wireMesh);
    createDefaultGeometry();
}

function changeSubdivAmount() {
    if(crnParams.subdivAmount >= 6) {
        console.log("Max subdivision amount is 6!");
        return;
    }
    crnParams.subdivAmount++;
    subdivide(crnParams.geometry);
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
    var obj = { };
    gui.add(params,'Subdivide');
    gui.add(params, 'geometry', geometriesNames).onChange(changeMeshGeometry);
    gui.add(params, 'material', materialNames).onChange(changeMeshMaterial);
    gui.addColor(params, 'meshColor').name('color').onChange(changeMeshColor);
    gui.add(params, 'surface').onChange(changeMeshSurface);
    gui.addColor(params, 'wireColor').name('wire color').onChange(changeWireMeshColor);
    gui.add(params, 'wireframe').onChange(changeMeshWireframe);
}

function createInitialGeoms() {
    geometries['tetrahedron'] = createBufferedIndexedGeomFromNormalGeometry(new THREE.TetrahedronGeometry(4));
    geometries['cube'] = createBufferedIndexedGeomFromNormalGeometry(new THREE.BoxGeometry(4, 4, 4));
    geometries['sphere'] = createBufferedIndexedGeomFromNormalGeometry(new THREE.SphereGeometry(4, 16, 9));
    geometries['icosahedron'] = createBufferedIndexedGeomFromNormalGeometry(new THREE.IcosahedronGeometry(4));
    geometries['dodecahedron'] = createBufferedIndexedGeomFromNormalGeometry(new THREE.DodecahedronGeometry(4));
}

function createMaterials() {
    var commonPhongParams = {
        color: crnParams.meshColor,
        shininess: 40,
        specular: 0x222222
    };
    materials['phongFlat'] = new THREE.MeshPhongMaterial(commonPhongParams);
    materials['phongFlat'].shading = THREE.FlatShading;
	materials['phongFlat'].side = THREE.DoubleSide;
    materials['phongSmooth'] = new THREE.MeshPhongMaterial(commonPhongParams);
    materials['phongSmooth'].shading = THREE.SmoothShading;
    materials['phongSmooth'].side = THREE.DoubleSide;
    materials['lambert'] = new THREE.MeshLambertMaterial({color: crnParams.meshColor});
    //materials['lambert'].side = THREE.DoubleSide;
    // create the wireframe material
    crnParams.wireMat = new THREE.MeshBasicMaterial({
        color: crnParams.wireColor,
        wireframe: true
    });
}


function createDefaultGeometry() {
    crnParams.geometry = geometries[params.geometry];
    crnParams.subdivAmount = 0;
    crnParams.mesh = new THREE.Mesh(
        crnParams.geometry,
        crnParams.material
    );
    changeMeshMaterial();
    scene.add(crnParams.mesh);
    // create the wireframe mesh
    crnParams.wireMesh = new THREE.Mesh(
        crnParams.geometry,
        crnParams.wireMat
    );
    scene.add(crnParams.wireMesh);
}

function createDefaultLights() {
    // create a point light
    var pointLight = new THREE.PointLight(0xFFFFFF);
    pointLight.position.x = 10;
    pointLight.position.y = 50;
    pointLight.position.z = 130;
    scene.add(pointLight);

    // create a point light
    var pointLight = new THREE.PointLight(0xFFFFFF);
    pointLight.position.x = -10;
    pointLight.position.y = -50;
    pointLight.position.z = -130;
    scene.add(pointLight);
}

function initialize() {
    width = window.innerWidth;
    height = window.innerHeight;

    // Get the DOM element to attach to
    const container = document.querySelector('#container');

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    stats.domElement.style.zIndex = 100;
    container.appendChild( stats.domElement );

    // Create a WebGL renderer, camera and a scene
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 45, width / height, 0.1, 40);
    camera.position.z = 15;

    controls = new THREE.OrbitControls(camera,renderer.domElement);
    controls.addEventListener('change', render);
    // some custom control settings
    controls.enablePan = false;

    scene.add(camera);

    window.addEventListener( 'resize', onWindowResize, false );

    initGui();

    // Attach the renderer-supplied DOM element.
    container.appendChild(renderer.domElement);

    createDefaultLights();
    createInitialGeoms();
    createMaterials();
    createDefaultGeometry();

    requestAnimationFrame(update);
}

function update () {
  renderer.render(scene, camera);
  stats.update();
  requestAnimationFrame(update);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function render() {
    renderer.render( scene, camera );
}
