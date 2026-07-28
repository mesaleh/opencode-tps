// Compiles tps.tsx into dist/tps.js with the Solid "universal" JSX transform.
//
// This has to happen at publish time, not load time. OpenCode used to run
// @opentui/solid's Bun transform plugin over every .tsx it imported, including
// plugin sources inside node_modules. Since @opentui/solid 0.4.x that plugin
// skips node_modules, so an npm-installed plugin shipping raw .tsx never gets
// the Solid transform and fails to import. Shipping pre-transformed JS keeps
// the package independent of whichever transform the host applies.
//
// The emitted imports ("@opentui/solid", "solid-js") stay as bare specifiers on
// purpose: OpenCode rewrites them to its own runtime instances, so the plugin
// must not bundle or resolve its own copies.

import { transformAsync } from "@babel/core"
import ts from "@babel/preset-typescript"
import solid from "babel-preset-solid"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const source = path.join(root, "tps.tsx")
const target = path.join(root, "dist", "tps.js")

const code = await readFile(source, "utf8")
const result = await transformAsync(code, {
  filename: source,
  configFile: false,
  babelrc: false,
  presets: [
    [solid, { moduleName: "@opentui/solid", generate: "universal" }],
    [ts, { isTSX: true, allExtensions: true }],
  ],
})

if (!result?.code) throw new Error("Solid transform produced no output")

await mkdir(path.dirname(target), { recursive: true })
await writeFile(target, result.code + "\n", "utf8")

console.log(`built ${path.relative(root, target)} (${result.code.length} bytes)`)
