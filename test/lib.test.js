/* eslint-disable */
let HtmlDiffer = require('html-differ').HtmlDiffer
let render = require('../src')
let differ = new HtmlDiffer()
let dif = (a, b) => expect(differ.isEqual(render(a), b)).toBeTruthy()

describe('tags', () => {
  test('', () => {
    let str = `
div
  Widget
`
    dif(str, `<div><Widget></Widget></div>`)
  })
})
