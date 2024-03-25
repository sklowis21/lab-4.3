/*--------------------------------------------------------------------
GGR472 LAB 4: Incorporating GIS Analysis into web maps using Turf.js 
--------------------------------------------------------------------*/

/*--------------------------------------------------------------------
Step 1: INITIALIZE MAP
--------------------------------------------------------------------*/
// Define access token
mapboxgl.accessToken = 'pk.eyJ1Ijoic2tsb3dpcyIsImEiOiJjbHI4NHB0NDgwNjhvMmlxeW5zbG5yamx2In0.4hjvu4k-dsvYVBtCAgn-GA'; //****ADD YOUR PUBLIC ACCESS TOKEN*****

// Initialize map and edit to your preference
const map = new mapboxgl.Map({
    container: 'map', // container id in HTML
    style: 'mapbox://styles/sklowis/cltq7z73e02yr01qe6jqq66dw',  // ****ADD MAP STYLE HERE *****
    center: [-79.39, 43.65],  // starting point, longitude/latitude
    zoom: 10 // starting zoom level
});

map.addControl(new mapboxgl.NavigationControl());

/*--------------------------------------------------------------------
Step 2: VIEW GEOJSON POINT DATA ON MAP
--------------------------------------------------------------------*/
//HINT: Create an empty variable
//      Use the fetch method to access the GeoJSON from your online repository
//      Convert the response to JSON format and then store the response in your new variable

let pedcycgeojson;

fetch('https://raw.githubusercontent.com/sklowis21/Lab-4.2/data/pedcyc_collision_06-21.geojson')
    .then(response => response.json())
    .then(response => {
        console.log(response);
        pedcycgeojson = response;
    });

/*--------------------------------------------------------------------
    Step 3: CREATE BOUNDING BOX AND HEXGRID
--------------------------------------------------------------------*/
//HINT: All code to create and view the hexgrid will go inside a map load event handler
//      First create a bounding box around the collision point data then store as a feature collection variable
//      Access and store the bounding box coordinates as an array variable
//      Use bounding box coordinates as argument in the turf hexgrid function

let envresult; 
document.getElementById('bboxbutton').addEventListener('click', () => {
    
    let enveloped = turf.envelope(pedcycgeojson);

    envresult = {
        "type": "FeatureCollection",
        "features": [enveloped]
    };

    map.addSource('envelopeGeoJSON', {
        "type": "geojson",
        "data": envresult
    })

    map.addLayer({
        "id":"pedcycEnvelope",
        "type": "fill",
        "source":"envelopeGeoJSON",
        "paint": {
            'fill-color': "green",
            'fill-opacity':0.5,
            'fill-outline-color':"black"
        }
    });

    document.getElementById('bboxbutton').disabled = true;

});

map.on('load', () => {
    //let bboxgeojson;
    let bbox = turf.envelope(pedcycgeojson);
    let bboxscaled = turf.transformScale(bbox, 1.10);

    bboxgeojson = {
        "type": "FeatureCollection",
        "features": [bboxscaled]
    };

console.log(bbox.geometry.coordinates);

let bboxcoords = [bboxscaled.geometry.coordinates [0][0][0],
                bboxscaled.geometry.coordinates[0][0][1],
                bboxscaled.geometry.coordinates[0][2][0],
                bboxscaled.geometry.coordinates[0][2][1]];

let hexgeojson = turf.hexGrid(bboxcoords, 0.5, {units:'kilometers'});



/*--------------------------------------------------------------------
Step 4: AGGREGATE COLLISIONS BY HEXGRID
--------------------------------------------------------------------*/
//HINT: Use Turf collect function to collect all '_id' properties from the collision points data for each hexagon
//      View the collect output in the console. Where there are no intersecting points in polygons, arrays will be empty

let collishex = turf.collect(hexgeojson, pedcycgeojson, '_id', 'values');

let maxcollis = 0;

collishex.features.forEach((feature) => {
    feature.properties.COUNT = feature.properties.values.length
    if (feature.properties.COUNT > maxcollis) {
        console.log(feature);
        maxcollis = feature.properties.COUNT
    }
});




map.addSource('collis-hex', {
    type: 'geojson',
    data: hexgeojson
});

map.addLayer({
    'id' : 'collis-hex-fill',
    'type' : 'fill',
    'source' : 'collis-hex',
    'paint' : {
        'fill-color':[
            'step',
            ['get', 'COUNT'],
            '#bbff99',
            10, '#ffff66',
            25, '#ff5c33'
        ],
        'fill-opacity': 0.5,
        'fill-outline-color': "white"
    }
});

});

map.on('click', 'collis-hex-fill', (e) => {
    new mapboxgl.Popup()
    .setLngLat(e.lngLat)
    .setHTML("<b>Collision count:</b>" + e.features[0].properties.COUNT)
    .addTo(map);
})


// /*--------------------------------------------------------------------
// Step 5: FINALIZE YOUR WEB MAP
// --------------------------------------------------------------------*/
//HINT: Think about the display of your data and usability of your web map.
//      Update the addlayer paint properties for your hexgrid using:
//        - an expression
//        - The COUNT attribute
//        - The maximum number of collisions found in a hexagon
//      Add a legend and additional functionality including pop-up windows


// Add zoom and rotation controls


//Declare legend variable using legend div tag
const legend = document.getElementById('legend');
