var po = org.polymaps;

var map = po.map()
    .container(document.getElementById("map").appendChild(po.svg("svg")))
    .zoomRange([0, 20])
    .zoom(1)
    .center({lat: 0, lon: 0})
    .add(po.interact())
    .add(po.hash());

map.add(po.layer(canvas));

map.add(po.compass()
    .pan("none"));

function canvas(tile) {
  if (tile.column < 0 || tile.column >= (1 << tile.zoom)) {
    tile.element = po.svg("g");
    return; // no wrap
  }

  var size = map.tileSize(),
      o = tile.element = po.svg("foreignObject"),
      c = o.appendChild(document.createElement("canvas")),
      g = c.getContext("2d"),
      image = g.createImageData(size.x, size.y);

  o.setAttribute("width", size.x);
  o.setAttribute("height", size.y);
  c.setAttribute("width", size.x);
  c.setAttribute("height", size.y);

  // following code adapted blindly from
  // http://blogs.msdn.com/mikeormond/archive/2008/08/22
  // /deep-zoom-multiscaletilesource-and-the-mandelbrot-set.aspx

  var tileCount = 1 << tile.zoom;

  var ReStart = -2.0;
  var ReDiff = 3.0;

  var MinRe = ReStart + ReDiff * tile.column / tileCount;
  var MaxRe = MinRe + ReDiff / tileCount;

  var ImStart = -1.2;
  var ImDiff = 2.4;

  var MinIm = ImStart + ImDiff * tile.row / tileCount;
  var MaxIm = MinIm + ImDiff / tileCount;

  var Re_factor = (MaxRe - MinRe) / (size.x - 1);
  var Im_factor = (MaxIm - MinIm) / (size.y - 1);

  var MaxIterations = 32;

  for (var y = 0, i = 0; y < size.y; ++y) {
    var c_im = MinIm + y * Im_factor;
    for (var x = 0; x < size.x; ++x) {
      var c_re = MinRe + x * Re_factor;
      var Z_re = c_re;
      var Z_im = c_im;
      var isInside = true;
      var n = 0;
      for (n = 0; n < MaxIterations; ++n) {
        var Z_re2 = Z_re * Z_re;
        var Z_im2 = Z_im * Z_im;
        if (Z_re2 + Z_im2 > 4) {
          isInside = false;
          break;
        }
        Z_im = 2 * Z_re * Z_im + c_im;
        Z_re = Z_re2 - Z_im2 + c_re;
      }
      if (isInside) {
        image.data[i++] = image.data[i++] = image.data[i++] = 0;
      } else if (n < MaxIterations / 2) {
        image.data[i++] = 255 / (MaxIterations / 2) * n;
        image.data[i++] = image.data[i++] = 0;
      } else {
        image.data[i++] = 255;
        image.data[i++] = image.data[i++] = (n - MaxIterations / 2) * 255 / (MaxIterations / 2);
      }
      image.data[i++] = 255;
    }
  }
  g.putImageData(image, 0, 0);
}