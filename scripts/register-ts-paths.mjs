import { register } from "node:module";

/** Lets check scripts import lib/*.ts files that use extensionless relative paths. */
const href =
  "data:text/javascript," +
  encodeURIComponent(`
    export async function resolve(specifier, context, nextResolve) {
      if (specifier.startsWith(".") && !/\\.[a-zA-Z0-9]+$/.test(specifier)) {
        return nextResolve(specifier + ".ts", context);
      }
      return nextResolve(specifier, context);
    }
  `);

register(href, import.meta.url);
