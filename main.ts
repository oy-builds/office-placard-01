import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const entryPath = new URL("./entry.txt", import.meta.url).pathname;
let text = readFileSync(entryPath, "utf8");

// Strip one trailing newline (and a preceding carriage return, if any).
if (text.endsWith("\n")) text = text.slice(0, -1);
if (text.endsWith("\r")) text = text.slice(0, -1);

const MAX_CHARS = 180;

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function validatePlacard(text: string): void {
  if (text.length === 0 || text.length > MAX_CHARS) {
    fail(`entry must be 1-${MAX_CHARS} characters, got ${text.length}`);
  }
  if (text.trim().length === 0) {
    fail("entry must not be only whitespace");
  }
  if (text.includes("\0")) {
    fail("entry must not contain NUL characters");
  }
  if (text.includes("\n") || text.includes("\r")) {
    fail("entry must be a single line");
  }
}

validatePlacard(text);

const outputTarget = process.env.MAKEFUN_OUTPUT_DIR ?? "/output/entry.txt";
// MAKEFUN_OUTPUT_DIR is a directory (the grader sets it to /output); only
// treat the value as a file path when it already names the entry file.
const outPath = outputTarget.endsWith("entry.txt")
  ? outputTarget
  : join(outputTarget, "entry.txt");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, text, "utf8");

const roundTrip = readFileSync(outPath, "utf8");
if (roundTrip !== text) {
  console.error("round-trip verification failed: output differs from entry");
  process.exit(1);
}
if (roundTrip.length !== text.length) {
  console.error("round-trip verification failed: character length mismatch");
  process.exit(1);
}
if (Buffer.byteLength(roundTrip, "utf8") !== Buffer.byteLength(text, "utf8")) {
  console.error("round-trip verification failed: byte length mismatch");
  process.exit(1);
}

console.log(`wrote ${text.length} chars (${Buffer.byteLength(text, "utf8")} bytes) to ${outPath} (round-trip verified)`);
