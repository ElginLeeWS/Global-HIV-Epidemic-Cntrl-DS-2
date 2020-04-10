
exports.render = function(req, res) {
	if (req.session.lastVisit) {
		console.log(req.session.lastVisit);
	}
	req.session.lastVisit = new Date();
	req.session.user = "";
	//render the landing page template
	res.render('index', {});
};

exports.render_charts = function(req, res) {
	var country = req.body.country_name;
	//this is where we would query the FHIR server and aggregate the data.
	res.render('charts', { country: country });
}