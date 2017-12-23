# tvdom
tvdom is a simple and fast tiny vdom tool that support parse html, diff vtree and patch to dom functions.


### Sample
```js
    var tpl = template(new Date());
    var container = document.getElementById('container');
    var tree = tvdom.parse(tpl);
    var dom = tree.render();
    container.append(dom);

    setInterval(function () {
        var newTpl = template(new Date());
        var newTree = tvdom.parse(newTpl);
        var patches = tvdom.diff(tree, newTree);
        tvdom.patch(dom, patches);
    }, 1000);

    function template(date) {
        return '<div><h2>Now time is :</h2><p class="time">' + date.toString() + '</p></div>';
    }

```


### How to build
> npm run build 


### Note
The tvdom build on the shoulder of the follwing repositories, thanks the contributors who build so simple and good tools.
- https://github.com/livoras/simple-virtual-dom
- https://github.com/HenrikJoreteg/html-parse-stringify