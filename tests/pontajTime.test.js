const test = require("node:test");
const assert = require("node:assert/strict");
const { formatDuration, parsePontajLine, cellToSeconds } = require("../utils/pontajTime.js");

test("formatDuration formatează secundele în formatul de stocare XhYmZs", () => {
  assert.equal(formatDuration(0), "0h 0m 0s");
  assert.equal(formatDuration(59), "0h 0m 59s");
  assert.equal(formatDuration(60), "0h 1m 0s");
  assert.equal(formatDuration(3661), "1h 1m 1s");
  assert.equal(formatDuration(7124 * 3600 + 12 * 60 + 8), "7124h 12m 8s");
});

test("parsePontajLine face round-trip cu formatDuration (garantează că pontaj.csv rămâne citibil)", () => {
  for (const seconds of [0, 1, 59, 60, 3599, 3600, 3661, 86399, 25646728]) {
    const line = `user_test,${formatDuration(seconds)}`;
    const parsed = parsePontajLine(line);
    assert.ok(parsed, `linia "${line}" ar trebui să fie parsabilă`);
    assert.equal(parsed.username, "user_test");
    assert.equal(parsed.totalSeconds, seconds);
  }
});

test("parsePontajLine întoarce null pentru linii invalide, în loc să arunce o eroare", () => {
  assert.equal(parsePontajLine("linie_fara_virgula"), null);
  assert.equal(parsePontajLine("user,timp_invalid"), null);
  assert.equal(parsePontajLine(""), null);
});

test("cellToSeconds interpretează corect celulele din Google Sheets", () => {
  assert.equal(cellToSeconds(""), 0);
  assert.equal(cellToSeconds(null), 0);
  assert.equal(cellToSeconds(undefined), 0);
  assert.equal(cellToSeconds("45"), 45 * 60); // minute simple, fără unități
  assert.equal(cellToSeconds("1h 30m 0s"), 3600 + 1800);
  assert.equal(cellToSeconds("0h 0m 0s"), 0);
});
