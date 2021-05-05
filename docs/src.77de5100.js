// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"utils/Maybe.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.just = just;
exports.nothing = nothing;
exports.map2 = map2;
exports.map3 = map3;
exports.fromUndefined = fromUndefined;
exports.combine = combine;

function just(value) {
  return new Just(value);
}

function nothing() {
  return new Nothing();
}

function map2(fn, a, b) {
  return a.andThen(a_ => b.map(b_ => fn(a_, b_)));
}

function map3(fn, maybeA, maybeB, maybeC) {
  return maybeA.andThen(a => maybeB.andThen(b => maybeC.map(c => fn(a, b, c))));
}

function fromUndefined(a) {
  if (a === undefined) return nothing();else return just(a);
}

class Just {
  constructor(value) {
    this.tag = "just";
    this.value = value;
  }

  withDefault(_) {
    return this.value;
  }

  map(func) {
    return new Just(func(this.value));
  }

  andThen(func) {
    return func(this.value);
  }

  orElse(_) {
    return this.value;
  }

  toBool() {
    return true;
  }

}

class Nothing {
  constructor() {
    this.tag = "nothing";
  }

  withDefault(value) {
    return value;
  }

  map(_) {
    return new Nothing();
  }

  andThen(_) {
    return new Nothing();
  }

  orElse(value) {
    return value();
  }

  toBool() {
    return false;
  }

}

function combine(maybes) {
  return maybes.reduce((maybeArray, maybeItem) => map2((array, item) => {
    array.push(item);
    return array;
  }, maybeArray, maybeItem), just([]));
}
},{}],"utils/Cmd.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.map = map;
exports.andThen = andThen;
exports.map2 = map2;
exports.none = none;
exports.batch = batch;
exports.saveToLocalStorage = saveToLocalStorage;
exports.getFromLocalStorage = getFromLocalStorage;
exports.preventDefault = preventDefault;

var Maybe = _interopRequireWildcard(require("./Maybe"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function of(execute) {
  return {
    tag: "Cmd",
    execute
  };
}

function map(cmd, f) {
  return of(dispatch => {
    cmd.execute(a => dispatch(f(a)));
  });
}

function andThen(cmd, f) {
  return of(dispatch => {
    cmd.execute(a => {
      f(a).execute(dispatch);
    });
  });
} // Ejecuta secuencialmente.


function map2(cmd, cmdB, f) {
  return of(dispatch => {
    cmd.execute(a => {
      cmdB.execute(b => {
        dispatch(f(a, b));
      });
    });
  });
}

function none() {
  return of(() => {});
}

function batch(cmds) {
  return of(dispatch => {
    for (const cmd of cmds) {
      cmd.execute(dispatch);
    }
  });
}

function saveToLocalStorage(key, value) {
  return of(_ => {
    localStorage.setItem(key, JSON.stringify(value));
  });
}

function getFromLocalStorage(key) {
  return of(dispatch => {
    const stateString = localStorage.getItem(key);

    if (stateString !== null) {
      dispatch(Maybe.just(stateString));
    } else {
      dispatch(Maybe.nothing());
    }
  });
}

function preventDefault(event) {
  return of(_ => {
    event.preventDefault();
  });
}
},{"./Maybe":"utils/Maybe.ts"}],"Update.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.of = of;
exports.pure = pure;
exports.map = map;
exports.andThen = andThen;
exports.update = update;

var Cmd = _interopRequireWildcard(require("./utils/Cmd"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function of(state, cmd) {
  return {
    tag: 'Update',
    state,
    cmd
  };
}

function pure(state) {
  return of(state, Cmd.none());
}

function map(update, f) {
  return of(f(update.state), update.cmd);
}

function andThen(update, f) {
  const {
    state,
    cmd
  } = update;
  const {
    state: newState,
    cmd: cmd0
  } = f(state);
  return of(newState, Cmd.batch([cmd, cmd0]));
} // UPDATE ---


function update(state, event) {
  return pure(state);
}
},{"./utils/Cmd":"utils/Cmd.ts"}],"utils/Levenshtein.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.distance = distance;

// --- Memoize the intermediate results (a la dynamic programming) ---
function table(a, b) {
  return {
    array: new Array(a * b),
    length: a
  };
}

function get(table, a, b) {
  return table.array[a * table.length + b];
}

function set(table, a, b, value) {
  table.array[a * table.length + b] = value;
} // --- Levenshtein distance ---


function tail(a) {
  return a.substring(1);
}

function distance(a, b) {
  return lev(table(a.length, b.length), a, b);
}
/** This is the function that matches with the definition at:
 * https://en.wikipedia.org/wiki/Levenshtein_distance#Definition
 */


function lev(table, a, b) {
  const [a_, b_] = [a.length, b.length];
  if (b_ === 0) return a_;
  if (a_ === 0) return b_;
  if (a[0] === b[0]) return lev_(table, tail(a), tail(b));
  return 1 + Math.min(lev_(table, tail(a), b), lev_(table, a, tail(b)), lev_(table, tail(a), tail(b)));
}
/** This is the function that memoizes the results in the table
 * to avoid calculating the same result over and over.
 * Mutates the table.
 */


function lev_(table, a, b) {
  const distance = get(table, a.length, b.length);

  if (distance !== undefined) {
    return distance;
  } else {
    const distance_ = lev(table, a, b);
    set(table, a.length, b.length, distance_);
    return distance_;
  }
}
},{}],"utils/vdom/Html.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.node = node;
exports.text = text;
exports.toElement = toElement;
exports.attribute = attribute;
exports.property = property;
exports.on = on;
exports.style = style;
exports.key = key;
exports.toDomAttribute = toDomAttribute;

function node(tagName, attributes, children) {
  return {
    nodeType: "node",
    tagName,
    attributes,
    children
  };
}

function text(text) {
  return {
    nodeType: "text",
    text
  };
}

function toElement(html, dispatch) {
  switch (html.nodeType) {
    case "node":
      const element = document.createElement(html.tagName);

      for (let attribute of html.attributes) toDomAttribute(attribute, dispatch, element);

      for (let child of html.children) element.appendChild(toElement(child, dispatch));

      return element;

    case "text":
      return document.createTextNode(html.text);
  }
}

function attribute(name, value) {
  return {
    tag: "attribute",
    name,
    value
  };
}

function property(name, value) {
  return {
    tag: "property",
    name,
    value
  };
}

function on(eventName, handler) {
  return {
    tag: "eventHandler",
    eventName,
    handler
  };
}

function style(property, value) {
  return {
    tag: "style",
    property,
    value
  };
}

function key(value) {
  return {
    tag: "key",
    value
  };
}

function toDomAttribute(attribute, dispatch, $element) {
  switch (attribute.tag) {
    case "attribute":
      $element.setAttribute(attribute.name, attribute.value);
      return;

    case "property":
      $element[attribute.name] = attribute.value;
      return;

    case "eventHandler":
      $element[`on${attribute.eventName}`] = event => dispatch(attribute.handler(event));

      return;

    case "style":
      $element.style[attribute.property] = attribute.value;
      return;
  }
}
},{}],"utils/Array.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.intersperse = intersperse;
exports.filterMap = filterMap;
exports.groupWhile = groupWhile;
exports.map2 = map2;
exports.decodeJson = decodeJson;

var Maybe = _interopRequireWildcard(require("./Maybe"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function intersperse(array, element) {
  return array.reduce((accum, value) => [...accum, element, value], []).slice(1);
}

function filterMap(array, fn) {
  var _a;

  const newArray = [];
  const l = array.length;

  for (let i = 0; i < l; i++) {
    (_a = fn(array[i])) === null || _a === void 0 ? void 0 : _a.map(x => newArray.push(x));
  }

  return newArray;
}

function groupWhile(array, compare) {
  const length = array.length;

  if (length === 1) {
    return [[array[0]]];
  } else {
    const newArray = [];
    let i = 0;

    while (i < length) {
      const group = [array[i]];
      i = i + 1;

      while (i < length && compare(array[i - 1], array[i])) {
        group.push(array[i]);
        i = i + 1;
      }

      newArray.push(group);
    }

    return newArray;
  }
}

function map2(as, bs, fn) {
  const cs = [];
  const length = Math.min(as.length, bs.length);

  for (let i = 0; i < length; i++) {
    cs.push(fn(as[i], bs[i]));
  }

  return cs;
}

function decodeJson(json, decodeElement) {
  if (json instanceof Array) {
    const decoded = filterMap(json, decodeElement);

    if (json.length === decoded.length) {
      return Maybe.just(decoded);
    }
  }

  return Maybe.nothing();
}
},{"./Maybe":"utils/Maybe.ts"}],"utils/layout/Layout.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toHtml = toHtml;
exports.column = column;
exports.row = row;
exports.space = space;
exports.html = html;
exports.text = text;

