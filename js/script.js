const margin = { top: 50, right: 200, bottom: 100, left: 80 };
const width = 850 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;
const tooltip = d3.select("#tooltip");


let modelSizeData = []
let benchmarkData = []
let benchmarkTasks = ["Handwriting recognition", "Image recognition", "Language understanding", "Predictive reasoning", "Reading comprehension"]
let modelTypes = ["Biology", "Games", "Image generation", "Language", "Multiple domains", "Other", "Robotics", "Speech", "Vision"]
let modelColors = modelTypes.reduce((a, d, i) => { return { ...a, [d]: d3.schemeCategory10[i] } }, {})
let benchmarkColors = benchmarkTasks.reduce((a, d, i) => { return { ...a, [d]: d3.schemeCategory10[i] } }, {})

let timelineEndYear = 1950
const modelSizeStartYear = 1950
const benchmarkStartYear = 1997

let timeline = new TL.Timeline('timeline-embed', 'timeline.json');


timeline.on("change", (d) => {
    const data = timeline.getDataById(d?.unique_id)
    const endYear = data?.start_date?.data?.year
    if (endYear != null) {
        updateGraphs(endYear)
    }
}
)

/* 
    TODO
    - add  titles to graphs/short descriptors
    - add Computer per dollar graph
    - allow hovering/filtering points on params graph 
*/

function updateGraphs(endYear) {
    timelineEndYear = endYear
    UpdateModelSizeVis()
    UpdateBenchmarkVis()
}

function addTitle(svg, title) {
    svg.append("text")
        .attr("x", width / 2 + margin.left)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "24px")
        .style("font-weight", "bold")
        .style("fill", "#333")
        .text(title);
}


function UpdateModelSizeVis() {
    let data = modelSizeData.filter(d => { return (d.date.getYear() + 1900) <= timelineEndYear })
    const g = d3.select("#vis1").select("svg").select("g")
    const xAxis = g.select(".xAxis")
    const yAxis = g.select(".yAxis")

    const x = d3.scaleTime()
        .domain([new Date(modelSizeStartYear, 0, 1), new Date(timelineEndYear, 0, 1)])
        .range([0, width]);

    const y = d3.scaleLog()
        .domain(d3.extent(modelSizeData, d => d.paramSize))
        .range([height, 0]);

    const xAxisUpdated = d3.axisBottom(x).tickFormat(d => d3.timeFormat("%Y")(d));
    const yAxisUpdated = d3.axisLeft(y);

    xAxis.transition()
        .duration(500)
        .call(xAxisUpdated)

    yAxis.transition()
        .duration(500)
        .call(yAxisUpdated)
    // Scatter dots
    g.selectAll("circle").data(data).join(

        function (enter) {
            return enter.append("circle")
                .on("mouseover", function (event, d) {
                    d3.select(this).style("cursor", "pointer")
                    d3.select(this).attr("r", 7)
                    tooltip.transition().duration(100).style("opacity", .95);
                    tooltip.html(`<strong><span style="color: ${d.color};"> ${d.Model}</span> (${d.date.getYear() + 1900})</strong>${d.Parameters} parameters`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");

                })
                .on("mouseout", function () {
                    d3.select(this).attr("r", 5)
                    tooltip.transition().duration(300).style("opacity", 0);
                })
                .attr("cy", d => y(d.paramSize))
                .attr("cx", d => x(d.date))
                .transition()
                .duration(500)
                .attr("r", 5)
                .attr("opacity", .75)
                .attr("stroke", "black")
                .attr("fill", d => d.color)
        },
        function (update) {
            return update.transition(500).attr("cy", d => y(d.paramSize)).attr("cx", d => x(d.date))
        },
        function (exit) {
            return exit.transition().duration(500).attr("r", 0).remove()
        }
    )

}

function InitModelSizeVis(data) {

    const svg = d3.select("#vis1")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)

    
    addTitle(svg, "AI Training Parameter Size Over Time");
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
        .text("Training Parameters Size");

    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .attr("class", "xAxis")

    g.append("g")
        .attr("class", "yAxis")


    const legend = svg.append("g").attr("class", "gLegend")
    let offset = 0;
    for (const modeltype of modelTypes) {
        const color = modelColors[modeltype]
        legend.append("circle").attr("cx", width + margin.left + 20).attr("cy", margin.top + offset).attr("r", 5).attr("fill", color)
        legend.append("text").attr("transform", `translate(${width + margin.left + 40},${margin.top + offset + 5})`).text(modeltype).style("fill", color).style("font-size", "12px")
        offset += 30
    }

    UpdateModelSizeVis()
}

