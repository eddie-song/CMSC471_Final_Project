const margin = { top: 50, right: 200, bottom: 100, left: 80 };
const width = 1000 - margin.left - margin.right;
const height = 700 - margin.top - margin.bottom;
const tooltip = d3.select("#tooltip");

let ModelSizeData = []
let BenchmarkData = []
let benchmarkTasks = ["Handwriting recognition", "Image recognition", "Language understanding", "Predictive reasoning", "Reading comprehension"]
let taskColors = {
    "Handwriting recognition": "steelblue", "Image recognition": "green",
    "Language understanding": "brown", "Predictive reasoning": "purple", "Reading comprehension": "orange"
}
let timelineStartYear = 1950
let timelineEndYear = 1955

const timeInput = document.getElementById("startDate")
timeInput.addEventListener("change", (event) => {
    timelineEndYear = event.target.value
    UpdateModelSizeVis()
    UpdateBenchmarkVis()
})

function UpdateModelSizeVis() {
    let data = ModelSizeData.filter(d => { return (d.date.getYear() + 1900) <= timelineEndYear - 1 })
    const g = d3.select("#vis1").select("svg").select("g")
    const xAxis = g.select(".xAxis")
    const yAxis = g.select(".yAxis")

    const x = d3.scaleTime()
        .domain([new Date(timelineStartYear, 0, 1), new Date(timelineEndYear, 0, 1)])
        .range([0, width]);

    const y = d3.scaleLog()
        .domain(d3.extent(ModelSizeData, d => d.paramSize))
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
                    d3.select(this).attr("r", 6)
                    tooltip.transition().duration(100).style("opacity", .95);
                    tooltip.html(`<strong>${d.Model}</strong><br>${d.Parameters} params<br>${d.date.getYear() + 1900}`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");

                })
                .on("mouseout", function () {
                    d3.select(this).attr("r", 4)
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

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", margin.left - 60)
        .attr("x", 0 - (margin.top + height / 2))
        .style("text-anchor", "middle")
        .text("Trainable Parameters (Log Scale)");

    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .attr("class", "xAxis")

    g.append("g")
        .attr("class", "yAxis")

    UpdateModelSizeVis()
}

function InitBenchmarkVis() {
    const svg = d3.select("#vis2").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Axis labels
    svg.append("text")
        .attr("transform", `translate(${margin.left + width / 2},${margin.top + height + 40})`)
        .style("text-anchor", "middle")

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", margin.left - 60)
        .attr("x", 0 - (margin.top + height / 2))
        .style("text-anchor", "middle")
        .text("AI Performance");

    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .attr("class", "xAxis")


    g.append("g")
        .attr("class", "yAxis")


    g.append("g").attr("class", "gLines")

    const legend = svg.append("g").attr("class", "gLegend")

    let offset = 0;
    for (task of benchmarkTasks) {
        const color = taskColors[task]
        legend.append("circle").attr("cx", width + margin.left + 20).attr("cy", margin.top + offset).attr("r", 5).attr("fill", color)
        legend.append("text").attr("transform", `translate(${width + margin.left + 40},${margin.top + offset + 5})`).text(task).style("fill", color).style("font-size", "12px")
        offset += 30
    }

    const lineGenerator = d3.line()
    svg.append("path").attr("class", "horiz")
        .attr("d", lineGenerator([[margin.left, height / 4], [width + margin.left -10 , height / 4]]))
        .attr('stroke', 'grey')
        .attr('fill', 'none');

    svg.append("text")
        .attr("transform", `translate(${margin.left + width / 4},${height / 4 - 5})`)
        .style("text-anchor", "middle")
        .text("Human Performance as benchmark (set to zero)")
        .attr("opacity", .7)
        .attr("z-index", 10)


    UpdateBenchmarkVis()
}

function UpdateBenchmarkVis() {
    const benchmarkStartYear = 1997
    let benchmarkEndYear = (timelineEndYear < benchmarkStartYear ? benchmarkStartYear : timelineEndYear)
    let data = BenchmarkData.filter(d => { return (d.date.getYear() + 1900) <= benchmarkEndYear })


    const g = d3.select("#vis2").select("svg").select("g")


    const xAxis = g.select(".xAxis")
    const yAxis = g.select(".yAxis")

    const x = d3.scaleTime()
        .domain([new Date(benchmarkStartYear, 0, 1), new Date(benchmarkEndYear, 0, 1)])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([-100, 20])
        .range([height, 0]);

    const yAxisUpdated = d3.axisLeft(y);
    const xAxisUpdated = d3.axisBottom(x).tickFormat(d => d3.timeFormat("%Y")(d));

    yAxis.transition()
        .call(yAxisUpdated)

    xAxis.transition()
        .call(xAxisUpdated)


    g.selectAll("circle").data(data).join(
        function (enter) {
            return enter.append("circle")
                .attr("cy", d => y(d.score))
                .attr("r", 4)
                .attr("fill", d => d.color)
                .attr("cx", d => x(d.date))
                .on("mouseover", function (event, d) {
                    if (d) {
                        d3.select(this).style("cursor", "pointer")
                        d3.select(this).attr("r", 6)
                        tooltip.transition().duration(100).style("opacity", .95);
                        tooltip.html(`<span style="color: ${d.color};">${d.task}</span> <br> ${d.score}`)
                            .style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY - 28) + "px");
                    }
                })
                .on("mouseout", function () {
                    d3.select(this).attr("r", 4)
                    tooltip.transition().duration(300).style("opacity", 0);
                })
        },
        function (update) {
            return update
                .attr("cy", d => y(d.score))
                .transition().attr("cx", d => x(d.date))
        },

    )

    const line = d3.line((d) => x(d.date), (d) => y(d.score))
    g.select(".gLines").selectAll("path").data(benchmarkTasks).join(
        enter => {
            return enter.append("path").attr("d", task => line(data.filter(d => d.task == task))).attr("fill", "none").attr("stroke", task => taskColors[task])

        },
        update => {
            return update.transition(100).attr("d", task => line(data.filter(d => d.task == task)))
        },
        exit => {
            return exit.remove()
        }
    )

}

d3.csv("data2/ai_benchmark_progress.csv").then(data => {
    parsedData = []

    data.forEach(d => {
        const date = new Date(d.Year, 0, 1);
        benchmarkTasks.forEach(task => {
            const score = parseInt(d[task]);
            if (!isNaN(score)) {
                parsedData.push({ date, task, score, color: taskColors[task] });
            }
        });
    });

    BenchmarkData = parsedData
    InitBenchmarkVis()
})

d3.csv("data2/notable_ai_models.csv").then(data => {

    data.forEach(d => {
        d.date = new Date(d["Publication date"]);
        d.paramSize = +d.Parameters;
        d.computeSize = + d["Training compute (FLOP)"]
        d.datasetSize = + d["Training dataset size (datapoints)"]
    });
    ModelSizeData = data.filter(d => { return d.paramSize > 0 });
    InitModelSizeVis(ModelSizeData)
});
