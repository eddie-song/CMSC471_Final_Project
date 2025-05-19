const margin = { top: 50, right: 200, bottom: 175, left: 80 };
const width = 1400 - margin.left - margin.right;
const height = 800 - margin.top - margin.bottom;

// Initialize tooltip
const tooltip = d3.select("#popup-vis")
    .append("div")
    .attr("id", "popup-tooltip")
    .style("position", "absolute")
    .style("opacity", 0)
    .style("background", "rgba(255, 255, 255, 0.95)")
    .style("border", "1px solid #ddd")
    .style("border-radius", "4px")
    .style("padding", "12px")
    .style("font-size", "14px")
    .style("pointer-events", "none")
    .style("box-shadow", "0 2px 8px rgba(0, 0, 0, 0.15)")
    .style("max-width", "300px")
    .style("line-height", "1.4")
    .style("z-index", "1001");

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

const dropdownContainer = d3.select("#popup-vis")
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

const svg = d3.select("#popup-vis")
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
    .style("font-size", "14px");

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
    .text("Score");

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
                .style("opacity", 0.3);

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

// Add information sections below the graph
const infoContainer = d3.select("#popup-vis")
    .append("div")
    .style("margin-top", "20px")
    .style("padding", "15px")
    .style("background-color", "#ffffff")
    .style("border-radius", "12px")
    .style("box-shadow", "0 2px 8px rgba(0,0,0,0.05)");

// Add task descriptions
infoContainer.append("h3")
    .text("Task Descriptions")
    .style("margin-bottom", "15px")
    .style("color", "#2c3e50")
    .style("font-size", "16px")
    .style("font-weight", "600");

const taskList = infoContainer.append("div")
    .style("display", "grid")
    .style("grid-template-columns", "repeat(2, 1fr)")
    .style("gap", "12px");

tasks.forEach(task => {
    taskList.append("div")
        .style("padding", "12px")
        .style("background-color", "#f8f9fa")
        .style("border-radius", "8px")
        .style("border-left", `3px solid ${taskColors(task)}`)
        .style("font-size", "13px")
        .style("line-height", "1.4")
        .html(`<strong style="color: #2c3e50; display: block; margin-bottom: 4px;">${task}</strong>${taskDescriptions[task]}`);
});

// Add score description
infoContainer.append("h3")
    .text("Score Scale")
    .style("margin-top", "20px")
    .style("margin-bottom", "12px")
    .style("color", "#2c3e50")
    .style("font-size", "16px")
    .style("font-weight", "600");

infoContainer.append("div")
    .style("padding", "12px")
    .style("background-color", "#f8f9fa")
    .style("border-radius", "8px")
    .style("font-size", "13px")
    .style("line-height", "1.4")
    .html(scoreDescription);

// Add source citation
infoContainer.append("div")
    .style("margin-top", "20px")
    .style("padding", "12px")
    .style("background-color", "#f8f9fa")
    .style("border-radius", "8px")
    .style("font-size", "13px")
    .style("line-height", "1.4")
    .html('<strong style="color: #2c3e50; display: block; margin-bottom: 4px;">Source</strong><a href="https://epoch.ai/data/ai-benchmarking-dashboard" style="color: #666;">Epoch AI - AI Benchmarking Dashboard</a>');

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