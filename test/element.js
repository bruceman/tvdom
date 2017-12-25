var test = require('tape');
var sinon = require('sinon');
var tvdom = require('../dist/tvdom.common');

var el = tvdom.element;

test('element tests', function(t) {
    var root = el('ul', { name: 'jerry' }, [
        el('li', null, [el('span')]),
        el('li', null, [el('span')]),
        el('li', null, [el('span')]),
        el('li', null, [el('span')])
    ]);

    t.equal(root.count, 8);
    t.equal(root.tagName, 'ul');
    t.deepEqual(root.props, { name: 'jerry' });
    t.equal(root.children[0].tagName, 'li');
    t.equal(root.children[0].count, 1);

    root = el('li', { key: 'uuid' });
    t.equal(root.key, 'uuid');

    t.end();

});


test('element render tests', function(t) {
    var oldDocument = global.document
    global.document = {}

    var props = { dataStyle: 'color: red' }
    var root = el('ul', props, [
        el('li'),
        el('li', [el('span')]),
        'test'
    ])
    var spy0 = sinon.spy();
    var spy3 = sinon.spy();
    var spy2 = document.createTextNode = sinon.spy();
    var spy1 = document.createElement = sinon.stub().returns({
        setAttribute: spy0,
        appendChild: spy3,
        style: {}
    });
    root.render();

    spy0.calledWith('dataStyle', 'color: red')
    t.equal(spy1.callCount, 4);
    spy2.calledWith('test')
    t.equal(spy3.callCount, 4);

    global.document = oldDocument;

    t.end();

});

// test('input element tests', function(t) {
//   var oldDocument = global.document
//     global.document = {
//       createElement: sinon.spy()
//     };

//     var input = el('div', {}, [
//         el('input', { value: 'string value' }, null),
//         el('textarea', { value: 'string value2' }, null)
//     ]);
//     var dom = input.render();

//     var spy1 = sinon.spy();
//     var spy2 = sinon.spy();

//     // dom.childNodes[0].setAttribute = spy1;

//     // dom.childNodes[0].value.should.be.equal('string value')
//     // spy1.should.not.have.been.called

//     // dom.childNodes[1].setAttribute = spy2
//     // spy2.should.not.have.been.called
//     // dom.childNodes[1].value.should.be.equal('string value2')

//     global.document = oldDocument;

//     t.end();

// });


/*
describe('Test Element', function () {

  it('Setting value of input and textarea', function () {
    var input = el('div', {}, [
      el('input', {value: 'string value'}, null),
      el('textarea', {value: 'string value2'}, null)
    ])
    var dom = input.render()

    var spy1 = sinon.spy()
    var spy2 = sinon.spy()

    dom.childNodes[0].setAttribute = spy1
    dom.childNodes[0].value.should.be.equal('string value')
    spy1.should.not.have.been.called

    dom.childNodes[1].setAttribute = spy2
    spy2.should.not.have.been.called
    dom.childNodes[1].value.should.be.equal('string value2')
  })

  it('Setting value of normal nodes', function () {
    var input = el('div', {}, [
      el('div', {value: 'string value'}, null)
    ])
    var dom = input.render()
    chai.expect(dom.childNodes[0].value).to.be.undefined
    dom.childNodes[0].getAttribute('value').should.be.equal('string value')
  })

  it('Passing JSX-style children', function () {
    var input = el('div', {},
      el('div', {value: 'string value'}, null),
      el('div', {value: 'another'}, null)
    )
    var dom = input.render()
    chai.expect(dom.childNodes.length).to.be.equal(2)
    dom.childNodes[0].getAttribute('value').should.be.equal('string value')
    dom.childNodes[1].getAttribute('value').should.be.equal('another')
  })
})
*/