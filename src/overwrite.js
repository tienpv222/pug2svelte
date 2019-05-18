let { Lexer } = require('pug-lexer')
let { CodeGenerator } = require('pug-code-gen')
let characterParser = require('character-parser')

module.exports = ({ lexer, gen }) => {
  if (lexer) {
    lexer.svelteBlocks = []
    lexer.advance = advance
    lexer.attributeValue = attributeValue
    lexer.indent = indent
    lexer.closeSBlock = closeSBlock
  }

  if (gen)
    gen.attrs = attrs
}

function svelteBlock () {
  let cap = /^{([#:])(\w+).*} *\n/.exec(this.input)
  if (!cap) return false

  let val = cap[0]
  let tok = this.tok('text', val.trim())
  cap[1] === '#' && this.svelteBlocks.push({ colno: this.colno, type: cap[2] })
  this.consume(val.length - 1)
  this.incrementColumn(val.length - 1)
  this.tokEnd(tok)
  this.tokens.push(tok)

  return true
}

function closeSBlock () {
  let block = this.svelteBlocks.pop()
  let val = `{/${block.type}}`
  this.tokens.push({
    type: 'text',
    loc: {
      start: { line: this.lineno, column: block.colno },
      end: { line: this.lineno, column: block.colno + val.length }
    },
    val
  })
  this.incrementLine(1)
}

function indent () {
  let captures = this.scanIndentation()
  let tok
  console.log('------')

  if (captures) {
    // ADD //
    let tabSize = this.input[1] === '\t' ? 1 : 2

    let indents = captures[1].length
    this.incrementLine(1)
    this.consume(indents + 1)

    if (this.input[0] === ' ' || this.input[0] === '\t')
      this.error('INVALID_INDENTATION', 'Invalid indentation, you can use tabs or spaces but not both')

    // blank line
    if (this.input[0] === '\n') {
      this.interpolationAllowed = true
      return this.tokEnd(this.tok('newline'))
    }

    // ADD //
    let closedSBlocks = []
    for (let e of this.svelteBlocks) {
      if ((indents + 1) > e.colno)
        indents -= tabSize
      else
        closedSBlocks.unshift(e)
    }

    // outdent
    if (indents < this.indentStack[0]) {
      /* ADD */
      let _indentStack = closedSBlocks.length ? this.indentStack.slice(1) : []
      // let blocksToOut = this.svelteBlocks.filter(e => (indents + 1) <= e.colno)
      // let i = blocksToOut.length - 1
      // if (blocksToOut[i] && this.indentStack[0] < blocksToOut[i].colno) {
      //   while (true) {
      //     this.tokens.push({
      //       type: 'newline',
      //       loc: {
      //         start: { line: this.lineno, column: 1 },
      //         end: { line: this.lineno, column: blocksToOut[i].colno }
      //       }
      //     })
      //     this.closeSvelteBlock()
      //     i--

      //     let block = blocksToOut.pop()
      //     let preBlock = blocksToOut[i]
      //     if (!preBlock || preBlock.colno !== block.colno)
      //       break
      //   }
      // }
      let outdentCount = 0
      while (this.indentStack[0] > indents) {
        if (this.indentStack[1] < indents)
          this.error('INCONSISTENT_INDENTATION', 'Inconsistent indentation. Expecting either ' + this.indentStack[1] + ' or ' + this.indentStack[0] + ' spaces/tabs.')

        outdentCount++
        this.indentStack.shift()
      }

      while (outdentCount--) {
        this.colno = 1
        tok = this.tok('outdent')
        this.colno = this.indentStack[0] + 1
        this.tokens.push(this.tokEnd(tok))

        /* ADD */
        if (closedSBlocks.length) {
          let _indent = _indentStack.shift()
          let block = closedSBlocks[0]
          tok.loc.end.column = block.colno

          if (block.colno === _indent + 1) {
            while (true) {
              // console.log('inwhile')
              // console.log(_indent)
              this.closeSBlock()
              closedSBlocks.shift()
              block = closedSBlocks[0]

              if (block && block.colno === _indent + 1) {
                tok = this.tok('newline')
                this.lineno = block.colno
                this.tokens.push(this.tokEnd(tok))
              } else { break }
            }
          }
        }

        // /* ADD */
        // if (i >= 0) {
        //   tok.loc.end.column = blocksToOut[i].colno
        //   if (!blocksToOut[i].outdent--) {
        //     this.closeSvelteBlock()
        //     i--
        //   }
        // }
      }
    // indent
    } else if (indents && indents !== this.indentStack[0]) {
      tok = this.tok('indent', indents)
      this.colno = 1 + indents
      this.tokens.push(this.tokEnd(tok))
      this.indentStack.unshift(indents)
    // newline
    } else {
      tok = this.tok('newline')
      this.colno = 1 + Math.min(this.indentStack[0] || 0, indents)
      this.tokens.push(this.tokEnd(tok))

      // ADD //
      // if (closeSvelteBlock && !/^{:/.test(this.input)) {
      let _colno = this.colno
      closedSBlocks.forEach(() => {
        this.closeSBlock()
        tok = this.tok('newline')
        this.colno = _colno
        this.tokens.push(this.tokEnd(tok))
      })
    }

    this.interpolationAllowed = true
    return true
  }
}

let _advance = Lexer.prototype.advance
function advance () {
  return svelteBlock.call(this)
    || _advance.call(this)
}

let _attrs = CodeGenerator.prototype.attrs
function attrs () {
  this.terse = true
  return _attrs.call(this, ...arguments)
}

// Borrow from pug & change some codes
function attributeValue (str) {
  let quoteRe = /['"]/
  let val = ''
  let done, i, x
  let escapeAttr = true
  let state = characterParser.defaultState()
  let col = this.colno
  let line = this.lineno

  // consume all whitespace before the equals sign
  for (i = 0; i < str.length; i++) {
    if (!this.whitespaceRe.test(str[i])) break
    if (str[i] === '\n') {
      line++
      col = 1
    } else {
      col++
    }
  }

  if (i === str.length)
    return { remainingSource: str }

  if (str[i] === '!') {
    escapeAttr = false
    col++
    i++
    if (str[i] !== '=') this.error('INVALID_KEY_CHARACTER', 'Unexpected character ' + str[i] + ' expected `=`')
  }

  if (str[i] !== '=')
  // check for anti-pattern `div("foo"bar)`
  {
    if (i === 0 && str && !this.whitespaceRe.test(str[0]) && str[0] !== ',')
      this.error('INVALID_KEY_CHARACTER', 'Unexpected character ' + str[0] + ' expected `=`')
    else
      return { remainingSource: str }
  }

  this.lineno = line
  this.colno = col + 1
  i++

  // consume all whitespace before the value
  for (; i < str.length; i++) {
    if (!this.whitespaceRe.test(str[i])) break
    if (str[i] === '\n')
      this.incrementLine(1)
    else this.incrementColumn(1)
  }

  line = this.lineno
  col = this.colno

  // start looping through the value
  for (; i < str.length; i++) {
    // if the character is in a string or in parentheses/brackets/braces
    if (!(state.isNesting() || state.isString())) {
      if (this.whitespaceRe.test(str[i])) {
        done = false

        // find the first non-whitespace character
        for (x = i; x < str.length; x++) {
          if (!this.whitespaceRe.test(str[x])) {
          // ORIGIN //
          // // if it is a JavaScript punctuator, then assume that it is
          // // a part of the value
          // if ((!characterParser.isPunctuator(str[x]) || quoteRe.test(str[x]) || str[x] === ':') && this.assertExpression(val, true)) {
          //   done = true;
          // }
          // OVERWRITE //
            if (str[x] === '{' || !characterParser.isPunctuator(str[x]) || quoteRe.test(str[x]) || str[x] === ':')
              done = /^{.*}$/.test(val) || this.assertExpression(val, true)

            break
          }
        }

        // if everything else is whitespace, return now so last attribute
        // does not include trailing whitespace
        if (done || x === str.length) break
      }

      // if there's no whitespace and the character is not ',', the
      // attribute did not end.
      if (str[i] === ',' && this.assertExpression(val, true)) break
    }

    state = characterParser.parseChar(str[i], state)
    val += str[i]

    if (str[i] === '\n') {
      line++
      col = 1
    } else {
      col++
    }
  }

  // ADD //
  /^{.*}$/.test(val) && (val = `'${val}'`)

  this.assertExpression(val)
  this.lineno = line
  this.colno = col

  return { val, mustEscape: escapeAttr, remainingSource: str.substr(i) }
}
