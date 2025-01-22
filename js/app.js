const coordinatesDisplay = document.getElementById("coordinates");

let issMarker = null;
let issImage = null;
let issAstre=null;
let currentCoordinates = null;
let prevPos = null;
let pos = null;
let vel = null;
let latlngs = null;

let displayPosX = null;
let displayPosY = null;

let lastPosX = null;
let lastPosY = null;

const maxForce = 0.5;
const maxSpeed = 1.5  ;

    let p = { x: Math.random() * 50, y: Math.random() * 50 };
    let v = {
      x: (Math.random() * 2 - 1) * maxSpeed,
      y: (Math.random() * 2 - 1 )* maxSpeed,
    };
    let a = { x: 0, y: 0 };

let moyenneX = 0;
let moyenneY = 0;

const BASE_IMAGE_SIZE = 10;

const map = L.map("map").setView([47.2261139115089, -1.6178462999999998], 3);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);
updateISSPosition();

function calculateImageBounds(coordinates, zoomLevel) {
  const scaleFactor =
    BASE_IMAGE_SIZE / Math.pow(1.012, Math.pow(zoomLevel, 2.3));
  return [
    [
      coordinates.latitude + scaleFactor / 2,
      coordinates.longitude + scaleFactor / 2,
    ],
    [
      coordinates.latitude - scaleFactor / 2,
      coordinates.longitude - scaleFactor / 2,
    ],
  ];
}

function updateISSImage(currentCoordinates) {
  if (currentCoordinates && issImage) {
    map.removeLayer(issImage);
    const imageUrl = "./Ressources/iss.png";
    const imageBounds = calculateImageBounds(currentCoordinates, map.getZoom());
    issImage = L.imageOverlay(imageUrl, imageBounds).addTo(map);
  }
}

function updateImage(coordinates) {
  if (coordinates) {
    if(issAstre)
    map.removeLayer(issAstre);
    const imageUrl = "./Ressources/astronaute.png";
    const imageBounds = calculateImageBounds(coordinates, map.getZoom());
    issAstre = L.imageOverlay(imageUrl, imageBounds).addTo(map);

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

    let imageUrl = "./Ressources/iss.png";
    let imageBounds = calculateImageBounds(currentCoordinates, map.getZoom());
    issImage = L.imageOverlay(imageUrl, imageBounds).addTo(map);


    displayLine();
displayAstre();


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
map.on("zoomend", () => updateISSImage(currentCoordinates));

const updateInterval = 5000;
const positionTracker = setInterval(updateISSPosition, updateInterval);

function displayLine() {
  let prevDisplayPosX;
  let prevDisplayPosY;

  if (currentCoordinates) {
    pos = {
      x: currentCoordinates.latitude,
      y: currentCoordinates.longitude,
    };

if(lastPosX){
     let join = [
       [lastPosX, lastPosY],
       [pos.x, pos.y],
     ];

     L.polyline(join, { color: "red" }).addTo(map);  
    }

    if (prevPos) {
      vel = { x: pos.x - prevPos.x, y: pos.y - prevPos.y };

      displayPosX = pos.x;
      displayPosY = pos.y;

       if (moyenneX == 0){
        moyenneX = vel.x;
        moyenneY = vel.y;
       }
       else {
        moyenneX=(moyenneX+vel.x)/2;
              moyenneY = (moyenneY + vel.y) / 2;
      }

      setInterval(() => {
        if (!prevDisplayPosX || prevDisplayPosY) {
          prevDisplayPosX = prevPos.x;
          prevDisplayPosY = prevPos.y;
        }

        latlngs = [
          [prevDisplayPosX, prevDisplayPosY],
          [displayPosX, displayPosY],
        ];

        L.polyline(latlngs, { color: "red" }).addTo(map);

        prevDisplayPosX=displayPosX;
        prevDisplayPosY=displayPosY;

        displayPosX += moyenneX / (1600);
        displayPosY += moyenneY / (1600);

        let newCoordinates = { latitude: displayPosX, longitude: displayPosY };

         updateISSImage(newCoordinates);

         lastPosX=displayPosX;
         lastPosY=displayPosY;
      }, 1);

    }
  }
  prevPos = pos;
}

function displayAstre(){
  setInterval(()=>{
  if(currentCoordinates){

    let desired = {
      x: currentCoordinates.latitude - p.x,
      y: currentCoordinates.longitude - p.y,
    };

    let force=maxForce/Math.pow(Math.abs(desired.x)+Math.abs(desired.y),2.5);
    if(force>maxForce*10)force=maxForce*10;

    a.x = (desired.x - v.x) * force;
a.y = (desired.y - v.y) * force;

v.x+=a.x;
v.y += a.y;


if(v.x>maxSpeed)v.x=maxSpeed;
if (v.x < -maxSpeed) v.x = -maxSpeed;

if (v.y > maxSpeed) v.y = maxSpeed;
if (v.y < -maxSpeed) v.y = -maxSpeed;

p.x+=v.x;
p.y+=v.y;

if(p.x>90)p.x=-90;
if (p.x <-90) p.x = 90;

if (p.y > 180) p.y = -180;
if (p.y < -180) p.y = 180;


let coord = {latitude:p.x,longitude:p.y};


updateImage(coord);

  }
},60
);
}

document.addEventListener("keypress", ()=>{
    p = {
      x: currentCoordinates.latitude + Math.random() * 40 - 25,
      y: currentCoordinates.longitude + Math.random() * 40 - 25,
    };     v = {
      x: (Math.random() * 2 - 1) * maxSpeed/2,
      y: (Math.random() * 2 - 1) * maxSpeed/2,
    };
    a = { x: 0, y: 0 };
});

function cleanup() {
  clearInterval(positionTracker);
  if (issMarker) map.removeLayer(issMarker);
  if (issImage) map.removeLayer(issImage);
  map.off("zoomend", updateISSImage);
}
