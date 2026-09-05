const test = require("node:test");
const assert = require("node:assert/strict");
const { buildStatusLines, getStartTimestampFromSession } = require("../statusUpdater.js");
const { userSessions } = require("../userSessions.js");

test("getStartTimestampFromSession extrage timestamp-ul din diversele forme de sesiune folosite în timp", () => {
  assert.equal(getStartTimestampFromSession(null), null);
  assert.equal(getStartTimestampFromSession(1700000000000), 1700000000000);
  assert.equal(getStartTimestampFromSession({ start: 123 }), 123);
  assert.equal(getStartTimestampFromSession({ startedAt: 456 }), 456);
  assert.equal(getStartTimestampFromSession({ timestamp: 789 }), 789);
  assert.equal(getStartTimestampFromSession({}), null);
});

test("buildStatusLines include doar membrii cu callsign [M-xxx] și arată starea corectă", () => {
  const members = new Map([
    ["1", { id: "1", nickname: "[M-001] Ana" }],
    ["2", { id: "2", nickname: "Fără callsign" }],
    ["3", { id: "3", displayName: "[M-003] Bogdan" }]
  ]);

  userSessions["1"] = Date.now();
  try {
    const lines = buildStatusLines(members);
    assert.equal(lines.length, 2);
    assert.ok(lines.some(l => l.includes("[M-001] Ana") && l.includes("PORNIT")));
    assert.ok(lines.some(l => l.includes("[M-003] Bogdan") && l.includes("OPRIT")));
    assert.ok(!lines.some(l => l.includes("Fără callsign")));
  } finally {
    delete userSessions["1"];
  }
});
