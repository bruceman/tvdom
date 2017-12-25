import element from './element';

// regex to match element
var tagRE = /<(?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+>/g;
// regex to match dom attribute
var attrRE = /([\w-]+)|['"]{1}([^'"]*)['"]{1}/g;

// re-used obj for quick lookups of components
var empty = Object.create ? Object.create(null) : {};

// create optimized lookup object for
// void elements as listed here: 
// http://www.w3.org/html/wg/drafts/html/master/syntax.html#void-elements
var lookup = (Object.create) ? Object.create(null) : {};
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
        throw new Error('Must have one root element');
    }

    return toElement(result[0]);
};

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
};

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

    return element(el.name, el.attrs, children);
}


export default parse;
