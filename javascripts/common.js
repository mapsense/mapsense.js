//http://www.netlobo.com/url_query_string_javascript.html
function getQueryParam (name) {
  name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
  var regexS = "[\\?&]" + name + "=([^&#]*)",
      regex = new RegExp(regexS),
      results = regex.exec(window.location.search);

  if (results === null) {
    return "";
  } else {
    return results[1];
  }
}

function selectText (obj) {
  var range, selection;
  if (obj) {
    if (document.selection) {
      range = document.body.createTextRange();
      range.moveToElementText(obj);
      range.select();
    } else if (window.getSelection) {
      selection = window.getSelection();
      range = document.createRange();
      range.selectNodeContents(obj);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
}

function unselectText () {
  if (window.getSelection) {
    window.getSelection().removeAllRanges();
  }
}

function isSameDay (timestamp, tDay) {
  var today = tDay || new Date(),
      theDate = new Date(timestamp);
  return (today.getYear() == theDate.getYear() && today.getMonth() == theDate.getMonth() && today.getDate() == theDate.getDate());
}

function updateUrlQueryString (queryString, doReplace) {
  if (history.pushState) {
    var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + queryString;
    if (doReplace) {
      window.history.replaceState({path:newurl}, "", newurl);
    } else {
      window.history.pushState({path:newurl}, "", newurl);
    }
  } else {
    window.location.search = queryString;
  }
}
;
