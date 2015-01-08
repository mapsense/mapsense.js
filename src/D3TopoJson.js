po.d3TopoJson = function(fetch) {
  if (!arguments.length) fetch = po.queue.json;

  var topologyFeatures = function(topology) {
    function convert(topology, object, layer, features) {
      if (object.type == 'GeometryCollection' && !object.properties) {
        object.geometries.forEach(function(g) {
          convert(topology, g, layer, features);
        });
      }
      else {
        var feature = topojson.feature(topology, object);
        feature.properties = { layer: layer };
        if (object.properties) {
          Object.keys(object.properties).forEach(function(property) {
            feature.properties[property] = object.properties[property];
          });
        }
        features.push(feature);
      }
    }

    var features = [];
    for (var o in topology.objects) {
      convert(topology, topology.objects[o], o, features);
    }
    return features;
  };

  var topoToGeo = function(url, callback) {
    return fetch(url, function(topology) {
      callback({
        type: 'FeatureCollection',
        features: topologyFeatures(topology)
      });
    });
  };

  var d3TopoJson = po.d3GeoJson(topoToGeo);

  d3TopoJson.topologyFeatures = function(x) {
    if (!arguments.length) return topologyFeatures;
    topologyFeatures = x;
    return d3TopoJson;
  };

  return d3TopoJson;
};
