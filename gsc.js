var width = 960,
    height = 1160;

var ddr = ['Thüringen', 'Sachsen-Anhalt', 'Brandenburg', 'Mecklenburg-Vorpommern','Sachsen'],
  brd = ['Schleswig-Holstein','Niedersachsen','Hessen','Bayern'];

var places = {};

var svg = d3.select('#gsc')
  .attr("width", width)
  .attr("height", height)
  .style({
    "background-color":"white",
    "border":"1px solid black"
  });

d3.json("gsc.json", function(error, gsc) {
  if (error) return console.error(error);

  var gsc_borders = topojson.feature(gsc, gsc.objects.gsc_borders);
  var projection = d3.geo.albers()
    .center([0, 50.5])
    .rotate([-11.5, 0])
    .parallels([45, 55])
    .scale(6000)
    .translate([width / 2, height / 2]);

  var path = d3.geo.path()
    .projection(projection)
    .pointRadius(2);

  //fill borders with css 
  svg.selectAll(".gsc_borders")
    .data(topojson.feature(gsc, gsc.objects.gsc_borders).features)
    .enter().append("path")
    .attr("class", function(d) { return "gsc_borders " + d.id; })
    .attr("d", path)
    .style({
      "fill": "#eee",
      "fill-opacity": ".2"
    });

  //stroke
  svg.append("path")
    .datum(topojson.mesh(gsc, gsc.objects.gsc_borders))
    .attr("d", path)
    .attr("class", "country-border")
    .style({
      "fill": "none",
      "stroke": "#777"
    });

  //DDR
  svg.append("path")
    .datum(topojson.mesh(gsc, gsc.objects.scaleranks, function(a, b) { 
      if( ($.inArray(a.properties.sname,ddr) > -1 && $.inArray(b.properties.sname,brd) > -1) || ($.inArray(a.properties.sname,brd) > -1 && $.inArray(b.properties.sname,ddr) > -1) ){
        return a 
      }
      return
    }))
    .attr("d", path)
    .attr("class", "ddr-border")
    .style({
      "fill": "none",
      "stroke": "#777",
      "stroke-dasharray": "2,2",
      "stroke-linejoin": "round",
    });

  //places
  svg.selectAll('.place')
    .data(topojson.feature(gsc, gsc.objects.gsc_places).features)
    .enter().append("path")
    .attr("d", path)
    .attr("class", "place")
    .attr('id',function(d){ return 'p_'+ d.properties.name.replace(/\s+/g, '') })
    .style({
      "visibility": "hidden",
      "fill": "#444"
    });

  svg.selectAll(".place-label")
    .data(topojson.feature(gsc, gsc.objects.gsc_places).features)
    .enter().append("text")
    .attr('id',function(d){
      if(d.properties.cname in places){
        places[d.properties.cname].push(d.properties.name);
      }
      else{
        places[d.properties.cname]= [ d.properties.name ]; 
      }
      return d.properties.name.replace(/\s+/g, '') 
    })
    .attr("class", "place-label")
    .attr("transform", function(d) { return "translate(" + projection(d.geometry.coordinates) + ")"; })
    .attr("dy", ".35em")
    .style({
      "visibility": "hidden",
      "font-family": "Helvetica, Arial, sans-serif",
      "font-size": "10px",
      "pointer-events": "none",
      "fill": "#444"
    })
    .text(function(d) { return d.properties.name; });

  svg.selectAll(".place-label")
    .attr("x", function(d) { return d.geometry.coordinates[0] > 8 ? 6 : -6; })
    .style("text-anchor", function(d) { return d.geometry.coordinates[0] > 8 ? "start" : "end"; });

  //country label
  svg.selectAll(".country-label")
    .data(topojson.feature(gsc, gsc.objects.gsc_borders).features)
    .enter().append("text")
    .attr("class", function(d) { return "country-label " + d.id; })
    .attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
    .attr("dy", ".35em")
    .text(function(d) { return d.properties.name; })
    .style({
      "font-family": "Helvetica, Arial, sans-serif",
      "pointer-events": "none",
      "fill": "#777",
      "fill-opacity": ".5",
      "font-size": "20px",
      "font-weight": "300",
      "text-anchor": "middle"
    });

  var mapTitle = svg.append("text")
    .attr("class", "map-title")
    .attr("transform", function(){ return "translate(" + (width-40) + "," + (height-35) + ")"; })
    .style({
      "font-family": "Helvetica, Arial, sans-serif",
      "pointer-events": "none",
      "fill": "#777",
      "fill-opacity": ".5",
      "font-size": "50px",
      "font-weight": "300",
      "text-anchor":"end"
    })
    .text('YEAR');


  $('<h2/>',{
    text:"Cities"
  }).appendTo('#cityList');

  $.each(places,function(k,v){
    $('<h4/>',{
      text:k
    }).appendTo('#cityList');

    $.each(v.sort(),function(i,d){
      $('<div />',{
        id:'div_'+ d.replace(/\s+/g, '')
      }).appendTo('#cityList');

      $('<input/>', {
        type: "checkbox",
        id: "cb_" + d.replace(/\s+/g, ''),
        value: d.replace(/\s+/g, '')
      }).appendTo('#div_'+ d.replace(/\s+/g, ''));

      $('<label />', { 
        'for': 'cb_'+ d.replace(/\s+/g, ''),
        text: d
      }).appendTo('#div_'+ d.replace(/\s+/g, ''));
    });
  });
  
  $('#cityList').on('change','input',function(){
    if(this.checked){
      d3.select("#" + this.value).style("visibility", "visible");
      d3.select('#p_'+this.value).style("visibility", "visible");
    }
    else{
      d3.select("#" + this.value).style("visibility", "hidden");
      d3.select('#p_'+this.value).style("visibility", "hidden");
    }
  });

  $('#yearField').on('keyup',function(){
    mapTitle.text($(this).val());
  });

  d3.select("#save").on("click", function(){
    var n = "gsc_" + $('#yearField').val() + ".png";
    svgenie.save( "gsc", {
        name : n
    });
  });
});