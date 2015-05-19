ms.basemap = function() {
  var basemap = ms.topoJson();
  var attribution = ms.attribution("<a href=\"https://developer.mapsense.co/tileViewer/?tileset=mapsense.earth\">©Mapsense ©OpenStreetMap</a>");

  var baseURL = "https://{S}-api.mapsense.co/explore/api/universes/mapsense.earth/{Z}/{X}/{Y}.topojson?s=10&ringSpan=8";
  var apiKey;
  var style;

  var __map__ = basemap.map;
  basemap.map = function(x) {
    var result = __map__.apply(basemap, arguments);
    if (arguments.length)
      attribution.map(x);
    return result;
  };

  basemap.apiKey = function(x) {
    if (!arguments.length) return apiKey;
    apiKey = x;
    basemap.url(ms.url(baseURL + "&api-key=" + apiKey)
      .hosts(["a", "b", "c", "d"]));
    return basemap;
  };

  basemap.style = function(x) {
    if (!arguments.length) return style;

    style = x;

    basemap.selection(function(s) {
      var styleClass = "mapsense-" + style;
      var zoomClass = "_" + Math.floor(basemap.map().zoom());
      s.attr("class", function(feature) {
        var classes = [ styleClass, zoomClass ];
        if (feature.properties) {
          if (feature.properties.layer)
            classes.push(feature.properties.layer);
          if (feature.properties.sub_layer)
            classes.push(feature.properties.sub_layer);
        }
        return classes.join(" ");
      });
    });

    return basemap;
  };

  basemap.style("light");
  return basemap;
};