var Html = _interopRequireWildcard(require("../vdom/Html"));

var Maybe = _interopRequireWildcard(require("../Maybe"));

var Array = _interopRequireWildcard(require("../Array"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function getSpacing(attribute) {
  if (attribute.attributeType === "spacing") return Maybe.just(attribute.value);else return Maybe.nothing();
}

function toHtmlAttribute(attribute) {
  switch (attribute.attributeType) {
    case "htmlAttribute":
      return Maybe.just(attribute.value);

    case "spacing":
      return Maybe.nothing();

    case "emptyAttribute":
      return Maybe.nothing();
  }
}

function toHtml(layout) {
  var _a;

  switch (layout.layoutType) {
    case "html":
      return layout.html;

    case "layout":
      const spacing = (_a = Array.filterMap(layout.attributes, getSpacing)[0]) !== null && _a !== void 0 ? _a : 0;
      return Html.node(layout.htmlTag, [Html.style("display", "flex"), Html.style("flex-direction", layout.direction), ...Array.filterMap(layout.attributes, toHtmlAttribute)], (() => {
        const childrenToHtml = children => children.map(child => toHtml(child));

        if (spacing !== 0) {
          return childrenToHtml(Array.intersperse(layout.children, space(spacing)));
        } else {
          return childrenToHtml(layout.children);
        }
      })());
  }
}

function column(htmlTag, attributes, children) {
  return {
    layoutType: "layout",
    direction: "column",
    htmlTag,
    attributes,
    children
  };
}

function row(htmlTag, attributes, children) {
  return {
    layoutType: "layout",
    direction: "row",
    htmlTag,
    attributes,
    children
  };
}

function space(size) {
  return html(Html.node("div", [Html.style("width", size + "px"), Html.style("height", size + "px")], []));
}

function html(html) {
  return {
    layoutType: "html",
    html
  };
}

function text(text) {
  return html(Html.text(text));
}
},{"../vdom/Html":"utils/vdom/Html.ts","../Maybe":"utils/Maybe.ts","../Array":"utils/Array.ts"}],"utils/layout/Attribute.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.spacing = spacing;
exports.padding = padding;
exports.paddingXY = paddingXY;
exports.empty = empty;
exports.style = style;
exports.attribute = attribute;
exports.on = on;

var Html = _interopRequireWildcard(require("../vdom/Html"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function spacing(value) {
  return {
    attributeType: "spacing",
    value
  };
}

function padding(value) {
  return style("padding", value + "px");
}

function paddingXY(x, y) {
  return style("padding", `${y}px ${x}px`);
}

function html(value) {
  return {
    attributeType: "htmlAttribute",
    value
  };
}

function empty() {
  return {
    attributeType: "emptyAttribute"
  };
}

function style(cssProperty, value) {
  return html(Html.style(cssProperty, value));
}

function attribute(attributeName, value) {
  return html(Html.attribute(attributeName, value));
}

function on(eventName, handler) {
  return html(Html.on(eventName, handler));
}
},{"../vdom/Html":"utils/vdom/Html.ts"}],"style/Color.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.rgba = rgba;
exports.rgba255 = rgba255;
exports.withAlpha = withAlpha;
exports.hex = hex;
exports.toCssString = toCssString;
exports.decode = decode;
exports.accent = exports.background = exports.violet = exports.white = exports.gray700 = exports.gray600 = exports.gray500 = exports.gray400 = exports.gray200 = exports.gray100 = exports.gray50 = exports.black = void 0;

var Maybe = _interopRequireWildcard(require("../utils/Maybe"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function rgba(r, g, b, a) {
  return {
    tag: "Rgba",
    r,
    g,
    b,
    a
  };
}

function rgba255(r, g, b, a) {
  return {
    tag: "Rgba",
    r: r / 255,
    g: g / 255,
    b: b / 255,
    a
  };
}

function withAlpha(rgba, a) {
  return Object.assign(Object.assign({}, rgba), {
    a
  });
}

function hex(hex) {
  return {
    tag: "Hex",
    hex
  };
}

function toCssString(color) {
  switch (color.tag) {
    case "Rgba":
      return `rgba(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)}, ${color.a})`;

    case "Hex":
      return `#${color.hex}`;
  }
}

function decode(json) {
  if (typeof json === "object" && typeof json.r === "number" && typeof json.g === "number" && typeof json.b === "number" && typeof json.a === "number") return Maybe.just(rgba(json.r, json.g, json.b, json.a));
  if (typeof json === "object" && typeof json.hex === "string") return Maybe.just(hex(json.hex));
  return Maybe.nothing();
}
/** Application colors
 *
 */


const black = hex('000000');
exports.black = black;
const gray50 = hex('0C0C0C');
exports.gray50 = gray50;
const gray100 = hex('141414');
exports.gray100 = gray100;
const gray200 = hex('222222');
exports.gray200 = gray200;
const gray400 = hex('757575');
exports.gray400 = gray400;
const gray500 = hex('929292');
exports.gray500 = gray500;
const gray600 = hex('A1A1A1');
exports.gray600 = gray600;
const gray700 = hex('B1B1B1');
exports.gray700 = gray700;
const white = hex('FFFFFF');
exports.white = white;
const violet = hex('7F8BF8');
exports.violet = violet;
const background = gray100;
exports.background = background;
const accent = violet;
exports.accent = accent;
},{"../utils/Maybe":"utils/Maybe.ts"}],"style/Component.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.textInput = textInput;
exports.textInputCss = textInputCss;
exports.button = button;

var Layout = _interopRequireWildcard(require("../utils/layout/Layout"));

var Attribute = _interopRequireWildcard(require("../utils/layout/Attribute"));

var Color = _interopRequireWildcard(require("./Color"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function textInput(attributes, args) {
  return Layout.column("label", [Attribute.attribute("for", args.id), Attribute.style("width", "100%"), Attribute.style("height", "100%"), Attribute.spacing(14), ...attributes], [args.label, Layout.column("input", [Attribute.attribute("id", args.id), Attribute.attribute("value", args.value), Attribute.style("width", "100%"), Attribute.style("height", "100%"), ...args.attributes], [])]);
}

function textInputCss() {
  return `
    label {
        color: ${Color.toCssString(Color.gray500)};
        font-size: 14px;
        letter-spacing: 0.08em;
        font-weight: 500;
    }
    input {
        background-color: ${Color.toCssString(Color.gray50)};
        color: ${Color.toCssString(Color.white)};
        font-size: 14px;
        letter-spacing: 0.04em;
        font-weight: 300;
        line-height: 38px;
        padding-left: 8px;
        padding-right: 8px;
    }
    input:focus {
        background-color: ${Color.toCssString(Color.black)};
    }`;
}

function button(attributes, args) {
  return Layout.column("button", [Attribute.on("click", args.onClick), ...attributes], [args.label]);
}
},{"../utils/layout/Layout":"utils/layout/Layout.ts","../utils/layout/Attribute":"utils/layout/Attribute.ts","./Color":"style/Color.ts"}],"style/Icon.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.button = button;
exports.play = play;
exports.delete_ = delete_;
exports.options = options;
exports.chevronUp = chevronUp;
exports.chevronDown = chevronDown;

var Color = _interopRequireWildcard(require("./Color"));

var Html = _interopRequireWildcard(require("../utils/vdom/Html"));

var Layout = _interopRequireWildcard(require("../utils/layout/Layout"));

