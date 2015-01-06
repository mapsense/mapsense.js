po.d3TopoJson = function(fetch) {
  if (!arguments.length) fetch = po.queue.json;

  var topoToGeo = function(url, callback) {
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

    return fetch(url, function(topology) {
      var features = [];
      for (var o in topology.objects) {
        convert(topology, topology.objects[o], o, features);
      }
      callback({
        type: 'FeatureCollection',
        features: features
      });
    });
  };

  var d3TopoJson = po.d3GeoJson(topoToGeo);

  return d3TopoJson;
};
