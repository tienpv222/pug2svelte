let lex = require('pug-lexer')
let parse = require('pug-parser')
let { CodeGenerator } = require('pug-code-gen')
let wrap = require('pug-runtime/wrap')

let _tag = /^([^(]*(\(?))(.*)/
let _tagEnd = /^(.*)(\)[^'"}]*(?: +.*|$))/
let _notTag = [
  /^[^\w#.]/,
  /^doctype/,
  /^(?:case|when|default)/,
  /^(?:if|else|each|while)/,
  /^(?:include|block|extends|append|mixin)/,
  /^\.\s*$/
]

function parseTag (str) {
  for (let e of _notTag)
    if (e.test(str)) return false

  let cap = str.match(_tag)
  let data = parseTagEnd(cap[3])
  return {
    ...data,
    pre: cap[1],
    hasTagEnd: !cap[2] || data.hasTagEnd
  }
}

function parseTagEnd (str) {
  let cap = str.match(_tagEnd)
  return {
    attrs: cap ? cap[1] : str,
    post: cap ? cap[2] : '',
    hasTagEnd: cap
  }
}

let _attrs = /(?:\w+|'.+?'|".+?")=(?:\w+|'.+?'|".+?"|{.*?})|'.+?'|".+?"|{.+?}|\w+/g
let _attrBlock = /^{.+}$/
let _attrValBlock = /^(.+=)({.+})$/

function parseAttrs (str) {
  let attrs = str.match(_attrs) || []

  attrs.forEach((e, i) => {
    if (_attrBlock.test(e)) {
      attrs[i] = `'${e}'`
    } else {
      let cap = e.match(_attrValBlock)
      cap && (attrs[i] = `${cap[1]}'${cap[2]}'`)
    }
  })

  return attrs.join(' ').trim()
}

function parseSBlock (str) {
  let cap = str.match(/^{([#:])(.+) ?.*/)
  return !cap
    ? false
    : {
      type: cap[2],
      newBlock: cap[1] === '#'
    }
}

function preprocess (str) {
  let rt = ''
  let sBlocks = []
  let toCloseSBlocks
  let tab
  let inTag

  // func to close svelte blocks which are outdented
  let closeSBlocks = () => {
    for (let e of toCloseSBlocks) {
      rt += `${e.indent}| {/${e.type}\n`
      sBlocks.pop()
    }
  }

  for (let line of str.match(/^.*$/gm)) {
    let cap = line.match(/^([ \t]*)(.*)$/)
    let indent = cap[1]
    let lineData = cap[2]

    // try to init tab size
    if (!tab) {
      if (indent[0] === ' ') tab = 2
      else if (indent[0] === '/t') tab = 1
    }

    // correct indent and set up
    // the svelte blocks to be closed
    toCloseSBlocks = []
    for (let e of sBlocks) {
      if (indent.length > e.indent.length)
        indent = indent.slice(0, -tab)
      else
        toCloseSBlocks.unshift(e)
    }

    // if currently inside a tag:
    // fix svelte typed attributes and
    // check if tag end
    if (inTag) {
      let data = parseTagEnd(lineData)
      let attrs = parseAttrs(data.attrs)
      rt += indent + attrs + data.post + '\n'
      data.hasTagEnd && (inTag = false)
      continue
    }

    // if it's a tag:
    // fix svelte typed attributes and
    // check if the tag extends to next lines
    let data = parseTag(lineData)
    if (data) {
      closeSBlocks()

      let attrs = parseAttrs(data.attrs)
      rt += indent + data.pre + attrs + data.post + '\n'
      data.hasTagEnd || (inTag = true)
      continue
    }

    // if it's a svelte block:
    // change block to pug plain text and
    // add to block stack if needed
    data = parseSBlock(lineData)
    if (data) {
      if (data.newBlock) {
        closeSBlocks()
        sBlocks.push({
          type: data.type,
          indent
        })
      }
      rt += indent + '| ' + lineData + '\n'
      continue
    }

    // if it's other pug object:
    // just copy paste
    rt += line + '\n'
  }

  return rt
}

let attrs = CodeGenerator.prototype.attrs

function render (str) {
  let gen = new CodeGenerator(parse(lex(preprocess(str))))
  gen.attrs = function () {
    this.terse = true
    return attrs.call(this, ...arguments)
  }
  return wrap(gen.compile())()
}

exports.render = render

// console.log(render(`
// p
//   {#if}
//     div({...})
//   {:else}
//     {#each}
//       p
//         to
//   {#await}
//     div
// `))

// console.log(a)
