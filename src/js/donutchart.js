function renderDonutChart(data, todayKey) {

	d3.select('#donutchart-container').selectAll('svg').remove();

	var svg = d3.select("#donutchart-container")
		.append("svg")
		.append("g")

	svg.append("g")
		.attr("class", "slices");
	svg.append("g")
		.attr("class", "labels");
	svg.append("g")
		.attr("class", "lines");

	var width = d3.select("#donutchart-container")
                  .node().getBoundingClientRect().width,
        // height = width / 3,
	    height = d3.select('#donutchart-container').node().getBoundingClientRect().height,
		radius = Math.min(width, height) / 4;

	var pie = d3.layout.pie()
		.sort(null)
		.value(function(d) {
			return d.value;
		});

	var arc = d3.svg.arc()
		.outerRadius(radius * 0.8)
		.innerRadius(radius * 0.4);

	var outerArc = d3.svg.arc()
		.innerRadius(radius * 0.9)
		.outerRadius(radius * 0.9);

	svg.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

	var key = function(d){ return d.data.label; };

	var color = d3.scale.ordinal()
		.domain(["Lorem ipsum", "dolor sit", "amet", "consectetur", "adipisicing", "elit", "sed", "do", "eiusmod", "tempor", "incididunt"])
		.range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

	function formatData() {
		// var labels = color.domain();
		// return data.map(function(color) {
		// 	return { label: color}
		// }
		// return labels.map(function(label){
		// 	return { label: label, value: data }
		// });
		var total = 0;
		for (var i = 0; i < data.length; i++) {
			// console.log(data[i].timeSpent[todayKey])
			total += data[i].timeSpent[todayKey];
		}

		var other = 0;
		var map = [];

		for (var i = 0; i < data.length; i++) {
			if (data[i].timeSpent[todayKey] < (total * .1)) {
				other += data[i].timeSpent[todayKey];
			} else {
				map.push({ label: data[i].domain, value: data[i].timeSpent[todayKey] });
			}
		}

		map.push({ label: 'other', value: other });

		return map;
	}

	change(formatData());

	function change(data) {

		/* ------- PIE SLICES -------*/
		var slice = svg.select(".slices").selectAll("path.slice")
			.data(pie(data), key);

		slice.enter()
			.insert("path")
			.style("fill", function(d) { return color(d.data.label); })
			.attr("class", "slice");

		slice		
			.transition().duration(1000)
			.attrTween("d", function(d) {
				this._current = this._current || d;
				var interpolate = d3.interpolate(this._current, d);
				this._current = interpolate(0);
				return function(t) {
					return arc(interpolate(t));
				};
			})

		slice.exit()
			.remove();

		/* ------- TEXT LABELS -------*/

		var text = svg.select(".labels").selectAll("text")
			.data(pie(data), key);

		text.enter()
			.append("text")
			.attr("dy", ".35em")
			.attr('class', 'labels')
			.text(function(d) {
				return d.data.label;
			});
		
		function midAngle(d){
			return d.startAngle + (d.endAngle - d.startAngle)/2;
		}

		text.transition().duration(1000)
			.attrTween("transform", function(d) {
				this._current = this._current || d;
				var interpolate = d3.interpolate(this._current, d);
				this._current = interpolate(0);
				return function(t) {
					var d2 = interpolate(t);
					var pos = outerArc.centroid(d2);
					pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
					return "translate("+ pos +")";
				};
			})
			.styleTween("text-anchor", function(d){
				this._current = this._current || d;
				var interpolate = d3.interpolate(this._current, d);
				this._current = interpolate(0);
				return function(t) {
					var d2 = interpolate(t);
					return midAngle(d2) < Math.PI ? "start":"end";
				};
			});

		text.exit()
			.remove();

		/* ------- SLICE TO TEXT POLYLINES -------*/

		var polyline = svg.select(".lines").selectAll("polyline")
			.data(pie(data), key);
		
		polyline.enter()
			.append("polyline");

		polyline.transition().duration(1000)
			.attrTween("points", function(d){
				this._current = this._current || d;
				var interpolate = d3.interpolate(this._current, d);
				this._current = interpolate(0);
				return function(t) {
					var d2 = interpolate(t);
					var pos = outerArc.centroid(d2);
					pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
					return [arc.centroid(d2), outerArc.centroid(d2), pos];
				};			
			});
		
		polyline.exit()
			.remove();
	};
};