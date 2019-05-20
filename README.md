# pug2svelte
[![Build Status](https://travis-ci.org/pynnl/pug2svelte.svg?branch=master)](https://travis-ci.org/pynnl/pug2svelte)
[![npm version](https://badge.fury.io/js/pug2svelte.svg)](https://badge.fury.io/js/pug2svelte)

Use svelte with pug syntax.

*Experimental*

## Install
```
npm i -D pug pug2svelte@latest
```
```javascript
let pug2svelte = require('pug2svelte')

pug2svelte('p Hello World!')
// <p> Hello World!</p>
```
## Supported Svelte syntaxes
```javascript
// attribute
a(href='page/{p}') page {p}

button(disable={!clickable})
button(disable='{number === 42}')
button({disable})
button(on:click|once={handler})

// spread attributes
Widget({...things})

// if
{#if answer === 42}
  p what was the question?
  
// if else
{#if porridge.temperature > 100}
  p too hot!
{:else if 80 > porridge.temperature}
  p too cold!
{:else}
  p just right!
  
// other svelte blocks
{#each todos as todo}
  p {todo.text}
{:else}
  p No tasks today!

{#await promise}
  p waiting for the promise to resolve...
{:then value}
  p The value is {value}
{:catch error}
  p Something went wrong: {error.message}
  
// nested blocks
div1
  {#if}
    div2
    {#each}
      {#await}

// <div1>
//   {#if}
//     <div2></div2>
//     {#each}
//       {#await}
//       {/await}
//     {/each}
//   {#if}
// </div1>
```

## Use with Rollup
```javascript
// rollup.config.js
import svelte from 'rollup-plugin-svelte'
import pug2svelte from 'pug2svelte'

export default {
  plugins: [
    svelte({
      extensions: ['.svelte', '.pug'],
      preprocess: {
        markup: ({ content }) => ({ code: pug2svelte(content) })
      },
      ...
    })
  ]
}
```
```javascript
// app.pug | app.svelte
p Hello {name}!

script.
  let name = 'World'

// Hello World!
```

## Parse from Html template
```javascript
// rollup.config.js
...
markup: ({ content }) => ({ code: pug2svelte(content, { html: true }) }),
...
```
```vue
<!-- app.svelte -->
<template>
p Hello {name}!
</template>

<script>
let name = 'World'
</script>
```

## Pug render options
You can also pass any [options](https://pugjs.org/api/reference.html#options) of `pug.render()`
```javascript
pug2svelte(content, {
  pretty: true
  })
```

## License
[**MIT**](https://github.com/pynnl/pug2svelte/blob/master/LICENSE)
