const test = require("node:test");
const assert = require("node:assert/strict");
const { buildStatusLines, getStartTimestampFromSession, pruneRecentlyStopped } = require("../statusUpdater.js");
const { userSessions, recentlyStopped } = require("../userSessions.js");

test("getStartTimestampFromSession extrage timestamp-ul din diversele forme de sesiune folosite în timp", () => {
  assert.equal(getStartTimestampFromSession(null), null);
  assert.equal(getStartTimestampFromSession(1700000000000), 1700000000000);
  assert.equal(getStartTimestampFromSession({ start: 123 }), 123);
  assert.equal(getStartTimestampFromSession({ startedAt: 456 }), 456);
  assert.equal(getStartTimestampFromSession({ timestamp: 789 }), 789);
  assert.equal(getStartTimestampFromSession({}), null);
});

test("buildStatusLines arată PORNIT / OPRIT recent / dispărut, și ignoră membrii fără callsign", () => {
  const members = new Map([
    ["1", { id: "1", nickname: "[M-001] Ana" }], // pontaj activ
    ["2", { id: "2", nickname: "Fără callsign" }], // fără [M-xxx], mereu ignorat
    ["3", { id: "3", displayName: "[M-003] Bogdan" }], // oprit acum 1 minut — încă vizibil
    ["4", { id: "4", nickname: "[M-004] Cezar" }] // oprit acum 10 minute — expirat, nu mai apare
  ]);

  userSessions["1"] = Date.now();
  recentlyStopped["3"] = Date.now() - 60 * 1000; // acum 1 minut
  recentlyStopped["4"] = Date.now() - 10 * 60 * 1000; // acum 10 minute (peste fereastra de 5 min)

  try {
    const lines = buildStatusLines(members);
    assert.equal(lines.length, 2);
    assert.ok(lines.some(l => l.includes("[M-001] Ana") && /PORNIT de <t:\d+:R>/.test(l)));
    assert.ok(lines.some(l => l.includes("[M-003] Bogdan") && l.includes("OPRIT")));
    assert.ok(!lines.some(l => l.includes("Fără callsign")));
    assert.ok(!lines.some(l => l.includes("Cezar")), "cineva oprit de peste 5 minute nu mai trebuie afișat");
  } finally {
    delete userSessions["1"];
    delete recentlyStopped["3"];
    delete recentlyStopped["4"];
  }
});

test("pornirea pontajului șterge intrarea din recentlyStopped (nu rămâne \"OPRIT\" stale)", () => {
  const members = new Map([["5", { id: "5", nickname: "[M-005] Dana" }]]);

  recentlyStopped["5"] = Date.now() - 1000; // tocmai oprise
  userSessions["5"] = Date.now(); // apoi repornește imediat
  delete recentlyStopped["5"]; // exact ce face buttons/onduty.js la pornire

  try {
    const lines = buildStatusLines(members);
    assert.equal(lines.length, 1);
    assert.ok(/PORNIT de <t:\d+:R>/.test(lines[0]));
  } finally {
    delete userSessions["5"];
  }
});

test("pruneRecentlyStopped elimină doar intrările expirate", () => {
  recentlyStopped["old"] = Date.now() - 10 * 60 * 1000;
  recentlyStopped["fresh"] = Date.now() - 1000;

  try {
    pruneRecentlyStopped();
    assert.equal("old" in recentlyStopped, false);
    assert.equal("fresh" in recentlyStopped, true);
  } finally {
    delete recentlyStopped.old;
    delete recentlyStopped.fresh;
  }
});
