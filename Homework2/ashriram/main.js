Promise.all([
  d3.csv("data/Student mental health.csv"),
  d3.select("#pie-container"),
  d3.select("#bar-container"),
  d3.select("#sankey-container"),
])
  .then(function ([info, pieContainer, barContainer, sankeyContainer]) {
    // Bar Graph
    const cgpaCounts = info.reduce((counts, entry) => {
      const cgpaRange = entry["What is your CGPA?"].trim();
      if (cgpaRange) {
        const range = cgpaRange;
        counts[range] = (counts[range] || 0) + 1;
      }
      return counts;
    }, {});

    const cgpaData = Object.keys(cgpaCounts).map((range) => ({
      range,
      count: cgpaCounts[range],
    }));

    const barWidth = 500;
    const barHeight = 250;
    const barMargin = { top: 30, right: 30, bottom: 60, left: 60 };

    const barSvg = barContainer
      .append("svg")
      .attr("width", barWidth)
      .attr("height", barHeight);

    const x = d3
      .scaleBand()
      .range([barMargin.left, barWidth - barMargin.right])
      .padding(0.1);
    const y = d3
      .scaleLinear()
      .range([barHeight - barMargin.bottom, barMargin.top]);

    x.domain(cgpaData.map((d) => d.range));
    y.domain([0, d3.max(cgpaData, (d) => d.count)]);

    barSvg
      .selectAll("rect")
      .data(cgpaData)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d.range))
      .attr("y", (d) => y(d.count))
      .attr("height", (d) => barHeight - barMargin.bottom - y(d.count))
      .attr("width", x.bandwidth())
      .attr("fill", "royalblue");

    barSvg
      .append("g")
      .attr("transform", `translate(0,${barHeight - barMargin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(0)")
      .attr("x", 20)
      .attr("y", 9)
      .style("text-anchor", "end");

    barSvg
      .append("g")
      .attr("transform", `translate(${barMargin.left},0)`)
      .call(d3.axisLeft(y));

    barSvg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0)
      .attr("x", 0 - barHeight / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Number of Students");

    barSvg
      .append("text")
      .attr("x", barWidth / 2)
      .attr("y", barMargin.top / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "black")
      .style("font-size", "18px")
      .text("Number of Students vs GPA Range");

    barSvg
      .append("rect")
      .attr("x", barWidth - barMargin.right - 10)
      .attr("y", barMargin.top + 4)
      .attr("width", 10)
      .attr("height", 10)
      .attr("fill", "royalblue");

    barSvg
      .append("text")
      .attr("x", barWidth - barMargin.right - 30)
      .attr("y", barMargin.top + 15)
      .style("text-anchor", "end")
      .text("GPA Range");

    barSvg
      .append("text")
      .attr("x", barWidth / 2)
      .attr("y", barHeight + barMargin.bottom - 80)
      .style("text-anchor", "middle")
      .text("GPA Range");

    // Pie Chart
    const depressionCounts = info.reduce((counts, entry) => {
      const depression = entry["Do you have Depression?"];
      if (depression === "Yes" || depression === "No") {
        counts[depression] = (counts[depression] || 0) + 1;
      }
      return counts;
    }, {});

    const depressionData = Object.keys(depressionCounts).map((status) => ({
      status,
      count: depressionCounts[status],
    }));

    const pieWidth = 300;
    const pieHeight = 200;
    const radius = Math.min(pieWidth, pieHeight) / 2;

    const pieSvg = pieContainer
      .append("svg")
      .attr("width", pieWidth)
      .attr("height", pieHeight)
      .append("g")
      .attr("transform", `translate(${pieWidth / 2},${pieHeight / 2})`);

    const color = d3
      .scaleOrdinal()
      .domain(depressionData.map((d) => d.status))
      .range(d3.schemeCategory10);

    const pie = d3
      .pie()
      .value((d) => d.count)
      .sort(null);

    const arc = d3.arc().innerRadius(0).outerRadius(radius);

    const pieChart = pieSvg
      .selectAll("arc")
      .data(pie(depressionData))
      .enter()
      .append("g")
      .attr("class", "arc");

    pieChart
      .append("path")
      .attr("d", arc)
      .attr("fill", (d) => color(d.data.status))
      .attr("stroke", "white")
      .style("stroke-width", "2px");

    pieChart
      .append("text")
      .attr("transform", (d) => `translate(${arc.centroid(d)})`)
      .attr("dy", "0.35em")
      .text((d) => `${d.data.status} (${d.data.count})`)
      .style("text-anchor", "middle");

    // Sankey Diagram
    const counts = {};

    // Iterate over the CSV data
    info.forEach((row) => {
      const source = row["What is your course?"];
      const target = row["What is your CGPA?"];

      // Create a key for the combination of source and target
      const key = `${source}!${target}`;

      // Increment the count for the key, or initialize it to 1 if it doesn't exist
      counts[key] = (counts[key] || 0) + 1;
    });

    // Convert the counts object into an array of objects
    const preprocessedData = Object.entries(counts).map(([key, value]) => {
      const [source, target] = key.split("!");
      return { source, target, value };
    });

    const dimensions = {
      width: 600,
      height: 600,
      margins: 10,
    };

    const sankeyData = { nodes: [], links: [] };
    preprocessedData.forEach((d) => {
      const nodesList = sankeyData.nodes.map((n) => n.name);
      if (!nodesList.includes(d.source)) {
        sankeyData.nodes.push({ name: d.source });
      }
      if (!nodesList.includes(d.target)) {
        sankeyData.nodes.push({ name: d.target });
      }
      sankeyData.links.push({
        source: d.source,
        target: d.target,
        value: d.value,
      });
    });
    sankeyData.links.forEach((l, x) => {
      sankeyData.links[x].source = sankeyData.nodes.findIndex(
        (n) => n.name === l.source
      );
      sankeyData.links[x].target = sankeyData.nodes.findIndex(
        (n) => n.name === l.target
      );
    });

    // Initialize color scale after sankeyData is computed
    const colorScale = d3
      .scaleOrdinal()
      .domain(sankeyData.nodes.map((n) => n.name))
      .range(["lightblue", "purple", "green", "grey"]);

    const sankey = d3
      .sankey()
      .nodes(sankeyData.nodes)
      .links(sankeyData.links)
      .nodeAlign(d3.sankeyLeft)
      .extent([
        [dimensions.margins, dimensions.margins],
        [
          dimensions.width - dimensions.margins,
          dimensions.height - dimensions.margins,
        ],
      ]);

    const svg = d3
      .create("svg")
      .attr("height", dimensions.height)
      .attr("width", dimensions.width)
      .attr("overflow", "visible");

    const chart = svg
      .append("g")
      .attr(
        "transform",
        `translate(${dimensions.margins}, ${dimensions.margins})`
      );

    chart
      .append("text")
      .text("Sankey Diagram")
      .attr("dominant-baseline", "middle")
      .attr("font-weight", "600");

    // Compute the layout
    const { nodes, links } = sankey();

    // Append nodes to the SVG
    chart
      .selectAll("rect")
      .data(nodes)
      .join("rect")
      .attr("x", (d) => d.x0)
      .attr("y", (d) => d.y0)
      .attr("fill", (d) => colorScale(d.name))
      .attr("height", (d) => d.y1 - d.y0)
      .attr("width", (d) => d.x1 - d.x0);

    // Append links to the SVG
    chart
      .append("g")
      .attr("fill", "none")
      .attr("stroke", "#000")
      .attr("stroke-opacity", 0.1)
      .selectAll("path")
      .data(links)
      .join("path")
      .attr("d", d3.sankeyLinkHorizontal())
      .attr("stroke-width", (d) => d.width);

    // Append labels to the SVG
    chart
      .append("g")
      .selectAll("text")
      .data(sankeyData.nodes)
      .join("text")
      .text((d) => d.name)
      .attr("class", (d) => d.depth)
      .attr("x", (d) => d3.mean([d.x0, d.x1]))
      .attr("y", (d) => d3.mean([d.y0, d.y1]))
      .attr("fill", (d) => (d.y1 - d.y0 < 20 ? "black" : "white"))
      .attr("font-family", "helvetica")
      .attr("font-weight", "100")
      .attr("font-size", "10")
      .style("text-shadow", ".5px .5px 2px #222");

    // Append the SVG to the container
    sankeyContainer.node().appendChild(svg.node());
  })
  .catch(function (error) {
    console.error("Error loading data:", error);
  });
