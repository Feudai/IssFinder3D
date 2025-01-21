
const coordinatesDisplay = document.getElementById("coordinates");


const map = L.map("map").setView([47.2261139115089, -1.6178462999999998], 19);


L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);
updateISSPosition();


let issMarker = null;
let issImage = null;
let currentCoordinates = null;

const BASE_IMAGE_SIZE = 10; 


function calculateImageBounds(coordinates, zoomLevel) {
    const scaleFactor = BASE_IMAGE_SIZE / Math.pow(1.012, Math.pow(zoomLevel,2.3));
  return [
    [
      coordinates.latitude + scaleFactor / 2,
      coordinates.longitude + scaleFactor / 2,
    ],
    [coordinates.latitude - scaleFactor/2, coordinates.longitude - scaleFactor/2],
  ];
}


function updateISSImage() {
  if (currentCoordinates && issImage) {
    map.removeLayer(issImage);
    const imageUrl = "./Ressources/iss.png";
    const imageBounds = calculateImageBounds(currentCoordinates, map.getZoom());
    issImage = L.imageOverlay(imageUrl, imageBounds).addTo(map);
  }
}


async function updateISSPosition() {
  try {
    const response = await fetch("http://api.open-notify.org/iss-now.json");
    const data = await response.json();

    //fetch("http://api.open-notify.org/iss-now.json").then(response=>response.JSON).then((data)=>{})

    currentCoordinates = {
      latitude: parseFloat(data.iss_position.latitude),
      longitude: parseFloat(data.iss_position.longitude),
    };

    coordinatesDisplay.innerText = `Latitude: ${currentCoordinates.latitude} - Longitude: ${currentCoordinates.longitude}`;

    if (issMarker) {
      map.removeLayer(issMarker);
    }
    if (issImage) {
      map.removeLayer(issImage);
    }

    issMarker = L.marker([
      currentCoordinates.latitude,
      currentCoordinates.longitude,
    ]).addTo(map);
    issMarker.setOpacity(0);

    const imageUrl = "./Ressources/iss.png";
    const imageBounds = calculateImageBounds(currentCoordinates, map.getZoom());
    issImage = L.imageOverlay(imageUrl, imageBounds).addTo(map);

    return currentCoordinates;
  } catch (error) {
    console.error("Erreur lors de la requête", error);
  }
}

function centerMapOnISS() {
  if (issMarker) {
    const position = issMarker.getLatLng();
    map.setView(position, map.getZoom());
  }
}

//eventListener
map.on("click", centerMapOnISS);
map.on("zoomend", updateISSImage); 

const updateInterval = 5000; 
const positionTracker = setInterval(updateISSPosition, updateInterval);

function cleanup() {
  clearInterval(positionTracker);
  if (issMarker) map.removeLayer(issMarker);
  if (issImage) map.removeLayer(issImage);
  map.off("zoomend", updateISSImage); 
}
