ms.topoJson = function(fetch) {
  if (!arguments.length) fetch = ms.queue.json;

  var classify,
      staticTopology;

  function groupFeatures(features) {
    if (!classify)
      return features;

    var classIndices = {};
    var groupedFeatures = [];
    features.forEach(function(f) {
      var c = classify(f);
      var index = classIndices[c];
      if (index === undefined) {
        index = groupedFeatures.push([]) - 1;
        classIndices[c] = index;
      }
      groupedFeatures[index].push(f);
    });

    return groupedFeatures.map(function(g) {
      return {
        type: 'GeometryCollection',
        geometries: g
      };
    });
  }

  var topologyFeatures = function(topology) {
    function convert(topology, object, layer, features) {
      if (object.type == "GeometryCollection" && !object.properties) {
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
    features = groupFeatures(features);
    return features;
  };

  var topoToGeo = function(url, callback) {
    return fetch(url, function(topology) {
      callback({
        type: "FeatureCollection",
        features: topologyFeatures(topology)
      });
    });
  };

  var topoJson = ms.geoJson(topoToGeo);

  topoJson.topologyFeatures = function(x) {
    if (!arguments.length) return topologyFeatures;
    topologyFeatures = x;
    return topoJson;
  };

  topoJson.classify = function(x) {
    if (!arguments.length) return classify;
    classify = x;
    return topoJson;
  };

  topoJson.staticTopology = function(x) {
    if (!arguments.length) return staticTopology;
    staticTopology = x;
    return topoJson.features(staticTopology ? topologyFeatures(staticTopology) : null);
  };

  return topoJson;
};
