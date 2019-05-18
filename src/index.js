let { Lexer } = require('pug-lexer')
let parse = require('pug-parser')
let { CodeGenerator } = require('pug-code-gen')
let wrap = require('pug-runtime/wrap')
let overwrite = require('./overwrite')
let pug = require('pug')

function render (str) {
  let lexer = new Lexer(str)
  overwrite({ lexer })
  let lex = JSON.parse(JSON.stringify(lexer.getTokens()))
  // let _lex = Object.values(lex).map(e => ({
  //   typ: e.type,
  //   sta: e.loc.start.line + ' - ' + e.loc.start.column,
  //   end: e.loc.end.line + ' - ' + e.loc.end.column,
  //   val: e.val
  // }))
  // console.log(JSON.stringify(_lex, null, 2))
  let gen = new CodeGenerator(parse(lex), { pretty: true })
  overwrite({ gen })
  let funcStr = gen.compile()
  let func = wrap(funcStr)
  return func()
}

module.exports = render

// console.log(render(`
// p
//   {#if}
//     div
//       {#await}
//         div2
//           div3
//     span
// `))
// `
// p
//   {#if}
//   div
//     {#await}
//     div2
//       div3
//   span
// `

function preprocess (str) {
  return str
}

function render2 (str) {
  // console.log(pug.render(preprocess(str)))
}

console.log(preprocess(`
p
  {#if}
    div
      {#await}
        div2
          div3
    span
`))
