let { Lexer } = require('pug-lexer')
let parse = require('pug-parser')
let { CodeGenerator } = require('pug-code-gen')
let wrap = require('pug-runtime/wrap')

let overwrite = require('./overwrite')

// let lexer = new Lexer(`
// p
//   {#if}
//     div
//       a
//   p
// `)

let lexer = new Lexer(`
div({a})
  tip
  {$if1}
    ton
    {hai}
      inside-hao
  grap
`)

overwrite({ lexer })

let lex = JSON.parse(JSON.stringify(lexer.getTokens()))
// console.log(JSON.stringify(lex, null, 2))
// console.log(JSON.stringify(parse(lex), null, 2))

let gen = new CodeGenerator(parse(lex), { pretty: true })
overwrite({ gen })
let funcStr = gen.compile()
let func = wrap(funcStr)
console.log(func())