var Attribute = _interopRequireWildcard(require("../utils/layout/Attribute"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function button(attributes, icon) {
  return Layout.column("button", [Attribute.style("width", "16px"), Attribute.style("height", "16px"), Attribute.style("border-radius", "50%"), Attribute.style("align-items", "center"), Attribute.style("justify-content", "center"), Attribute.style("background-color", Color.toCssString(Color.gray100)), ...attributes], [Layout.html(icon)]);
}

function play() {
  return Html.node("img", [Html.attribute("src", "media-play.svg"), Html.attribute("width", "8"), Html.attribute("height", "8")], []);
}

function delete_() {
  return Html.node("img", [Html.attribute("src", "trash.svg"), Html.attribute("width", "8"), Html.attribute("height", "8")], []);
}

function options() {
  return Html.node("img", [Html.attribute("src", "ellipses.svg"), Html.attribute("width", "8"), Html.attribute("height", "8")], []);
}

function chevronUp() {
  return Html.node("img", [Html.attribute("src", "chevron-top.svg"), Html.attribute("width", "8"), Html.attribute("height", "8")], []);
}

function chevronDown() {
  return Html.node("img", [Html.attribute("src", "chevron-bottom.svg"), Html.attribute("width", "8"), Html.attribute("height", "8")], []);
}
},{"./Color":"style/Color.ts","../utils/vdom/Html":"utils/vdom/Html.ts","../utils/layout/Layout":"utils/layout/Layout.ts","../utils/layout/Attribute":"utils/layout/Attribute.ts"}],"utils/Result.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ok = ok;
exports.error = error;
exports.map2 = map2;
exports.andMap = andMap;
exports.toMaybe = toMaybe;
exports.fromMaybe = fromMaybe;
exports.collect = collect;

var Maybe = _interopRequireWildcard(require("./Maybe"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function ok(value) {
  return {
    tag: 'ok',
    value,
    map: fn => ok(fn(value)),
    andThen: fn => fn(value),
    mapError: _ => ok(value),
    withDefault: _ => value,
    match: (fn, _) => fn(value)
  };
}

function error(err) {
  return {
    tag: 'error',
    error: err,
    map: _ => error(err),
    andThen: _ => error(err),
    mapError: fn => error(fn(err)),
    withDefault: default_ => default_,
    match: (_, fn) => fn(err)
  };
}

function map2(resultA, resultB, fn) {
  return resultA.andThen(a => resultB.map(b => fn(a, b)));
}

function andMap(wrappedFunction, wrappedValue) {
  if (wrappedFunction.tag === 'ok') {
    return wrappedValue.tag === 'ok' ? ok(wrappedFunction.value(wrappedValue.value)) : error(wrappedValue.error);
  }

  return error(wrappedFunction.error);
}

function toMaybe(result) {
  return result.tag === 'ok' ? Maybe.just(result.value) : Maybe.nothing();
}

function fromMaybe(err, maybe) {
  return maybe.map(a => ok(a)).withDefault(error(err));
}

function collect(array) {
  return array.reduce((previousValue, currentValue) => map2(previousValue, currentValue, (array, element) => [...array, element]), ok([]));
}
},{"./Maybe":"utils/Maybe.ts"}],"utils/Pair.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.pair = pair;
exports.first = first;
exports.second = second;

function pair(a, b) {
  return [a, b];
}

function first(pair) {
  return pair[0];
}

function second(pair) {
  return pair[1];
}
},{}],"utils/decoder/Decoder.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.decode = decode;
exports.literal = literal;
exports.array = array;
exports.property = property;
exports.index = index;
exports.oneOf = oneOf;
exports.errorToString = errorToString;
exports.map = map;
exports.map2 = map2;
exports.andThen = andThen;
exports.map3 = map3;
exports.map4 = map4;
exports.map5 = map5;
exports.map6 = map6;
exports.map7 = map7;
exports.map8 = map8;
exports.map9 = map9;
exports.succeed = succeed;
exports.fail = fail;
exports.maybe = maybe;
exports.null_ = exports.number = exports.boolean = exports.string = void 0;

var Result = _interopRequireWildcard(require("../Result"));

var Maybe = _interopRequireWildcard(require("../Maybe"));

var Pair = _interopRequireWildcard(require("../Pair"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function decode(a, decoder) {
  return decoder.decoder(a);
}

function decoder(decoder) {
  return {
    tag: 'Decoder',
    decoder
  };
}

const string = decoder(a => typeof a === 'string' ? Result.ok(a) : Result.error({
  tag: 'expectingString'
}));
exports.string = string;
const boolean = decoder(a => typeof a === 'boolean' ? Result.ok(a) : Result.error({
  tag: 'expectingBoolean'
}));
exports.boolean = boolean;
const number = decoder(a => typeof a === 'number' ? Result.ok(a) : Result.error({
  tag: 'expectingNumber'
}));
exports.number = number;

function literal(literal) {
  return decoder(a => a === literal ? Result.ok(literal) : Result.error({
    tag: 'expectingLiteral',
    literal
  }));
}

const null_ = literal(null);
exports.null_ = null_;

function array(elementDecoder) {
  return decoder(as => as instanceof Array ? Result.collect(as.map((a, index) => decode(a, elementDecoder).mapError(error => ({
    tag: 'atArrayIndex',
    index,
    error
  })))) : Result.error({
    tag: 'expectingArray'
  }));
}

function property(propertyName, propertyDecoder) {
  return decoder(a => typeof a === 'object' && a !== null ? decode(a[propertyName], propertyDecoder).mapError(error => ({
    tag: 'atObjectProperty',
    propertyName,
    error
  })) : Result.error({
    tag: 'expectingObject'
  }));
}

function index(index, elementDecoder) {
  return decoder(as => as instanceof Array ? decode(as[index], elementDecoder).mapError(error => ({
    tag: 'atArrayIndex',
    index,
    error
  })) : Result.error({
    tag: 'expectingArray'
  }));
}

function oneOf(decoder_, ...decoders) {
  return decoder(a => decoders.reduce((previousResult, currentDecoder) => previousResult.match(a => Result.ok(a), _ => decode(a, currentDecoder)), decode(a, decoder_)));
}

function errorToString(error) {
  switch (error.tag) {
    case 'expectingString':
      return 'Expecting a string';

    case 'expectingBoolean':
      return 'Expecting a boolean';

    case 'expectingNumber':
      return 'Expecting a number';

    case 'expectingLiteral':
      return `Expecting the literal value '${error.literal}'`;

    case 'expectingArray':
      return 'Expecting an array';

    case 'atArrayIndex':
      return `${errorToString(error.error)} at array index ${error.index}`;

    case 'expectingObject':
      return 'Expecting an object';

    case 'atObjectProperty':
      return `${errorToString(error.error)} at object property '${error.propertyName}'`;

    case 'message':
      return error.message;
  }
}

function map(decoder_, mapFunction) {
  return decoder(x => decode(x, decoder_).map(mapFunction));
}

function map2(decoderA, decoderB, mapFunction) {
  return decoder(x => Result.map2(decode(x, decoderA), decode(x, decoderB), mapFunction));
}

function andThen(decoder_, func) {
  return decoder(x => decode(x, decoder_).andThen(a => decode(x, func(a))));
}

function map3(decoderA, decoderB, decoderC, mapFunction) {
  return map2(decoderA, map2(decoderB, decoderC, Pair.pair), (a, [b, c]) => mapFunction(a, b, c));
}

function map4(decoderA, decoderB, decoderC, decoderD, mapFunction) {
  return map3(decoderA, decoderB, map2(decoderC, decoderD, Pair.pair), (a, b, [c, d]) => mapFunction(a, b, c, d));
}

function map5(decoderA, decoderB, decoderC, decoderD, decoderE, mapFunction) {
  return map4(decoderA, decoderB, decoderC, map2(decoderD, decoderE, Pair.pair), (a, b, c, [d, e]) => mapFunction(a, b, c, d, e));
}

function map6(decoderA, decoderB, decoderC, decoderD, decoderE, decoderF, mapFunction) {
  return map5(decoderA, decoderB, decoderC, decoderD, map2(decoderE, decoderF, Pair.pair), (a, b, c, d, [e, f]) => mapFunction(a, b, c, d, e, f));
}

function map7(decoderA, decoderB, decoderC, decoderD, decoderE, decoderF, decoderG, mapFunction) {
  return map6(decoderA, decoderB, decoderC, decoderD, decoderE, map2(decoderF, decoderG, Pair.pair), (a, b, c, d, e, [f, g]) => mapFunction(a, b, c, d, e, f, g));
}

function map8(decoderA, decoderB, decoderC, decoderD, decoderE, decoderF, decoderG, decoderH, mapFunction) {
  return map7(decoderA, decoderB, decoderC, decoderD, decoderE, decoderF, map2(decoderG, decoderH, Pair.pair), (a, b, c, d, e, f, [g, h]) => mapFunction(a, b, c, d, e, f, g, h));
}

function map9(decoderA, decoderB, decoderC, decoderD, decoderE, decoderF, decoderG, decoderH, decoderI, mapFunction) {
  return map8(decoderA, decoderB, decoderC, decoderD, decoderE, decoderF, decoderG, map2(decoderH, decoderI, Pair.pair), (a, b, c, d, e, f, g, [h, i]) => mapFunction(a, b, c, d, e, f, g, h, i));
}

function succeed(a) {
  return decoder(_ => Result.ok(a));
}

function fail(message) {
  return decoder(_ => Result.error({
    tag: 'message',
    message
  }));
}

function maybe(decoder_) {
  return oneOf(map(property('tag', literal('nothing')), _ => Maybe.nothing()), map2(property('tag', literal('just')), property('value', decoder_), (_, value) => Maybe.just(value)));
}
},{"../Result":"utils/Result.ts","../Maybe":"utils/Maybe.ts","../Pair":"utils/Pair.ts"}],"utils/Time.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.time = time;
exports.fromString = fromString;
exports.compare = compare;
exports.toString = toString;
exports.difference = difference;
exports.fromJavascriptDate = fromJavascriptDate;
exports.decoder = void 0;

