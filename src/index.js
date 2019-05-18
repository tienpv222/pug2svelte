let { Lexer } = require('pug-lexer')
let parse = require('pug-parser')
let { CodeGenerator } = require('pug-code-gen')
let wrap = require('pug-runtime/wrap')
let overwrite = require('./overwrite')

function render (str) {
  let lexer = new Lexer(str)
  overwrite({ lexer })
  let lex = JSON.parse(JSON.stringify(lexer.getTokens()))
  let gen = new CodeGenerator(parse(lex))
  overwrite({ gen })
  let funcStr = gen.compile()
  let func = wrap(funcStr)
  return func()
}

module.exports = render
