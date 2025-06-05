declare module 'virtual:vite-plugin-tailwind-runtime-class' {
  /**
   * Generates a responsive Tailwind CSS class string from an object
   * where keys represent screen sizes (e.g., 'default', 'sm', 'md', etc.)
   * and values are space-separated Tailwind CSS class names.
   *
   * The returned object includes a `runtimeClass` string which
   * contains all the class names prefixed for responsive usage.
   *
   * @param prefixesObject - An object mapping prefixes keys to class strings.
   *                   The special key `'default'` is used for non-prefixed classes.
   *
   * @returns The original object with an added `runtimeClass` property.
   */
  export function generateRuntimeClass<
    T extends Record<string, string> & {
      default?: string;
    },
  >(prefixesObject: T): T & { runtimeClass: string };
}
