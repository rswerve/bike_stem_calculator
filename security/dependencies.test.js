import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { X509Certificate } from "node:crypto";
import { rootCertificates } from "node:tls";
import { SourceMapConsumer } from "source-map-js";
import { packages } from "../package-lock.json";

const loadPackage = createRequire(__filename);

test("Jest coverage includes app source and excludes generated output", () => {
  const jestBin = loadPackage.resolve("jest/bin/jest");
  const { configs } = JSON.parse(
    execFileSync(process.execPath, [jestBin, "--showConfig"], {
      cwd: path.resolve(__dirname, ".."),
      encoding: "utf8",
    }),
  );
  const { globsToMatcher } = loadPackage("jest-util");
  const includesSource = globsToMatcher(configs[0].collectCoverageFrom);

  expect(includesSource("components/FitCalculator/FitCalculator.tsx")).toBe(true);
  expect(includesSource("hooks/useDebounce.jsx")).toBe(true);
  expect(includesSource("pages/api/hello.js")).toBe(true);
  expect(includesSource(".next/server/pages/index.js")).toBe(false);
  expect(includesSource("coverage/lcov-report/sorter.js")).toBe(false);
});

test("Jest coverage discovers calculator source and excludes its tests", () => {
  const loadCoverageDependency = createRequire(
    loadPackage.resolve("babel-plugin-istanbul"),
  );
  const TestExclude = loadCoverageDependency("test-exclude");
  const files = new TestExclude({
    cwd: path.resolve(__dirname, ".."),
    include: ["components/FitCalculator/**"],
    exclude: ["**/*.test.tsx"],
    extension: [".tsx"],
  }).globSync();

  expect(files).toContain("components/FitCalculator/FitCalculator.tsx");
  expect(files).not.toContain("components/FitCalculator/FitCalculator.test.tsx");
});

const braceExpansionPaths = Object.keys(packages).filter((packagePath) =>
  packagePath.endsWith("/brace-expansion"),
);

describe.each(braceExpansionPaths)("%s", (packagePath) => {
  const moduleExports = loadPackage(path.resolve(__dirname, "..", packagePath));
  const expand = moduleExports.expand || moduleExports;

  test("expands ordinary patterns", () => {
    expect(expand("{a,b}.js")).toEqual(["a.js", "b.js"]);
  });

  test("bounds brace rewrites without relying on a timing threshold", () => {
    expect(expand("{a},b}", { maxRewrites: 0 })).toEqual(["{a},b}"]);
  });

  test("bounds brace rewrites when callers use the default options", () => {
    const pattern = "{a}" + "}".repeat(2000) + ",z}";
    expect(expand(pattern)).toEqual([pattern]);
  });

  test("handles deeply nested braces without overflowing the stack", () => {
    const pattern = "{".repeat(5000) + "a,b" + "}".repeat(5000);
    expect(() => expand(pattern)).not.toThrow();
  });

  test("handles comma groups with many nested braces without overflowing the stack", () => {
    const pattern = "{" + "{a}".repeat(20000) + ",b}";
    expect(expand(pattern)).toHaveLength(2);
  });
});

describe("source-map-js section offsets", () => {
  const sourceMap = {
    version: 3,
    sources: ["input.js"],
    names: [],
    mappings: "AAAA",
  };

  test.each([-1, 1.5, Infinity, 1e12])("rejects offset.line %s", (line) => {
    expect(
      () =>
        new SourceMapConsumer({
          version: 3,
          sections: [{ offset: { line, column: 0 }, map: sourceMap }],
        }),
    ).toThrow(/Section offset/);
  });

  test("accepts valid section offsets and preserves mapping positions", () => {
    const consumer = new SourceMapConsumer({
      version: 3,
      sections: [{ offset: { line: 2, column: 0 }, map: sourceMap }],
    });

    const mappings = [];
    consumer.eachMapping((mapping) => mappings.push(mapping));
    expect(mappings).toEqual([
      expect.objectContaining({
        source: "input.js",
        generatedLine: 3,
        generatedColumn: 0,
        originalLine: 1,
        originalColumn: 0,
      }),
    ]);
  });
});

test.each([
  "emSign ECC Root CA - G3",
  "emSign Root CA - C1",
  "emSign ECC Root CA - C3",
])("Node's bundled roots exclude %s after the eMudhra incident", (name) => {
  const subjects = rootCertificates.flatMap((pem) =>
    new X509Certificate(pem).subject.split("\n"),
  );
  expect(subjects).not.toContain(`CN=${name}`);
});
