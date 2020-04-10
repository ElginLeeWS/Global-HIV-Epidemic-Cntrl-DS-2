var width = window.innerWidth,
    height = window.innerHeight,
    centered,
	clicked_point;

//set defaults
var year_selected = "2020";
var data_selected = "HTS_TEST";

var projection = d3.geoMercator()
	.scale(width / 4.5)
    .translate([width / 2, height / 1.5]);
    
var main = d3.select("#main");

var svg = main.append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "map");
    
svg.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height)
    .on("click", clickedOcean);

var path = d3.geoPath()
    .projection(projection);


var g = svg.append("g");

// append the html elements that are needed for the choropleth map:
// legend, including year selector and data-type buttons,
// interactive map

var tooltip = d3.select("#main")
  .append("div")
  .attr("class", "tooltip hidden");
  
var legend_cont = d3.select("#main")
  					.append("div")
					  .attr("class", "legendContainer")
					  .html("<h3>PEPFAR Monitor</h3>");

var dropdown = legend_cont.append('select').attr('id', 'yearselect');
					dropdown.append('option').attr('value', '2020').text('2020').on("click", changeYear);
					dropdown.append('option').attr('value', '2019').text('2019').on("click", changeYear);
					dropdown.append('option').attr('value', '2018').text('2018').on("click", changeYear);

function changeYear() {
	year_selected = document.getElementById('yearselect').value;
	loadData();
}

var legend  = d3.select(".legendContainer")
  				.append("ul")
  				.attr("class", "legend");

var legend_items = legend.selectAll("li")
					 .data(data_categories)
					 .enter()
					 .append("li")
					 .on("click", function(d) { data_selected = d.name; loadData(); })
					 .html(function(d, i){return getLegend(d);});

 
// var tooltip_point = d3.select("body")
//   	.append("div")
// 	  .attr("class", "tooltip_point hidden");
/* 	  
// Add coloring legend
var g1 = svg.append("g")
    .attr("class", "legendThreshold")
    .attr("transform", "translate(20,20)");
g1.append("text")
    .attr("class", "caption")
    .attr("x", 0)
    .attr("y", -6)
    .text("Percent");
var labels = ['0-9', '10-29', '30-49', '50-69', '70-89', '90-94', '95-100'];
var legend1 = d3.legendColor()
    .labels(function (d) { return labels[d.i]; })
    .shapePadding(4)
    .scale(colorScale);
svg.select(".legendThreshold")
    .call(legend1); */

