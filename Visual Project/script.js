// Setup SVG dimensions and pie chart layout
const width = 850;
const height = 850;
const radius = Math.min(width, height) / 2 - 50;

const svg = d3
  .select("#chart")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("viewBox", `0 0 ${width} ${height}`)
  .append("g")
  .attr("transform", `translate(${width / 2}, ${height / 2})`);

const pie = d3.pie().value((d) => d.value);
const arc = d3
  .arc()
  .outerRadius(radius - 10)
  .innerRadius(0);

const color = d3.scaleOrdinal(d3.schemeCategory10);
let selectedCountries = new Set();
let allSelected = false;
let updateTimeout = null;
let isTotalSelected = false;

// Tooltip
const tooltip = d3.select("body").append("div").attr("class", "tooltip1");

// Load data
d3.csv("./data/OECD_DATA.csv").then((data) => {
  const years = [
    ...new Set(
      data.map((d) => +d["TIME_PERIOD"]).filter((year) => !isNaN(year))
    ),
  ].sort();

  const yearSelect = d3.select("#year-select");
  yearSelect.append("option").attr("value", "all").text("All time");
  years.forEach((year) => {
    yearSelect.append("option").attr("value", year).text(year);
  });
  yearSelect.property("value", "all");

  yearSelect.on("change", updateCountryList);

  function updateCountryList() {
    const selectedYear = yearSelect.property("value");

    const countriesWithData =
      selectedYear === "all"
        ? [...new Set(data.map((d) => d["Reference area"]))]
        : [
            ...new Set(
              data
                .filter((d) => +d["TIME_PERIOD"] === +selectedYear)
                .map((d) => d["Reference area"])
            ),
          ];

    const countryList = d3.select("#country-list");
    countryList.selectAll("label").remove();

    const allCountriesLabel = countryList.append("label").text("All Countries");
    allCountriesLabel
      .append("input")
      .attr("type", "checkbox")
      .attr("value", "all")
      .on("change", function () {
        isTotalSelected = this.checked;
        updateChart();
      });
    allCountriesLabel.append("br");

    countriesWithData.forEach((country) => {
      const label = countryList.append("label").text(country);
      label
        .append("input")
        .attr("type", "checkbox")
        .attr("value", country)
        .on("change", () => {
          if (updateTimeout) clearTimeout(updateTimeout);
          updateTimeout = setTimeout(updateChart, 200);
        });
      label.append("br");
    });

    updateChart();
  }

  d3.select("#toggle-select").on("click", function () {
    allSelected = !allSelected;
    document
      .querySelectorAll("#country-list input[type=checkbox]")
      .forEach((input) => {
        input.checked = allSelected;
      });
    this.textContent = allSelected ? "Deselect All" : "Select All";
    if (updateTimeout) clearTimeout(updateTimeout);
    updateTimeout = setTimeout(updateChart, 200);
  });

  function updateChart() {
    const selectedYear = yearSelect.property("value");
    selectedCountries = new Set(
      Array.from(
        document.querySelectorAll("#country-list input[type=checkbox]:checked")
      )
        .map((input) => input.value)
        .filter((value) => value !== "all")
    );

    const totalExpenditure = data
      .filter(
        (d) => selectedYear === "all" || +d["TIME_PERIOD"] === +selectedYear
      )
      .reduce((acc, d) => acc + +d["OBS_VALUE"], 0);

    const selectedExpenditure = Array.from(selectedCountries).reduce(
      (acc, country) => {
        const countryData = data
          .filter(
            (d) =>
              d["Reference area"] === country &&
              (selectedYear === "all" || +d["TIME_PERIOD"] === +selectedYear)
          )
          .reduce((sum, d) => sum + +d["OBS_VALUE"], 0);
        acc[country] = countryData;
        return acc;
      },
      {}
    );

    let pieData;
    if (isTotalSelected && selectedCountries.size === 0) {
      pieData = [{ country: "All Countries", value: totalExpenditure }];
    } else if (isTotalSelected && selectedCountries.size > 0) {
      const selectedTotal = d3.sum(Object.values(selectedExpenditure));
      const remaining = totalExpenditure - selectedTotal;
      pieData = [
        ...Object.entries(selectedExpenditure).map(([country, value]) => ({
          country,
          value,
        })),
        { country: "Rest of the World", value: remaining },
      ];
    } else {
      pieData = Object.entries(selectedExpenditure).map(([country, value]) => ({
        country,
        value,
      }));
    }

    const totalValue = d3.sum(pieData, (d) => d.value);

    const arcs = svg
      .selectAll(".arc")
      .data(pie(pieData), (d) => d.data.country);

    arcs
      .enter()
      .append("path")
      .attr("class", "arc pie-slice")
      .attr("fill", (d) => color(d.data.country))
      .each(function (d) {
        this._current = { startAngle: 0, endAngle: 0 };
      })
      .transition()
      .duration(750)
      .attrTween("d", arcTween)
      .on("end", function () {
        d3.select(this)
          .on("mouseover", function (event, d) {
            const percentage = ((d.data.value / totalValue) * 100).toFixed(1);
            d3.select(this)
              .transition()
              .duration(200)
              .attr("transform", function () {
                const [x, y] = arc.centroid(d);
                return `translate(${x * 0.1}, ${y * 0.1}) scale(1.05)`;
              });
            tooltip
              .style("opacity", 1)
              .html(
                `<strong>${
                  d.data.country
                }</strong><br>Expenditure: $${d.data.value.toFixed(
                  2
                )}<br>Percentage: ${percentage}%`
              )
              .style("left", `${event.pageX + 10}px`)
              .style("top", `${event.pageY - 20}px`);
          })
          .on("mousemove", (event) => {
            tooltip
              .style("left", `${event.pageX + 10}px`)
              .style("top", `${event.pageY - 20}px`);
          })
          .on("mouseout", function () {
            d3.select(this)
              .transition()
              .duration(200)
              .attr("transform", "translate(0,0) scale(1)");
            tooltip.style("opacity", 0);
          });
      });

    arcs.transition().duration(750).attrTween("d", arcTween);

    arcs
      .exit()
      .transition()
      .duration(750)
      .attrTween("d", arcTween)
      .style("opacity", 0)
      .remove();

    setTimeout(displayDetails, 750);

    function displayDetails() {
      const detailsList = d3.select("#details-list");
      detailsList.html("");

      const selectedYear = yearSelect.property("value");
      const titleText =
        selectedYear === "all"
          ? "Health Expenditure Distribution by Country"
          : `Health Expenditure Distribution by Country in ${selectedYear}`;

      detailsList.append("h5").text(titleText);

      pieData.forEach((d) => {
        const percentage = ((d.value / totalValue) * 100).toFixed(1);

        const detailItem = detailsList
          .append("div")
          .attr("class", "detail-item");
        detailItem
          .append("div")
          .attr("class", "detail-color")
          .style("background-color", color(d.country));
        detailItem
          .append("div")
          .attr("class", "detail-text")
          .text(`${d.country}: $${d.value.toFixed(2)} (${percentage}%)`);
      });
    }
  }

  function arcTween(d) {
    const interpolate = d3.interpolate(this._current, d);
    this._current = interpolate(1);
    return function (t) {
      return arc(interpolate(t));
    };
  }

  updateCountryList();
});
