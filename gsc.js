//Configuration vars
var container = '#gsc';
var gsc_width = 960,
    gsc_height = 1160;

var gsc_projection_var = {
  center:[0, 50.5],
  rotate:[-11.5, 0],
  parallels:[45, 55],
  scale:6000
};

//german states that define the DDR border
var ddr = ['Thüringen', 'Sachsen-Anhalt', 'Brandenburg', 'Mecklenburg-Vorpommern','Sachsen'],
    brd = ['Schleswig-Holstein','Niedersachsen','Hessen','Bayern'];

var gsc_file = "gsc.json";


//Visualization Obj
var Vis = function(w,h,c){
  this.width = w;
  this.height = h;
  this.container = c;
  this.maps = {};

  this._setupContainer();
  this._setMapYear();
  this._setListeners();
};

//Map Obj
var D3Map = function(f,n,p,i,v){
  this.file = f;  
  this.name = n;
  this.vis = v;
  this.projection;
  this.path;
  this.places = {};
  this.mapData;

  this.init(p,i);
};

Vis.prototype = {
  _setupContainer: function(){
    this.svg = d3.select(this.container)
      .attr("width", this.width)
      .attr("height", this.height);
  },
  changeWidth:function(w){
    this.width = w;
    this.svg.attr("width", this.width);
  },
  _setMapYear:function(){
    var self = this;
    this.mapTitle = this.svg.append("text")
    .attr("class", "map-title")
    .attr("transform", function(){ return "translate(" + (self.width-40) + "," + (self.height-35) + ")"; })
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
  },
  _setListeners:function(){
    var self = this;
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
      self.mapTitle.text($(this).val());
    });

    d3.select("#save").on("click", function(){
      var n = "gsc_" + $('#yearField').val() + ".png";
      svgenie.save( "gsc", {
          name : n
      });
    });
  }
};

D3Map.prototype = {
  _getData:function(){
    var self = this;
    var d = $.Deferred();
    d3.json(self.file, function(error, data) {
      if (error) return console.error(error);
      else {
        self.mapData = data;
        d.resolve(data);
      }
    });
    return d.promise();
  },
  _setProjection:function(p){
    var self = this;
    this.projection = d3.geo.albers()
      .center(p.center)
      .rotate(p.rotate)
      .parallels(p.parallels)
      .scale(p.scale)
      .translate([self.vis.width / 2, self.vis.height / 2]);
  },
  _setPath:function(){
    var self = this;
    this.path = d3.geo.path()
      .projection(self.projection)
      .pointRadius(2);
  },
  _setCountryFill:function(){
    var self = this;
    self.vis.svg.selectAll(".country_fill")
//################## DO WE NEED TO RENAME THE SUBFILES??? ####################
      .data(topojson.feature(self.mapData, self.mapData.objects.gsc_borders).features)
      .enter().append("path")
      .attr("class", function(d) { return "country_fill " + d.id; })
      .attr("d", self.path)
      .style({
        "fill": "#eee",
        "fill-opacity": ".2"
      });
  },
  _setCountryStroke:function(){
    var self = this;
    self.vis.svg.append("path")
      .datum(topojson.mesh(self.mapData, self.mapData.objects.gsc_borders))
      .attr("d", self.path)
      .attr("class", "country-border")
      .style({
        "fill": "none",
        "stroke": "#777"
      });
  },
  _setInteriorBorder: function(state1,state2){
    var self = this;
    self.vis.svg.append("path")
      .datum(topojson.mesh(self.mapData, self.mapData.objects.scaleranks, function(a, b) { 
        if( ($.inArray(a.properties.sname,state1) > -1 && $.inArray(b.properties.sname,state2) > -1) || ($.inArray(a.properties.sname,state2) > -1 && $.inArray(b.properties.sname,state1) > -1) ){
          return a 
        }
        return
      }))
      .attr("d", self.path)
      .attr("class", "state-border")
      .style({
        "fill": "none",
        "stroke": "#777",
        "stroke-dasharray": "2,2",
        "stroke-linejoin": "round",
      });
  },
  _setCities:function(){
    var self = this;
    self.vis.svg.selectAll('.place')
      .data(topojson.feature(self.mapData, self.mapData.objects.gsc_places).features)
      .enter().append("path")
      .attr("d", self.path)
      .attr("class", "place")
      .attr('id',function(d){ return 'p_'+ d.properties.name.replace(/\s+/g, '') })
      .style({
        "visibility": "hidden",
        "fill": "#444"
      });
  },
  _setCityLabel:function(){
    var self = this;
    self.vis.svg.selectAll(".place-label")
      .data(topojson.feature(self.mapData, self.mapData.objects.gsc_places).features)
      .enter().append("text")
      .attr('id',function(d){
        if(d.properties.cname in self.places){
          self.places[d.properties.cname].push(d.properties.name);
        }
        else{
          self.places[d.properties.cname]= [ d.properties.name ]; 
        }
        return d.properties.name.replace(/\s+/g, '') 
      })
      .attr("class", "place-label")
      .attr("transform", function(d) { return "translate(" + self.projection(d.geometry.coordinates) + ")"; })
      .attr("dy", ".35em")
      .style({
        "visibility": "hidden",
        "font-family": "Helvetica, Arial, sans-serif",
        "font-size": "10px",
        "pointer-events": "none",
        "fill": "#444"
      })
      .text(function(d) { return d.properties.name; });

    self.vis.svg.selectAll(".place-label")
      .attr("x", function(d) { return d.geometry.coordinates[0] > 8 ? 6 : -6; })
      .style("text-anchor", function(d) { return d.geometry.coordinates[0] > 8 ? "start" : "end"; });
  },
  _setCountryLabel:function(){
    var self = this;
    self.vis.svg.selectAll(".country-label")
      .data(topojson.feature(self.mapData, self.mapData.objects.gsc_borders).features)
      .enter().append("text")
      .attr("class", function(d) { return "country-label " + d.id; })
      .attr("transform", function(d) { return "translate(" + self.path.centroid(d) + ")"; })
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
  },
  _createCityList:function(){
    var self = this;
    $('<h2/>',{
      text:self.name + " Cities"
    }).appendTo('#cityList');

    $.each(self.places,function(k,v){
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
  },
  init:function(proj,interiors){
    interiors = interiors || false;
    var self = this;

    self.vis.maps[self.name] = self;
    
    $.when(self._getData()).done(function(){
      self._setProjection(proj);
      self._setPath();
      self._setCountryFill();
      self._setCountryStroke();
      (interiors) ? self._setInteriorBorder(interiors[0],interiors[1]) : '';
      self._setCities();
      self._setCityLabel();
      self._setCountryLabel();
      self._createCityList();
    });
  }
}

var mapVis = new Vis(gsc_width,gsc_height,container);
var gsc = new D3Map(gsc_file, "GSC", gsc_projection_var,[ddr,brd], mapVis);

