ms.basemap = function() {
  var basemap = ms.topoJson();
  var attribution = ms.attribution('<a target="_blank" href="https://developer.mapsense.co/tileViewer/?tileset=mapsense.earth">©Mapsense ©OpenStreetMap</a>');

  var url = "https://{S}-api.mapsense.co/universes/mapsense.earth/{Z}/{X}/{Y}.topojson?s=10&ringSpan=8";
  var apiKey;
  var style;

  function urlWithKey() {
    return ms.url(url + "&api-key=" + apiKey)
      .hosts(["a", "b", "c", "d"]);
  }

  var __map__ = basemap.map;
  basemap.map = function(x) {
    var result = __map__.apply(basemap, arguments);
    if (arguments.length)
      attribution.map(x);
    return result;
  };

  var __url__ = basemap.url;
  basemap.url = function(x) {
    if (!arguments.length) return url;
    url = x;
    __url__.call(basemap, urlWithKey());
    return basemap;
  };

  basemap.apiKey = function(x) {
    if (!arguments.length) return apiKey;
    apiKey = x;
    __url__.call(basemap, urlWithKey());
    return basemap;
  };

  basemap.style = function(x) {
    if (!arguments.length) return style;

    if (style)
      attribution.container().classList.remove(style);

    style = x;

    basemap.selection(function(s) {
      var styleClass = style ? "mapsense-" + style : "";
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

    if (style)
      attribution.container().classList.add(style);

    return basemap;
  };

  basemap.on("load", function(e) {
    var g = e.tile.element;
    var tileBackground = g.querySelector(".tile-background");
    if (tileBackground && style)
      tileBackground.classList.add("mapsense-" + style);
  });

  basemap.style("light");
  basemap.tileBackground(true);
  basemap.clip(true);
  return basemap;
};
