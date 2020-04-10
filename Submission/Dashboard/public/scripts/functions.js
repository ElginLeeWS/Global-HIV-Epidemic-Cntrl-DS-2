var debug ;

var data_categories = [{"name" : "HTS_TEST"},
             {"name" : "HTS_TEST_POS"},
				 {"name" : "TX_NEW"}, 
             {"name" : "TX_CURR"}];
							   
			 
// show country name on hover
function showTooltipCountry(d){
  var mouse = d3.mouse(svg.node()).map(function(d) {
                        return parseInt(d);
					});
  var percent = document.getElementById(d.id).getAttribute("percent")
  tooltip
  .classed('hidden', false)
  .html(`${d.properties.name} ${percent}%`)
  .attr('style', 
		'left:' + (mouse[0] + 15) + 'px; top:' + (mouse[1] - 35) + 'px')
};

// hide tooltip
function hideTooltip(d) {
  // Show the tooltip (unhide it) and set the name of the data entry.
  tooltip
  .classed('hidden', true);
}

// hide point tooltip
function hideTooltipPoint(d) {
  // Show the tooltip (unhide it) and set the name of the data entry.
  tooltip_point
  .classed('hidden', true);
}


// show location name on hover
function showTooltip(d){
  var mouse = d3.mouse(svg.node()).map(function(d) {
                        return parseInt(d);
                    });
  if (tooltip_point.classed("hidden")){
  		tooltip
	   .classed('hidden', false)
	   .html("<span id='close' onclick='hideTooltipPoint()'>x</span>" + 
	   "<div class='inner_tooltip'>" + 
	   			"<p>" + d.name + "</p>" +	 
        	 "</div><div>" + 
        		getIconsAndLinks(d) + 
    			// 
        	"</div>");
	  // .attr('style', 
		//	 'left:' + (mouse[0] + 15) + 'px; top:' + (mouse[1] - 35) + 'px')
  };
  
};

// show point tooltip
function showTooltipPoint(d){
  var mouse = d3.mouse(svg.node()).map(function(d) {
                        return parseInt(d);
                    });
  tooltip_point
  .classed('hidden', false)
  .html("<span id='close' onclick='hideTooltipPoint()'>x</span>" + 
	   "<div class='inner_tooltip'>" + 
	   			"<p>" + d.name + "</p>" +	 
        	 "</div><div>" + 
        		getIconsAndLinks(d) + 
    			// 
        	"</div>")
  .attr('style', 
        'left:' + (mouse[0] + 15) + 'px; top:' + (mouse[1] - 35) + 'px')
};


// get legend items
function getLegend(d){
	var outlineType = "secondary";

	if (d.name=="HTS_TEST") { outlineType = "danger"; }
	else if (d.name=="HTS_TEST_POS") { outlineType = "primary"; }
	else if (d.name=="TX_NEW") { outlineType = "success"; }

	var temp = `<button id='${d.name}' width='50' height='50' class='btn btn-outline-${outlineType}'>${d.name}</button>`;

	return(temp);
};	

function getFormHtml(country) {
  return `		<div class="info_rect_form" xmlns="http://www.w3.org/1999/xhtml"><form  action="/charts?country_name=${country}" method="POST">
<div class="form-group"><p class="info_rect_form">Select dates of detail to view for this country:</p>
<label class="info_rect_form" for="date_start">Start Date:</label>
<input class="form-control" type="date" id="date_start" name="date_start">
<label class="info_rect_form" for="date_end">End Date:</label>
<input type="date" id="date_end" name="date_end">
</div>
  <button type="submit" class="btn btn-default btn-sm">View Detail Charts</button>
</form></div>`
};
	
