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
