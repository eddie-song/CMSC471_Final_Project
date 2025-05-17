const margin = { top: 50, right: 200, bottom: 100, left: 80 };
const width = 680 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;
const tooltip = d3.select("#tooltip");


let computeData = []
let modelSizeData = []
let benchmarkData = []
let benchmarkTasks = ["Handwriting recognition", "Image recognition", "Language understanding", "Predictive reasoning", "Reading comprehension"]
let modelTypes = ["Biology", "Games", "Image generation", "Language", "Multiple domains", "Other", "Robotics", "Speech", "Vision"]
let modelColors = modelTypes.reduce((a, d, i) => { return { ...a, [d]: d3.schemeCategory10[i] } }, {})
let benchmarkColors = benchmarkTasks.reduce((a, d, i) => { return { ...a, [d]: d3.schemeCategory10[i] } }, {})

let selectedModels = new Set();
let selectedComputes = new Set();

let timelineYear = 1949
const computeStartYear = 1959
const modelSizeStartYear = 1950
const benchmarkStartYear = 1997



function addSelectedMilestone(milestone) {
    const name = milestone?.milestone_name;
    const milestoneType = milestone?.milestone_type == null ? "model" : milestone?.milestone_type;
    if (name != null) {
        if (milestoneType == "compute") {
            selectedComputes.add(name)
        } else if (milestoneType == "model") {
            selectedModels.add(name)
        }
    }

}

async function populateSelectedMilestones() {
    const res = await fetch("./timeline.json")
    const json = await res.json()
    if (json?.events == null) { return }

    for (const event of json.events) {
        console.log(event)
        addSelectedMilestone(event)
    }
}


populateSelectedMilestones();
let timeline = new TL.Timeline('timeline-embed', 'timeline.json');


timeline.on("change", (d) => {
    const event = timeline.getDataById(d?.unique_id)
    const endYear = event?.start_date?.data?.year
    if (endYear != null) {
        timelineYear = parseInt(endYear)
        UpdateModelSizeVis()
        UpdateBenchmarkVis()
        UpdateComputeVis()

    }
})

function addTitle(svg, title) {
    svg.append("text")
        .attr("x", width / 2 + margin.left)
        .attr("y", margin.top / 3)
        .attr("text-anchor", "middle")
        .style("font-size", "24px")
        .style("font-weight", "bold")
        .style("fill", "#333")
        .text(title);
}


function getOpacity(name, selected, defaultOpacity) {

    if (selected.size == 0 || selected.has(name)) {
        return defaultOpacity
    }

    return .1
}

