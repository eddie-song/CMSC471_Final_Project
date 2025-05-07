const margin = { top: 50, right: 200, bottom: 175, left: 80 };
const width = 1400 - margin.left - margin.right;
const height = 800 - margin.top - margin.bottom;

const companyMapping = {
    "claude": ["claude-2.0", "claude-2.1", "claude-3-haiku", "claude-3-opus", "claude-3-sonnet", "claude-3.5", "claude-3.7"],
    "openai": ["gpt-3.5", "gpt-4", "gpt-4.5", "gpt-4.1"],
    "anthropic": ["claude"],
    "google": ["gemini", "gemma"],
    "meta": ["llama"],
    "mistral": ["mistral", "mixtral"],
    "xai": ["grok"],
    "qwen": ["qwen"],
    "deepseek": ["deepseek"],
    "all": []
};

const dropdownContainer = d3.select("#vis")
    .insert("div", ":first-child")
    .style("margin-bottom", "20px")
    .style("display", "flex")
    .style("gap", "20px")
    .style("align-items", "center");

const companyDropdownDiv = dropdownContainer.append("div")
    .style("display", "flex")
    .style("align-items", "center");

companyDropdownDiv.append("label")
    .attr("for", "companySelect")
    .text("Select Company: ")
    .style("margin-right", "10px");

const companyDropdown = companyDropdownDiv.append("select")
    .attr("id", "companySelect")
    .style("padding", "5px")
    .style("font-size", "14px");

companyDropdown.selectAll("option")
    .data(["all", ...Object.keys(companyMapping)])
    .enter()
    .append("option")
    .text(d => d.charAt(0).toUpperCase() + d.slice(1))
    .attr("value", d => d);

const modelDropdownDiv = dropdownContainer.append("div")
    .style("display", "flex")
    .style("align-items", "center");

modelDropdownDiv.append("label")
    .attr("for", "modelSelect")
    .text("Select Model: ")
    .style("margin-right", "10px");

const modelDropdown = modelDropdownDiv.append("select")
    .attr("id", "modelSelect")
    .style("padding", "5px")
    .style("font-size", "14px");

const svg = d3.select("#vis")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const tasks = ["GPQA diamond", "MATH level 5", "OTIS Mock AIME 2024-2025", "FrontierMath-2025-02-28-Public", "FrontierMath-2025-02-28-Private", "SWE-Bench verified"];

const taskDescriptions = {
    "GPQA diamond": "General Programming Quality Assessment - Tests model's ability to solve general programming problems",
    "MATH level 5": "Advanced Mathematics Problems - Tests mathematical reasoning and problem-solving at a high school/early college level",
    "OTIS Mock AIME 2024-2025": "American Invitational Mathematics Examination Practice - Tests advanced mathematical problem-solving skills",
    "FrontierMath-2025-02-28-Public": "Public Dataset of Frontier Mathematics Problems - Tests cutting-edge mathematical reasoning",
    "FrontierMath-2025-02-28-Private": "Private Dataset of Frontier Mathematics Problems - Additional challenging mathematics problems",
    "SWE-Bench verified": "Software Engineering Benchmark - Tests practical software development and coding abilities"
};

const scoreDescription = `
Score Scale (0-1):
• 0.0 = No correct answers
• 0.5 = Half of answers correct
• 1.0 = All answers correct

The score represents the model's accuracy in solving problems for each task. Higher scores indicate better performance.
`;

const taskColors = d3.scaleOrdinal()
    .domain(tasks)
    .range(d3.schemeCategory10);

const xScale = d3.scalePoint()
    .domain(tasks)
    .range([0, width])
    .padding(0.5);

const yScale = d3.scaleLinear()
    .domain([0, 1])
    .range([height, 0]);

const xAxis = d3.axisBottom(xScale)
    .tickSize(-height);

const yAxis = d3.axisLeft(yScale)
    .tickSize(-width)
    .tickFormat(d3.format(".1f"));

svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(xAxis)
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end")
    .style("font-size", "14px")
    .style("cursor", "help")
    .on("mouseover", function(event, d) {
        const tooltip = d3.select("#tooltip");
        tooltip.style("display", "block")
            .html(`<strong>${d}</strong><br>${taskDescriptions[d]}`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
    })
    .on("mouseout", function() {
        d3.select("#tooltip").style("display", "none");
    });

const yAxisGroup = svg.append("g")
    .attr("class", "y-axis")
    .call(yAxis);

yAxisGroup.selectAll("text")
    .style("font-size", "14px");

const yAxisLabel = svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 20)
    .attr("x", -height / 2)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("font-size", "16px")
    .style("cursor", "help")
    .text("Score")
    .on("mouseover", function(event) {
        const tooltip = d3.select("#tooltip");
        tooltip.style("display", "block")
            .html(`<strong>Performance Score</strong><br>${scoreDescription}`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
    })
    .on("mouseout", function() {
        d3.select("#tooltip").style("display", "none");
    });

yAxisGroup.selectAll(".tick")
    .style("cursor", "help")
    .on("mouseover", function(event) {
        const tooltip = d3.select("#tooltip");
        tooltip.style("display", "block")
            .html(`<strong>Performance Score</strong><br>${scoreDescription}`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
    })
    .on("mouseout", function() {
        d3.select("#tooltip").style("display", "none");
    });

const line = d3.line()
    .x(d => xScale(d.task))
    .y(d => yScale(d.score))
    .defined(d => !isNaN(d.score));

function isModelFromCompany(modelName, company) {
    if (company === "all") return true;
    return companyMapping[company].some(prefix => modelName.toLowerCase().startsWith(prefix.toLowerCase()));
}

function updateModelDropdown(data, selectedCompany) {
    const models = [...data.keys()].filter(model => isModelFromCompany(model, selectedCompany));
    
    models.unshift("all");

    const modelOptions = modelDropdown.selectAll("option")
        .data(models);

    modelOptions.exit().remove();

    modelOptions.enter()
        .append("option")
        .merge(modelOptions)
        .text(d => d === "all" ? "All Models" : d)
        .attr("value", d => d);

    modelDropdown.property("value", "all");
}

function shouldShowModel(model, selectedCompany, selectedModel) {
    if (selectedModel === "all") {
        return isModelFromCompany(model, selectedCompany);
    }
    return model === selectedModel;
}

function updateVisualization(data, selectedCompany, selectedModel = "all") {
    svg.selectAll(".model-line").remove();
    svg.selectAll("circle").remove();

    const filteredData = new Map([...data].filter(([model]) => 
        shouldShowModel(model, selectedCompany, selectedModel)
    ));

    filteredData.forEach((points, model) => {
        const validPoints = points
            .map(d => ({
                task: d.task,
                score: parseFloat(d["Best score (across scorers)"])
            }))
            .filter(d => !isNaN(d.score) && tasks.includes(d.task))
            .sort((a, b) => tasks.indexOf(a.task) - tasks.indexOf(b.task));

        if (validPoints.length > 1) {
            svg.append("path")
                .datum(validPoints)
                .attr("class", "model-line")
                .attr("d", line)
                .style("fill", "none")
                .style("stroke", d => taskColors(d[0].task))
                .style("opacity", 0.3)
                .on("mouseover", function() {
                    d3.select(this)
                        .style("opacity", 1)
                        .style("stroke-width", 3);
                    
                    const tooltip = d3.select("#tooltip");
                    tooltip.style("display", "block")
                        .html(`<strong>Model: ${model}</strong><br>` +
                              validPoints.map(p => `${p.task}: ${p.score.toFixed(3)}`).join("<br>"));
                })
                .on("mousemove", function(event) {
                    const tooltip = d3.select("#tooltip");
                    tooltip.style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 10) + "px");
                })
                .on("mouseout", function() {
                    d3.select(this)
                        .style("opacity", 0.3)
                        .style("stroke-width", 1);
                    d3.select("#tooltip").style("display", "none");
                });

            svg.selectAll(null)
                .data(validPoints)
                .enter()
                .append("circle")
                .attr("cx", d => xScale(d.task))
                .attr("cy", d => yScale(d.score))
                .attr("r", 4)
                .style("fill", d => taskColors(d.task))
                .style("opacity", 0.6);
        }
    });
}

d3.csv("data/benchmarks_runs.csv").then(rawData => {
    const modelData = d3.group(rawData, d => d.model);
    
    updateModelDropdown(modelData, "all");

    companyDropdown.on("change", function() {
        const selectedCompany = this.value;
        updateModelDropdown(modelData, selectedCompany);
        updateVisualization(modelData, selectedCompany, "all");
    });

    modelDropdown.on("change", function() {
        const selectedCompany = companyDropdown.property("value");
        const selectedModel = this.value;
        updateVisualization(modelData, selectedCompany, selectedModel);
    });

    updateVisualization(modelData, "all", "all");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "24px")
        .text("Model Performance Across Different Tasks in 2025");
});
