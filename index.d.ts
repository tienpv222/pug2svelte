/**
 * Render a svelte-pug template into html
 */
export default function pug2svelte (
  str: string,
  options: {
    htmlTemplate: boolean
  }): string
