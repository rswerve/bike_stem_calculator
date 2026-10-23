import path from "node:path";
import { createRequire } from "node:module";
import { X509Certificate } from "node:crypto";
import { rootCertificates } from "node:tls";
import { SourceMapConsumer } from "source-map-js";
import { packages } from "../package-lock.json";

const loadPackage = createRequire(__filename);

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
