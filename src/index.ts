import { createHash } from 'node:crypto';
import { relative } from 'node:path';
import { readFileSync, statSync, writeFileSync } from 'fs';
import { createFilter, type Plugin } from 'vite';
import glob from 'fast-glob';

const VITE_PLUGIN_NAME = 'vite-plugin-tailwind-runtime-class';

export interface FileChangeLoggerOptions {
  /** File patterns to include (default: all files) */
  include?: string[];
  /** File patterns to exclude (default: node_modules, .git, dist) */
  exclude?: string[];
  /** output file location for tailwind to pickup */
  outPutPath?: string;
}

const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
} as const;

export default function tailwindRuntimeClassGenerator({
  exclude = ['node_modules'],
  include = [],
  outPutPath = `./${VITE_PLUGIN_NAME}.json`,
}: FileChangeLoggerOptions = {}): Plugin {
  const VIRTUAL_MODULE_ID = `virtual:${VITE_PLUGIN_NAME}`;
  const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;

  const filter = createFilter(include, exclude);
  const relativeOutputPath = toRelativePath(outPutPath);
  const fileHashes = new Map<string, string>();
  const classMap: Record<string, string> = {};

  function writeClassObjToDesk(classObj: Record<string, string>) {
    writeFileSync(relativeOutputPath, JSON.stringify(classObj, null, 2));
  }

  function extractRuntimeClassFromFile(filePath: string): Record<
    string,
    string
  > & {
    runtimeClass: string;
  } {
    let result = {
      runtimeClass: '',
    };

    try {
      const content = readFileSync(filePath, 'utf-8');
      if (!content.includes(VIRTUAL_MODULE_ID)) return result;

      const regex = new RegExp(
        `${generateRuntimeClass.name}\\s*\\(\\s*({[\\s\\S]*?})\\s*\\)`,
      );

      const match = content.match(regex);
      if (!match || !match[1]) return result;

      const jsonStr = match[1]
        .replace(/(\w+):/g, '"$1":')
        .replace(/'/g, '"')
        .replace(/,\s*}/, '}');

      const obj = JSON.parse(jsonStr) as Record<string, string>;
      const runtimeClass = generateRuntimeClass(obj);
      return runtimeClass;
    } catch (e) {
      console.error(e);
      return result;
    }
  }

  async function processAllFiles() {
    console.time('Processed All files');
    console.log(
      `${colors.blue}🔄 Scanning for runtime classes...${colors.reset}`,
    );

    try {
      const allFiles = glob.sync(include);
      let processedCount = 0;

      for (const filePath of allFiles) {
        const fileInfo = getFileInfo(filePath);
        if (fileInfo && fileInfo.hash) {
          fileHashes.set(filePath, fileInfo.hash);
          const runtimeResult = extractRuntimeClassFromFile(filePath);

          if (runtimeResult.runtimeClass.trim()) {
            classMap[filePath] = runtimeResult.runtimeClass;
            processedCount++;
          }
        }
      }

      writeClassObjToDesk(classMap);
      console.log(
        `${colors.green}✅ Found ${processedCount} files with runtime classes${colors.reset}`,
      );

      if (processedCount > 0) {
        console.log(
          `${colors.cyan}📄 Classes written to: ${outPutPath}${colors.reset}`,
        );
      }
      console.timeEnd('Processed All files');
    } catch (error) {
      console.error(
        `${colors.red}❌ Error during initial scan:${colors.reset}`,
        error,
      );
    }
  }

  return {
    name: VIRTUAL_MODULE_ID,

    resolveId(source: string): string | undefined {
      if (
        source === VIRTUAL_MODULE_ID ||
        source.startsWith(`${VIRTUAL_MODULE_ID}?v=`)
      ) {
        return RESOLVED_VIRTUAL_MODULE_ID;
      }
      return undefined;
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        return `export ${generateRuntimeClass.toString()}`;
      }
    },

    handleHotUpdate({ file }) {
      const rel = toRelativePath(file);
      if (rel === relativeOutputPath) {
        return [];
      }
    },

    configureServer(server) {
      console.log(
        `${colors.green}🔍 Runtime tailwind class generator activated${colors.reset}`,
      );

      const watcher = server.watcher;
      watcher.on('change', (filePath: string) => {
        const relativePath = toRelativePath(filePath);
        if (relativePath === relativeOutputPath || !filter(filePath)) return;

        const fileInfo = getFileInfo(filePath);
        if (fileInfo && fileInfo.hash) {
          const oldHash = fileHashes.get(filePath);

          if (fileInfo.hash === oldHash) return;

          fileHashes.set(relativePath, fileInfo.hash);
          const { runtimeClass } = extractRuntimeClassFromFile(filePath);
          const oldValue = classMap[filePath];
          if (oldValue !== runtimeClass) {
            classMap[filePath] = runtimeClass;
            writeClassObjToDesk(classMap);
          }
        }
      });
    },

    buildStart() {
      console.log(
        `${colors.cyan}🚀 Starting runtime class generation...${colors.reset}`,
      );

      processAllFiles();

      if (process.env.NODE_ENV === 'development') {
        console.log(
          `${colors.yellow}📦 Dev: Runtime tailwind class generator is listening for changes${colors.reset}`,
        );
      }
    },
  };
}

function getFileInfo(filePath: string): { hash: string; size: number } | null {
  try {
    const content = readFileSync(filePath, 'utf8');
    return {
      hash: getFileHash(content),
      size: Buffer.byteLength(content, 'utf8'),
    };
  } catch (error) {
    try {
      const stats = statSync(filePath);
      return {
        hash: '',
        size: stats.size,
      };
    } catch {
      return null;
    }
  }
}

function getFileHash(content: string): string {
  return createHash('md5')
    .update(content, 'utf8')
    .digest('hex')
    .substring(0, 8);
}

function generateRuntimeClass(obj: Record<string, string>) {
  let runtimeClass = '';

  Object.entries(obj).forEach(([size, className]) => {
    runtimeClass +=
      (className as string)
        .split(' ')
        .map((c) => (size === 'default' ? c : `${size}:${c}`))
        .join(' ') + ' ';
  });

  return {
    ...obj,
    runtimeClass,
  };
}

function toRelativePath(path: string) {
  return relative(process.cwd(), path);
}
