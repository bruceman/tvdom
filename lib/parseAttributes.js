import Source from 'source-component';
import _ from './util';

var quotas = '"\'';
var regSpace = /^\s$/;


// the chars to close the abttribute
function isClosed(char) {
  return char === '/' || char === '>';
}

function isSpace(char) {
  return regSpace.test(char);
}

// parse tag name part: <div id='abc'></div> => div
function parseTagName(source) {
  if (source.currentChar() !== '<') {
    throw Error('This is not a HTML tag. HTML tag has to start with "<"');
  }

  let name = '';
  let char = source.nextChar();
  while (char) {
    // space or closed
    if (isSpace(char) || isClosed(char)) {
      break;
    } else {
      name += char;
    }
    char = source.nextChar();
  }
  return name;
}

// <div id="abc"></div> => id
function parseAttributeName(source) {
  let char = source.currentChar();
  let string = '';
  while (char) {
    if (isSpace(char) || isClosed(char) || char === '=') {
      // unshift last char
      source.skip(-1);
      break;
    } else {
      string += char;
    }

    char = source.nextChar();
  }
  return string;
}

//<div id='abc'></div> => abc
function parseAttributeValue(source) {
  let char = source.currentChar();
  // string quotation mark
  let stringMark = quotas.indexOf(char) >= 0 ? char : null;
  if (stringMark) {
    char = source.nextChar();
  }
  let string = '';
  while (char) {
    if (stringMark) {
      // close string (not escaped)
      if (char === stringMark && source.peek(-1) !== '\\') {
        break;
      } else {
        string += char;
      }
    } else {
      if (isSpace(char) || isClosed(char)) {
        break;
      } else {
        string += char;
      }
    }

    char = source.nextChar();
  }
  return string;
}

// parse tag attribute parts
function parseAttributes(source) {
  let field = '';
  let char = source.currentChar();
  let attributes = {};

  while (char) {
    // skip space char
    if (isSpace(char)) {
      char = skipBlank(source);
    }

      // close attribute
    if (isClosed(char)) {
      break;
    }

    field = parseAttributeName(source);
    // skip blank char
    char = skipBlank(source);

    // first non-space char
    if (char === '=') {
      skipBlank(source);
      attributes[field] = _.unescapeString(parseAttributeValue(source));
      source.nextChar();
    } else {
      // only have key but have no value 
      if (field && !attributes.hasOwnProperty(field)) {
        attributes[field] = true
      }
    }
  }

  return attributes
}

function skipBlank(source) {
  let c = null;;
  do {
    c = source.nextChar();
  } while(c && isSpace(c));
  
  return c;
}

export default function parse(text) {
  let field = '';
  let source = new Source(text);
  
  return {
    tagName: parseTagName(source),
    attributes: parseAttributes(source)
  }
}
