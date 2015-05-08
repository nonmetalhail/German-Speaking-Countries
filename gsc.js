var width = 960,
    height = 1160;

var svg = d3.select("body").append("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("style","border:1px solid black");

d3.json("gsc.json", function(error, gsc) {
  if (error) return console.error(error);

  // console.log(gsc);
  var gsc_borders = topojson.feature(gsc, gsc.objects.gsc_borders);
  var projection = d3.geo.albers()
    .center([0, 50.5])
    .rotate([-11.5, 0])
    .parallels([50, 60])
    .scale(6000)
    .translate([width / 2, height / 2]);

  var path = d3.geo.path()
    .projection(projection)
    .pointRadius(2);

  //fill borders with css
  // svg.selectAll(".gsc_borders")
  //   .data(topojson.feature(gsc, gsc.objects.gsc_borders).features)
  //   .enter().append("path")
  //   .attr("class", function(d) { console.log(d.id); return "gsc_borders " + d.id; })
  //   .attr("d", path);

  //stroke
  svg.append("path")
    .datum(topojson.mesh(gsc, gsc.objects.gsc_borders))
    .attr("d", path)
    .attr("class", "country-border");


  //places
  svg.append("path")
    .datum(topojson.feature(gsc, gsc.objects.gsc_places))
    .attr("d", path)
    .attr("class", "place");

  svg.selectAll(".place-label")
    .data(topojson.feature(gsc, gsc.objects.gsc_places).features)
    .enter().append("text")
    .attr("class", "place-label")
    .attr("transform", function(d) { return "translate(" + projection(d.geometry.coordinates) + ")"; })
    .attr("dy", ".35em")
    .text(function(d) { return d.properties.name; });

  svg.selectAll(".place-label")
    .attr("x", function(d) { return d.geometry.coordinates[0] > 12 ? 6 : -6; })
    .style("text-anchor", function(d) { return d.geometry.coordinates[0] > 12 ? "start" : "end"; });


  //country label
  svg.selectAll(".country-label")
    .data(topojson.feature(gsc, gsc.objects.gsc_borders).features)
    .enter().append("text")
    .attr("class", function(d) { return "country-label " + d.id; })
    .attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
    .attr("dy", ".35em")
    .text(function(d) { return d.properties.name; });

});
