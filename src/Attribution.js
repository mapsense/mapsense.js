ms.attribution = function(text) {
  var attribution = {},
      map,
      container = ms.svg("g"),
      textNode = ms.svg("text");

  container.setAttribute("class", "attribution");
  container.appendChild(textNode);

  textNode.setAttribute("text-anchor", "end");
  textNode.setAttribute("user-select", "none");
  textNode.setAttribute("dx", -5);
  textNode.setAttribute("dy", -5);
  textNode.style.setProperty("user-select", "none");
  textNode.style.setProperty("cursor", "default");

  attribution.text = function(x) {
    if (!arguments.length) return textNode.textContent;
    textNode.textContent = x;
    return attribution;
  };

  function resize() {
    var map = attribution.map();
    var mapSize = map.size();
    textNode.setAttribute("x", mapSize.x);
    textNode.setAttribute("y", mapSize.y);
  }

  attribution.map = function(x) {
    if (!arguments.length) return map;
    if (map) {
      if (map === x) {
        container.parentNode.appendChild(container);
        return attribution;
      }
      map.off("resize", resize);
      container.parentNode.removeChild(container);
    }
    map = x;
    if (map) {
      map.container().appendChild(container);
      map.on("resize", resize);
      resize();
    }
    return attribution;
  };

  return attribution.text(text);
};
