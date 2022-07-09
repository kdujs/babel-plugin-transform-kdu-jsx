import { expect } from 'chai'
import Kdu from 'kdu'

describe('babel-plugin-transform-kdu-jsx', () => {
  it('should contain text', () => {
    const knode = render(h => <div>test</div>)
    expect(knode.tag).to.equal('div')
    expect(knode.children[0].text).to.equal('test')
  })

  it('should bind text', () => {
    const text = 'foo'
    const knode = render(h => <div>{text}</div>)
    expect(knode.tag).to.equal('div')
    expect(knode.children[0].text).to.equal('foo')
  })

  it('should extract attrs', () => {
    const knode = render(h => <div id="hi" dir="ltr"></div>)
    expect(knode.data.attrs.id).to.equal('hi')
    expect(knode.data.attrs.dir).to.equal('ltr')
  })

  it('should bind attr', () => {
    const id = 'foo'
    const knode = render(h => <div id={id}></div>)
    expect(knode.data.attrs.id).to.equal('foo')
  })

  it('should handle top-level special attrs', () => {
    const knode = render(h => (
      <div
        class="foo"
        style="bar"
        key="key"
        ref="ref"
        refInFor
        slot="slot">
      </div>
    ))
    expect(knode.data.class).to.equal('foo')
    expect(knode.data.style).to.equal('bar')
    expect(knode.data.key).to.equal('key')
    expect(knode.data.ref).to.equal('ref')
    expect(knode.data.refInFor).to.be.true
    expect(knode.data.slot).to.equal('slot')
  })

  it('should handle nested properties', () => {
    const noop = _ => _
    const knode = render(h => (
      <div
        on-click={noop}
        on-kebab-case={noop}
        domProps-innerHTML="<p>hi</p>"
        hook-insert={noop}>
      </div>
    ))
    expect(knode.data.on.click).to.equal(noop)
    expect(knode.data.on['kebab-case']).to.equal(noop)
    expect(knode.data.domProps.innerHTML).to.equal('<p>hi</p>')
    expect(knode.data.hook.insert).to.equal(noop)
  })

  it('should handle nested properties (camelCase)', () => {
    const noop = _ => _
    const knode = render(h => (
      <div
        onClick={noop}
        onCamelCase={noop}
        domPropsInnerHTML="<p>hi</p>"
        hookInsert={noop}>
      </div>
    ))
    expect(knode.data.on.click).to.equal(noop)
    expect(knode.data.on.camelCase).to.equal(noop)
    expect(knode.data.domProps.innerHTML).to.equal('<p>hi</p>')
    expect(knode.data.hook.insert).to.equal(noop)
  })

  it('should support data attributes', () => {
    const knode = render(h => (
      <div data-id="1"></div>
    ))
    expect(knode.data.attrs['data-id']).to.equal('1')
  })

  it('should handle identifier tag name as components', () => {
    const Test = {}
    const knode = render(h => <Test/>)
    expect(knode.tag).to.contain('kdu-component')
  })

  it('should work for components with children', () => {
    const Test = {}
    const knode = render(h => <Test><div>hi</div></Test>)
    const children = knode.componentOptions.children
    expect(children[0].tag).to.equal('div')
  })

  it('should bind things in thunk with correct this context', () => {
    const Test = {
      render (h) {
        return <div>{this.$slots.default}</div>
      }
    }
    const context = { test: 'foo' }
    const knode = render((function (h) {
      return <Test>{this.test}</Test>
    }).bind(context))
    const vm = createComponentInstanceForKnode(knode)
    const childKnode = vm._render()
    expect(childKnode.tag).to.equal('div')
    expect(childKnode.children[0].text).to.equal('foo')
  })

  it('spread (single object expression)', () => {
    const props = {
      innerHTML: 2
    }
    const knode = render(h => (
      <div {...{ props }}/>
    ))
    expect(knode.data.props.innerHTML).to.equal(2)
  })

  it('spread (mixed)', () => {
    const calls = []
    const data = {
      attrs: {
        id: 'hehe'
      },
      on: {
        click: function () {
          calls.push(1)
        }
      },
      props: {
        innerHTML: 2
      },
      hook: {
        insert: function () {
          calls.push(3)
        }
      },
      class: ['a', 'b']
    }
    const knode = render(h => (
      <div href="huhu"
        {...data}
        class={{ c: true }}
        on-click={() => calls.push(2)}
        hook-insert={() => calls.push(4)} />
    ))

    expect(knode.data.attrs.id).to.equal('hehe')
    expect(knode.data.attrs.href).to.equal('huhu')
    expect(knode.data.props.innerHTML).to.equal(2)
    expect(knode.data.class).to.deep.equal(['a', 'b', { c: true }])
    // merge handlers properly for on
    knode.data.on.click()
    expect(calls).to.deep.equal([1, 2])
    // merge hooks properly
    knode.data.hook.insert()
    expect(calls).to.deep.equal([1, 2, 3, 4])
  })

  it('custom directives', () => {
    const knode = render(h => (
      <div k-test={ 123 } v-other={ 234 } />
    ))

    expect(knode.data.directives.length).to.equal(2)
    expect(knode.data.directives[0]).to.deep.equal({ name: 'test', value: 123 })
    expect(knode.data.directives[1]).to.deep.equal({ name: 'other', value: 234 })
  })

  it('xlink:href', () => {
    const knode = render(h => (
      <use xlinkHref={'#name'}></use>
    ))

    expect(knode.data.attrs['xlink:href']).to.equal('#name')
  })

  it('merge class', () => {
    const knode = render(h => (
      <div class="a" {...{ class: 'b' }}/>
    ))

    expect(knode.data.class).to.deep.equal({ a: true, b: true })
  })

  it('h self-defining in object methods', () => {
    const obj = {
      method () {
        return <div>test</div>
      }
    }
    const knode = render(h => obj.method.call({ $createElement: h }))
    expect(knode.tag).to.equal('div')
    expect(knode.children[0].text).to.equal('test')
  })

  it('h self-defining in object getters', () => {
    const obj = {
      get computed () {
        return <div>test</div>
      }
    }
    const knode = render(h => {
      obj.$createElement = h
      return obj.computed
    })
    expect(knode.tag).to.equal('div')
    expect(knode.children[0].text).to.equal('test')
  })

  it('h self-defining in multi-level object getters', () => {
    const obj = {
      inherited: {
        get computed () {
          return <div>test</div>
        }
      }
    }
    const knode = render(h => {
      obj.inherited.$createElement = h
      return obj.inherited.computed
    })
    expect(knode.tag).to.equal('div')
    expect(knode.children[0].text).to.equal('test')
  })

  it('h self-defining in class methods', () => {
    class Test {
      constructor (h) {
        this.$createElement = h
      }
      render () {
        return <div>test</div>
      }
    }
    const knode = render(h => (new Test(h)).render(h))
    expect(knode.tag).to.equal('div')
    expect(knode.children[0].text).to.equal('test')
  })

  it('h self-defining in class getters', () => {
    class Test {
      constructor (h) {
        this.$createElement = h
      }
      get computed () {
        return <div>test</div>
      }
    }
    const knode = render(h => (new Test(h)).computed)
    expect(knode.tag).to.equal('div')
    expect(knode.children[0].text).to.equal('test')
  })

  it('h self-defining in methods with parameters', () => {
    class Test {
      constructor (h) {
        this.$createElement = h
      }
      notRender (notH) {
        return <div>{notH}</div>
      }
    }
    const knode = render(h => (new Test(h)).notRender('test'))
    expect(knode.tag).to.equal('div')
    expect(knode.children[0].text).to.equal('test')
  })
})

// helpers

function render (render) {
  return new Kdu({
    render
  })._render()
}

function createComponentInstanceForKnode (knode) {
  const opts = knode.componentOptions
  return new opts.Ctor({
    _isComponent: true,
    parent: opts.parent,
    propsData: opts.propsData,
    _componentTag: opts.tag,
    _parentKnode: knode,
    _parentListeners: opts.listeners,
    _renderChildren: opts.children
  })
}
