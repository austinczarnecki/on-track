// Renders a bar chart on the newtab page.

function renderBarChart(data, key, animate = false) {

  d3.select('#barchart-container').selectAll('svg').remove();

  var margin = {top: 20, right: 30, bottom: 20, left: 160},
      width = d3.select("#barchart-container")
                  .node().getBoundingClientRect().width - margin.left - margin.right,
      height = d3.select("#barchart-container")
                  .node().getBoundingClientRect().height - margin.top - margin.bottom;

  var x = d3.scale.linear()
      .range([0, width]);

  var y = d3.scale.ordinal()
      .rangeRoundBands([0, height], 0.1);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("top");

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .tickSize(0)
      .tickPadding(6);

  var svg = d3.select("#barchart-container").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  x.domain([0, d3.max(data, function(d) { return toMinutes(d.timeSpent[key]); })]).nice();
  // console.log(d3.extent(data, function(d) { return toMinutes(d.timeSpent[key]); }));
  y.domain(data.map(function(d) { return d.domain; }));

  if (animate) {
    svg.selectAll(".bar")
      .data(data)
    .enter().append("rect")
      .attr("class", function(d) { return "bar bar--" + (toMinutes(d.timeSpent[key]) < 0 ? "negative" : "positive"); })
      .attr("x", function(d) { return x(Math.min(0, toMinutes(d.timeSpent[key]))); })
      .attr("y", function(d) { return y(d.domain); })
      .attr("width", 0)
      .attr("height", y.rangeBand())
      .transition().delay(function (d,i){ return i * 40;})
      .duration(500)
      .attr("width", function(d) { return Math.abs(x(toMinutes(d.timeSpent[key])) - x(0)); });
  } else {
    svg.selectAll(".bar")
      .data(data)
    .enter().append("rect")
      .attr("class", function(d) { return "bar bar--" + (toMinutes(d.timeSpent[key]) < 0 ? "negative" : "positive"); })
      .attr("x", function(d) { return x(Math.min(0, toMinutes(d.timeSpent[key]))); })
      .attr("y", function(d) { return y(d.domain); })
      .attr("width", function(d) { return Math.abs(x(toMinutes(d.timeSpent[key])) - x(0)); })
      .attr("height", y.rangeBand());
  }
  

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0,0)")
      .call(xAxis);

  svg.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + x(0) + ",0)")
      .call(yAxis);

  function type(d) {
    d.timeSpent[key] = +d.timeSpent[key];
    return d;
  }

  function toMinutes(d) {
    return d / (60 * 1000);
  }

}