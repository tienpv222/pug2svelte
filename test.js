let lex = require('pug-lexer')

let obj = lex(`
div
  p({kj})
    a
  h
`)

// console.log(JSON.stringify(obj, null, 2)) 