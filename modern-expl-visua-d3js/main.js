// CHART START
// 1. aquí hay que poner el código que genera la gráfica
const width = 800
const height = 600
const margin = {
    top: 40,
    bottom: 60,
    left: 100,
    right: 20
}

let years;
let winners;
let originalData;

let winnersCount = {};

// data:
d3.csv("WorldCup.csv").then(data => {
    // 2. aquí hay que poner el código que requiere datos para generar la gráfica
    data.map(d=> d.Year = +d.Year);
    
    originalData = data;
    years = Array.from(new Set(data.map(d => d.Year))); 
    winners = filterDataByYear(years[years.length - 1]);

    // Inicializar el recuento de victorias por país
    winners = d3.nest()
        .key(d => d.winner)
        .entries(data)

    // Actualizar el gráfico con los datos del último año
    update(winners);
    slider();
});

// update:
function update(data) {
    // 3. función que actualiza el gráfico
    // Actualizar el recuento de victorias por país
    data.forEach(function(d) {
        if (!winnersCount[d.Winner]) {
            winnersCount[d.Winner] = 0;
        }
        winnersCount[d.Winner] += 1;
    });

    const winnersData = Object.entries(winnersCount).map(([winner, count]) => ({ Winner: winner, Ganadas: count }));
    
    winnersData.sort((a, b) => b.Ganadas - a.Ganadas);

    // Elimina el gráfico anterior
    d3.select("svg").remove();

    // Crea un nuevo SVG contenedor para el gráfico de barras
    var svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    var xScale = d3.scaleLinear()
        .domain([0, d3.max(winnersData, d => d.Ganadas)]) 
        .nice()
        .range([margin.left, width - margin.right]);

    var yScale = d3.scaleBand()
        .domain(winnersData.map(d => d.Winner)) 
        .range([margin.top, height - margin.bottom])
        .padding(0.1);

    svg.selectAll("rect")
        .data(winnersData)
        .enter()
        .append("rect")
        .attr("x", margin.left)
        .attr("y", d => yScale(d.Winner))
        .attr("width", d => xScale(d.Ganadas))
        .attr("height", yScale.bandwidth())

    var xAxis = d3.axisBottom(xScale)
        .ticks(5)
        .tickFormat(d3.format("d")); 

    var yAxis = d3.axisLeft(yScale);

    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(xAxis);

    svg.append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(yAxis);

    svg.append("text")
        .attr("class", "x-label")
        .attr("x", width / 2)
        .attr("y", height - margin.bottom + 50) // Ajusta la posición vertical del texto
        .text("Veces que ha Ganado");

    svg.append("text")
        .attr("class", "y-label")
        .attr("x", -height / 2)
        .attr("y", margin.left - 80)
        .attr("transform", "rotate(-90)")
        .text("Países Ganadores");
}

// treat data:
function filterDataByYear(year) {
    // 4. función que filtra los datos dependiendo del año que le pasemos (year)
    var selectedYear = parseInt(year);

    // Filtra los datos según el año seleccionado
    var filteredData = originalData.filter(function(d) {
        return d.Year === selectedYear;
    });

    return filteredData;
    
}
// CHART END

// slider:
function slider() {    
    // esta función genera un slider:
    var sliderTime = d3
        .sliderBottom()
        .min(d3.min(years))  // rango años
        .max(d3.max(years))
        .step(4)  // cada cuánto aumenta el slider (4 años)
        .width(580)  // ancho de nuestro slider en px
        .ticks(years.length)  
        .default(years[years.length -1])  // punto inicio del marcador
        .on('onchange', val => {
            // 5. AQUÍ SÓLO HAY QUE CAMBIAR ESTO:
            //console.log("La función aún no está conectada con la gráfica")
            const selectedYear = val;
            const filteredData = filterDataByYear(selectedYear);
            winnersCount = {};
            update(filteredData);
            
        });

        // contenedor del slider
        var gTime = d3 
            .select('div#slider-time')  // div donde lo insertamos
            .append('svg')
            .attr('width', width * 0.8)
            .attr('height', 100)
            .append('g')
            .attr('transform', 'translate(30,30)');

        gTime.call(sliderTime);  // invocamos el slider en el contenedor

        d3.select('p#value-time').text(sliderTime.value());  // actualiza el año que se representa
}