//zoom out
function clickedOcean(){
	var x, y, k;
	x = width / 1.75;
	y = height / 1.75;
	k = 1;
	centered = null;
	legend_cont.classed("hidden", false);
	
	// map transition
	g.transition()
		//.style("stroke-width", (0.75 / k) + "px")
		.duration(750)
		.attr("transform", "translate(" + width / 2 + "," + height / 1.5 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
		.on('end', function() {
			if (centered === null){
			  g.selectAll("path")
			   .style("stroke-width", (0.75 / k) + "px");
	  }
		});
		
	// remove all old points
	//g.selectAll("rect").remove();
	g.select("svg").remove();
	

}

var colorScale;

function setColor() {
	//set color scheme for choropleth
	colorScale = null;
	var colorScheme = null;

	if (data_selected == "HTS_TEST") {
		colorScheme = d3.schemeReds[6];
	} else if (data_selected == "HTS_TEST_POS") {
		colorScheme = d3.schemeBlues[6];
	} else if (data_selected == "TX_NEW") {
		colorScheme = d3.schemeGreens[6];
	} else {
		colorScheme = d3.schemeGreys[6];
	}
	if (colorScheme[0] != "#eee") {	colorScheme.unshift("#eee"); }
	colorScale = d3.scaleThreshold()
		.domain([10, 30, 50, 70, 90, 95])
		.range(colorScheme);
}

	// The magic function - converts node positions into positions on screen.    
	function getScreenCoords(x, y, translate, scale) {
		var xn = translate[0] + x*scale;
		var yn = translate[1] + y*scale;
		return { x: xn, y: yn };
	}

function addRectAndChartsLink(g, upper_x, upper_y, k, d_country) {
	//TODO: overlay overview of country's data + link to dashboard for this country
	var rectData = [
		{ "x": upper_x, "y": upper_y, "height": 400 / k, "width": 600 / k }
	];

	var textData = [
		{ "x": upper_x + (20 / k), "y": upper_y + (400 / k) / 2, "text": d_country.properties.name },
		{ "x": upper_x + (20 / k), "y": upper_y + (440 / k) / 2, "text": d_country.percent + '%' }
	];

	// zooming in -> draw rect 
	var new_svg = g.append("svg")
		.attr("width", function() { return rectData.width; })
		.attr("height", function() { return rectData.height; });

	new_svg.selectAll("rect")
		.data(rectData)
		.enter()
		.append("rect")
		.attr("class", "info_rect")
		.attr("x", function (d) { return d.x; })
		.attr("y", function (d) { return d.y; })
		.attr("height", function (d) { return d.height; })
		.attr("width", function (d) { return d.width; })
		.on("click", clickedOcean);

	var form = getFormHtml(d_country.properties.name);

	new_svg.selectAll("foreignObject")
		.data(rectData)
		.enter()
		.append("foreignObject")
		.attr("x", function (d) { return d.x; })
		.attr("y", function (d) { return d.y; })
		.attr("height", function (d) { return d.height; })
		.attr("width", function (d) { return d.width; })
		.html(form);	
}

//when a country is clicked, zoom in on it
function clicked(d) {
  // console.log(d);
	var upper_x = 20;
	var upper_y = 20;
	if ((d && centered !== d)) {
	  	g.selectAll('path')
	 	.attr('fill', function(d) { return colorScale(d.percent) });
	 //	console.log(d.id);
		var coords;
		var centroid = path.centroid(d);
		center_x = centroid[0];
		center_y = centroid[1];
		var bounds = path.bounds(d);
		upper_x = bounds[0][0];
		upper_y = bounds[0][1];
		var dx = bounds[1][0] - bounds[0][0],
			dy = bounds[1][1] - bounds[0][1];
		
		legend_cont.classed("hidden", true);
		x = (bounds[0][0] + bounds[1][0]) / 2;
		y = (bounds[0][1] + bounds[1][1]) / 2;
		k = Math.min(width / dx, height / dy);
		centered = d;
	} else {
		x = width / 2;
		y = height / 2;
		k = 1;
		centered = null;
		legend_cont.classed("hidden", false);
		g.select("svg").remove();
	}
  
	g.selectAll("path")
	   //make the clicked-on country 'active'
	   .classed("active", centered && function(d) { return d === centered; });
     
	  // make contours thinner before zoom 
	  if (centered !== null){
		g.selectAll("path")
		 .style("stroke-width", (0.75 / k) + "px");
	  }
  
	  // map transition
	  var t = g.transition()
		//.style("stroke-width", (0.75 / k) + "px")
		.duration(750)
		.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
		.on('end', function() {
			if (centered === null){
			  g.selectAll("path")
			   .style("stroke-width", (0.75 / k) + "px");
	  		} else {
				//addRectAndChartsLink(g, x, y, k, d);
				document.getElementById('country_name').setAttribute('value', d.properties.name);
				document.getElementById('chartForm').submit();
			  }
			});
  
	  //g.selectAll("rect").remove();

  }
  

// load and display the World
function loadData() {
	//remove previous map
	g.selectAll("path").remove();
	setColor();
	var data = d3.map();
	
	//select new data source
	var file = `public/scripts/data_${data_selected}_${year_selected}.csv`
	d3.queue()
		.defer(d3.json, "public/scripts/countries-50m.json")
		.defer(d3.csv, file, function(d) { data.set(d.name, +d.percent); })
		.await(ready);

	//draw new map
	function ready(error, topology) {
		if (error) {
			return;
		}
	//	console.log(file);
	//	if (error) throw error;

		g.selectAll("path")
			.data(topojson.feature(topology, topology.objects.countries)
			.features)
			.enter()
			.append("path")
			.attr("id", function(d) { return d.id })
			.attr("fill", function (d){
					// Pull data for this country
					d.percent = data.get(d.properties.name) || 0;
					// Set the color
					return colorScale(d.percent);
				})
			.attr("d", path)
			.attr("percent", function (d) { return data.get(d.properties.name) || 0; })
			.on("click", clicked)
			.on("mousemove", showTooltipCountry)
			.on("mouseout", hideTooltip);
		};
}


window.onload = loadData;