var Maybe = _interopRequireWildcard(require("./Maybe"));

var Decoder = _interopRequireWildcard(require("./decoder/Decoder"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function time(hours, minutes) {
  return {
    hours: Math.min(Math.max(0, Math.floor(hours)), 23),
    minutes: Math.min(Math.max(0, Math.floor(minutes)), 59)
  };
}

function fromString(input) {
  const matches = input.match(/(\d\d?)[:\- ]*(\d\d?)?/);
  var hours = Maybe.nothing();
  var minutes = Maybe.nothing();

  if (matches !== null) {
    if (matches[1] !== undefined) {
      var hours_ = Number(matches[1]);

      if (!Number.isNaN(hours_) && hours_ < 24) {
        hours = Maybe.just(hours_);
        minutes = Maybe.just(0);
      }
    }

    if (matches[2] !== undefined) {
      var minutes_ = Number(matches[2]);

      if (!Number.isNaN(minutes_) && minutes_ < 60) {
        minutes = Maybe.just(minutes_);
      }
    }
  }

  return Maybe.map2(time, hours, minutes);
}

function compare(a, b) {
  return a.hours < b.hours || a.hours == b.hours && a.minutes < b.minutes ? -1 : a.hours == b.hours && a.minutes == b.minutes ? 0 : 1;
}

function pad(n) {
  return n < 10 ? `0${n}` : `${n}`;
}

function toString(time) {
  return `${pad(time.hours)}:${pad(time.minutes)}`;
}
/** Minutos negativos se convierten en el tiempo 00:00 */


function fromMinutes(minutes) {
  return time(minutes / 60, minutes % 60);
}

function toMinutes(time) {
  return time.hours * 60 + time.minutes;
}

function difference(a, b) {
  return fromMinutes(Math.abs(toMinutes(a) - toMinutes(b)));
}

const decoder = Decoder.map2(Decoder.property('hours', Decoder.number), Decoder.property('minutes', Decoder.number), time);
exports.decoder = decoder;

function fromJavascriptDate(date) {
  return time(date.getHours(), date.getMinutes());
}
},{"./Maybe":"utils/Maybe.ts","./decoder/Decoder":"utils/decoder/Decoder.ts"}],"utils/Date.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.date = date;
exports.toJavascriptDate = toJavascriptDate;
exports.groupToSpanishLabel = groupToSpanishLabel;
exports.groupOf = groupOf;
exports.weekdayToSpanishLabel = weekdayToSpanishLabel;
exports.dayTag = dayTag;
exports.dayTagToSpanishLabel = dayTagToSpanishLabel;
exports.decoder = void 0;

var Decoder = _interopRequireWildcard(require("./decoder/Decoder"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function date(year, month, day) {
  return {
    year: Math.min(Math.max(1990, Math.floor(year)), 2100),
    month: monthOf(month),
    day: Math.min(Math.max(1, Math.floor(day)), 31)
  };
}

function monthOf(number) {
  return Math.min(Math.max(1, Math.floor(number)), 12);
}

function toJavascriptDate(date) {
  return new window.Date(date.year, date.month - 1, date.day);
}

function groupToSpanishLabel(group) {
  switch (group.tag) {
    case "inTheFuture":
      return "En el futuro";

    case "nextWeek":
      return "La semana que viene";

    case "thisWeek":
      return "Esta semana";

    case "lastWeek":
      return "La semana pasada";

    case "weeksAgo":
      return `Hace ${group.x} semanas`;

    case "lastMonth":
      return "El mes pasado";

    case "month":
      return monthToSpanishLabel(group.month);

    case "lastYear":
      return "El año pasado";

    case "year":
      return String(group.year);

    default:
      const _ = group;
      return "Nunca";
  }
}

function monthToSpanishLabel(month) {
  switch (month) {
    case 1:
      return "Enero";

    case 2:
      return "Febrero";

    case 3:
      return "Marzo";

    case 4:
      return "Abril";

    case 5:
      return "Mayo";

    case 6:
      return "Junio";

    case 7:
      return "Julio";

    case 8:
      return "Agosto";

    case 9:
      return "Septiembre";

    case 10:
      return "Octubre";

    case 11:
      return "Noviembre";

    case 12:
      return "Diciembre";
  }
}

function groupOf(args) {
  const {
    today,
    time
  } = args;

  if (time.year > today.year) {
    return {
      tag: "inTheFuture"
    };
  } else if (time.year === today.year) {
    return groupSameYear(today, time);
  } else if (time.year === today.year - 1) {
    return {
      tag: "lastYear"
    };
  } else {
    return {
      tag: "year",
      year: time.year
    };
  }
}

function groupSameYear(today, time) {
  if (time.month > today.month) {
    if (isoWeek(time) === isoWeek(today) + 1) {
      return {
        tag: "nextWeek"
      };
    } else {
      return {
        tag: "inTheFuture"
      };
    }
  } else if (time.month === today.month) {
    if (isoWeek(time) === isoWeek(today) + 1) {
      return {
        tag: "nextWeek"
      };
    } else if (isoWeek(time) === isoWeek(today)) {
      return {
        tag: "thisWeek"
      };
    } else if (isoWeek(time) === isoWeek(today) - 1) {
      return {
        tag: "lastWeek"
      };
    } else {
      return {
        tag: "weeksAgo",
        x: isoWeek(today) - isoWeek(time)
      };
    }
  } else if (time.month === today.month - 1) {
    return {
      tag: "lastMonth"
    };
  } else {
    return {
      tag: "month",
      month: time.month
    };
  }
} // https://weeknumber.net/how-to/javascript
// Returns the ISO week of the date.


function isoWeek(x) {
  var date = toJavascriptDate(x); // Thursday in current week decides the year.

  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7); // January 4 is always in week 1.

  var week1 = new window.Date(date.getFullYear(), 0, 4); // Adjust to Thursday in week 1 and count number of weeks from date to week1.

  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

function weekdayToSpanishLabel(weekday) {
  return weekday;
}

function weekdayFromDate(date) {
  switch (toJavascriptDate(date).getDay()) {
    case 0:
      return "Domingo";

    case 1:
      return "Lunes";

    case 2:
      return "Martes";

    case 3:
      return "Miércoles";

    case 4:
      return "Jueves";

    case 5:
      return "Viernes";

    default:
      return "Sábado";
  }
}

function dayTag(args) {
  const {
    today,
    time
  } = args;

  if (time.year !== today.year) {
    return {
      tag: "distantDate",
      weekday: weekdayFromDate(time),
      day: time.day,
      month: time.month,
      year: time.year
    };
  } else if (time.month === today.month) {
    if (time.day === today.day - 1) {
      return {
        tag: "yesterday"
      };
    } else if (time.day === today.day) {
      return {
        tag: "today"
      };
    } else if (time.day === today.day + 1) {
      return {
        tag: "tomorrow"
      };
    } else if (time.day < today.day && isoWeek(time) === isoWeek(today)) {
      return {
        tag: "earlierThisWeek",
        weekday: weekdayFromDate(time)
      };
    } else {
      return {
        tag: "thisYearsDate",
        weekday: weekdayFromDate(time),
        day: time.day,
        month: time.month
      };
    }
  } else {
    return {
      tag: "thisYearsDate",
      weekday: weekdayFromDate(time),
      day: time.day,
      month: time.month
    };
  }
}

function dayTagToSpanishLabel(day) {
  switch (day.tag) {
    case "distantDate":
      return `${weekdayToSpanishLabel(day.weekday)} ${day.day} de ` + `${monthToSpanishLabel(day.month)}, ${day.year}`;

    case "thisYearsDate":
      return `${weekdayToSpanishLabel(day.weekday)} ${day.day} de ` + `${monthToSpanishLabel(day.month)}`;

    case "earlierThisWeek":
      return weekdayToSpanishLabel(day.weekday);

    case "today":
      return "Hoy";

    case "tomorrow":
      return "Mañana";

    case "yesterday":
      return "Ayer";
  }
}

const decoder = Decoder.map3(Decoder.property('year', Decoder.number), Decoder.property('month', Decoder.number), Decoder.property('day', Decoder.number), date);
exports.decoder = decoder;
},{"./decoder/Decoder":"utils/decoder/Decoder.ts"}],"Record.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.id = id;
exports.idEquals = idEquals;
exports.record = record;
exports.hasId = hasId;
exports.withDescription = withDescription;
exports.withTask = withTask;
exports.withStart = withStart;
exports.withEnd = withEnd;
exports.compare = compare;
exports.save = save;
exports.view = view;
exports.mapWithId = mapWithId;
exports.deleteWithId = deleteWithId;
exports.search = search;
exports.recordCss = recordCss;
exports.decoder = exports.idDecoder = void 0;

