let userSessions = {}; // obiect global cu sesiuni active
let recentlyStopped = {}; // userId -> timestamp oprire (afișat temporar ca "OPRIT" în listă)

module.exports = { userSessions, recentlyStopped };
