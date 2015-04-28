ms.stylist = function() {
  var attrs = [],
      styles = [],
      title;

  function stylist(e) {
    var ne = e.features.length,
        na = attrs.length,
        ns = styles.length,
        f, // feature
        d, // data
        o, // element
        x, // attr or style or title descriptor
        v, // attr or style or title value
        i,
        j;
    for (i = 0; i < ne; ++i) {
      if (!(o = (f = e.features[i]).element)) continue;
      d = f.data;
      for (j = 0; j < na; ++j) {
        v = (x = attrs[j]).value;
        if (typeof v === "function") v = v.call(null, d);
        if (v == null) {
          if (x.name.local)
            o.removeAttributeNS(x.name.space, x.name.local);
          else
            o.removeAttribute(x.name);
        }
        else {
          if (x.name.local)
            o.setAttributeNS(x.name.space, x.name.local, v);
          else
            o.setAttribute(x.name, v);
        }
      }
      for (j = 0; j < ns; ++j) {
        v = (x = styles[j]).value;
        if (typeof v === "function") v = v.call(null, d);
        if (v == null)
          o.style.removeProperty(x.name);
        else
          o.style.setProperty(x.name, v, x.priority);
      }
      if (v = title) {
        if (typeof v === "function") v = v.call(null, d);
        while (o.lastChild) o.removeChild(o.lastChild);
        if (v != null) o.appendChild(ms.svg("title")).appendChild(document.createTextNode(v));
      }
    }
  }

  stylist.attr = function(n, v) {
    attrs.push({name: ns(n), value: v});
    return stylist;
  };

  stylist.style = function(n, v, p) {
    styles.push({name: n, value: v, priority: arguments.length < 3 ? null : p});
    return stylist;
  };

  stylist.title = function(v) {
    title = v;
    return stylist;
  };

  return stylist;
};
