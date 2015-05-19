ms.attribution = function(html) {
  var attribution = {},
      map,
      container = document.createElement("div");

  container.setAttribute("class", "mapsense-attribution");

  attribution.container = function() {
    return container;
  };

  attribution.html = function(x) {
    if (!arguments.length) return container.innerHTML;
    container.innerHTML = x;
    return attribution;
  };

  attribution.map = function(x) {
    if (!arguments.length) return map;
    if (map) {
      if (map === x) {
        container.parentNode.appendChild(container);
        return attribution;
      }
      container.parentNode.removeChild(container);
    }
    map = x;
    if (map) {
      map.relativeContainer().appendChild(container);
    }
    return attribution;
  };

  return attribution.html(html);
};
