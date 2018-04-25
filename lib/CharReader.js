/**
 * CharReader
 */
class CharReader {
   constructor(str) {
    this.str = str;
    this.index = 0;
  }

  currentChar() {
    return this.str[this.index];
  }

  currentIndex() {
    return this.index;
  }

  charAt(index) {
    return this.str[index];
  }

  nextChar() {
    this.index++;
    if (this.index >= this.str.length) return undefined;
    return this.currentChar();
  }

 
  peek(offset) {
    offset = offset == undefined ? 1 : offset;
    return this.str[this.index + offset];
  }

  skip(offset) {
    this.index += offset;
  }

  length() {
    return this.str.length;
  }

}

export default CharReader;