var Update = _interopRequireWildcard(require("./Update"));

var Levenshtein = _interopRequireWildcard(require("./utils/Levenshtein"));

var Input = _interopRequireWildcard(require("./Input"));

var Layout = _interopRequireWildcard(require("./utils/layout/Layout"));

var Component = _interopRequireWildcard(require("./style/Component"));

var Icon = _interopRequireWildcard(require("./style/Icon"));

var Color = _interopRequireWildcard(require("./style/Color"));

var Attribute = _interopRequireWildcard(require("./utils/layout/Attribute"));

var Decoder = _interopRequireWildcard(require("./utils/decoder/Decoder"));

var Time = _interopRequireWildcard(require("./utils/Time"));

var Date = _interopRequireWildcard(require("./utils/Date"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function id(id) {
  return {
    tag: "recordId",
    id
  };
}

function idEquals(a, b) {
  return a.id === b.id;
}

function record(id, description, start, end, taskInput, date) {
  return {
    id,
    description,
    startInput: Time.toString(start),
    startTime: start,
    endInput: Time.toString(end),
    endTime: end,
    taskInput,
    date
  };
}

function hasId(id, record) {
  return idEquals(id, record.id);
}

function withDescription(description, record) {
  return Object.assign(Object.assign({}, record), {
    description
  });
}

function withTask(taskInput, record) {
  return Object.assign(Object.assign({}, record), {
    taskInput
  });
}

function withStart(startInput, record) {
  return Object.assign(Object.assign({}, record), {
    startInput,
    startTime: Time.fromString(startInput).withDefault(record.startTime)
  });
}

function withEnd(endInput, record) {
  return Object.assign(Object.assign({}, record), {
    endInput,
    endTime: Time.fromString(endInput).withDefault(record.endTime)
  });
}

function compare(a, b) {
  return Time.compare(a.startTime, b.startTime);
}
/** If a date is mispelled or the task is invalid, reset the input value to the last valid value. */


function save(record, today) {
  return Object.assign(Object.assign(Object.assign({
    id: record.id,
    description: record.description
  }, Time.fromString(record.startInput).map(startTime => ({
    startTime,
    startInput: record.startInput
  })).withDefault({
    startTime: record.startTime,
    startInput: Time.toString(record.startTime)
  })), Time.fromString(record.endInput).map(endTime => ({
    endTime,
    endInput: record.endInput
  })).withDefault({
    endTime: record.endTime,
    endInput: Time.toString(record.endTime)
  })), {
    taskInput: record.taskInput,
    date: today
  });
}

function view(record) {
  const input = inputName => Input.record(record, inputName);

  return Layout.row("div", [Attribute.attribute("class", "parent"), Attribute.spacing(18)], [Component.textInput([Attribute.style("flex-basis", "40%")], {
    id: `record_${record.id}_description`,
    label: Layout.column("div", [Attribute.paddingXY(8, 0)], [Layout.text('Descripción')]),
    value: record.description,
    attributes: [Attribute.on("input", event => {
      var _a;

      return Update.onInput(input("description"), ((_a = event === null || event === void 0 ? void 0 : event.target) === null || _a === void 0 ? void 0 : _a.value) || "");
    })]
  }), Component.textInput([Attribute.style("flex-basis", "20%")], {
    id: `record_${record.id}_task`,
    label: Layout.column("div", [Attribute.paddingXY(8, 0)], [Layout.text('Tarea')]),
    value: record.taskInput,
    attributes: [Attribute.on("input", event => {
      var _a;

      return Update.onInput(input("task"), ((_a = event === null || event === void 0 ? void 0 : event.target) === null || _a === void 0 ? void 0 : _a.value) || "");
    })]
  }), Component.textInput([Attribute.style("flex-basis", "10%"), Attribute.style("text-align", "right")], {
    id: `record_${record.id}_start`,
    label: Layout.column("div", [Attribute.paddingXY(8, 0)], [Layout.text('Inicio')]),
    value: record.startInput,
    attributes: [Attribute.on("input", event => {
      var _a;

      return Update.onInput(input("startTime"), ((_a = event === null || event === void 0 ? void 0 : event.target) === null || _a === void 0 ? void 0 : _a.value) || "");
    })]
  }), Component.textInput([Attribute.style("flex-basis", "10%"), Attribute.style("text-align", "right")], {
    id: `record_${record.id}_end`,
    label: Layout.column("div", [Attribute.paddingXY(8, 0)], [Layout.text('Fin')]),
    value: record.endInput,
    attributes: [Attribute.on("input", event => {
      var _a;

      return Update.onInput(input("endTime"), ((_a = event === null || event === void 0 ? void 0 : event.target) === null || _a === void 0 ? void 0 : _a.value) || "");
    })]
  }), Component.textInput([Attribute.style("flex-basis", "10%"), Attribute.style("text-align", "right")], {
    id: `record_${record.id}_duration`,
    label: Layout.column("div", [Attribute.paddingXY(8, 0)], [Layout.text('Duración')]),
    value: Time.toString(Time.difference(record.endTime, record.startTime)),
    attributes: []
  }), Layout.column("div", [Attribute.attribute("class", "parent-hover-makes-visible"), Attribute.style("width", "16px"), Attribute.spacing(8), Attribute.style("color", Color.toCssString(Color.gray500)), Attribute.style("justify-content", "flex-end")], [Icon.button([//Attribute.on("click", (_) => Update.clickedButton(Button.resumeRecord(record.id))),
  ], Icon.play()), Icon.button([//Attribute.on("click", (_) => Update.clickedButton(Button.deleteRecord(record.id))),
  ], Icon.delete_()), Icon.button([//Attribute.on("click", (_) => Update.clickedButton(Button.deleteRecord(record.id))),
  ], Icon.options())])]);
}

function mapWithId(records, id, fn) {
  return records.map(record => hasId(id, record) ? fn(record) : record);
}

function deleteWithId(records, id) {
  return records.filter(record => !hasId(id, record));
}

const idDecoder = Decoder.map2(Decoder.property('tag', Decoder.literal('recordId')), Decoder.property('id', Decoder.number), (_, x) => id(x));
exports.idDecoder = idDecoder;
const decoder = Decoder.map8(Decoder.property('id', idDecoder), Decoder.property('description', Decoder.string), Decoder.property('startInput', Decoder.string), Decoder.property('startTime', Time.decoder), Decoder.property('endInput', Decoder.string), Decoder.property('endTime', Time.decoder), Decoder.property('taskInput', Decoder.string), Decoder.property('date', Date.decoder), (id, description, startInput, startTime, endInput, endTime, taskInput, date) => ({
  id,
  description,
  startInput,
  startTime,
  endInput,
  endTime,
  taskInput,
  date
}));
exports.decoder = decoder;

function search(query, records) {
  if (query === "") return [];else return records.map(record => [record, Levenshtein.distance(query.toLowerCase(), record.description.toLowerCase())]).sort((a, b) => {
    const [recordA, distanceA] = a;
    const [recordB, distanceB] = b;
    return distanceA - distanceB;
  }).map(([record, _]) => record);
}

function recordCss() {
  return `

.parent > .parent-hover-makes-visible {
    opacity: 0%;
    transition: opacity 0.2s ease-out;
}

.parent:hover > .parent-hover-makes-visible {
    opacity: 100%;
}

`;
}
},{"./Update":"Update.ts","./utils/Levenshtein":"utils/Levenshtein.ts","./Input":"Input.ts","./utils/layout/Layout":"utils/layout/Layout.ts","./style/Component":"style/Component.ts","./style/Icon":"style/Icon.ts","./style/Color":"style/Color.ts","./utils/layout/Attribute":"utils/layout/Attribute.ts","./utils/decoder/Decoder":"utils/decoder/Decoder.ts","./utils/Time":"utils/Time.ts","./utils/Date":"utils/Date.ts"}],"Input.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.record = record;
exports.createRecord = createRecord;
exports.equals = equals;
exports.toStringId = toStringId;

