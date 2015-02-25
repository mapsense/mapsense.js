ms.geoJson = function(fetch) {
  var geoJson = ms.layer(load, unload),
      container = geoJson.container(),
      url,
      clip = true,
      clipId = "org.polymaps." + ms.id(),
      clipHref = "url(#" + clipId + ")",
      clipPath = container.insertBefore(ms.svg("clipPath"), container.firstChild),
      clipRect = clipPath.appendChild(ms.svg("rect")),
      scale = "auto",
      zoom = null,
      pointRadius = 4.5,
      features,
      tileBackground = true,
      selection;

  container.setAttribute("fill-rule", "evenodd");
  clipPath.setAttribute("id", clipId);

  if (!arguments.length) fetch = ms.queue.json;

  function projection(proj) {
    var l = {lat: 0, lon: 0};
    return function(coordinates, c) {
      l.lat = coordinates[1];
      l.lon = coordinates[0];
      var p = proj(l);
      c.x = p.x;
      c.y = p.y;
      return p;
    };
  }

  function rescale(o, e, k) {
    var g = o.geometry;
    return g.type in rescales && rescales[g.type](o, e, k);
  }

  var rescales = {

    Point: function (o, e, k) {
      e.setAttribute("transform", "translate(" + o.x + "," + o.y + ")" + k);
    },

    MultiPoint: function (o, e, k) {
      e.setAttribute("transform", "translate(" + o.x + "," + o.y + ")" + k);
    }

  };

  // Create path projecting WGS84 spherical Mercator coordinates.
  function projectSpherical(tileProj) {
    return d3.geo.path().projection({
      stream: function(stream) {
        return {
          point: function(x, y) {
            // Latitudes at the poles (or beyond!) result in unrenderable NaN's and Infinities.
            var epsilon = 1.0e-6;
            y = Math.min(90 - epsilon, y);
            y = Math.max(-90 + epsilon, y);
            var p = tileProj.locationPoint({ lon: x, lat: y });
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

  function load(tile, proj) {
    var g = tile.element = ms.svg("g");

    var tileProj = proj(tile);

    tile.features = [];

    function update(data) {
      var updated = [];

      /* Fetch the next batch of features, if so directed. */
      if (data.next) tile.request = fetch(data.next.href, update);

      if (geoJson.tile() && tileBackground) {
        var tileSize = geoJson.map().tileSize();
        d3.select(g.insertBefore(ms.svg("rect"), g.firstChild))
          .attr("width", tileSize.x)
          .attr("height", tileSize.x)
          .attr("class", "tile-background");
      }

      draw(g, data, tileProj, updated, tile);

      tile.ready = true;
      updated.push.apply(tile.features, updated);
      geoJson.dispatch({type: "load", tile: tile, features: updated});
    }

    if (url != null) {
      tile.request = fetch(typeof url == "function" ? url(tile) : url, update);
    } else {
      update({type: "FeatureCollection", features: features || []});
    }
  }

  function copyObject(source) {
    var copy = {};
    for (var property in source) {
      copy[property] = source[property];
    }
    return copy;
  }

  function projectPoint(p, proj) {
    proj(p.geometry.coordinates, p);
    return p;
  }

  function projectPointsForMultiPoint(mp, proj) {
    var length = mp.geometry.coordinates.length;
    var points = [];
    for (var i = 0; i < length; i++) {
      var p = copyObject(mp);
      proj(p.geometry.coordinates[i], p);
      points.push(p);
    }
    return points;
  }

  function draw(g, data, tileProj, updated, tile) {
    var proj = projection(tileProj.locationPoint);

    var path = projectSpherical(tileProj);

    var pathFeatures = [],
        pointFeatures = [];

    data.features.forEach(function(f) {
      if (f.geometry.type === "Point")
        pointFeatures.push(projectPoint(f, proj));
      else if (f.geometry.type === "MultiPoint")
        pointFeatures.push.apply(pointFeatures, projectPointsForMultiPoint(f, proj));
      else
        pathFeatures.push(f);
    });

    var pathUpdate = d3.select(g)
      .selectAll("path")
      .data(pathFeatures)
      .enter()
      .append("path")
      .attr("d", function(f) { return path(f); });

    if (updated)
      pathUpdate.each(function(f) { updated.push({ element: this, data: f }); });

    var pointUpdate = d3.select(g)
      .selectAll("circle")
      .data(pointFeatures)
      .enter()
      .append("circle")
      .attr("transform", function(f) {
        return "translate(" + f.x + "," + f.y + ")";
      })
      .attr("r", pointRadius);

    if (updated)
      pointUpdate.each(function(f) { updated.push({ element: this, data: f }); });

    if (selection) {
      pathUpdate.push.apply(pathUpdate, pointUpdate);
      selection(pathUpdate);
    }
  }

  function unload(tile) {
    if (tile.request) tile.request.abort(true);
  }

  function move() {
    var zoom = geoJson.map().zoom(),
        tiles = geoJson.cache.locks(), // visible tiles
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
          while (++i < n) rescale((feature = features[i]).data, feature.element, k);
          tile.scale = zoom;
        }
      }
    }
  }

  geoJson.tileBackground = function(x) {
    if (!arguments.length) return tileBackground;
    tileBackground = x;
    return geoJson;
  };

  geoJson.selection = function(x) {
    if (!arguments.length) return selection;
    selection = x;
    return geoJson.reshow();
  };

  geoJson.url = function(x) {
    if (!arguments.length) return url;
    url = typeof x == "string" && /{.}/.test(x) ? ms.url(x) : x;
    if (url != null) features = null;
    if (typeof url == "string") geoJson.tile(false);
    return geoJson.reload();
  };

  geoJson.features = function(x) {
    if (!arguments.length) return features;
    if (features = x) {
      url = null;
      geoJson.tile(false);
    }
    return geoJson.reload();
  };

  geoJson.clip = function(x) {
    if (!arguments.length) return clip;
    if (clip) container.removeChild(clipPath);
    if (clip = x) container.insertBefore(clipPath, container.firstChild);
    var locks = geoJson.cache.locks();
    for (var key in locks) {
      if (clip) locks[key].element.setAttribute("clip-path", clipHref);
      else locks[key].element.removeAttribute("clip-path");
    }
    return geoJson;
  };

  var __tile__ = geoJson.tile;
  geoJson.tile = function(x) {
    if (arguments.length && !x) geoJson.clip(x);
    return __tile__.apply(geoJson, arguments);
  };

  var __map__ = geoJson.map;
  geoJson.map = function(x) {
    if (x && clipRect) {
      var size = x.tileSize();
      clipRect.setAttribute("width", size.x);
      clipRect.setAttribute("height", size.y);
    }
    return __map__.apply(geoJson, arguments);
  };

  geoJson.scale = function(x) {
    if (!arguments.length) return scale;
    if (scale = x) geoJson.on("move", move);
    else geoJson.off("move", move);
    if (geoJson.map()) move();
    return geoJson;
  };

  geoJson.show = function(tile) {
    if (clip) tile.element.setAttribute("clip-path", clipHref);
    else tile.element.removeAttribute("clip-path");
    if (selection) {
      var s = d3.select(tile.element).selectAll("path");
      s.push.apply(s, d3.select(tile.element).selectAll("circle"));
      selection(s);
    }
    geoJson.dispatch({type: "show", tile: tile, features: tile.features});
    return geoJson;
  };

  geoJson.reshow = function() {
    var locks = geoJson.cache.locks();
    for (var key in locks) geoJson.show(locks[key]);
    return geoJson;
  };

  return geoJson;
};
