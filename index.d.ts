/**
 * Render a svelte-pug template into html
 */
export function render(
  str: string,
  options: {
    pretty: boolean
  }): string