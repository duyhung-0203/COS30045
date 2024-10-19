// Create the scene, camera, and renderer
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create a sphere (earth)
let geometry = new THREE.SphereGeometry(5, 32, 32);
let material = new THREE.MeshBasicMaterial({
  map: new THREE.TextureLoader().load(
    "https://threejsfundamentals.org/threejs/resources/images/earth.jpg"
  ),
});
let earth = new THREE.Mesh(geometry, material);
scene.add(earth);

// Set camera position
camera.position.z = 10;

// Add rotation to the Earth
function animate() {
  requestAnimationFrame(animate);
  earth.rotation.y += 0.001; // Rotate the earth slowly
  renderer.render(scene, camera);
}
animate();

// Sample health data (replace with your actual dataset)
let healthData = [
  {
    country: "USA",
    lat: 37.0902,
    lon: -95.7129,
    healthInfo: "Obesity rate: 36%",
  },
  {
    country: "India",
    lat: 20.5937,
    lon: 78.9629,
    healthInfo: "Diabetes rate: 8.9%",
  },
  {
    country: "Brazil",
    lat: -14.235,
    lon: -51.9253,
    healthInfo: "Heart disease: 20%",
  },
];

// Function to convert lat/lon to 3D coordinates on the sphere
function latLonToVector3(lat, lon, radius) {
  let phi = (90 - lat) * (Math.PI / 180);
  let theta = (lon + 180) * (Math.PI / 180);
  let x = -radius * Math.sin(phi) * Math.cos(theta);
  let z = radius * Math.sin(phi) * Math.sin(theta);
  let y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Add markers for health data points
healthData.forEach((data) => {
  let markerGeometry = new THREE.SphereGeometry(0.1, 8, 8);
  let markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  let marker = new THREE.Mesh(markerGeometry, markerMaterial);

  let markerPosition = latLonToVector3(data.lat, data.lon, 5);
  marker.position.copy(markerPosition);
  scene.add(marker);

  // Display health information when hovering
  let infoDiv = document.querySelector(".info");
  marker.onmouseover = function () {
    infoDiv.textContent = `${data.country}: ${data.healthInfo}`;
  };
});

// Adjust the scene on window resize
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
