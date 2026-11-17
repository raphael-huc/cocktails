/*
 * Architecture rules, checked by `pnpm arch`.
 *
 * src/modules/<module>/
 *   domain/       business types and rules, plain TypeScript
 *   http/         the only code that talks to Directus
 *   application/  queries, mutations, cache: links http to ui
 *   ui/           React components of the module
 *   index.ts      the only entry point for the rest of the code
 */

const MODULE = "^src/modules/[^/]+";

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment: "Circular dependencies make modules impossible to reason about in isolation.",
      from: {},
      to: { circular: true, viaOnly: { dependencyTypesNot: ["type-only"] } },
    },
    {
      name: "domain-is-pure",
      severity: "error",
      comment:
        "domain/ may only import other domain/ code: no React, no Directus, no cache, no shared code.",
      from: { path: `${MODULE}/domain/`, pathNot: "\\.test\\.ts$" },
      to: { pathNot: `${MODULE}/domain/` },
    },
    {
      name: "http-knows-no-react",
      severity: "error",
      comment: "http/ returns domain types and knows nothing about React, the cache or the UI.",
      from: { path: `${MODULE}/http/` },
      to: {
        path: [
          `${MODULE}/(application|ui)/`,
          "^src/app/",
          "packages/ui/",
          "node_modules/(react|react-dom|@tanstack)/",
        ],
      },
    },
    {
      name: "application-knows-no-ui",
      severity: "error",
      comment: "application/ exposes hooks and query options, never components.",
      from: { path: `${MODULE}/application/` },
      to: { path: [`${MODULE}/ui/`, "^src/app/", "packages/ui/"] },
    },
    {
      name: "ui-goes-through-application",
      severity: "error",
      comment: "ui/ never calls the backend itself: it goes through application/.",
      from: { path: `${MODULE}/ui/` },
      to: {
        path: [`${MODULE}/http/`, "^src/shared/http/", "^src/app/", "node_modules/@directus/"],
      },
    },
    {
      name: "modules-expose-a-public-api",
      severity: "error",
      comment: "Another module is imported through its index.ts, never through its internals.",
      from: { path: "^src/modules/([^/]+)/(http|application|ui)/" },
      to: {
        path: "^src/modules/",
        pathNot: ["^src/modules/$1/", `${MODULE}/index\\.ts$`],
      },
    },
    {
      name: "app-uses-public-apis",
      severity: "error",
      comment: "Routes and layout import modules through their index.ts.",
      from: { path: "^src/app/" },
      to: { path: "^src/modules/", pathNot: `${MODULE}/index\\.ts$` },
    },
    {
      name: "shared-is-independent",
      severity: "error",
      comment: "shared/ is technical code with no business knowledge.",
      from: { path: "^src/shared/" },
      to: { path: "^src/(modules|app)/" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: ["^src/app/routeTree\\.gen\\.ts$", "^src/shared/i18n/paraglide/"] },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
      mainFields: ["module", "main", "types", "typings"],
    },
  },
};
