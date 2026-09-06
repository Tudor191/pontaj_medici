const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { readJsonFile } = require("../utils/safeJson.js");

function tempFile(content) {
  const file = path.join(os.tmpdir(), `safejson-test-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  if (content !== null) fs.writeFileSync(file, content, "utf8");
  return file;
}

test("readJsonFile întoarce fallback dacă fișierul nu există", () => {
  const missing = path.join(os.tmpdir(), "safejson-nu-exista.json");
  assert.deepEqual(readJsonFile(missing, { count: 0 }), { count: 0 });
});

test("readJsonFile întoarce fallback dacă fișierul e gol (exact bug-ul raportat: sessions.json golit manual)", () => {
  const file = tempFile("");
  try {
    assert.deepEqual(readJsonFile(file, {}), {});
  } finally {
    fs.unlinkSync(file);
  }
});

test("readJsonFile întoarce fallback dacă fișierul are JSON invalid, nu aruncă", () => {
  const file = tempFile("{ nume: fara ghilimele, ");
  try {
    assert.deepEqual(readJsonFile(file, { ephemeral: false }), { ephemeral: false });
  } finally {
    fs.unlinkSync(file);
  }
});

test("readJsonFile parsează normal un fișier valid", () => {
  const file = tempFile(JSON.stringify({ count: 42 }));
  try {
    assert.deepEqual(readJsonFile(file, { count: 0 }), { count: 42 });
  } finally {
    fs.unlinkSync(file);
  }
});
