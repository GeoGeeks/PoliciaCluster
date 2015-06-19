var entro = false,mylocate, encender = true, labels = {};;
var map = L.map('map',{
	maxZoom: 17
});
map.on('load', function(e) {
    $('#loadingSpace').hide();
});
map.setView([3.812300, -72.276290], 6);
map.locate({setView: true, maxZoom: 16});

/* Componente de Geolocalización */

var locate = L.control.locate({
  position: 'topright',
  remainActive: true,
  circleStyle: {
    color : '#1DF500',
    weight : 15
  },
  markerStyle : {
    fillColor : '#009900',
    color : '#009900',
    weight : 12
  },
  strings: {
      title: "Encontrar mi ubicación", 
      popup: "Actual Ubicación", 
      outsideMapBoundsMsg: "Pareces que te encuentras fuera de los límites del mapa"
  },
  locateOptions: {
	maxZoom: 17
  }
}).addTo(map);

locate.start();

/* Componente de Geocodificación */

var searchControl = new L.esri.Geocoding.Controls.Geosearch({
  position: 'topright',
  useMapBounds: false,
  placeholder: 'Ej: Carrera 12 90 20, Bogotá Colombia',
  title: 'Buscar una dirección',
  zoomToResult: false
}).addTo(map);

var results = new L.LayerGroup().addTo(map);

searchControl.on('results', function(data){
  var icono = L.icon({
    iconUrl: 'imagenes/pin.png',
    iconSize: [35, 37],
    iconAnchor: [18, 35.5],
    popupAnchor: [0,-30],
  });
  results.clearLayers();
  results.addLayer(L.marker(data.results[0].latlng,{
    icon : icono
  }));
  results.eachLayer(function (layer) {
    layer.bindPopup('<strong>Dirección: </strong>'+data.results[0].text);
  });
  map.setView( data.results[0].latlng, 16);
});

/* Capas del mapa */
L.esri.basemapLayer('Streets').addTo(map);
L.esri.featureLayer('http://gisponal.policia.gov.co/arcgis1/rest/services/Servicios_geograficos/COLOMBIA_PLANCUADRANTES/MapServer/1',{
  minZoom: 13,
  simplifyFactor: 0.35,
  style: {
    fillColor: 'transparent',
    color: '#02650B',
    weight: 3
  }
}).addTo(map);

/* Capa barrios y labels */
var capaBarrios = L.esri.featureLayer('http://gisponal.policia.gov.co/arcgis1/rest/services/Servicios_geograficos/COLOMBIA_PLANCUADRANTES/MapServer/2',{
  minZoom: 15,
  simplifyFactor: 0.75,
  precision: 5,
  style: {
    fillColor: 'transparent',
    color: '#434142',
    weight: 5,
    fillOpacity: 0.6
  }
});

/* labels */
capaBarrios.on('createfeature', function(e){
  var id = e.feature.id;
  var feature = capaBarrios.getFeature(id);
  var center = feature.getBounds().getCenter();
  var label = L.marker(center, {
    icon: new L.DivIcon({
      iconSize: null,
      className: 'labelBarrios',
      html: '<div><strong>' + e.feature.properties.NOMBRE + '</strong></div>'
    })
  }).addTo(map);
  labels[id] = label;
});
capaBarrios.on('addfeature', function(e){
  var label = labels[e.feature.id];
  if(label){
    label.addTo(map);
  }
});

capaBarrios.on('removefeature', function(e){
  var label = labels[e.feature.id];
  if(label){
    map.removeLayer(label);
  }
});

capaBarrios.on('mouseover', function (e) {
  capaBarrios.setFeatureStyle(e.layer.feature.id, {
    fillColor: 'gray'
  });
});
capaBarrios.on('mouseout', function (e) {
  capaBarrios.setFeatureStyle(e.layer.feature.id, {
    fillColor: 'transparent'
  });
});

/* Fin Labels */ 

/* Fin Capas*/

map.on('overlayadd', function(data){
  for(var i in labels){
    labels[i].addTo(map);
  }
  setTimeout(function(){ 
    $('#loadingSpace').hide();
  }, 1000);
});
map.on('overlayremove', function(data){
  for(var i in labels){
    map.removeLayer(labels[i]);
  }
  setTimeout(function(){ 
    $('#loadingSpace').hide();
  }, 1000);
});
var overlays = {
  "Barrios": capaBarrios
};
var baseMaps = {
  "Grayscale": capaBarrios
};
var layerControl = L.control.layers().addTo(map);
layerControl.addOverlay(capaBarrios, "Cities" , "Landmarks")
/* Fin Layer Control */

