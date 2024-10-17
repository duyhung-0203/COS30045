function init() {
    // Set up SVG dimensions and padding
    var w = 500;
    var h = 200;
    var barPadding = 1;

    // Initialize SVG container before loading data
    var svg = d3.select("#chart")
                .append("svg")
                .attr("width", w)
                .attr("height", h);

    // Load data from CSV and initiate the bar chart
    d3.csv("book.csv").then(function(data) {
        console.log(data);
        wombatSightings = data;
        barChart(wombatSightings, svg, w, h, barPadding); // Call barChart with necessary parameters
    });
}

//Add bar chart
function barChart(data, svg, w, h, barPadding) {

    // Define x scale based on the 'date' property in the data
    var xScale = d3.scaleBand()
        .domain(data.map(function(d) {
            return d.date;
        }))
        .range([0, w])
        .padding(0.1);

    // Define y scale based on the 'wombats' property in the data
    var yScale = d3.scaleLinear()
        .domain([0, d3.max(data, function(d) {
            return d.wombats;
        })])
        .range([h, 0]);

    // Append x-axis to the SVG
    svg.append("g")
        .attr("transform", "translate(0," + h + ")")
        .call(d3.axisBottom(xScale));

    // Append y-axis to the SVG
    svg.append("g")
        .call(d3.axisLeft(yScale));

    // Append and transition the bars in the bar chart
    svg.selectAll("rect")
        .data(wombatSightings)
        .enter()
        .append("rect")
        .attr("x", function(d, i) {
            return i * (w / data.length);
        })
        .attr("y", h) // Start from the bottom of the SVG
        .attr("width", w / data.length - barPadding)
        .attr("height", 0) // Start with height as 0
        .transition() // Start the animation
        .duration(800) // Duration of the animation is 800ms
        .attr("y", function(d) {
            return h - (d.wombats * 5); // Final Y position
        })
        .attr("height", function(d) {
            return d.wombats * 5; // Final height of the bar
        })
        .attr("fill", function(d) {
            return d.wombats > 10 ? "darkblue" : "lightblue";
        });

    // Set up mouseover and mouseout events for tooltip
    svg.selectAll("rect")
       .on("mouseover", function(event, d) {
           // Get mouse position
           var xPosition = event.pageX;
           var yPosition = event.pageY;

           // Update content and position of the tooltip
           d3.select("#tooltip")
             .style("left", xPosition + "px")
             .style("top", yPosition + "px")
             .text("Wombats: " + d.wombats)
             .style("visibility", "visible");
       })
       .on("mouseout", function() {
           // Hide tooltip when mouse is not over the bar
           d3.select("#tooltip")
             .style("visibility", "hidden");
       });

       
}

// Execute init function when the window is loaded
window.onload = init;