const GraphYAxisFormat = (y) => {
    if (y < .0001) {
        return d3.format(".2e")(y)
    }
    if (y < 10) {
        return d3.format(".3f")(y)
    }

    if (y < 1000000) {
        return d3.format(",")(y)
    }

    return d3.format(".2s")(y).replace(/T/, " Trillion").replace(/G/, " Billion").replace(/M/, " Million").replace(/k/, " Thousand")
}
function UpdateModelSizeVis() {
    let data = modelSizeData.filter(d => { return (d.date.getYear() + 1900) <= timelineYear })
    const g = d3.select("#vis1").select("svg").select("g")
    const xAxis = g.select(".xAxis")
    const yAxis = g.select(".yAxis")


    const x = d3.scaleTime()
        .domain([new Date(modelSizeStartYear, 0, 1), new Date(timelineYear, 0, 1)])
        .range([0, width]);

    const y = d3.scaleLog()
        .domain(d3.extent(modelSizeData, d => d.paramSize))
        .range([height, 0]);

    const xAxisUpdated = d3.axisBottom(x).tickFormat(d => d3.timeFormat("%Y")(d));
    const yAxisUpdated = d3.axisLeft(y).tickFormat(GraphYAxisFormat);

    xAxis.transition()
        .duration(500)
        .call(xAxisUpdated)

    yAxis.transition()
        .duration(500)
        .call(yAxisUpdated)

    g.selectAll(".marker").data(data).join(
        function (enter) {
            return enter.append("circle")
                .on("click", function (event, d) {
                    if (selectedModels.has(d.Model)) {
                        selectedModels.delete(d.Model)
                    } else {
                        selectedModels.add(d.Model)
                    }
                    UpdateModelSizeVis()
                })
                .on("mouseover", function (event, d) {
                    d3.select(this).style("cursor", "pointer")
                    tooltip.transition().duration(100).style("opacity", .95);
                    tooltip.html(`<strong><span style="color: ${d.color};"> ${d.Model}</span> (${d.date.getYear() + 1900})</strong>${GraphYAxisFormat(d.Parameters)} parameters`)
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
                .attr("opacity", d => getOpacity(d.Model, selectedModels, 1))
                .attr("stroke", "black")
                .attr("fill", d => d.color)
                .attr("class", "marker")
        },
        function (update) {
            return update
                .transition(500)
                .attr("cy", d => y(d.paramSize))
                .attr("cx", d => x(d.date))
                .attr("opacity", d => getOpacity(d.Model, selectedModels, 1))

        },
        function (exit) {
            return exit.transition().duration(300).attr("r", 0).remove()
        }
    )

    let selectedData = data.filter(d => selectedModels.has(d.Model))
    g.selectAll(".outline").data(selectedData).join(
        function (enter) {
            return enter.append("circle")
                .attr("cy", d => y(d.paramSize))
                .attr("cx", d => x(d.date))
                .transition()
                .duration(500)
                .attr("r", 10)
                .attr("stroke", d => d.color)
                .attr("stroke-width", "2")
                .attr("fill", "none")
                .attr("class", "outline")
        },
        function (update) {
            return update
                .attr("stroke", d => d.color)
                .transition(500)
                .attr("cy", d => y(d.paramSize))
                .attr("cx", d => x(d.date))
        },
        function (exit) {
            return exit.remove()
        }
    )

    g.selectAll(".name").data(selectedData).join(
        function (enter) {
            enter.append("text")
                .attr("x", d => x(d.date))
                .attr("y", d => y(d.paramSize))
                .attr("text-anchor", "end ")
                .style("font-size", "18px")
                .style("font-weight", "bold")
                .style("transform", "translate(-10px, -10px)")
                .attr("fill", d => d.color)
                .text(d => d.Model)
                .attr("class", "name")
                .style("text-shadow", "1px 1px 1px black")
        },
        function (update) {
            return update
                .text(d => d.Model)
                .attr("fill", d => d.color)
                .transition(500)
                .attr("x", d => x(d.date))
                .attr("y", d => y(d.paramSize))
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
        .attr("transform", `translate(${margin.left + width / 1.8},${height / 4 + margin.top / 5})`)
        .style("text-anchor", "end")
        .text("Human Benchmark Performance")
        .attr("opacity", .5)
        .attr("font-weight", "bold")
        .style("font-size", 14)

    UpdateBenchmarkVis()
}

function UpdateBenchmarkVis() {
    let benchmarkEndYear = (timelineYear < benchmarkStartYear ? benchmarkStartYear : timelineYear)
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
                .attr("cx", d => x(d.date))
                .attr("cy", d => y(d.score))
        },

        function (exit) {
            return exit.remove()
        }

    )

    const line = d3.line((d) => x(d.date), (d) => y(d.score))
    g.select(".gLines").selectAll("path").data(benchmarkTasks).join(
        enter => {
            return enter.append("path")
                .attr("d", task => line(data.filter(d => d.task == task)))
                .attr("fill", "none")
                .attr("stroke", task => benchmarkColors[task])
        },
        update => {
            return update.attr("d", task => line(data.filter(d => d.task == task)))
        },
        exit => {
            return exit.remove()
        }
    )

}



function UpdateComputeVis() {
    let computeEndYear = (timelineYear < computeStartYear ? computeStartYear : timelineYear)
    let data = computeData.filter(d => { return (d.date.getYear() + 1900) <= computeEndYear })

    const g = d3.select("#vis3").select("svg").select("g")

    const xAxis = g.select(".xAxis")
    const yAxis = g.select(".yAxis")

    const x = d3.scaleTime()
        .domain([new Date(computeStartYear, 0, 1), new Date(computeEndYear, 0, 1)])
        .range([0, width]);

    const y = d3.scaleLog()
        .domain(d3.extent(computeData, d => d.cost))
        .range([height, 0]);


    const yAxisUpdated = d3.axisLeft(y).tickFormat(GraphYAxisFormat);
    const xAxisUpdated = d3.axisBottom(x).tickFormat(d3.timeFormat("%Y"));

    yAxis.transition()
        .call(yAxisUpdated)

    xAxis.transition()
        .call(xAxisUpdated)

    g.selectAll("circle").data(data).join(
        function (enter) {
            return enter.append("circle")
                .on("click", function (event, d) {
                    if (selectedComputes.has(d.name)) {
                        selectedComputes.delete(d.name)
                    } else {
                        selectedComputes.add(d.name)
                    }
                })
                .on("mouseover", function (event, d) {
                    if (d) {
                        d3.select(this).style("cursor", "pointer")
                        d3.select(this).attr("r", 12)
                        tooltip.transition().duration(100).style("opacity", .95);
                        tooltip.html(`<strong>${d.name}</strong>$${GraphYAxisFormat(d.cost)}`)
                            .style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY - 28) + "px");
                    }
                })
                .on("mouseout", function () {
                    d3.select(this).attr("r", 10)
                    tooltip.transition().duration(300).style("opacity", 0);
                })
                .attr("r", 10)
                .attr("fill", "#69b3a2")
                .attr("stroke", "black")
                .attr("opacity", d => getOpacity(d.name, selectedComputes, .75))
                .transition()
                .duration(300)
                .attr("cx", d => x(d.date))
                .attr("cy", d => y(d.cost))

        },
        function (update) {
            return update
                .transition().duration(500)
                .attr("cy", d => y(d.cost))
                .attr("cx", d => x(d.date))
                .attr("opacity", d => getOpacity(d.name, selectedComputes, .75))
        },
        function (exit) {
            return exit.transition().duration(300).attr("r", 0).remove()
        }
    )

    let selectedData = data.filter(d => selectedComputes.has(d.name))
    g.selectAll(".name").data(selectedData).join(
        function (enter) {
            enter.append("text")
                .attr("x", d => x(d.date))
                .attr("y", d => y(d.cost))
                .attr("text-anchor", "middle")
                .style("font-size", "18px")
                .style("font-weight", "bold")
                .style("transform", "translate(0, -15px)")
                .attr("fill", "#69b3a2")
                .text(d => d.name)
                .attr("class", "name")
                .style("text-shadow", "1px 1px 1px black")
        },
        function (update) {
            return update
                .text(d => d.name)
                .transition()
                .duration(500)
                .attr("y", d => y(d.cost))
                .attr("x", d => x(d.date))
        },
        function (exit) {
            return exit.remove()
        }
    )
}


function InitComputeVis() {
    const svg = d3.select("#vis3").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    addTitle(svg, "U.S. Dollars Per Compute Over Time")

    // Axis labels
    svg.append("text")
        .attr("transform", `translate(${margin.left + width / 2},${margin.top + height + 40})`)
        .style("text-anchor", "middle")

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", margin.left - 60)
        .attr("x", 0 - (margin.top + height / 2))
        .style("text-anchor", "middle")
        .text("Dollars Per GFLOP");

    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .attr("class", "xAxis")


    g.append("g").attr("class", "yAxis")
    g.append("g").attr("class", "gLines")

    UpdateComputeVis()
}

d3.csv("data/dollars_per_compute.csv").then(data => {
    data.forEach(d => {
        d.cost = +d.GFLOPCost;
        d.date = new Date(d.Day)
        d.name = d.Entity
    });

    data.sort((a, b) => { return a.date - b.date })
    computeData = data
    InitComputeVis()
})

d3.csv("data/ai_benchmark_progress.csv").then(data => {
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

d3.csv("data/notable_ai_models.csv").then(data => {

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