var icon = L.icon({
    iconUrl: 'imagenes/policia.png',
    iconSize: [50, 50],
    iconAnchor: [31, 36.5],
    popupAnchor: [0, -11],
  });

// create a new cluster layer
var policias = L.esri.clusteredFeatureLayer('http://gisponal.policia.gov.co/arcgis1/rest/services/Servicios_geograficos/COLOMBIA_PLANCUADRANTES/MapServer/0', {
  spiderfyOnMaxZoom:false,
  disableClusteringAtZoom: 18,
  polygonOptions: {
    color: '#02650B',
    weight: 4,
    opacity: 1,
    fillOpacity: 0.5
  },
  // this function defines how the icons
  // representing  clusters are created
  iconCreateFunction: function(cluster) {
    // get the number of items in the cluster
    var count = cluster.getChildCount();

    // figure out how many digits long the number is
    var digits = (count+'').length;

    var icono = new L.DivIcon({
      html: count,
      className:'cluster digits-'+digits,
      iconSize: null
    });
    if(map.getZoom()>15){
      icono = L.icon({
        iconUrl: 'imagenes/policias.png',
        iconSize: [70, 70],
        iconAnchor: [37.5, 36.5],
        popupAnchor: [0, -11],
      });
    }

    return icono;
  },

  // this function defines how individual markers
  // are created. You can see we are using the
  // direction from the feature to get the icon
  pointToLayer: function (geojson, latlng) {
  //  var direction = (geojson.properties.direction) ? geojson.properties.direction.toLowerCase() : 'none';
    return L.marker(latlng, {
      icon: icon
    });
  }
}).addTo(map);

policias.on('clusterclick', function (a) {
  var popup = L.popup();
  var result = "";
    if(map.getZoom()>15){
      var nodos = a.layer.getAllChildMarkers();
      result += L.Util.template('<div style="position:relative;" id="popUpinfo'+0+'">Cuadrante: <strong>{NRO_CUADRA}</strong><br>Policia: <strong>{EMPLEADO}</strong><br>Telefono: <strong>{TELEFONO}</strong><br><img src="imagenes/flecha_der.png" class="flechaDer" onclick="cambioPopUp(1,0)"></div>', nodos[0].feature.properties);
      for (var i = 1; i < nodos.length-1; i++) {
        result += L.Util.template('<div style="position:relative; display:none;" id="popUpinfo'+i+'"><img src="imagenes/flecha_izq.png" class="flechaIzq" onclick="cambioPopUp('+(i-1)+','+i+')">Cuadrante: <strong>{NRO_CUADRA}</strong><br>Policia: <strong>{EMPLEADO}</strong><br>Telefono: <strong>{TELEFONO}</strong><br><img src="imagenes/flecha_der.png" class="flechaDer" onclick="cambioPopUp('+(i+1)+','+i+')"></div>', nodos[i].feature.properties);
      }
      result += L.Util.template('<div style="position:relative; display:none;" id="popUpinfo'+(nodos.length-1)+'"><img src="imagenes/flecha_izq.png" class="flechaIzq" onclick="cambioPopUp('+(nodos.length-2)+','+(nodos.length-1)+')">Cuadrante: <strong>{NRO_CUADRA}</strong><br>Policia: <strong>{EMPLEADO}</strong><br>Telefono: <strong>{TELEFONO}</strong><br></div>', nodos[nodos.length-1].feature.properties);
       popup
        .setLatLng(a.latlng)
        .setContent(result)
        .openOn(map);
      return false;
    }
  return false;
});
policias.bindPopup(function(feature){
  return L.Util.template('<strong>Cuadrante: </strong>{NRO_CUADRA}<br><strong>Policia: </strong>{EMPLEADO}<br><strong>Telefono: </strong>{TELEFONO}<br>', feature.properties);
});
$(".leaflet-control-zoom-in").html('');
$('.leaflet-control-zoom-out').html('');


function cambioPopUp(nuevo,antiguo){
  $("#popUpinfo"+antiguo).fadeOut("slow", function() {
    $("#popUpinfo"+nuevo).fadeIn("slow");
  });
}

$("#capaBarrios").click(function(){
  $('#loadingSpace').show();
  $('.leaflet-control-layers-selector').click();
});

function homeExtent(){
  var coordenadas = L.latLng(5.02528, -72.20215);
  map.setView( coordenadas , 5);
}