function InitBenchmarkVis() {
    const svg = d3.select("#vis2").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    addTitle(svg, "AI Benchmark Performance Over Time")

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
    for (const task of benchmarkTasks) {
        const color = benchmarkColors[task]
        legend.append("circle").attr("cx", width + margin.left + 20).attr("cy", margin.top + offset).attr("r", 5).attr("fill", color)
        legend.append("text").attr("transform", `translate(${width + margin.left + 40},${margin.top + offset + 5})`).text(task).style("fill", color).style("font-size", "12px")
        offset += 30
    }

    const lineGenerator = d3.line()
    svg.append("path").attr("class", "horiz")
        .attr("d", lineGenerator([[margin.left, height / 4 + margin.top / 4], [width + margin.left, height / 4 + margin.top / 4]]))
        .attr('stroke', 'grey')
        .attr('fill', 'none');

    svg.append("text")
        .attr("transform", `translate(${margin.left + width / 3},${height / 4 + margin.top / 5})`)
        .style("text-anchor", "middle")
        .text("Human Performance as benchmark (set to zero)")
        .attr("opacity", .5)


    UpdateBenchmarkVis()
}

function UpdateBenchmarkVis() {
    let benchmarkEndYear = (timelineEndYear < benchmarkStartYear ? benchmarkStartYear : timelineEndYear)
    let data = benchmarkData.filter(d => { return (d.date.getYear() + 1900) <= benchmarkEndYear })


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
            .transition().duration(500).attr("cy", d => y(d.score))
                .attr("cx", d => x(d.date))
        },

    )

    const line = d3.line((d) => x(d.date), (d) => y(d.score))
    g.select(".gLines").selectAll("path").data(benchmarkTasks).join(
        enter => {
            return enter.append("path").transition().duration(500).attr("d", task => line(data.filter(d => d.task == task))).attr("fill", "none").attr("stroke", task => benchmarkColors[task])
        },
        update => {
            return update.transition().duration(500).attr("d", task => line(data.filter(d => d.task == task)))
        },
        exit => {
            return exit.remove()
        }
    )

}

d3.csv("data2/ai_benchmark_progress.csv").then(data => {
    const parsedData = []

    data.forEach(d => {
        const date = new Date(d.Year, 0, 1);
        benchmarkTasks.forEach(task => {
            const score = parseInt(d[task]);
            if (!isNaN(score)) {
                parsedData.push({ date, task, score, color: benchmarkColors[task] });
            }
        });
    });

    parsedData.sort((a, b) => { return a.date - b.date })
    benchmarkData = parsedData
    InitBenchmarkVis()
})

d3.csv("data2/notable_ai_models.csv").then(data => {

    data.forEach(d => {
        let domains = d.Domain.split(",")
        if (domains.len > 1) {
            d.color = modelColors["Multiple domains"]
        } else {
            const domain = domains[0];
            d.color = domain in modelColors ? modelColors[domain] : modelColors["Other"]
        }
        d.date = new Date(d["Publication date"]);
        d.paramSize = +d.Parameters;
        d.computeSize = + d["Training compute (FLOP)"]
        d.datasetSize = + d["Training dataset size (datapoints)"]
    });
    data = data.filter(d => { return d.paramSize > 0 });
    data.sort((a, b) => { return a.date - b.date })
    modelSizeData = data;
    InitModelSizeVis(modelSizeData)
});
