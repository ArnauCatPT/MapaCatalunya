const map = L.map('map').setView([41.8, 1.6], 8);

L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  {
    attribution: '© OpenStreetMap'
  }
).addTo(map);

let infoComarques = [];
let comarcaSeleccionada = null;

// Creamos un grupo de Leaflet para los marcadores de los municipios.
// Esto nos permite borrarlos todos juntos fácilmente con una sola línea.
const marcadoresMunicipios = L.layerGroup().addTo(map);

// Cargar JSON personalizado
fetch('comarcas.json')
  .then(res => res.json())
  .then(json => {
    infoComarques = json;
    cargarMapa();
  });

function cargarMapa() {
  fetch('comarcas.geojson')
    .then(res => res.json())
    .then(data => {

      L.geoJSON(data, {
        filter: function(feature) {
          return (
            feature.geometry.type === 'Polygon' ||
            feature.geometry.type === 'MultiPolygon' ||
            feature.geometry.type === 'GeometryCollection'
          );
        },

        style: {
          color: '#ffffff',
          weight: 2,
          fillColor: '#7E57C2',
          fillOpacity: 0.7
        },

        onEachFeature: function(feature, layer) {
          layer.on('click', function(e) {
            
            // 1. Limpiar los marcadores de municipios anteriores
            marcadoresMunicipios.clearLayers();

            // Restaurar estilo de la comarca anterior
            if (comarcaSeleccionada) {
              comarcaSeleccionada.setStyle({
                fillColor: '#7E57C2',
                fillOpacity: 0.7
              });
            }

            // Guardar y pintar la nueva comarca seleccionada
            comarcaSeleccionada = e.target;
            if (e.target.setStyle) {
              e.target.setStyle({
                fillColor: 'red',
                fillOpacity: 1
              });
            }

            // Buscar la comarca en tu JSON
            const comarca = infoComarques.find(c =>
              c.name === feature.properties.name
            );

            if (comarca) {
              const totalMunicipis = comarca.municipis ? comarca.municipis.length : 0;
              // Creamos el popup principal de la comarca
              e.target.bindPopup(`
                <h3>${comarca.name}</h3>
                <p>Website: ${comarca.website || 'No disponible'}</p>
                <p>Municipios cargados: ${totalMunicipis}</p>
              `).openPopup();

              // 2. Pintar los marcadores de sus municipios
              // AJUSTE: Cambia 'municipis' si en tu JSON se llama 'municipios' o de otra forma
              if (comarca.municipis && Array.isArray(comarca.municipis)) {
                comarca.municipis.forEach(municipio => {
                  
                  // Asegúrate de que el municipio tenga coordenadas válidas
                  if (municipio.coordinates && municipio.coordinates.lat && municipio.coordinates.lng) {
                    
                    // Creamos el marcador para el municipio
                    const marker = L.marker([municipio.coordinates.lat, municipio.coordinates.lng]);
                    
                    // Le añadimos un popup al marcador con sus datos
                    marker.bindPopup(`
                      <h4>${municipio.name}</h4>
                      <p>Lat: ${municipio.coordinates.lat}</p>
                      <p>Lng: ${municipio.coordinates.lng}</p>
                    `);
                    
                    // Lo metemos dentro de nuestro grupo de marcadores
                    marcadoresMunicipios.addLayer(marker);
                  }
                });
              }

            } else {
              // Fallback si no encuentra la comarca
              e.target.bindPopup(`
                <h3>${feature.properties.name}</h3>
                <p>No encontrada en comarques.json</p>
              `).openPopup();
            }

          });
        }
      }).addTo(map);

    });
}