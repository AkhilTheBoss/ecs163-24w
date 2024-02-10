const csvFilePath = "data/Student mental health.csv";

// Load CSV data and create bar graph and pie chart
Promise.all([
  d3.csv(csvFilePath),
  d3.select("#pie-container"),
  d3.select("#bar-container"),
])
  .then(function ([info, pieContainer, barContainer]) {
    // Bar Graph
    const cgpaCounts = info.reduce((counts, entry) => {
      const cgpaRange = entry["What is your CGPA?"];
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

    const barWidth = 500; // Reduce width
    const barHeight = 250; // Increase height slightly
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

    const pieWidth = 300; // Reduce width
    const pieHeight = 200; // Reduce height
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
  })
  .catch(function (error) {
    console.error("Error loading data:", error);
  });