var Record = _interopRequireWildcard(require("./Record"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function record(record, name) {
  return {
    tag: "record",
    id: record.id,
    name
  };
}

function createRecord(name) {
  return {
    tag: "createRecord",
    name
  };
}

function equals(a, b) {
  if (a.tag === "createRecord" && b.tag === "createRecord") {
    return a.name === b.name;
  }

  if (a.tag === "record" && b.tag === "record") {
    return Record.idEquals(a.id, b.id) && a.name === b.name;
  }

  return false;
}

function toStringId(input) {
  switch (input.tag) {
    case "createRecord":
      return `createRecord-${input.name}`;

    case "record":
      return `record-${input.id.id}-${input.name}`;
  }
}
},{"./Record":"Record.ts"}],"Button.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.stop = stop;
exports.play = play;
exports.deleteRecord = deleteRecord;
exports.resumeRecord = resumeRecord;

function stop() {
  return {
    tag: "stop"
  };
}

function play() {
  return {
    tag: "play"
  };
}

function deleteRecord(recordId) {
  return {
    tag: "deleteRecord",
    recordId
  };
}

function resumeRecord(recordId) {
  return {
    tag: "resumeRecord",
    recordId
  };
}
},{}],"CreateRecord.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.start = start;
exports.empty = empty;
exports.withStart = withStart;
exports.withTask = withTask;
exports.withStartInput = withStartInput;
exports.sanitizeInputs = sanitizeInputs;
exports.toRecord = toRecord;
exports.view = view;
exports.resumeRecord = resumeRecord;
exports.decoder = void 0;

var Input = _interopRequireWildcard(require("./Input"));

var Record = _interopRequireWildcard(require("./Record"));

var Button = _interopRequireWildcard(require("./Button"));

var Update = _interopRequireWildcard(require("./Update"));

var Maybe = _interopRequireWildcard(require("./utils/Maybe"));

var Result = _interopRequireWildcard(require("./utils/Result"));

var Date = _interopRequireWildcard(require("./utils/Date"));

var Time = _interopRequireWildcard(require("./utils/Time"));

var Html = _interopRequireWildcard(require("./utils/vdom/Html"));

var Decoder = _interopRequireWildcard(require("./utils/decoder/Decoder"));

var Layout = _interopRequireWildcard(require("./utils/layout/Layout"));

var Attribute = _interopRequireWildcard(require("./utils/layout/Attribute"));

var Component = _interopRequireWildcard(require("./style/Component"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function start(time, date) {
  return {
    input: Time.toString(time),
    time,
    date
  };
}

function empty(descriptionInputValue) {
  return {
    descriptionInput: descriptionInputValue,
    taskInput: '',
    start: Maybe.nothing()
  };
}

function withStart(time, date, createRecord) {
  return Object.assign(Object.assign({}, createRecord), {
    start: Maybe.just(start(time, date))
  });
}

function withTask(taskInputValue, createRecord) {
  return Object.assign(Object.assign({}, createRecord), {
    taskInput: taskInputValue
  });
}

function withStartInput(startInputValue, createRecord) {
  return Time.fromString(startInputValue).map(newStartTime => Object.assign(Object.assign({}, createRecord), {
    start: createRecord.start.map(s => start(newStartTime, s.date))
  })).withDefault(createRecord);
}

function sanitizeInputs(createRecord) {
  return Object.assign(Object.assign({}, createRecord), {
    start: createRecord.start.map(s => start(s.time, s.date))
  });
}

const emptyDescription = {
  tag: 'emptyDescription'
};
const emptyTask = {
  tag: 'emptyTask'
};
const emptyBoth = {
  tag: 'emptyBoth'
};

function hasEmptyDescription(createRecord) {
  return createRecord.descriptionInput.trim() === '';
}

function hasEmptyTask(createRecord) {
  return createRecord.taskInput.trim() === '';
}

function getError(createRecord) {
  if (hasEmptyDescription(createRecord) && hasEmptyTask(createRecord)) {
    return Maybe.just(emptyBoth);
  }

  if (hasEmptyDescription(createRecord)) {
    return Maybe.just(emptyDescription);
  }

  if (hasEmptyTask(createRecord)) {
    return Maybe.just(emptyTask);
  }

  return Maybe.nothing();
}

function toRecord(recordId, endTime, endDate, createRecord) {
  return getError(createRecord).map(x => Result.error(x)).withDefault(Result.ok(Record.record(recordId, createRecord.descriptionInput, createRecord.start.map(({
    time
  }) => time).withDefault(endTime), endTime, createRecord.taskInput, createRecord.start.map(({
    date
  }) => date).withDefault(endDate))));
}

function view(attributes, args) {
  const redBorder = Attribute.style("borderColor", "red");
  const descriptionInput = Input.createRecord("description");
  const taskInput = Input.createRecord("task");
  return Layout.row("div", attributes, [Component.textInput([], {
    id: "createRecord-description",
    label: Layout.text("Descripción"),
    value: args.createRecord.descriptionInput,
    attributes: [(() => {
      if (hasEmptyDescription(args.createRecord)) {
        return redBorder;
      } else {
        return Attribute.empty();
      }
    })(), Attribute.on("change", event => {
      var _a;

      return Update.onInput(descriptionInput, ((_a = event === null || event === void 0 ? void 0 : event.target) === null || _a === void 0 ? void 0 : _a.value) || "");
    })]
  }), Component.textInput([], {
    id: "createRecord-task",
    label: Layout.text("Tarea"),
    value: args.createRecord.taskInput,
    attributes: [(() => {
      if (hasEmptyTask(args.createRecord)) {
        return redBorder;
      } else {
        return Attribute.empty();
      }
    })()]
  }), ...args.createRecord.start.map(({
    input
  }) => [Component.textInput([], {
    id: "create-record-start-time",
    label: Layout.text("Start time"),
    value: input,
    attributes: [Attribute.on("input", event => {
      var _a;

      return Update.onInput(Input.createRecord("startTime"), ((_a = event === null || event === void 0 ? void 0 : event.target) === null || _a === void 0 ? void 0 : _a.value) || "");
    })]
  }), Layout.html(Html.node("button", [Html.on("click", event => Update.clickedButton(Button.stop()))], [Html.text("Parar")]))]).withDefault([Layout.html(Html.node("button", [Html.on("click", _ => Update.clickedButton(Button.play()))], [Html.text("Empezar")]))])]);
}

const decoder = Decoder.map3(Decoder.property('descriptionInput', Decoder.string), Decoder.property('taskInput', Decoder.string), Decoder.property('start', Decoder.maybe(Decoder.map2(Decoder.property('time', Time.decoder), Decoder.property('date', Date.decoder), start))), (descriptionInput, taskInput, start) => ({
  descriptionInput,
  taskInput,
  start
}));
exports.decoder = decoder;

function resumeRecord(now, today, record) {
  return {
    descriptionInput: record.description,
    taskInput: record.taskInput,
    start: Maybe.just(start(now, today))
  };
}
},{"./Input":"Input.ts","./Record":"Record.ts","./Button":"Button.ts","./Update":"Update.ts","./utils/Maybe":"utils/Maybe.ts","./utils/Result":"utils/Result.ts","./utils/Date":"utils/Date.ts","./utils/Time":"utils/Time.ts","./utils/vdom/Html":"utils/vdom/Html.ts","./utils/decoder/Decoder":"utils/decoder/Decoder.ts","./utils/layout/Layout":"utils/layout/Layout.ts","./utils/layout/Attribute":"utils/layout/Attribute.ts","./style/Component":"style/Component.ts"}],"State.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.initialState = initialState;
exports.decoder = decoder;

