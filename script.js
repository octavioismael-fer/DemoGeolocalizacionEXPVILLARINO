document.addEventListener('DOMContentLoaded', () => {
    const apiKey = '5b3ce3597851110001cf6248ef8d458b9eaa4668b93988cf8bc98952'; // Reemplaza con tu clave de OpenRouteService

    // Inicializar el mapa
    const map = L.map('map').setView([0, 0], 13);

    // Añadir tiles de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Puntos de entrada al parque
    const entradas = [
        { name: 'Entrada Horacio', coords: [-33.02439412327588, -60.890023609904205] },
        { name: 'Entrada Timoteo', coords: [-33.02823896821544, -60.88505458177282] },
    ];

    // Función para calcular distancia en kilómetros
    const calcularDistancia = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Radio de la Tierra en km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Obtener la ubicación del usuario
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            map.setView([latitude, longitude], 15);

            // Añadir marcador de ubicación del usuario
            const userMarker = L.marker([latitude, longitude])
                .addTo(map)
                .bindPopup('Tu ubicación actual')
                .openPopup();

            // Encontrar la entrada más cercana
            let entradaMasCercana = null;
            let menorDistancia = Infinity;

            entradas.forEach((entrada) => {
                const distancia = calcularDistancia(latitude, longitude, ...entrada.coords);
                if (distancia < menorDistancia) {
                    menorDistancia = distancia;
                    entradaMasCercana = entrada;
                }
            });

            if (entradaMasCercana) {
                // Mostrar la entrada más cercana en el mapa
                L.marker(entradaMasCercana.coords)
                    .addTo(map)
                    .bindPopup(`${entradaMasCercana.name} (distancia: ${menorDistancia.toFixed(2)} km)`)
                    .openPopup();

                // Llamar a la API de OpenRouteService para obtener la ruta
                const url = `https://api.openrouteservice.org/v2/directions/foot-walking?api_key=${apiKey}&start=${longitude},${latitude}&end=${entradaMasCercana.coords[1]},${entradaMasCercana.coords[0]}`;
                
                fetch(url)
                    .then(response => response.json())
                    .then(data => {
                        // Extraer los puntos de la ruta
                        const rutaCoords = data.features[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);

                        // Dibujar la ruta en el mapa
                        L.polyline(rutaCoords, {
                            color: 'blue',
                            weight: 4,
                            opacity: 0.7,
                            dashArray: '5, 10' // Ruta punteada
                        }).addTo(map);
                    })
                    .catch(error => console.error('Error al obtener la ruta:', error));
            }
        },
        (error) => {
            console.error('Error obteniendo la ubicación:', error);
        }
    );

    // Añadir marcadores para todas las entradas
    entradas.forEach((entrada) => {
        L.marker(entrada.coords).addTo(map).bindPopup(entrada.name);
    });
});
