import ts from "typescript";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cache = new Map();

function compile(file) {
  const source = readFileSync(file, "utf8");
  return ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
}

/**
 * 加载项目内 TypeScript 模块（支持 @/ 路径别名），供 node:test 直接使用。
 */
export function loadModule(spec) {
  if (cache.has(spec)) return cache.get(spec).exports;
  const file = spec.startsWith("@/") ? path.join(root, `${spec.slice(2)}.ts`) : path.join(root, spec);
  const code = compile(file);
  const module = { exports: {} };
  cache.set(spec, module);
  const requireShim = (dependency) => {
    if (dependency.startsWith("@/")) return loadModule(dependency);
    throw new Error(`Unsupported import in test loader: ${dependency}`);
  };
  Function("require", "module", "exports", code)(requireShim, module, module.exports);
  return module.exports;
}
