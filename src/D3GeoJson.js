po.d3GeoJson = function(fetch) {
  var d3GeoJson = po.layer(load, unload),
      container = d3GeoJson.container(),
      url,
      clip = true,
      clipId = "org.polymaps." + po.id(),
      clipHref = "url(#" + clipId + ")",
      clipPath = container.insertBefore(po.svg("clipPath"), container.firstChild),
      clipRect = clipPath.appendChild(po.svg("rect")),
      scale = "auto",
      zoom = null,
      features,
      tileBackground = true,
      mercatorSource = false,
      selection;

  container.setAttribute("fill-rule", "evenodd");
  clipPath.setAttribute("id", clipId);

  if (!arguments.length) fetch = po.queue.json;

  function projection(proj) {
    var l = {lat: 0, lon: 0};
    return function(coordinates) {
      l.lat = coordinates[1];
      l.lon = coordinates[0];
      var p = proj(l);
      coordinates.x = p.x;
      coordinates.y = p.y;
      return p;
    };
  }

  function rescale(o, e, k) {
    return o.type in rescales && rescales[o.type](o, e, k);
  }

  var rescales = {

    Point: function (o, e, k) {
      var p = o.coordinates;
      e.setAttribute("transform", "translate(" + p.x + "," + p.y + ")" + k);
    },

    MultiPoint: function (o, e, k) {
      var c = o.coordinates,
          i = -1,
          n = p.length,
          x = e.firstChild,
          p;
      while (++i < n) {
        p = c[i];
        x.setAttribute("transform", "translate(" + p.x + "," + p.y + ")" + k);
        x = x.nextSibling;
      }
    }

  };

  // Create path projecting WGS84 (4326) to spherical coordinates (900913).
  function projectSpherical(tileProj) {
    return d3.geo.path().projection({
      stream: function(stream) {
        return {
          point: function(x, y) {
            var p = tileProj.locationPoint({ lon: x, lat: y});
            stream.point(Math.round(2 * p.x) / 2, Math.round(2 * p.y) / 2);
          },
          sphere: function() { stream.sphere(); },
          lineStart: function() { stream.lineStart(); },
          lineEnd: function() { stream.lineEnd(); },
          polygonStart: function() { stream.polygonStart(); },
          polygonEnd: function() { stream.polygonEnd(); }
        };
      }
    });
  }

  // Create path for already projected spherical Mercator coordinates (900913).
  function projectMercator(tile) {
    function invert(sx, sy, tx, ty) {
      return d3.geo.transform({
        point: function(x, y) {
          this.stream.point(sx * (x - tx), sy * (y - ty));
        }
      });
    }

    var K = 40075016.6856;
    var m = Math.pow(2, tile.zoom);
    var tileSize = d3GeoJson.map().tileSize();
    var sx = m * tileSize.x / K;
    var sy = m * tileSize.y / K;
    var tx = (m / 2 - tile.column) * K / m;
    var ty = (m / 2 - tile.row) * K / m;

    return d3.geo.path().projection(invert(sx, sy, -tx, -ty));
  }

  function load(tile, proj) {
    var g = tile.element = po.svg("g");

    var tileProj = proj(tile),
        path = mercatorSource ? projectMercator(tile) :
          projectSpherical(tileProj);

    tile.features = [];

    function update(data) {
      var updated = [];

      /* Fetch the next batch of features, if so directed. */
      if (data.next) tile.request = fetch(data.next.href, update);

      if (d3GeoJson.tile() && tileBackground) {
        var tileSize = d3GeoJson.map().tileSize();
        d3.select(g.insertBefore(po.svg("rect"), g.firstChild))
          .attr("width", tileSize.x)
          .attr("height", tileSize.x)
          .attr("class", "tile-background");
      }

      draw(g, data, path, updated, tile);

      tile.ready = true;
      updated.push.apply(tile.features, updated);
      d3GeoJson.dispatch({type: "load", tile: tile, features: updated});
    }

    if (url != null) {
      tile.request = fetch(typeof url == "function" ? url(tile) : url, update);
    } else {
      update({type: "FeatureCollection", features: features || []});
    }
  }

  function draw(g, data, path, updated, tile) {
    var update = d3.select(g)
      .selectAll('path')
      .data(data.features);

    update.exit()
      .remove();

    var enter = update
      .enter()
      .append('path');

    if (updated)
      enter.each(function(f) { updated.push({ element: this, data: f }); });

    if (selection)
      selection(update);

    var paths = [];
    update.each(function(f, i) {
      paths[i] = path(f);
    });
    update.attr('d', function(f, i) { return paths[i]; });
  }

  function unload(tile) {
    if (tile.request) tile.request.abort(true);
  }

  function move() {
    var zoom = d3GeoJson.map().zoom(),
        tiles = d3GeoJson.cache.locks(), // visible tiles
        key, // key in locks
        tile, // locks[key]
        features, // tile.features
        i, // current feature index
        n, // current feature count, features.length
        feature, // features[i]
        k; // scale transform
    if (scale == "fixed") {
      for (key in tiles) {
        if ((tile = tiles[key]).scale != zoom) {
          k = "scale(" + Math.pow(2, tile.zoom - zoom) + ")";
          i = -1;
          n = (features = tile.features).length;
          while (++i < n) rescale((feature = features[i]).data.geometry, feature.element, k);
          tile.scale = zoom;
        }
      }
    } else {
      for (key in tiles) {
        i = -1;
        n = (features = (tile = tiles[key]).features).length;
        while (++i < n) rescale((feature = features[i]).data.geometry, feature.element, "");
        delete tile.scale;
      }
    }
  }

  d3GeoJson.tileBackground = function(x) {
    if (!arguments.length) return tileBackground;
    tileBackground = x;
    return d3GeoJson;
  };

  d3GeoJson.mercatorSource = function(x) {
    if (!arguments.length) return mercatorSource;
    mercatorSource = x;
    return d3GeoJson;
  };

  d3GeoJson.selection = function(x) {
    if (!arguments.length) return selection;
    selection = x;
    return d3GeoJson.reshow();
  };

  d3GeoJson.url = function(x) {
    if (!arguments.length) return url;
    url = typeof x == "string" && /{.}/.test(x) ? po.url(x) : x;
    if (url != null) features = null;
    if (typeof url == "string") d3GeoJson.tile(false);
    return d3GeoJson.reload();
  };

  d3GeoJson.features = function(x) {
    if (!arguments.length) return features;
    if (features = x) {
      url = null;
      d3GeoJson.tile(false);
    }
    return d3GeoJson.reload();
  };

  d3GeoJson.clip = function(x) {
    if (!arguments.length) return clip;
    if (clip) container.removeChild(clipPath);
    if (clip = x) container.insertBefore(clipPath, container.firstChild);
    var locks = d3GeoJson.cache.locks();
    for (var key in locks) {
      if (clip) locks[key].element.setAttribute("clip-path", clipHref);
      else locks[key].element.removeAttribute("clip-path");
    }
    return d3GeoJson;
  };

  var __tile__ = d3GeoJson.tile;
  d3GeoJson.tile = function(x) {
    if (arguments.length && !x) d3GeoJson.clip(x);
    return __tile__.apply(d3GeoJson, arguments);
  };

  var __map__ = d3GeoJson.map;
  d3GeoJson.map = function(x) {
    if (x && clipRect) {
      var size = x.tileSize();
      clipRect.setAttribute("width", size.x);
      clipRect.setAttribute("height", size.y);
    }
    return __map__.apply(d3GeoJson, arguments);
  };

  d3GeoJson.scale = function(x) {
    if (!arguments.length) return scale;
    if (scale = x) d3GeoJson.on("move", move);
    else d3GeoJson.off("move", move);
    if (d3GeoJson.map()) move();
    return d3GeoJson;
  };

  d3GeoJson.show = function(tile) {
    if (clip) tile.element.setAttribute("clip-path", clipHref);
    else tile.element.removeAttribute("clip-path");
    d3GeoJson.dispatch({type: "show", tile: tile, features: tile.features});
    return d3GeoJson;
  };

  d3GeoJson.reshow = function() {
    var locks = d3GeoJson.cache.locks();
    for (var key in locks) d3GeoJson.show(locks[key]);
    return d3GeoJson;
  };

  return d3GeoJson;
};
