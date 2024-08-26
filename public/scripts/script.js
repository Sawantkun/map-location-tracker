const socket = io();

// Initialize the map
const map = L.map('map').setView([51.505, -0.09], 17);

// Define base layers for different map views
const baseLayers = {
    "Satellite": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
    "OpenStreetMap Dark": L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'),
    "OpenStreetMap Light": L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png')
};

// Add default layer
baseLayers["Satellite"].addTo(map);

// Add a layer control to switch between different views
L.control.layers(baseLayers).addTo(map);

// Create a marker with no initial position
const marker = L.marker([0, 0]).addTo(map);

// Initialize the routing control
let routeControl = L.Routing.control({
    waypoints: [],
    createMarker: () => null, // Do not create markers for waypoints
    routeWhileDragging: true,
    lineOptions: {
        styles: [{ color: '#6FA1EC', weight: 4 }]
    },
    geocoder: L.Control.Geocoder.nominatim()
}).addTo(map);

// Initialize an empty marker for the destination with default Leaflet icon
let destinationMarker = L.marker([0, 0], { icon: L.icon({iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png', iconSize: [25, 41], iconAnchor: [12, 41]}) }).addTo(map);

// Function to update location
function updateLocation(position) {
    const { latitude, longitude } = position.coords;
    console.log(`Geolocation data: Latitude ${latitude}, Longitude ${longitude}`);

    // Update the marker position
    marker.setLatLng([latitude, longitude]);

    // Center the map on the new position
    map.setView([latitude, longitude]);

    // Emit the location to the server
    socket.emit('locationUpdate', { latitude, longitude });

    // Update the current location for routing
    if (routeControl.getPlan().getWaypoints().length > 0) {
        routeControl.setWaypoints([
            L.latLng(latitude, longitude),
            routeControl.getPlan().getWaypoints()[1]
        ]);
    }
}

// Function to handle errors
function handleError(error) {
    console.error('Error obtaining location', error);
    alert('Unable to retrieve location. Please check your browser settings.');
}

// Watch position
if ('geolocation' in navigator) {
    navigator.geolocation.watchPosition(updateLocation, handleError, { enableHighAccuracy: true });
} else {
    alert('Geolocation is not supported by your browser.');
}

// Listen for location updates from the server
socket.on('updateMap', (location) => {
    console.log(`Updating map with received data: Latitude ${location.latitude}, Longitude ${location.longitude}`);
    marker.setLatLng([location.latitude, location.longitude]);
    map.setView([location.latitude, location.longitude]);
});

// Add search control
const geocoder = L.Control.Geocoder.nominatim();
L.Control.geocoder({
    geocoder: geocoder,
    placeholder: 'Search for a place...'
}).on('markgeocode', function(event) {
    // Get the coordinates from the search result
    const { center } = event.geocode;
    console.log(`Search result center: Latitude ${center.lat}, Longitude ${center.lng}`);
    
    // Add a waypoint to the routing control
    routeControl.setWaypoints([
        L.latLng(marker.getLatLng()),  // Current location
        center                        // Search result location
    ]);

    // Add a marker at the destination location
    destinationMarker.setLatLng(center);
}).addTo(map);
