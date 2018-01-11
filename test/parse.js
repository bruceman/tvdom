var test = require('tape');
var tvdom = require('../dist/tvdom.common');


test('parse tests', function(t) {
    var html = '<div class="oh"><p></p></div>';
    var parsed = tvdom.parse(html);
    t.deepEqual(parsed, {
        tagName: 'div',
        props: {
            class: 'oh'
        },
        children: [{
            tagName: 'p',
            props: {},
            children: [],
            key: undefined,
            count: 0
        }],
        key: undefined,
        count: 1,
    });

    html = ' <div title="oh&quot;i&#x27;m &lt;bruce&gt;. 1&#x3D;1"><p>hi</p></div> ';
    parsed = tvdom.parse(html);

    t.deepEqual(parsed, {
        tagName: 'div',
        props: {
            title: 'oh"i\'m <bruce>. 1=1'
        },
        children: [{
            tagName: 'p',
            props: {},
            children: [
                'hi'
            ],
            key: undefined,
            count: 1
        }],
        key: undefined,
        count: 2
    }, 'trim ahead and trailing blank chars');

    html = '<div>oh <strong>hello</strong> there! How are <span>you</span>?</div>';
    parsed = tvdom.parse(html);

    t.deepEqual(parsed, {
        tagName: 'div',
        props: {},
        children: [
            'oh ',
            {
                tagName: 'strong',
                props: {},
                children: ['hello'],
                key: undefined,
                count: 1
            },
            ' there! How are ',
            {
                tagName: 'span',
                props: {},
                children: ['you'],
                key: undefined,
                count: 1
            },
            '?'
        ],
        key: undefined,
        count: 7
    });

    html = '<div class="handles multiple classes" key="mykey"></div>';
    parsed = tvdom.parse(html);

    t.deepEqual(parsed, {
        tagName: 'div',
        props: {
            class: 'handles multiple classes',
            key: 'mykey'
        },
        children: [],
        key: 'mykey',
        count: 0
    });

    html = '<div class=\'handles\' other=47 and="attributes"></div>';
    parsed = tvdom.parse(html);

    t.deepEqual(parsed, {
        tagName: 'div',
        props: {
            class: 'handles',
            other: '47',
            and: 'attributes'
        },
        children: [],
        key: undefined,
        count: 0
    });

    html = '<div-custom class="oh"><my-component some="thing"></my-component></div-custom>';
    parsed = tvdom.parse(html);

    t.deepEqual(parsed, {
        tagName: 'div-custom',
        props: {
            class: 'oh'
        },
        children: [{
            tagName: 'my-component',
            props: {
                some: 'thing'
            },
            children: [],
            key: undefined,
            count: 0
        }],
        key: undefined,
        count: 1
    }, 'custom elements');

    html = '<div><img src="a.jpg"></div>';
    parsed = tvdom.parse(html);

    t.deepEqual(parsed, {
        tagName: 'div',
        props: {},
        children: [{
            tagName: 'img',
            props: {
                src: 'a.jpg'
            },
            children: [],
            key: undefined,
            count: 0
        }],
        key: undefined,
        count: 1
    }, 'should handle unclosed void elements');

    html = '<div><void-web-component key="mykey"/></div>';
    parsed = tvdom.parse(html);
    t.deepEqual(parsed, {
        tagName: 'div',
        props: {},
        children: [{
            tagName: 'void-web-component',
            props: {
                key: "mykey"
            },
            children: [],
            key: 'mykey',
            count: 0
        }],
        key: undefined,
        count: 1
    }, 'should handle custom void tags if self-closing');

    html = '<div>root1</div><p>root2</p>';
    try {
        tvdom.parse(html);
    } catch(error) {
        t.equal(error.message, 'Must have one root element');
    }

    t.end();
});

test('simple speed sanity check', function(t) {
    var i = 100000;
    var groupSize = 1000;
    var waitLoopSize = 10000000;
    var groups = i / groupSize;
    var html = '<html><head><title>Some page</title></head><body class="hey there"><img src="someURL"><h3>Hey, we need content</h3><br></body></html>';

    var parse = tvdom.parse;
    var times = [];
    var count;
    var waitCount;
    var total = 0;
    var start, stepAverage;

    console.log('running ' + i + ' iterations...');

    while (i--) {
        count = groupSize;
        // grab groups
        if (i % count === 0) {
            start = Date.now();
            while (count--) {
                parse(html);
            }
            var diff = Date.now() - start;
            stepAverage = diff / groupSize;
            console.log('group ' + (groups - (i / groupSize)) + ': ' + stepAverage);
            times.push(stepAverage);
            total += stepAverage;
            waitCount = waitLoopSize;
            // forcing a bit of a pause between tests
            while (waitCount--) {}
        }

    }

    // trim off first
    // it's always a slower outlier
    // with higher variability that
    // makes it harder to find differences
    times.shift();

    var max = Math.max.apply(null, times);
    var min = Math.min.apply(null, times);
    var average = total / times.length;

    console.log('max', max);
    console.log('min', min);
    console.log('avg', average);

    t.comment('average parse time: ' + average);

    t.end();
});

test('text unescape test', function(t) {
    var html = '<div>tom&amp;jerry</div>';
    var parsed = tvdom.parse(html);
    t.deepEqual(parsed, {
        tagName: 'div',
        props: {},
        children: ['tom&jerry'],
        key: undefined,
        count: 1,
    });

    html = '<div>tom&amp;jerry&amp;bruce</div>';
    parsed = tvdom.parse(html);
    t.deepEqual(parsed, {
        tagName: 'div',
        props: {},
        children: ['tom&jerry&bruce'],
        key: undefined,
        count: 1,
    });

    html = '<div>a&amp;b&lt;c&gt;d&quot;1&#x27;2&#x60;3&#x3D;4</div>';
    parsed = tvdom.parse(html);
    t.deepEqual(parsed, {
        tagName: 'div',
        props: {},
        children: ['a&b<c>d"1\'2`3=4'],
        key: undefined,
        count: 1,
    });

    html = '<div>a&amp;b&nbsp;c</div>';
    parsed = tvdom.parse(html);
    t.deepEqual(parsed, {
        tagName: 'div',
        props: {},
        children: ['a&b&nbsp;c'],
        key: undefined,
        count: 1,
    });

    html = '<div><em>name:</em>bruce&quot;man</div>';
    parsed = tvdom.parse(html);
    t.deepEqual(parsed, {
        tagName: 'div',
        props: {},
        children: [
             {
                tagName: 'em',
                props: {},
                children: ['name:'],
                key: undefined,
                count: 1
            },
            'bruce"man'
        ],
        key: undefined,
        count: 3,
    });

    t.end();
});

