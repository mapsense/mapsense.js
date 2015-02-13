ms.image = function() {
  var image = ms.layer(load, unload),
      url;

  function load(tile) {
    var element = tile.element = ms.svg("image"), size = image.map().tileSize();
    element.setAttribute("preserveAspectRatio", "none");
    element.setAttribute("width", size.x);
    element.setAttribute("height", size.y);

    if (typeof url == "function") {
      element.setAttribute("opacity", 0);
      var tileUrl = url(tile);
      if (tileUrl != null) {
        tile.request = ms.queue.image(element, tileUrl, function(img) {
          delete tile.request;
          tile.ready = true;
          tile.img = img;
          element.removeAttribute("opacity");
          image.dispatch({type: "load", tile: tile});
        });
      } else {
        tile.ready = true;
        image.dispatch({type: "load", tile: tile});
      }
    } else {
      tile.ready = true;
      if (url != null) element.setAttributeNS(ms.ns.xlink, "href", url);
      image.dispatch({type: "load", tile: tile});
    }
  }

  function unload(tile) {
    if (tile.request) tile.request.abort(true);
  }

  image.url = function(x) {
    if (!arguments.length) return url;
    url = typeof x == "string" && /{.}/.test(x) ? ms.url(x) : x;
    return image.reload();
  };

  return image;
};
