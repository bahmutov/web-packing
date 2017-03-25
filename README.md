# web-packing

> Webpack on demand (immutable builds, cached by your browser)

Inspired by "Browserify as a service" at [https://wzrd.in/](https://wzrd.in/).

Just deploy this micro service yourself ([Zeit.co Now](https://zeit.co/now)
works really well). Then require single or multiple NPM packages.

## Example

Let us say you want to try [hyperx](https://github.com/substack/hyperx).
Just grab it and it will be available as `window.packs.hyper`

```html
<script src="https://your web-packing domain/hyperx"></script>
<script>
  // print virtual dom from template string
  var hyperx = window.packs.hyperx
  var write = hyperx(function (tagName, attrs, children) {
    console.log(tagName, attrs, children)
  })
  write`<h1>hello world</h1>`
</script>
```

Multiple libs can be packed

```html
<script src="https://your web-packing domain/hyperx&lodash"></script>
<script>
  var {hyperx, lodash} = window.packs
</script>
```

## It is slow?!

Running NPM install + webpack every time someone requires a library
**is slow**. To get around it, every bundle is cached by the service and
returned with the following header, which helps alleviate the problem

```
Cache-Control:max-age=99999999, public, immutable
```

You can see the server timings BTW in the modern browser

![Server Timing][screenshot]

[screenshot]: https://raw.githubusercontent.com/bahmutov/web-packing/master/images/web-packing.png

## Small print

Author: Gleb Bahmutov <gleb.bahmutov@gmail.com> @ 2017

* [@bahmutov](https://twitter.com/bahmutov)
* [glebbahmutov.com](https://glebbahmutov.com)
* [blog](https://glebbahmutov.com/blog)

License: MIT - do anything with the code, but don't blame me if it does not work.

Support: if you find any problems with this module, email / tweet /
[open issue](https://github.com/bahmutov/web-packing/issues) on Github
