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
      var featureOrCollection = topojson.feature(topology, object),
          layerFeatures;

      if (featureOrCollection.type === "FeatureCollection") {
        layerFeatures = featureOrCollection.features;
      } else {
        layerFeatures = [featureOrCollection];
      }
      layerFeatures.forEach(function(f) {
        f.properties.layer = layer;
      });
      features.push.apply(features, layerFeatures);
    }

    var features = [];
    for (var o in topology.objects) {
      convert(topology, topology.objects[o], o, features);
    }
    features = groupFeatures(features);
    return features;
  };

  var topoToGeo = function(url, callback, options) {
    return fetch(url, function(topology) {
      callback({
        type: "FeatureCollection",
        features: topologyFeatures(topology)
      });
    }, options);
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
