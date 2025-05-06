const margin = { top: 50, right: 200, bottom: 100, left: 80 };
const width = 1400 - margin.left - margin.right;
const height = 800 - margin.top - margin.bottom;
const tooltip = d3.select("#tooltip");


let OriginalData = []
let startYear = 1950
let endYear = 1955

const timeInput = document.getElementById("startDate")
timeInput.addEventListener("change", (event) => {
    endYear = event.target.value
    UpdateModelSizeVis()
})

function UpdateModelSizeVis() {
    let data = OriginalData.filter(d => { return (d.date.getYear() + 1900) <= endYear - 1 })
    const g = d3.select("#vis1").select("svg").select("g")
    const xAxis = g.select(".xAxis")
    const yAxis = g.select(".yAxis")

    const x = d3.scaleTime()
        .domain([new Date(startYear, 0, 1), new Date(endYear, 0, 1)])
        .range([0, width]);

    const y = d3.scaleLog()
        .domain(d3.extent(OriginalData, d => d.paramSize))
        .range([height, 0]);

    const xAxisUpdated = d3.axisBottom(x).tickFormat(d => d3.timeFormat("%Y")(d));
    const yAxisUpdated = d3.axisLeft(y);

    xAxis.transition()
        .duration(100)
        .call(xAxisUpdated)

    yAxis.transition()
        .duration(100)
        .call(yAxisUpdated)

    // Scatter dots
    g.selectAll("circle").data(data).join(
        function (enter) {
            return enter.append("circle")
                .attr("cy", d => y(d.paramSize))
                .attr("r", 4)
                .attr("fill", "steelblue")
                .attr("cx", d => x(d.date))
                .on("mouseover", function (event, d) {
                    d3.select(this).style("cursor", "pointer")
                    tooltip.transition().duration(100).style("opacity", .95);
                    tooltip.html(`<strong>${d.Model}</strong><br>${d.Parameters} params<br>${d["Publication date"]}`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");

                })
                .on("mouseout", function () {
                    tooltip.transition().duration(300).style("opacity", 0);
                })
        },
        function (update) {
            return update.attr("cy", d => y(d.paramSize)).attr("cx", d => x(d.date))
        },
        function (exit) {
            return exit.remove()
        }
    )

}

function InitModelSizeVis(data) {

    const svg = d3.select("#vis1")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Axis labels
    svg.append("text")
        .attr("transform", `translate(${margin.left + width / 2},${margin.top + height + 40})`)
        .style("text-anchor", "middle")
        .text("Publication Date");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", margin.left - 60)
        .attr("x", 0 - (margin.top + height / 2))
        .style("text-anchor", "middle")
        .text("Trainable Parameters (log scale)");

    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .attr("class", "xAxis")

    g.append("g")
        .attr("class", "yAxis")

    UpdateModelSizeVis()
}



d3.csv("data2/notable_ai_models.csv").then(data => {

    data.forEach(d => {
        d.date = new Date(d["Publication date"]);
        d.paramSize = +d.Parameters;
        d.computeSize = + d["Training compute (FLOP)"]
        d.datasetSize = + d["Training dataset size (datapoints)"]
    });
    OriginalData = data.filter(d => { return d.paramSize > 0 });
    InitModelSizeVis(OriginalData)
});