var CreateRecord = _interopRequireWildcard(require("./CreateRecord"));

var Record = _interopRequireWildcard(require("./Record"));

var Effect = _interopRequireWildcard(require("./utils/Cmd"));

var Decoder = _interopRequireWildcard(require("./utils/decoder/Decoder"));

var Time = _interopRequireWildcard(require("./utils/Time"));

var Date = _interopRequireWildcard(require("./utils/Date"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function initialState(flags, today) {
  try {
    return [Decoder.decode(flags && JSON.parse(flags), decoder(today)).withDefault(initialUnsavedState(today)), Effect.none()];
  } catch (e) {
    return [initialUnsavedState(today), Effect.none()];
  }
}

function initialUnsavedState(today) {
  return {
    createRecord: CreateRecord.empty(""),
    records: [Record.record(Record.id(0), "Login", Time.time(22, 54), Time.time(23, 25), "Inweb", Date.date(21, 4, 2021)), Record.record(Record.id(1), "Login", Time.time(7, 15), Time.time(10, 49), "Inweb", Date.date(22, 4, 2021)), Record.record(Record.id(2), "Login", Time.time(14, 37), Time.time(17, 53), "Inweb", Date.date(22, 4, 2021))],
    today
  };
}

function decoder(today) {
  return Decoder.map2(Decoder.property('records', Decoder.array(Record.decoder)), Decoder.property('createRecord', CreateRecord.decoder), (records, createRecord) => ({
    records,
    createRecord,
    today
  }));
}
},{"./CreateRecord":"CreateRecord.ts","./Record":"Record.ts","./utils/Cmd":"utils/Cmd.ts","./utils/decoder/Decoder":"utils/decoder/Decoder.ts","./utils/Time":"utils/Time.ts","./utils/Date":"utils/Date.ts"}],"utils/Utils.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.upperCaseFirst = upperCaseFirst;
exports.assertNever = assertNever;
exports.equals = equals;
exports.compareStrings = compareStrings;

var Array_ = _interopRequireWildcard(require("./Array"));

var Pair = _interopRequireWildcard(require("./Pair"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function upperCaseFirst(string) {
  return string[0].toUpperCase() + string.substring(1);
}

function assertNever(never) {
  console.warn(`Value of tipe never`, never);
}

function equals(a, b) {
  if (a instanceof Array && b instanceof Array) {
    return a.every((x, i) => equals(x, b[i]));
  }

  if (typeof a === "object" && typeof b === "object") {
    if (a === null || b === null) {
      return a === b;
    } else {
      const aEntries = Object.entries(a);
      const bEntries = Object.entries(b);

      const sortFunction = (a, b) => compareStrings(Pair.first(a), Pair.first(b));

      return aEntries.length === bEntries.length && Array_.map2(aEntries.sort(sortFunction), bEntries.sort(sortFunction), ([aKey, aValue], [bKey, bValue]) => aKey === bKey && equals(aValue, bValue)).every(x => x);
    }
  }

  return a === b;
}

function compareStrings(a, b) {
  if (a < b) return -1;else if (a === b) return 0;else return 1;
}
},{"./Array":"utils/Array.ts","./Pair":"utils/Pair.ts"}],"Records.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.view = view;

var Record = _interopRequireWildcard(require("./Record"));

var Date = _interopRequireWildcard(require("./utils/Date"));

var Utils = _interopRequireWildcard(require("./utils/Utils"));

var Array_ = _interopRequireWildcard(require("./utils/Array"));

var Layout = _interopRequireWildcard(require("./utils/layout/Layout"));

var Attribute = _interopRequireWildcard(require("./utils/layout/Attribute"));

var Icon = _interopRequireWildcard(require("./style/Icon"));

var Color = _interopRequireWildcard(require("./style/Color"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function view(records, today) {
  return Layout.column("div", [Attribute.spacing(50)], Array_.groupWhile(records.sort(Record.compare), (a, b) => Utils.equals(Date.groupOf({
    today,
    time: a.date
  }), Date.groupOf({
    today,
    time: b.date
  }))).map(group => viewRecordGroup(group, today)));
}

function viewRecordGroup(group, today) {
  return Layout.column("div", [Attribute.spacing(20)], [Layout.row("div", [Attribute.style("color", Color.toCssString(Color.gray400)), Attribute.style("font-size", "14px"), Attribute.style("align-items", "baseline"), Attribute.spacing(18)], [Layout.column("div", [Attribute.style("flex-grow", "1"), Attribute.style("height", "1px"), Attribute.style("margin-left", "8px"), Attribute.style("background-color", Color.toCssString(Color.gray200))], []), Layout.column("div", [Attribute.style("white-space", "nowrap")], [Layout.text(Date.groupToSpanishLabel(Date.groupOf({
    today,
    time: group[0].date
  })))]), Layout.column("div", [Attribute.style("flex-grow", "1"), Attribute.style("height", "1px"), Attribute.style("background-color", Color.toCssString(Color.gray200))], []), Icon.button([Attribute.style("transform", `translateY(3px)`)], Icon.chevronDown())]), Layout.column("div", [Attribute.spacing(55)], Array_.groupWhile(group, (a, b) => Utils.equals(Date.dayTag({
    today,
    time: a.date
  }), Date.dayTag({
    today,
    time: b.date
  }))).map(day => viewRecordDay(day, today)))]);
}

function viewRecordDay(day, today) {
  return Layout.column("div", [Attribute.spacing(20)], [Layout.column("div", [Attribute.style("color", Color.toCssString(Color.accent)), Attribute.style("font-size", "12px"), Attribute.style("letter-spacing", "0.15em"), Attribute.paddingXY(8, 0)], [Layout.text(Date.dayTagToSpanishLabel(Date.dayTag({
    today,
    time: day[0].date
  })).toUpperCase())]), Layout.column("div", [Attribute.spacing(55)], day.map(Record.view))]);
}
},{"./Record":"Record.ts","./utils/Date":"utils/Date.ts","./utils/Utils":"utils/Utils.ts","./utils/Array":"utils/Array.ts","./utils/layout/Layout":"utils/layout/Layout.ts","./utils/layout/Attribute":"utils/layout/Attribute.ts","./style/Icon":"style/Icon.ts","./style/Color":"style/Color.ts"}],"utils/vdom/VirtualDom.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.diff = diff;

var Html = _interopRequireWildcard(require("./Html"));

var Utils = _interopRequireWildcard(require("../Utils"));

var Maybe = _interopRequireWildcard(require("../Maybe"));

