const test = require("node:test");
const assert = require("node:assert/strict");
const { isNetworkError } = require("../utils/errors.js");

test("isNetworkError recunoaște codurile undici de conectivitate (UND_ERR_*)", () => {
  assert.equal(isNetworkError({ code: "UND_ERR_CONNECT_TIMEOUT" }), true);
  assert.equal(isNetworkError({ code: "UND_ERR_SOCKET" }), true);
});

test("isNetworkError recunoaște codurile clasice de rețea din Node", () => {
  assert.equal(isNetworkError({ code: "ECONNRESET" }), true);
  assert.equal(isNetworkError({ code: "ETIMEDOUT" }), true);
  assert.equal(isNetworkError({ code: "ENOTFOUND" }), true);
});

test("isNetworkError întoarce false pentru un DiscordAPIError (code e număr, nu string)", () => {
  // ex: DiscordAPIError[10062] Unknown interaction — .code e 10062, nu "10062"
  assert.equal(isNetworkError({ code: 10062, message: "Unknown interaction" }), false);
});

test("isNetworkError întoarce false pentru erori fără code / valori goale", () => {
  assert.equal(isNetworkError({ message: "ceva fără code" }), false);
  assert.equal(isNetworkError(new Error("eroare simplă")), false);
  assert.equal(isNetworkError(null), false);
  assert.equal(isNetworkError(undefined), false);
});
