/* eslint-disable no-undef */
let HtmlDiffer = require('html-differ').HtmlDiffer
let render = require('../src')
let differ = new HtmlDiffer()
let dif = (a, b) => expect(differ.isEqual(render(a), b)).toBeTruthy()

describe('tag', () => {
  test('', () => {
    let str = `
div
  Widget
`
    dif(str, `<div><Widget></Widget></div>`)
  })
})

describe('attribute', () => {
  test('contain js expression', () => {
    let str = `a(href='page/{p}') page {p}`
    dif(str, `<a href='page/{p}'>page {p}</a>`)
  })

  test('be js expression', () => {
    let str = `button(disabled={!clickable}) ...`
    dif(str, `<button disabled={!clickable}>...</button>`)
  })

  test('attribute name matches value', () => {
    let str = `button({disabled}) ...`
    dif(str, `<button {disabled}>...</button>`)
  })

  test('spread attributes', () => {
    let str = `Widget({...things})`
    dif(str, `<Widget {...things}></Widget>`)
  })
})
