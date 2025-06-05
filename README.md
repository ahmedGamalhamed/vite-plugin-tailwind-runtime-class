## Features
- ✅ No runtime performance hit, its just an extra step at build time.
- 🔍 Automatically scans files for runtime class definitions
- 🔄 Hot reload support during development
- 📦 Generates JSON output for Tailwind CSS consumption
- ⚡ Fast file watching with hash-based change detection
- 🎯 Configurable include/exclude patterns

## ⚠️ CRITICAL REQUIREMENT

**The function name MUST be exactly `generateRuntimeClass` and CANNOT be changed, renamed, or aliased. The plugin specifically scans for this exact function name in your code. Using any other name will cause the plugin to fail silently.**

```typescript
// ✅ CORRECT - Plugin will detect this
const classes = generateRuntimeClass({ ... });

// ❌ WRONG - Plugin will NOT detect these
const classes = myCustomName({ ... });
const generateClasses = generateRuntimeClass;
const classes = generateClasses({ ... });
import { generateRuntimeClass as genClass } from '...';
const classes = genClass({ ... });
```

## Installation

```bash
npm install vite-plugin-tailwind-runtime-class
# or
yarn add vite-plugin-tailwind-runtime-class
# or
pnpm add vite-plugin-tailwind-runtime-class
```

## Usage

### Vite Configuration

Add the plugin to your `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import tailwindRuntimeClassGenerator from "vite-plugin-tailwind-runtime-class";

export default defineConfig({
 plugins: [
  tailwindRuntimeClassGenerator({
   include: ["src/**/*"],
   exclude: ["node_modules"],
   outPutPath: "./tailwind-runtime-classes.json",
  }),
 ],
});
```

if you are using typescript, add type definitions to your `typescript.json` or `typescript.app.json`

```json
include: ["src", ..., "node_modules/vite-plugin-tailwind-runtime-class/dist/virtual-module.d.d.ts"]

```

### In Your Code

Use the virtual module to generate runtime classes:

```typescript
import { generateRuntimeClass } from "virtual:vite-plugin-tailwind-runtime-class";

const runtimeClasses = generateRuntimeClass({
 default: "bg-blue-500 text-white",
 sm: "bg-red-500",
 lg: "bg-green-500 text-black",
});

console.log(runtimeClasses.runtimeClass);
// Output: "bg-blue-500 text-white sm:bg-red-500 lg:bg-green-500 lg:text-black"
```

## Options

| Option       | Type       | Default                                       | Description                                   |
| ------------ | ---------- | --------------------------------------------- | --------------------------------------------- |
| `include`    | `string[]` | `[]`                                          | File patterns to include (default: all files) |
| `exclude`    | `string[]` | `['node_modules']`                            | File patterns to exclude                      |
| `outPutPath` | `string`   | `'./vite-plugin-tailwind-runtime-class.json'` | Output file location for Tailwind to pickup   |

## How It Works

1. The plugin scans your files for calls to `generateRuntimeClass()`
2. Extracts the class definitions from the function calls
3. Generates responsive classes by prefixing with breakpoint names
4. Writes the results to a JSON file that Tailwind can consume
5. Watches for file changes and updates the classes in real-time

## Example

Input:

```typescript
const classes = generateRuntimeClass({
 default: "p-4 bg-white",
 md: "p-6",
 lg: "p-8 bg-gray-100",
});
```

Generated classes:

```
p-4 bg-white md:p-6 lg:p-8 lg:bg-gray-100
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Issues

If you find any bugs or have feature requests, please create an issue on [GitHub](https://github.com/yourusername/vite-plugin-tailwind-runtime-class/issues).
