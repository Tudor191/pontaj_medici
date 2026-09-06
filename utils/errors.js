// utils/errors.js

// undici (folosit de discord.js pentru request-uri HTTP) marchează erorile de
// conectivitate reală (timeout, DNS, socket închis etc.) cu coduri gen UND_ERR_*
// sau codurile clasice de rețea din Node — spre deosebire de DiscordAPIError,
// al cărui `.code` e un număr (ex: 10062), nu un string
function isNetworkError(error) {
  const code = error?.code;
  if (typeof code !== "string") return false;
  if (code.startsWith("UND_ERR_")) return true;
  return ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "ECONNREFUSED", "EAI_AGAIN"].includes(code);
}

module.exports = { isNetworkError };
