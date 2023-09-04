const width = 800
const height = 600
const margin = {
    top: 10,
    right: 10,
    bottom: 40,
    left: 70
}
let years;
let winners;
let originalData;

const svg = d3.select("#chart")
    .append("svg")
    .attr("id", "svg")
    .attr("width", width)
    .attr("height", height)


const elementGroup = svg.append("g")
    .attr("id", "elementGroup")
    .attr('transform', `translate(${0}, ${margin.top})`)

let y = d3.scaleBand()
    .range([0, height - margin.top - margin.bottom])
    .paddingInner(0.2).paddingOuter(0.05)
let x = d3.scaleLinear()
    .range([50, width - margin.left - margin.right])

const axisGroup = svg.append("g")
    .attr("id", "axisGroup")
const xAxisGroup = axisGroup
    .append("g")
    .attr("id", "xAxisGroup")
    .attr('transform', `translate(
        ${margin.left},
        ${height - margin.bottom})`)
const yAxisGroup = axisGroup
    .append("g")
    .attr("id", "yAxisGroup")
    .attr('transform', `translate(
        ${margin.left},
        ${margin.top})`)
const xAxis = d3.axisBottom()
    .scale(x).ticks(5).tickSize(-height)
const yAxis = d3.axisLeft().scale(y)

d3.csv('WorldCup.csv').then(data => {
    data.map(d => {
        d.Year = +d.Year
    })
    years = [...new Set(data.map(d => +d.Year))];
    originalData = data
    winners = d3.nest()
        .key(d => d.Winner)
        .rollup(v => v.length)
        .entries(data);

    // Ordena los datos por cantidad de victorias
    winners.sort((a, b) => b.value - a.value);

    // Usa los datos agrupados para el gráfico de barras
    x.domain([0, d3.max(winners, d => d.value)]);
    y.domain(winners.map(d => d.key));

    xAxisGroup.call(xAxis);
    yAxisGroup.call(yAxis);
    xAxisGroup.select('.domain').remove();

    elementGroup.selectAll('.bar')
        .data(winners)
        .enter()
        .append("rect")
        .attr('class', 'bar')
        .attr('height', y.bandwidth())
        .attr('x', margin.left)
        .attr('y', d => y(d.key))
        .attr('width', d => x(d.value));

})