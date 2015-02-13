// Default map controls.
ms.interact = function() {
  var interact = {},
      drag = ms.drag(),
      wheel = ms.wheel(),
      dblclick = ms.dblclick(),
      touch = ms.touch(),
      arrow = ms.arrow();

  interact.map = function(x) {
    drag.map(x);
    wheel.map(x);
    dblclick.map(x);
    touch.map(x);
    arrow.map(x);
    return interact;
  };

  return interact;
};
