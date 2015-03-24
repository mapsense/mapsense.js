ms.queue = (function() {
  var queued = [], active = 0, size = 6;

  function process() {
    if ((active >= size) || !queued.length) return;
    active++;
    queued.pop()();
  }

  function dequeue(send) {
    for (var i = 0; i < queued.length; i++) {
      if (queued[i] == send) {
        queued.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  function merge(dest, src) {
    for (var property in src) {
      dest[property] = src[property];
    }
    return dest;
  }

  function request(url, callback, options) {
    var req;

    function send() {
      req = new XMLHttpRequest();
      req.open("GET", url, true);
      if (options) {
        if (options.mimeType && req.overrideMimeType)
          req.overrideMimeType(options.mimeType);
        if (options.responseType)
          req.responseType = options.responseType;
        if (options.xhrFields) {
          for (var f in options.xhrFields) {
            req[f] = options.xhrFields[f];
          }
        }
      }
      req.onreadystatechange = function(e) {
        if (req.readyState == 4) {
          active--;
          if (req.status < 300) callback(req);
          process();
        }
      };
      req.send(null);
    }

    function abort(hard) {
      if (dequeue(send)) return true;
      if (hard && req) { req.abort(); return true; }
      return false;
    }

    queued.push(send);
    process();
    return {abort: abort};
  }

  function text(url, callback, mimeType) {
    return request(url, function(req) {
      if (req.responseText) callback(req.responseText);
    }, { mimeType: mimeType });
  }

  /*
   * We the override MIME type here so that you can load local files; some
   * browsers don't assign a proper MIME type for local files.
   */

  function json(url, callback, options) {
    return request(url, function(req) {
      if (req.responseText) callback(JSON.parse(req.responseText));
    }, merge({ mimeType: "application/json" }, options));
  }

  function xml(url, callback, options) {
    return request(url, function(req) {
      if (req.responseXML) callback(req.responseXML);
    }, merge({ mimeType: "application/xml" }, options));
  }

  function octetStream(url, callback, options) {
    var defaultOptions = {
      mimeType: "application/octet-stream",
      responseType: "arraybuffer"
    };
    return request(url, function(req) {
      if (req.response) callback(req.response);
    }, merge(defaultOptions, options));
  }

  function image(image, src, callback) {
    var img;

    function send() {
      img = document.createElement("img");
      img.onerror = function() {
        active--;
        process();
      };
      img.onload = function() {
        active--;
        callback(img);
        process();
      };
      img.src = src;
      image.setAttributeNS(ms.ns.xlink, "href", src);
    }

    function abort(hard) {
      if (dequeue(send)) return true;
      if (hard && img) { img.src = "about:"; return true; } // cancels request
      return false;
    }

    queued.push(send);
    process();
    return {abort: abort};
  }

  return {
    text: text,
    xml: xml,
    json: json,
    octetStream: octetStream,
    image: image
  };
})();