var Array_ = _interopRequireWildcard(require("../Array"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function diff(oldVDom, newVDom, dispatch) {
  if (oldVDom.nodeType === "text" || newVDom.nodeType === "text" || oldVDom.tagName !== newVDom.tagName) {
    return $node => {
      const $newNode = Html.toElement(newVDom, dispatch);
      $node.replaceWith($newNode);
      return $newNode;
    };
  } else if (keyOf(oldVDom.attributes) === keyOf(newVDom.attributes)) {
    return $node => $node;
  } else {
    const patchAttributes = diffAttributes(oldVDom.attributes, newVDom.attributes, dispatch);
    const patchChildren = diffChildren(oldVDom.children, newVDom.children, dispatch);
    return $node => {
      patchAttributes($node);
      patchChildren($node);
      return $node;
    };
  }
}

function keyOf(attributes) {
  return Array_.filterMap(attributes, attribute => attribute.tag === "key" ? Maybe.just(attribute) : Maybe.nothing()).map(attribute => attribute.value)[0];
}
/** A list's indexed map2 but without dropping elements.
 */


function map2Extra(xs, ys, bothPresent, xPresent, yPresent) {
  const array = [];

  for (let i = 0; i < Math.min(xs.length, ys.length); i++) {
    array.push(bothPresent(xs[i], ys[i], i));
  }

  for (let i = ys.length; i < xs.length; i++) {
    array.push(xPresent(xs[i], i));
  }

  for (let i = xs.length; i < ys.length; i++) {
    array.push(yPresent(ys[i], i));
  }

  return array;
} // diffAttributes


function diffAttributes(oldAttributes, newAttributes, dispatch) {
  const patches = map2Extra(oldAttributes, newAttributes, (oldAttr, newAttr, i) => $node => {
    if (!attributeEquality(oldAttr, newAttr)) {
      removeAttribute(oldAttr, $node);
      Html.toDomAttribute(newAttr, dispatch, $node);
    }
  }, (oldAttr, i) => $node => {
    removeAttribute(oldAttr, $node);
  }, (newAttr, i) => $node => {
    Html.toDomAttribute(newAttr, dispatch, $node);
  });
  return $node => {
    if ($node instanceof Element) patches.forEach(patch => patch($node));
  };
}

function attributeEquality(a, b) {
  if (a.tag === "attribute" && b.tag === "attribute") {
    return a.name === b.name && a.value === b.value;
  } else if (a.tag === "property" && b.tag === "property") {
    return a.name === b.name && Utils.equals(a.value, b.value);
  } else if (a.tag === "eventHandler" && b.tag === "eventHandler") {
    // The function comparison will most likely always return false;
    // a smarter implementation could optimize this case somehow.
    return a.eventName === b.eventName && a.handler === b.handler;
  } else if (a.tag === "style" && b.tag === "style") {
    return a.property === b.property && a.value === b.value;
  }

  return false;
}

function removeAttribute(attr, $node) {
  if ($node instanceof Text) {
    // Text nodes don't have attributes AFAIK
    return;
  }

  switch (attr.tag) {
    case "attribute":
      $node.removeAttribute(attr.name);
      return;

    case "property":
      $node[attr.name] = undefined;
      return;

    case "eventHandler":
      $node[`on${attr.eventName}`] = undefined;
      return;

    case "style":
      $node.style[attr.property] = "";
      return;

    case "key":
      return;
  }

  Utils.assertNever(attr);
} // diffChildren


function diffChildren(oldChildren, newChildren, dispatch) {
  return $parent => {
    if ($parent instanceof Element) {
      /** We need the $parent to calculate the patches because we need to save childNodes[i]
       * before removing elements, which could alter the indexing.
       */
      const patches = getChildrenPatches(oldChildren, newChildren, dispatch, $parent);
      patches.forEach(patch => patch());
    }
  };
}

function getChildrenPatches(oldChildren, newChildren, dispatch, $parent) {
  return map2Extra(oldChildren, newChildren, (oldChild, newChild, i) => {
    const $child = $parent.childNodes[i];
    return () => {
      if ($child instanceof Element || $child instanceof Text) diff(oldChild, newChild, dispatch)($child);else throw {
        $parent,
        oldChild,
        newChild,
        $child
      };
    };
  }, (oldChild, i) => {
    const $child = $parent.childNodes[i];
    return () => {
      $child.remove();
    };
  }, (newChild, i) => () => {
    $parent.appendChild(Html.toElement(newChild, dispatch));
  });
}
},{"./Html":"utils/vdom/Html.ts","../Utils":"utils/Utils.ts","../Maybe":"utils/Maybe.ts","../Array":"utils/Array.ts"}],"index.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.view = view;

var State = _interopRequireWildcard(require("./State"));

var Update = _interopRequireWildcard(require("./Update"));

var Record = _interopRequireWildcard(require("./Record"));

var Records = _interopRequireWildcard(require("./Records"));

var CreateRecord = _interopRequireWildcard(require("./CreateRecord"));

var Html = _interopRequireWildcard(require("./utils/vdom/Html"));

var VirtualDom = _interopRequireWildcard(require("./utils/vdom/VirtualDom"));

var Layout = _interopRequireWildcard(require("./utils/layout/Layout"));

var Attribute = _interopRequireWildcard(require("./utils/layout/Attribute"));

var Color = _interopRequireWildcard(require("./style/Color"));

var Component = _interopRequireWildcard(require("./style/Component"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

/** About this code
 *
 * I'm using The Elm Architecture, which is essentially the same idea as React/Redux.
 *
 */
// --- VIEW
function view(state) {
  return Layout.toHtml(Layout.column("div", [Attribute.style("align-items", "center")], [// CSS
  Layout.html(Html.node("style", [Html.key("1")], [Html.text(resetCss()), Html.text(bodyCss()), Html.text(Component.textInputCss()), Html.text(Record.recordCss())])), // CONTENT
  Layout.column("div", [Attribute.style("max-width", 1024 + 40 + "px"), Attribute.style("padding", "0 20px")], [Layout.space(50), CreateRecord.view([Attribute.padding(10)], {
    createRecord: state.createRecord,
    records: state.records
  }), Records.view(state.records, state.today)])]));
}

function resetCss() {
  return `
* {
    margin: 0;
    padding: 0;
    text: inherit;
    box-sizing: inherit;
    text-decoration: inherit;
    font-weight: inherit;
    font-size: inherit;
    background: transparent;
    border: 0;
    transition: all 0.2s ease-out;
    color: inherit;
    text-align: inherit;
}
*:hover, *:focus, *:active {
    outline: 0;
}

html {
    box-sizing: border-box;
    line-height: 1;
}
    `;
}

function bodyCss() {
  return `
body {
    background-color: ${Color.toCssString(Color.background)};
    font-family: Lato, -apple-system, BlinkMacSystemFont, avenir next, avenir,
        helvetica neue, helvetica, Ubuntu, roboto, noto, segoe ui, arial, sans-serif;
    border-top: 6px solid ${Color.toCssString(Color.accent)};
    color: ${Color.toCssString(Color.gray700)};
}
    `;
} // --- MAIN


let $rootElement = document.getElementById('root');
let timeout = setTimeout(() => {}, 0);
/** Flags refer to some external state that is passed to app initialization */

const flags = localStorage.getItem("state");

if ($rootElement !== null) {
  let [state, initialCmd] = State.initialState(flags, {
    day: 23,
    month: 4,
    year: 2021
  });
  let currentView = view(state);

  const dispatch = event => {
    const {
      state: newState,
      cmd
    } = Update.update(state, event);
    const newView = view(newState);
    const patch = VirtualDom.diff(currentView, newView, dispatch);
    patch($rootElement);
    currentView = newView;
    cmd.execute(dispatch);
  };

  const $initialRender = Html.toElement(currentView, dispatch);
  $rootElement.replaceWith($initialRender);
  $rootElement = $initialRender;
  requestAnimationFrame(() => {
    initialCmd.execute(dispatch);
  });
}
},{"./State":"State.ts","./Update":"Update.ts","./Record":"Record.ts","./Records":"Records.ts","./CreateRecord":"CreateRecord.ts","./utils/vdom/Html":"utils/vdom/Html.ts","./utils/vdom/VirtualDom":"utils/vdom/VirtualDom.ts","./utils/layout/Layout":"utils/layout/Layout.ts","./utils/layout/Attribute":"utils/layout/Attribute.ts","./style/Color":"style/Color.ts","./style/Component":"style/Component.ts"}],"../node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "34867" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else if (location.reload) {
        // `location` global exists in a web worker context but lacks `.reload()` function.
        location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["../node_modules/parcel-bundler/src/builtins/hmr-runtime.js","index.ts"], null)
//# sourceMappingURL=/src.77de5100.js.map