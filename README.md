# babel-plugin-transform-kdu-jsx

> Babel plugin for Kdu 2.0 JSX

### Babel Compatibility Notes

- If using Babel 7, use 4.x
- If using Babel 6, use 3.x

### Requirements

- Assumes you are using Babel with a module bundler e.g. Webpack, because the spread merge helper is imported as a module to avoid duplication.

- This is mutually exclusive with `babel-plugin-transform-react-jsx`.

### Usage

``` bash
npm install\
  babel-plugin-syntax-jsx\
  babel-plugin-transform-kdu-jsx\
  babel-helper-kdu-jsx-merge-props\
  babel-preset-env\
  --save-dev
```

In your `.babelrc`:

``` json
{
  "presets": ["env"],
  "plugins": ["transform-kdu-jsx"]
}
```

The plugin transpiles the following JSX:

``` jsx
<div id="foo">{this.text}</div>
```

To the following JavaScript:

``` js
h('div', {
  attrs: {
    id: 'foo'
  }
}, [this.text])
```

Note the `h` function, which is a shorthand for a Kdu instance's `$createElement` method, must be in the scope where the JSX is. Since this method is passed to component render functions as the first argument, in most cases you'd do this:

``` js
Kdu.component('jsx-example', {
  render (h) { // <-- h must be in scope
    return <div id="foo">bar</div>
  }
})
```

### `h` auto-injection

Starting with version 3.4.0 we automatically inject `const h = this.$createElement` in any method and getter (not functions or arrow functions) declared in ES2015 syntax that has JSX so you can drop the `(h)` parameter.

``` js

Kdu.component('jsx-example', {
  render () { // h will be injected
    return <div id="foo">bar</div>
  },
  myMethod: function () { // h will not be injected
    return <div id="foo">bar</div>
  },
  someOtherMethod: () => { // h will not be injected
    return <div id="foo">bar</div>
  }
})

@Component
class App extends Kdu {
  get computed () { // h will be injected
    return <div id="foo">bar</div>
  }
}
```

### Difference from React JSX

First, Kdu 2.0's knode format is different from React's. The second argument to the `createElement` call is a "data object" that accepts nested objects. Each nested object will be then processed by corresponding modules:

``` js
render (h) {
  return h('div', {
    // Component props
    props: {
      msg: 'hi'
    },
    // normal HTML attributes
    attrs: {
      id: 'foo'
    },
    // DOM props
    domProps: {
      innerHTML: 'bar'
    },
    // Event handlers are nested under "on", though
    // modifiers such as in k-on:keyup.enter are not
    // supported. You'll have to manually check the
    // keyCode in the handler instead.
    on: {
      click: this.clickHandler
    },
    // For components only. Allows you to listen to
    // native events, rather than events emitted from
    // the component using vm.$emit.
    nativeOn: {
      click: this.nativeClickHandler
    },
    // class is a special module, same API as `k-bind:class`
    class: {
      foo: true,
      bar: false
    },
    // style is also same as `k-bind:style`
    style: {
      color: 'red',
      fontSize: '14px'
    },
    // other special top-level properties
    key: 'key',
    ref: 'ref',
    // assign the `ref` is used on elements/components with k-for
    refInFor: true,
    slot: 'slot'
  })
}
```

The equivalent of the above in Kdu 2.0 JSX is:

``` jsx
render (h) {
  return (
    <div
      // normal attributes or component props.
      id="foo"
      // DOM properties are prefixed with `domProps`
      domPropsInnerHTML="bar"
      // event listeners are prefixed with `on` or `nativeOn`
      onClick={this.clickHandler}
      nativeOnClick={this.nativeClickHandler}
      // other special top-level properties
      class={{ foo: true, bar: false }}
      style={{ color: 'red', fontSize: '14px' }}
      key="key"
      ref="ref"
      // assign the `ref` is used on elements/components with k-for
      refInFor
      slot="slot">
    </div>
  )
}
```

### Component Tip

If a custom element starts with lowercase, it will be treated as a string id and used to lookup a registered component. If it starts with uppercase, it will be treated as an identifier, which allows you to do:

``` js
import Todo from './Todo.js'

export default {
  render (h) {
    return <Todo/> // no need to register Todo via components option
  }
}
```

### JSX Spread

JSX spread is supported, and this plugin will intelligently merge nested data properties. For example:

``` jsx
const data = {
  class: ['b', 'c']
}
const knode = <div class="a" {...data}/>
```

The merged data will be:

``` js
{ class: ['a', 'b', 'c'] }
```

### Kdu directives

Note that almost all built-in Kdu directives are not supported when using JSX, the sole exception being `k-show`, which can be used with the `k-show={value}` syntax. In most cases there are obvious programmatic equivalents, for example `k-if` is just a ternary expression, and `k-for` is just an `array.map()` expression, etc.

For custom directives, you can use the `k-name={value}` syntax. However, note that directive arguments and modifiers are not supported using this syntax. There are two workarounds:

1. Pass everything as an object via `value`, e.g. `k-name={{ value, modifier: true }}`

2. Use the raw knode directive data format:

``` js
const directives = [
  { name: 'my-dir', value: 123, modifiers: { abc: true } }
]

return <div {...{ directives }}/>
```
