(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.tvdom = factory());
}(this, (function () { 'use strict';

var _ = {};

_.type = function (obj) {
  return Object.prototype.toString.call(obj).replace(/\[object\s|\]/g, '');
};

_.isArray = function isArray(list) {
  return _.type(list) === 'Array';
};

_.slice = function slice(arrayLike, index) {
  return Array.prototype.slice.call(arrayLike, index);
};

_.truthy = function truthy(value) {
  return !!value;
};

_.isString = function isString(list) {
  return _.type(list) === 'String';
};

_.each = function each(array, fn) {
  for (var i = 0, len = array.length; i < len; i++) {
    fn(array[i], i);
  }
};

_.toArray = function toArray(listLike) {
  if (!listLike) {
    return [];
  }

  var list = [];

  for (var i = 0, len = listLike.length; i < len; i++) {
    list.push(listLike[i]);
  }

  return list;
};

_.setAttr = function setAttr(node, key, value) {
  switch (key) {
    case 'style':
      node.style.cssText = value;
      break;
    case 'value':
      var tagName = node.tagName || '';
      tagName = tagName.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea') {
        node.value = value;
      } else {
        // if it is not a input or textarea, use `setAttribute` to set
        node.setAttribute(key, value);
      }
      break;
    default:
      node.setAttribute(key, value);
      break;
  }
};

/**
 * Virtual-dom Element.
 * @param {String} tagName
 * @param {Object} props - Element's properties,
 *                       - using object to store key-value pair
 * @param {Array<Element|String>} - This element's children elements.
 *                                - Can be Element instance or just a piece plain text.
 */
function Element(tagName, props, children) {
  if (!(this instanceof Element)) {
    if (!_.isArray(children) && children != null) {
      children = _.slice(arguments, 2).filter(_.truthy);
    }
    return new Element(tagName, props, children);
  }

  if (_.isArray(props)) {
    children = props;
    props = {};
  }

  this.tagName = tagName;
  this.props = props || {};
  this.children = children || [];
  this.key = props ? props.key : void 666;

  var count = 0;

  _.each(this.children, function (child, i) {
    if (child instanceof Element) {
      count += child.count;
    } else {
      children[i] = '' + child;
    }
    count++;
  });

  this.count = count;
}

/**
 * Render the hold element tree.
 */
Element.prototype.render = function () {
  var el = document.createElement(this.tagName);
  var props = this.props;

  for (var propName in props) {
    var propValue = props[propName];
    _.setAttr(el, propName, propValue);
  }

  _.each(this.children, function (child) {
    var childEl = child instanceof Element ? child.render() : document.createTextNode(child);
    el.appendChild(childEl);
  });

  return el;
};

// regex to match element
var tagRE = /<(?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+>/g;
// regex to match dom attribute
var attrRE = /([\w-]+)|['"]{1}([^'"]*)['"]{1}/g;

// create optimized lookup object for
// void elements as listed here: 
// http://www.w3.org/html/wg/drafts/html/master/syntax.html#void-elements
var lookup = Object.create ? Object.create(null) : {};
lookup.area = true;
lookup.base = true;
lookup.br = true;
lookup.col = true;
lookup.embed = true;
lookup.hr = true;
lookup.img = true;
lookup.input = true;
lookup.keygen = true;
lookup.link = true;
lookup.menuitem = true;
lookup.meta = true;
lookup.param = true;
lookup.source = true;
lookup.track = true;
lookup.wbr = true;

/**
 * Parse html fragement and return vitrual dom tree
 * 
 * Note: html must have one root element and all tags must be closed or self-closing.
 */
function parse(html) {
    var result = [];
    var current;
    var level = -1;
    var arr = [];
    var byTag = {};

    // remove un-neccessary blank chars
    html = html.trim();
    html.replace(tagRE, function (tag, index) {
        var isOpen = tag.charAt(1) !== '/';
        var start = index + tag.length;
        var nextChar = html.charAt(start);
        var parent;

        if (isOpen) {
            level++;

            current = parseTag(tag);

            if (!current.voidElement && nextChar && nextChar !== '<') {
                current.children.push({
                    type: 'text',
                    content: html.slice(start, html.indexOf('<', start))
                });
            }

            byTag[current.tagName] = current;

            // if we're at root, push new base node
            if (level === 0) {
                result.push(current);
            }

            parent = arr[level - 1];

            if (parent) {
                parent.children.push(current);
            }

            arr[level] = current;
        }

        if (!isOpen || current.voidElement) {
            level--;
            if (nextChar !== '<' && nextChar) {
                // trailing text node
                arr[level].children.push({
                    type: 'text',
                    content: html.slice(start, html.indexOf('<', start))
                });
            }
        }
    });

    if (result.length !== 1) {
        throw new Error('Must have one root container');
    }

    return toElement(result[0]);
}

function parseTag(tag) {
    var i = 0;
    var key;
    var res = {
        type: 'tag',
        name: '',
        voidElement: false,
        attrs: {},
        children: []
    };

    tag.replace(attrRE, function (match) {
        if (i % 2) {
            key = match;
        } else {
            if (i === 0) {
                if (lookup[match] || tag.charAt(tag.length - 2) === '/') {
                    res.voidElement = true;
                }
                res.name = match;
            } else {
                res.attrs[key] = match.replace(/['"]/g, '');
            }
        }
        i++;
    });

    return res;
}

// to vdom element
function toElement(el) {
    var children = [];
    el.children.forEach(function (child) {
        if (child.type == 'text') {
            children.push(child.content);
        } else {
            children.push(toElement(child));
        }
    });

    return Element(el.name, el.attrs, children);
}

/**
 * Diff two list in O(N).
 * @param {Array} oldList - Original List
 * @param {Array} newList - List After certain insertions, removes, or moves
 * @return {Object} - {moves: <Array>}
 *                  - moves is a list of actions that telling how to remove and insert
 */
function diff$2 (oldList, newList, key) {
  var oldMap = makeKeyIndexAndFree(oldList, key);
  var newMap = makeKeyIndexAndFree(newList, key);

  var newFree = newMap.free;

  var oldKeyIndex = oldMap.keyIndex;
  var newKeyIndex = newMap.keyIndex;

  var moves = [];

  // a simulate list to manipulate
  var children = [];
  var i = 0;
  var item;
  var itemKey;
  var freeIndex = 0;

  // fist pass to check item in old list: if it's removed or not
  while (i < oldList.length) {
    item = oldList[i];
    itemKey = getItemKey(item, key);
    if (itemKey) {
      if (!newKeyIndex.hasOwnProperty(itemKey)) {
        children.push(null);
      } else {
        var newItemIndex = newKeyIndex[itemKey];
        children.push(newList[newItemIndex]);
      }
    } else {
      var freeItem = newFree[freeIndex++];
      children.push(freeItem || null);
    }
    i++;
  }

  var simulateList = children.slice(0);

  // remove items no longer exist
  i = 0;
  while (i < simulateList.length) {
    if (simulateList[i] === null) {
      remove(i);
      removeSimulate(i);
    } else {
      i++;
    }
  }

  // i is cursor pointing to a item in new list
  // j is cursor pointing to a item in simulateList
  var j = i = 0;
  while (i < newList.length) {
    item = newList[i];
    itemKey = getItemKey(item, key);

    var simulateItem = simulateList[j];
    var simulateItemKey = getItemKey(simulateItem, key);

    if (simulateItem) {
      if (itemKey === simulateItemKey) {
        j++;
      } else {
        // new item, just inesrt it
        if (!oldKeyIndex.hasOwnProperty(itemKey)) {
          insert(i, item);
        } else {
          // if remove current simulateItem make item in right place
          // then just remove it
          var nextItemKey = getItemKey(simulateList[j + 1], key);
          if (nextItemKey === itemKey) {
            remove(i);
            removeSimulate(j);
            j++; // after removing, current j is right, just jump to next one
          } else {
            // else insert item
            insert(i, item);
          }
        }
      }
    } else {
      insert(i, item);
    }

    i++;
  }

  function remove (index) {
    var move = {index: index, type: 0};
    moves.push(move);
  }

  function insert (index, item) {
    var move = {index: index, item: item, type: 1};
    moves.push(move);
  }

  function removeSimulate (index) {
    simulateList.splice(index, 1);
  }

  return {
    moves: moves,
    children: children
  }
}

/**
 * Convert list to key-item keyIndex object.
 * @param {Array} list
 * @param {String|Function} key
 */
function makeKeyIndexAndFree (list, key) {
  var keyIndex = {};
  var free = [];
  for (var i = 0, len = list.length; i < len; i++) {
    var item = list[i];
    var itemKey = getItemKey(item, key);
    if (itemKey) {
      keyIndex[itemKey] = i;
    } else {
      free.push(item);
    }
  }
  return {
    keyIndex: keyIndex,
    free: free
  }
}

function getItemKey (item, key) {
  if (!item || !key) return void 666
  return typeof key === 'string'
    ? item[key]
    : key(item)
}

var makeKeyIndexAndFree_1 = makeKeyIndexAndFree; // exports for test
var diff_2 = diff$2;

var diff_1 = {
	makeKeyIndexAndFree: makeKeyIndexAndFree_1,
	diff: diff_2
};

var listDiff2 = diff_1.diff;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};

var REPLACE = 0;
var REORDER = 1;
var PROPS = 2;
var TEXT = 3;

function patch(node, patches) {
  var walker = { index: 0 };
  dfsWalk$1(node, walker, patches);
}

function dfsWalk$1(node, walker, patches) {
  var currentPatches = patches[walker.index];

  var len = node.childNodes ? node.childNodes.length : 0;
  for (var i = 0; i < len; i++) {
    var child = node.childNodes[i];
    walker.index++;
    dfsWalk$1(child, walker, patches);
  }

  if (currentPatches) {
    applyPatches(node, currentPatches);
  }
}

function applyPatches(node, currentPatches) {
  _.each(currentPatches, function (currentPatch) {
    switch (currentPatch.type) {
      case REPLACE:
        var newNode = typeof currentPatch.node === 'string' ? document.createTextNode(currentPatch.node) : currentPatch.node.render();
        node.parentNode.replaceChild(newNode, node);
        break;
      case REORDER:
        reorderChildren(node, currentPatch.moves);
        break;
      case PROPS:
        setProps(node, currentPatch.props);
        break;
      case TEXT:
        if (node.textContent) {
          node.textContent = currentPatch.content;
        } else {
          // old ie
          node.nodeValue = currentPatch.content;
        }
        break;
      default:
        throw new Error('Unknown patch type ' + currentPatch.type);
    }
  });
}

function setProps(node, props) {
  for (var key in props) {
    if (props[key] === void 666) {
      node.removeAttribute(key);
    } else {
      var value = props[key];
      _.setAttr(node, key, value);
    }
  }
}

function reorderChildren(node, moves) {
  var staticNodeList = _.toArray(node.childNodes);
  var maps = {};

  _.each(staticNodeList, function (node) {
    if (node.nodeType === 1) {
      var key = node.getAttribute('key');
      if (key) {
        maps[key] = node;
      }
    }
  });

  _.each(moves, function (move) {
    var index = move.index;
    if (move.type === 0) {
      // remove item
      if (staticNodeList[index] && staticNodeList[index] === node.childNodes[index]) {
        // maybe have been removed for inserting
        node.removeChild(node.childNodes[index]);
      }
      staticNodeList.splice(index, 1);
    } else if (move.type === 1) {
      // insert item
      var insertNode = maps[move.item.key] ? maps[move.item.key].cloneNode(true) // reuse old item
      : _typeof(move.item) === 'object' ? move.item.render() : document.createTextNode(move.item);
      staticNodeList.splice(index, 0, insertNode);
      node.insertBefore(insertNode, node.childNodes[index] || null);
    }
  });
}

// patch types
patch.REPLACE = REPLACE;
patch.REORDER = REORDER;
patch.PROPS = PROPS;
patch.TEXT = TEXT;

function diff(oldTree, newTree) {
  var index = 0;
  var patches = {};
  dfsWalk(oldTree, newTree, index, patches);
  return patches;
}

function dfsWalk(oldNode, newNode, index, patches) {
  var currentPatch = [];

  // Node is removed.
  if (newNode === null) {
    // Real DOM node will be removed when perform reordering, so has no needs to do anthings in here
    // TextNode content replacing
  } else if (_.isString(oldNode) && _.isString(newNode)) {
    if (newNode !== oldNode) {
      currentPatch.push({ type: patch.TEXT, content: newNode });
    }
    // Nodes are the same, diff old node's props and children
  } else if (oldNode.tagName === newNode.tagName && oldNode.key === newNode.key) {
    // Diff props
    var propsPatches = diffProps(oldNode, newNode);
    if (propsPatches) {
      currentPatch.push({ type: patch.PROPS, props: propsPatches });
    }
    // Diff children. If the node has a `ignore` property, do not diff children
    if (!isIgnoreChildren(newNode)) {
      diffChildren(oldNode.children, newNode.children, index, patches, currentPatch);
    }
    // Nodes are not the same, replace the old node with new node
  } else {
    currentPatch.push({ type: patch.REPLACE, node: newNode });
  }

  if (currentPatch.length) {
    patches[index] = currentPatch;
  }
}

function diffChildren(oldChildren, newChildren, index, patches, currentPatch) {
  var diffs = listDiff2(oldChildren, newChildren, 'key');
  newChildren = diffs.children;

  if (diffs.moves.length) {
    var reorderPatch = { type: patch.REORDER, moves: diffs.moves };
    currentPatch.push(reorderPatch);
  }

  var leftNode = null;
  var currentNodeIndex = index;
  _.each(oldChildren, function (child, i) {
    var newChild = newChildren[i];
    currentNodeIndex = leftNode && leftNode.count ? currentNodeIndex + leftNode.count + 1 : currentNodeIndex + 1;
    dfsWalk(child, newChild, currentNodeIndex, patches);
    leftNode = child;
  });
}

function diffProps(oldNode, newNode) {
  var count = 0;
  var oldProps = oldNode.props;
  var newProps = newNode.props;

  var key, value;
  var propsPatches = {};

  // Find out different properties
  for (key in oldProps) {
    value = oldProps[key];
    if (newProps[key] !== value) {
      count++;
      propsPatches[key] = newProps[key];
    }
  }

  // Find out new property
  for (key in newProps) {
    value = newProps[key];
    if (!oldProps.hasOwnProperty(key)) {
      count++;
      propsPatches[key] = newProps[key];
    }
  }

  // If properties all are identical
  if (count === 0) {
    return null;
  }

  return propsPatches;
}

function isIgnoreChildren(node) {
  return node.props && node.props.hasOwnProperty('ignore');
}

//tvdom main functions
var main = {
    parse: parse,
    diff: diff,
    patch: patch
};

return main;

})));
