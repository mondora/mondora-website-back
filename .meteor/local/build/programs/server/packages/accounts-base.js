(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var _ = Package.underscore._;
var check = Package.check.check;
var Match = Package.check.Match;
var Random = Package.random.Random;
var EJSON = Package.ejson.EJSON;
var Hook = Package['callback-hook'].Hook;
var DDP = Package.livedata.DDP;
var DDPServer = Package.livedata.DDPServer;
var MongoInternals = Package['mongo-livedata'].MongoInternals;

/* Package-scope variables */
var Accounts, EXPIRE_TOKENS_INTERVAL_MS, CONNECTION_CLOSE_DELAY_MS, getTokenLifetimeMs, maybeStopExpireTokensInterval;

(function () {

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/accounts-base/accounts_common.js                                                                     //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
Accounts = {};                                                                                                   // 1
                                                                                                                 // 2
// Currently this is read directly by packages like accounts-password                                            // 3
// and accounts-ui-unstyled.                                                                                     // 4
Accounts._options = {};                                                                                          // 5
                                                                                                                 // 6
// how long (in days) until a login token expires                                                                // 7
var DEFAULT_LOGIN_EXPIRATION_DAYS = 90;                                                                          // 8
// Clients don't try to auto-login with a token that is going to expire within                                   // 9
// .1 * DEFAULT_LOGIN_EXPIRATION_DAYS, capped at MIN_TOKEN_LIFETIME_CAP_SECS.                                    // 10
// Tries to avoid abrupt disconnects from expiring tokens.                                                       // 11
var MIN_TOKEN_LIFETIME_CAP_SECS = 3600; // one hour                                                              // 12
// how often (in milliseconds) we check for expired tokens                                                       // 13
EXPIRE_TOKENS_INTERVAL_MS = 600 * 1000; // 10 minutes                                                            // 14
// how long we wait before logging out clients when Meteor.logoutOtherClients is                                 // 15
// called                                                                                                        // 16
CONNECTION_CLOSE_DELAY_MS = 10 * 1000;                                                                           // 17
                                                                                                                 // 18
// Set up config for the accounts system. Call this on both the client                                           // 19
// and the server.                                                                                               // 20
//                                                                                                               // 21
// XXX we should add some enforcement that this is called on both the                                            // 22
// client and the server. Otherwise, a user can                                                                  // 23
// 'forbidClientAccountCreation' only on the client and while it looks                                           // 24
// like their app is secure, the server will still accept createUser                                             // 25
// calls. https://github.com/meteor/meteor/issues/828                                                            // 26
//                                                                                                               // 27
// @param options {Object} an object with fields:                                                                // 28
// - sendVerificationEmail {Boolean}                                                                             // 29
//     Send email address verification emails to new users created from                                          // 30
//     client signups.                                                                                           // 31
// - forbidClientAccountCreation {Boolean}                                                                       // 32
//     Do not allow clients to create accounts directly.                                                         // 33
// - restrictCreationByEmailDomain {Function or String}                                                          // 34
//     Require created users to have an email matching the function or                                           // 35
//     having the string as domain.                                                                              // 36
// - loginExpirationInDays {Number}                                                                              // 37
//     Number of days since login until a user is logged out (login token                                        // 38
//     expires).                                                                                                 // 39
//                                                                                                               // 40
Accounts.config = function(options) {                                                                            // 41
  // We don't want users to accidentally only call Accounts.config on the                                        // 42
  // client, where some of the options will have partial effects (eg removing                                    // 43
  // the "create account" button from accounts-ui if forbidClientAccountCreation                                 // 44
  // is set, or redirecting Google login to a specific-domain page) without                                      // 45
  // having their full effects.                                                                                  // 46
  if (Meteor.isServer) {                                                                                         // 47
    __meteor_runtime_config__.accountsConfigCalled = true;                                                       // 48
  } else if (!__meteor_runtime_config__.accountsConfigCalled) {                                                  // 49
    // XXX would be nice to "crash" the client and replace the UI with an error                                  // 50
    // message, but there's no trivial way to do this.                                                           // 51
    Meteor._debug("Accounts.config was called on the client but not on the " +                                   // 52
                  "server; some configuration options may not take effect.");                                    // 53
  }                                                                                                              // 54
                                                                                                                 // 55
  // validate option keys                                                                                        // 56
  var VALID_KEYS = ["sendVerificationEmail", "forbidClientAccountCreation",                                      // 57
                    "restrictCreationByEmailDomain", "loginExpirationInDays"];                                   // 58
  _.each(_.keys(options), function (key) {                                                                       // 59
    if (!_.contains(VALID_KEYS, key)) {                                                                          // 60
      throw new Error("Accounts.config: Invalid key: " + key);                                                   // 61
    }                                                                                                            // 62
  });                                                                                                            // 63
                                                                                                                 // 64
  // set values in Accounts._options                                                                             // 65
  _.each(VALID_KEYS, function (key) {                                                                            // 66
    if (key in options) {                                                                                        // 67
      if (key in Accounts._options) {                                                                            // 68
        throw new Error("Can't set `" + key + "` more than once");                                               // 69
      } else {                                                                                                   // 70
        Accounts._options[key] = options[key];                                                                   // 71
      }                                                                                                          // 72
    }                                                                                                            // 73
  });                                                                                                            // 74
                                                                                                                 // 75
  // If the user set loginExpirationInDays to null, then we need to clear the                                    // 76
  // timer that periodically expires tokens.                                                                     // 77
  if (Meteor.isServer)                                                                                           // 78
    maybeStopExpireTokensInterval();                                                                             // 79
};                                                                                                               // 80
                                                                                                                 // 81
if (Meteor.isClient) {                                                                                           // 82
  // The connection used by the Accounts system. This is the connection                                          // 83
  // that will get logged in by Meteor.login(), and this is the                                                  // 84
  // connection whose login state will be reflected by Meteor.userId().                                          // 85
  //                                                                                                             // 86
  // It would be much preferable for this to be in accounts_client.js,                                           // 87
  // but it has to be here because it's needed to create the                                                     // 88
  // Meteor.users collection.                                                                                    // 89
  Accounts.connection = Meteor.connection;                                                                       // 90
                                                                                                                 // 91
  if (typeof __meteor_runtime_config__ !== "undefined" &&                                                        // 92
      __meteor_runtime_config__.ACCOUNTS_CONNECTION_URL) {                                                       // 93
    // Temporary, internal hook to allow the server to point the client                                          // 94
    // to a different authentication server. This is for a very                                                  // 95
    // particular use case that comes up when implementing a oauth                                               // 96
    // server. Unsupported and may go away at any point in time.                                                 // 97
    //                                                                                                           // 98
    // We will eventually provide a general way to use account-base                                              // 99
    // against any DDP connection, not just one special one.                                                     // 100
    Accounts.connection = DDP.connect(                                                                           // 101
      __meteor_runtime_config__.ACCOUNTS_CONNECTION_URL)                                                         // 102
  }                                                                                                              // 103
}                                                                                                                // 104
                                                                                                                 // 105
// Users table. Don't use the normal autopublish, since we want to hide                                          // 106
// some fields. Code to autopublish this is in accounts_server.js.                                               // 107
// XXX Allow users to configure this collection name.                                                            // 108
//                                                                                                               // 109
Meteor.users = new Meteor.Collection("users", {                                                                  // 110
  _preventAutopublish: true,                                                                                     // 111
  connection: Meteor.isClient ? Accounts.connection : Meteor.connection                                          // 112
});                                                                                                              // 113
// There is an allow call in accounts_server that restricts this                                                 // 114
// collection.                                                                                                   // 115
                                                                                                                 // 116
// loginServiceConfiguration and ConfigError are maintained for backwards compatibility                          // 117
Meteor.startup(function () {                                                                                     // 118
  var ServiceConfiguration =                                                                                     // 119
    Package['service-configuration'].ServiceConfiguration;                                                       // 120
  Accounts.loginServiceConfiguration = ServiceConfiguration.configurations;                                      // 121
  Accounts.ConfigError = ServiceConfiguration.ConfigError;                                                       // 122
});                                                                                                              // 123
                                                                                                                 // 124
// Thrown when the user cancels the login process (eg, closes an oauth                                           // 125
// popup, declines retina scan, etc)                                                                             // 126
Accounts.LoginCancelledError = function(description) {                                                           // 127
  this.message = description;                                                                                    // 128
};                                                                                                               // 129
                                                                                                                 // 130
// This is used to transmit specific subclass errors over the wire. We should                                    // 131
// come up with a more generic way to do this (eg, with some sort of symbolic                                    // 132
// error code rather than a number).                                                                             // 133
Accounts.LoginCancelledError.numericError = 0x8acdc2f;                                                           // 134
Accounts.LoginCancelledError.prototype = new Error();                                                            // 135
Accounts.LoginCancelledError.prototype.name = 'Accounts.LoginCancelledError';                                    // 136
                                                                                                                 // 137
getTokenLifetimeMs = function () {                                                                               // 138
  return (Accounts._options.loginExpirationInDays ||                                                             // 139
          DEFAULT_LOGIN_EXPIRATION_DAYS) * 24 * 60 * 60 * 1000;                                                  // 140
};                                                                                                               // 141
                                                                                                                 // 142
Accounts._tokenExpiration = function (when) {                                                                    // 143
  // We pass when through the Date constructor for backwards compatibility;                                      // 144
  // `when` used to be a number.                                                                                 // 145
  return new Date((new Date(when)).getTime() + getTokenLifetimeMs());                                            // 146
};                                                                                                               // 147
                                                                                                                 // 148
Accounts._tokenExpiresSoon = function (when) {                                                                   // 149
  var minLifetimeMs = .1 * getTokenLifetimeMs();                                                                 // 150
  var minLifetimeCapMs = MIN_TOKEN_LIFETIME_CAP_SECS * 1000;                                                     // 151
  if (minLifetimeMs > minLifetimeCapMs)                                                                          // 152
    minLifetimeMs = minLifetimeCapMs;                                                                            // 153
  return new Date() > (new Date(when) - minLifetimeMs);                                                          // 154
};                                                                                                               // 155
                                                                                                                 // 156
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/accounts-base/accounts_server.js                                                                     //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
var crypto = Npm.require('crypto');                                                                              // 1
                                                                                                                 // 2
///                                                                                                              // 3
/// CURRENT USER                                                                                                 // 4
///                                                                                                              // 5
                                                                                                                 // 6
Meteor.userId = function () {                                                                                    // 7
  // This function only works if called inside a method. In theory, it                                           // 8
  // could also be called from publish statements, since they also                                               // 9
  // have a userId associated with them. However, given that publish                                             // 10
  // functions aren't reactive, using any of the infomation from                                                 // 11
  // Meteor.user() in a publish function will always use the value                                               // 12
  // from when the function first runs. This is likely not what the                                              // 13
  // user expects. The way to make this work in a publish is to do                                               // 14
  // Meteor.find(this.userId()).observe and recompute when the user                                              // 15
  // record changes.                                                                                             // 16
  var currentInvocation = DDP._CurrentInvocation.get();                                                          // 17
  if (!currentInvocation)                                                                                        // 18
    throw new Error("Meteor.userId can only be invoked in method calls. Use this.userId in publish functions."); // 19
  return currentInvocation.userId;                                                                               // 20
};                                                                                                               // 21
                                                                                                                 // 22
Meteor.user = function () {                                                                                      // 23
  var userId = Meteor.userId();                                                                                  // 24
  if (!userId)                                                                                                   // 25
    return null;                                                                                                 // 26
  return Meteor.users.findOne(userId);                                                                           // 27
};                                                                                                               // 28
                                                                                                                 // 29
                                                                                                                 // 30
///                                                                                                              // 31
/// LOGIN HOOKS                                                                                                  // 32
///                                                                                                              // 33
                                                                                                                 // 34
// Exceptions inside the hook callback are passed up to us.                                                      // 35
var validateLoginHook = new Hook();                                                                              // 36
                                                                                                                 // 37
// Callback exceptions are printed with Meteor._debug and ignored.                                               // 38
var onLoginHook = new Hook({                                                                                     // 39
  debugPrintExceptions: "onLogin callback"                                                                       // 40
});                                                                                                              // 41
var onLoginFailureHook = new Hook({                                                                              // 42
  debugPrintExceptions: "onLoginFailure callback"                                                                // 43
});                                                                                                              // 44
                                                                                                                 // 45
Accounts.validateLoginAttempt = function (func) {                                                                // 46
  return validateLoginHook.register(func);                                                                       // 47
};                                                                                                               // 48
                                                                                                                 // 49
Accounts.onLogin = function (func) {                                                                             // 50
  return onLoginHook.register(func);                                                                             // 51
};                                                                                                               // 52
                                                                                                                 // 53
Accounts.onLoginFailure = function (func) {                                                                      // 54
  return onLoginFailureHook.register(func);                                                                      // 55
};                                                                                                               // 56
                                                                                                                 // 57
                                                                                                                 // 58
// Give each login hook callback a fresh cloned copy of the attempt                                              // 59
// object, but don't clone the connection.                                                                       // 60
//                                                                                                               // 61
var cloneAttemptWithConnection = function (connection, attempt) {                                                // 62
  var clonedAttempt = EJSON.clone(attempt);                                                                      // 63
  clonedAttempt.connection = connection;                                                                         // 64
  return clonedAttempt;                                                                                          // 65
};                                                                                                               // 66
                                                                                                                 // 67
var validateLogin = function (connection, attempt) {                                                             // 68
  validateLoginHook.each(function (callback) {                                                                   // 69
    var ret;                                                                                                     // 70
    try {                                                                                                        // 71
      ret = callback(cloneAttemptWithConnection(connection, attempt));                                           // 72
    }                                                                                                            // 73
    catch (e) {                                                                                                  // 74
      attempt.allowed = false;                                                                                   // 75
      attempt.error = e;                                                                                         // 76
      return true;                                                                                               // 77
    }                                                                                                            // 78
    if (! ret) {                                                                                                 // 79
      attempt.allowed = false;                                                                                   // 80
      attempt.error = new Meteor.Error(403, "Login forbidden");                                                  // 81
    }                                                                                                            // 82
    return true;                                                                                                 // 83
  });                                                                                                            // 84
};                                                                                                               // 85
                                                                                                                 // 86
                                                                                                                 // 87
var successfulLogin = function (connection, attempt) {                                                           // 88
  onLoginHook.each(function (callback) {                                                                         // 89
    callback(cloneAttemptWithConnection(connection, attempt));                                                   // 90
    return true;                                                                                                 // 91
  });                                                                                                            // 92
};                                                                                                               // 93
                                                                                                                 // 94
var failedLogin = function (connection, attempt) {                                                               // 95
  onLoginFailureHook.each(function (callback) {                                                                  // 96
    callback(cloneAttemptWithConnection(connection, attempt));                                                   // 97
    return true;                                                                                                 // 98
  });                                                                                                            // 99
};                                                                                                               // 100
                                                                                                                 // 101
                                                                                                                 // 102
///                                                                                                              // 103
/// LOGIN METHODS                                                                                                // 104
///                                                                                                              // 105
                                                                                                                 // 106
// Login methods return to the client an object containing these                                                 // 107
// fields when the user was logged in successfully:                                                              // 108
//                                                                                                               // 109
//   id: userId                                                                                                  // 110
//   token: *                                                                                                    // 111
//   tokenExpires: *                                                                                             // 112
//                                                                                                               // 113
// tokenExpires is optional and intends to provide a hint to the                                                 // 114
// client as to when the token will expire. If not provided, the                                                 // 115
// client will call Accounts._tokenExpiration, passing it the date                                               // 116
// that it received the token.                                                                                   // 117
//                                                                                                               // 118
// The login method will throw an error back to the client if the user                                           // 119
// failed to log in.                                                                                             // 120
//                                                                                                               // 121
//                                                                                                               // 122
// Login handlers and service specific login methods such as                                                     // 123
// `createUser` internally return a `result` object containing these                                             // 124
// fields:                                                                                                       // 125
//                                                                                                               // 126
//   type:                                                                                                       // 127
//     optional string; the service name, overrides the handler                                                  // 128
//     default if present.                                                                                       // 129
//                                                                                                               // 130
//   error:                                                                                                      // 131
//     exception; if the user is not allowed to login, the reason why.                                           // 132
//                                                                                                               // 133
//   userId:                                                                                                     // 134
//     string; the user id of the user attempting to login (if                                                   // 135
//     known), required for an allowed login.                                                                    // 136
//                                                                                                               // 137
//   options:                                                                                                    // 138
//     optional object merged into the result returned by the login                                              // 139
//     method; used by HAMK from SRP.                                                                            // 140
//                                                                                                               // 141
//   stampedLoginToken:                                                                                          // 142
//     optional object with `token` and `when` indicating the login                                              // 143
//     token is already present in the database, returned by the                                                 // 144
//     "resume" login handler.                                                                                   // 145
//                                                                                                               // 146
// For convenience, login methods can also throw an exception, which                                             // 147
// is converted into an {error} result.  However, if the id of the                                               // 148
// user attempting the login is known, a {userId, error} result should                                           // 149
// be returned instead since the user id is not captured when an                                                 // 150
// exception is thrown.                                                                                          // 151
//                                                                                                               // 152
// This internal `result` object is automatically converted into the                                             // 153
// public {id, token, tokenExpires} object returned to the client.                                               // 154
                                                                                                                 // 155
                                                                                                                 // 156
// Try a login method, converting thrown exceptions into an {error}                                              // 157
// result.  The `type` argument is a default, inserted into the result                                           // 158
// object if not explicitly returned.                                                                            // 159
//                                                                                                               // 160
var tryLoginMethod = function (type, fn) {                                                                       // 161
  var result;                                                                                                    // 162
  try {                                                                                                          // 163
    result = fn();                                                                                               // 164
  }                                                                                                              // 165
  catch (e) {                                                                                                    // 166
    result = {error: e};                                                                                         // 167
  }                                                                                                              // 168
                                                                                                                 // 169
  if (result && !result.type && type)                                                                            // 170
    result.type = type;                                                                                          // 171
                                                                                                                 // 172
  return result;                                                                                                 // 173
};                                                                                                               // 174
                                                                                                                 // 175
                                                                                                                 // 176
// Log in a user on a connection.                                                                                // 177
//                                                                                                               // 178
// We use the method invocation to set the user id on the connection,                                            // 179
// not the connection object directly. setUserId is tied to methods to                                           // 180
// enforce clear ordering of method application (using wait methods on                                           // 181
// the client, and a no setUserId after unblock restriction on the                                               // 182
// server)                                                                                                       // 183
//                                                                                                               // 184
// The `stampedLoginToken` parameter is optional.  When present, it                                              // 185
// indicates that the login token has already been inserted into the                                             // 186
// database and doesn't need to be inserted again.  (It's used by the                                            // 187
// "resume" login handler).                                                                                      // 188
var loginUser = function (methodInvocation, userId, stampedLoginToken) {                                         // 189
  if (! stampedLoginToken) {                                                                                     // 190
    stampedLoginToken = Accounts._generateStampedLoginToken();                                                   // 191
    Accounts._insertLoginToken(userId, stampedLoginToken);                                                       // 192
  }                                                                                                              // 193
                                                                                                                 // 194
  // This order (and the avoidance of yields) is important to make                                               // 195
  // sure that when publish functions are rerun, they see a                                                      // 196
  // consistent view of the world: the userId is set and matches                                                 // 197
  // the login token on the connection (not that there is                                                        // 198
  // currently a public API for reading the login token on a                                                     // 199
  // connection).                                                                                                // 200
  Meteor._noYieldsAllowed(function () {                                                                          // 201
    Accounts._setLoginToken(                                                                                     // 202
      userId,                                                                                                    // 203
      methodInvocation.connection,                                                                               // 204
      Accounts._hashLoginToken(stampedLoginToken.token)                                                          // 205
    );                                                                                                           // 206
  });                                                                                                            // 207
                                                                                                                 // 208
  methodInvocation.setUserId(userId);                                                                            // 209
                                                                                                                 // 210
  return {                                                                                                       // 211
    id: userId,                                                                                                  // 212
    token: stampedLoginToken.token,                                                                              // 213
    tokenExpires: Accounts._tokenExpiration(stampedLoginToken.when)                                              // 214
  };                                                                                                             // 215
};                                                                                                               // 216
                                                                                                                 // 217
                                                                                                                 // 218
// After a login method has completed, call the login hooks.  Note                                               // 219
// that `attemptLogin` is called for *all* login attempts, even ones                                             // 220
// which aren't successful (such as an invalid password, etc).                                                   // 221
//                                                                                                               // 222
// If the login is allowed and isn't aborted by a validate login hook                                            // 223
// callback, log in the user.                                                                                    // 224
//                                                                                                               // 225
var attemptLogin = function (methodInvocation, methodName, methodArgs, result) {                                 // 226
  if (!result)                                                                                                   // 227
    throw new Error("result is required");                                                                       // 228
                                                                                                                 // 229
  if (!result.userId && !result.error)                                                                           // 230
    throw new Error("A login method must specify a userId or an error");                                         // 231
                                                                                                                 // 232
  var user;                                                                                                      // 233
  if (result.userId)                                                                                             // 234
    user = Meteor.users.findOne(result.userId);                                                                  // 235
                                                                                                                 // 236
  var attempt = {                                                                                                // 237
    type: result.type || "unknown",                                                                              // 238
    allowed: !! (result.userId && !result.error),                                                                // 239
    methodName: methodName,                                                                                      // 240
    methodArguments: _.toArray(methodArgs)                                                                       // 241
  };                                                                                                             // 242
  if (result.error)                                                                                              // 243
    attempt.error = result.error;                                                                                // 244
  if (user)                                                                                                      // 245
    attempt.user = user;                                                                                         // 246
                                                                                                                 // 247
  validateLogin(methodInvocation.connection, attempt);                                                           // 248
                                                                                                                 // 249
  if (attempt.allowed) {                                                                                         // 250
    var ret = _.extend(                                                                                          // 251
      loginUser(methodInvocation, result.userId, result.stampedLoginToken),                                      // 252
      result.options || {}                                                                                       // 253
    );                                                                                                           // 254
    successfulLogin(methodInvocation.connection, attempt);                                                       // 255
    return ret;                                                                                                  // 256
  }                                                                                                              // 257
  else {                                                                                                         // 258
    failedLogin(methodInvocation.connection, attempt);                                                           // 259
    throw attempt.error;                                                                                         // 260
  }                                                                                                              // 261
};                                                                                                               // 262
                                                                                                                 // 263
                                                                                                                 // 264
// All service specific login methods should go through this function.                                           // 265
// Ensure that thrown exceptions are caught and that login hook                                                  // 266
// callbacks are still called.                                                                                   // 267
//                                                                                                               // 268
Accounts._loginMethod = function (methodInvocation, methodName, methodArgs, type, fn) {                          // 269
  return attemptLogin(                                                                                           // 270
    methodInvocation,                                                                                            // 271
    methodName,                                                                                                  // 272
    methodArgs,                                                                                                  // 273
    tryLoginMethod(type, fn)                                                                                     // 274
  );                                                                                                             // 275
};                                                                                                               // 276
                                                                                                                 // 277
                                                                                                                 // 278
// Report a login attempt failed outside the context of a normal login                                           // 279
// method. This is for use in the case where there is a multi-step login                                         // 280
// procedure (eg SRP based password login). If a method early in the                                             // 281
// chain fails, it should call this function to report a failure. There                                          // 282
// is no corresponding method for a successful login; methods that can                                           // 283
// succeed at logging a user in should always be actual login methods                                            // 284
// (using either Accounts._loginMethod or Accounts.registerLoginHandler).                                        // 285
Accounts._reportLoginFailure = function (methodInvocation, methodName, methodArgs, result) {                     // 286
  var attempt = {                                                                                                // 287
    type: result.type || "unknown",                                                                              // 288
    allowed: false,                                                                                              // 289
    error: result.error,                                                                                         // 290
    methodName: methodName,                                                                                      // 291
    methodArguments: _.toArray(methodArgs)                                                                       // 292
  };                                                                                                             // 293
  if (result.userId)                                                                                             // 294
    attempt.user = Meteor.users.findOne(result.userId);                                                          // 295
                                                                                                                 // 296
  validateLogin(methodInvocation.connection, attempt);                                                           // 297
  failedLogin(methodInvocation.connection, attempt);                                                             // 298
};                                                                                                               // 299
                                                                                                                 // 300
                                                                                                                 // 301
///                                                                                                              // 302
/// LOGIN HANDLERS                                                                                               // 303
///                                                                                                              // 304
                                                                                                                 // 305
// list of all registered handlers.                                                                              // 306
var loginHandlers = [];                                                                                          // 307
                                                                                                                 // 308
// The main entry point for auth packages to hook in to login.                                                   // 309
//                                                                                                               // 310
// A login handler is a login method which can return `undefined` to                                             // 311
// indicate that the login request is not handled by this handler.                                               // 312
//                                                                                                               // 313
// @param name {String} Optional.  The service name, used by default                                             // 314
// if a specific service name isn't returned in the result.                                                      // 315
//                                                                                                               // 316
// @param handler {Function} A function that receives an options object                                          // 317
// (as passed as an argument to the `login` method) and returns one of:                                          // 318
// - `undefined`, meaning don't handle;                                                                          // 319
// - a login method result object                                                                                // 320
                                                                                                                 // 321
Accounts.registerLoginHandler = function(name, handler) {                                                        // 322
  if (! handler) {                                                                                               // 323
    handler = name;                                                                                              // 324
    name = null;                                                                                                 // 325
  }                                                                                                              // 326
  loginHandlers.push({name: name, handler: handler});                                                            // 327
};                                                                                                               // 328
                                                                                                                 // 329
                                                                                                                 // 330
// Checks a user's credentials against all the registered login                                                  // 331
// handlers, and returns a login token if the credentials are valid. It                                          // 332
// is like the login method, except that it doesn't set the logged-in                                            // 333
// user on the connection. Throws a Meteor.Error if logging in fails,                                            // 334
// including the case where none of the login handlers handled the login                                         // 335
// request. Otherwise, returns {id: userId, token: *, tokenExpires: *}.                                          // 336
//                                                                                                               // 337
// For example, if you want to login with a plaintext password, `options` could be                               // 338
//   { user: { username: <username> }, password: <password> }, or                                                // 339
//   { user: { email: <email> }, password: <password> }.                                                         // 340
                                                                                                                 // 341
// Try all of the registered login handlers until one of them doesn't                                            // 342
// return `undefined`, meaning it handled this call to `login`. Return                                           // 343
// that return value.                                                                                            // 344
var runLoginHandlers = function (methodInvocation, options) {                                                    // 345
  for (var i = 0; i < loginHandlers.length; ++i) {                                                               // 346
    var handler = loginHandlers[i];                                                                              // 347
                                                                                                                 // 348
    var result = tryLoginMethod(                                                                                 // 349
      handler.name,                                                                                              // 350
      function () {                                                                                              // 351
        return handler.handler.call(methodInvocation, options);                                                  // 352
      }                                                                                                          // 353
    );                                                                                                           // 354
                                                                                                                 // 355
    if (result)                                                                                                  // 356
      return result;                                                                                             // 357
    else if (result !== undefined)                                                                               // 358
      throw new Meteor.Error(400, "A login handler should return a result or undefined");                        // 359
  }                                                                                                              // 360
                                                                                                                 // 361
  return {                                                                                                       // 362
    type: null,                                                                                                  // 363
    error: new Meteor.Error(400, "Unrecognized options for login request")                                       // 364
  };                                                                                                             // 365
};                                                                                                               // 366
                                                                                                                 // 367
// Deletes the given loginToken from the database.                                                               // 368
//                                                                                                               // 369
// For new-style hashed token, this will cause all connections                                                   // 370
// associated with the token to be closed.                                                                       // 371
//                                                                                                               // 372
// Any connections associated with old-style unhashed tokens will be                                             // 373
// in the process of becoming associated with hashed tokens and then                                             // 374
// they'll get closed.                                                                                           // 375
Accounts.destroyToken = function (userId, loginToken) {                                                          // 376
  Meteor.users.update(userId, {                                                                                  // 377
    $pull: {                                                                                                     // 378
      "services.resume.loginTokens": {                                                                           // 379
        $or: [                                                                                                   // 380
          { hashedToken: loginToken },                                                                           // 381
          { token: loginToken }                                                                                  // 382
        ]                                                                                                        // 383
      }                                                                                                          // 384
    }                                                                                                            // 385
  });                                                                                                            // 386
};                                                                                                               // 387
                                                                                                                 // 388
// Actual methods for login and logout. This is the entry point for                                              // 389
// clients to actually log in.                                                                                   // 390
Meteor.methods({                                                                                                 // 391
  // @returns {Object|null}                                                                                      // 392
  //   If successful, returns {token: reconnectToken, id: userId}                                                // 393
  //   If unsuccessful (for example, if the user closed the oauth login popup),                                  // 394
  //     throws an error describing the reason                                                                   // 395
  login: function(options) {                                                                                     // 396
    var self = this;                                                                                             // 397
                                                                                                                 // 398
    // Login handlers should really also check whatever field they look at in                                    // 399
    // options, but we don't enforce it.                                                                         // 400
    check(options, Object);                                                                                      // 401
                                                                                                                 // 402
    var result = runLoginHandlers(self, options);                                                                // 403
                                                                                                                 // 404
    return attemptLogin(self, "login", arguments, result);                                                       // 405
  },                                                                                                             // 406
                                                                                                                 // 407
  logout: function() {                                                                                           // 408
    var token = Accounts._getLoginToken(this.connection.id);                                                     // 409
    Accounts._setLoginToken(this.userId, this.connection, null);                                                 // 410
    if (token && this.userId)                                                                                    // 411
      Accounts.destroyToken(this.userId, token);                                                                 // 412
    this.setUserId(null);                                                                                        // 413
  },                                                                                                             // 414
                                                                                                                 // 415
  // Delete all the current user's tokens and close all open connections logged                                  // 416
  // in as this user. Returns a fresh new login token that this client can                                       // 417
  // use. Tests set Accounts._noConnectionCloseDelayForTest to delete tokens                                     // 418
  // immediately instead of using a delay.                                                                       // 419
  //                                                                                                             // 420
  // @returns {Object} Object with token and tokenExpires keys.                                                  // 421
  logoutOtherClients: function () {                                                                              // 422
    var self = this;                                                                                             // 423
    var user = Meteor.users.findOne(self.userId, {                                                               // 424
      fields: {                                                                                                  // 425
        "services.resume.loginTokens": true                                                                      // 426
      }                                                                                                          // 427
    });                                                                                                          // 428
    if (user) {                                                                                                  // 429
      // Save the current tokens in the database to be deleted in                                                // 430
      // CONNECTION_CLOSE_DELAY_MS ms. This gives other connections in the                                       // 431
      // caller's browser time to find the fresh token in localStorage. We save                                  // 432
      // the tokens in the database in case we crash before actually deleting                                    // 433
      // them.                                                                                                   // 434
      var tokens = user.services.resume.loginTokens;                                                             // 435
      var newToken = Accounts._generateStampedLoginToken();                                                      // 436
      var userId = self.userId;                                                                                  // 437
      Meteor.users.update(self.userId, {                                                                         // 438
        $set: {                                                                                                  // 439
          "services.resume.loginTokensToDelete": tokens,                                                         // 440
          "services.resume.haveLoginTokensToDelete": true                                                        // 441
        },                                                                                                       // 442
        $push: { "services.resume.loginTokens": Accounts._hashStampedToken(newToken) }                           // 443
      });                                                                                                        // 444
      Meteor.setTimeout(function () {                                                                            // 445
        // The observe on Meteor.users will take care of closing the connections                                 // 446
        // associated with `tokens`.                                                                             // 447
        deleteSavedTokens(userId, tokens);                                                                       // 448
      }, Accounts._noConnectionCloseDelayForTest ? 0 :                                                           // 449
                        CONNECTION_CLOSE_DELAY_MS);                                                              // 450
      // We do not set the login token on this connection, but instead the                                       // 451
      // observe closes the connection and the client will reconnect with the                                    // 452
      // new token.                                                                                              // 453
      return {                                                                                                   // 454
        token: newToken.token,                                                                                   // 455
        tokenExpires: Accounts._tokenExpiration(newToken.when)                                                   // 456
      };                                                                                                         // 457
    } else {                                                                                                     // 458
      throw new Error("You are not logged in.");                                                                 // 459
    }                                                                                                            // 460
  }                                                                                                              // 461
});                                                                                                              // 462
                                                                                                                 // 463
///                                                                                                              // 464
/// ACCOUNT DATA                                                                                                 // 465
///                                                                                                              // 466
                                                                                                                 // 467
// connectionId -> {connection, loginToken, srpChallenge}                                                        // 468
var accountData = {};                                                                                            // 469
                                                                                                                 // 470
// HACK: This is used by 'meteor-accounts' to get the loginToken for a                                           // 471
// connection. Maybe there should be a public way to do that.                                                    // 472
Accounts._getAccountData = function (connectionId, field) {                                                      // 473
  var data = accountData[connectionId];                                                                          // 474
  return data && data[field];                                                                                    // 475
};                                                                                                               // 476
                                                                                                                 // 477
Accounts._setAccountData = function (connectionId, field, value) {                                               // 478
  var data = accountData[connectionId];                                                                          // 479
                                                                                                                 // 480
  // safety belt. shouldn't happen. accountData is set in onConnection,                                          // 481
  // we don't have a connectionId until it is set.                                                               // 482
  if (!data)                                                                                                     // 483
    return;                                                                                                      // 484
                                                                                                                 // 485
  if (value === undefined)                                                                                       // 486
    delete data[field];                                                                                          // 487
  else                                                                                                           // 488
    data[field] = value;                                                                                         // 489
};                                                                                                               // 490
                                                                                                                 // 491
Meteor.server.onConnection(function (connection) {                                                               // 492
  accountData[connection.id] = {connection: connection};                                                         // 493
  connection.onClose(function () {                                                                               // 494
    removeConnectionFromToken(connection.id);                                                                    // 495
    delete accountData[connection.id];                                                                           // 496
  });                                                                                                            // 497
});                                                                                                              // 498
                                                                                                                 // 499
                                                                                                                 // 500
///                                                                                                              // 501
/// RECONNECT TOKENS                                                                                             // 502
///                                                                                                              // 503
/// support reconnecting using a meteor login token                                                              // 504
                                                                                                                 // 505
Accounts._hashLoginToken = function (loginToken) {                                                               // 506
  var hash = crypto.createHash('sha256');                                                                        // 507
  hash.update(loginToken);                                                                                       // 508
  return hash.digest('base64');                                                                                  // 509
};                                                                                                               // 510
                                                                                                                 // 511
                                                                                                                 // 512
// {token, when} => {hashedToken, when}                                                                          // 513
Accounts._hashStampedToken = function (stampedToken) {                                                           // 514
  return _.extend(                                                                                               // 515
    _.omit(stampedToken, 'token'),                                                                               // 516
    {hashedToken: Accounts._hashLoginToken(stampedToken.token)}                                                  // 517
  );                                                                                                             // 518
};                                                                                                               // 519
                                                                                                                 // 520
                                                                                                                 // 521
// Using $addToSet avoids getting an index error if another client                                               // 522
// logging in simultaneously has already inserted the new hashed                                                 // 523
// token.                                                                                                        // 524
Accounts._insertHashedLoginToken = function (userId, hashedToken, query) {                                       // 525
  query = query ? _.clone(query) : {};                                                                           // 526
  query._id = userId;                                                                                            // 527
  Meteor.users.update(                                                                                           // 528
    query,                                                                                                       // 529
    { $addToSet: {                                                                                               // 530
        "services.resume.loginTokens": hashedToken                                                               // 531
    } }                                                                                                          // 532
  );                                                                                                             // 533
};                                                                                                               // 534
                                                                                                                 // 535
                                                                                                                 // 536
// Exported for tests.                                                                                           // 537
Accounts._insertLoginToken = function (userId, stampedToken, query) {                                            // 538
  Accounts._insertHashedLoginToken(                                                                              // 539
    userId,                                                                                                      // 540
    Accounts._hashStampedToken(stampedToken),                                                                    // 541
    query                                                                                                        // 542
  );                                                                                                             // 543
};                                                                                                               // 544
                                                                                                                 // 545
                                                                                                                 // 546
Accounts._clearAllLoginTokens = function (userId) {                                                              // 547
  Meteor.users.update(                                                                                           // 548
    userId,                                                                                                      // 549
    {$set: {'services.resume.loginTokens': []}}                                                                  // 550
  );                                                                                                             // 551
};                                                                                                               // 552
                                                                                                                 // 553
                                                                                                                 // 554
// hashed token -> list of connection ids                                                                        // 555
var connectionsByLoginToken = {};                                                                                // 556
                                                                                                                 // 557
// test hook                                                                                                     // 558
Accounts._getTokenConnections = function (token) {                                                               // 559
  return connectionsByLoginToken[token];                                                                         // 560
};                                                                                                               // 561
                                                                                                                 // 562
// Remove the connection from the list of open connections for the connection's                                  // 563
// token.                                                                                                        // 564
var removeConnectionFromToken = function (connectionId) {                                                        // 565
  var token = Accounts._getLoginToken(connectionId);                                                             // 566
  if (token) {                                                                                                   // 567
    connectionsByLoginToken[token] = _.without(                                                                  // 568
      connectionsByLoginToken[token],                                                                            // 569
      connectionId                                                                                               // 570
    );                                                                                                           // 571
    if (_.isEmpty(connectionsByLoginToken[token]))                                                               // 572
      delete connectionsByLoginToken[token];                                                                     // 573
  }                                                                                                              // 574
};                                                                                                               // 575
                                                                                                                 // 576
Accounts._getLoginToken = function (connectionId) {                                                              // 577
  return Accounts._getAccountData(connectionId, 'loginToken');                                                   // 578
};                                                                                                               // 579
                                                                                                                 // 580
// newToken is a hashed token.                                                                                   // 581
Accounts._setLoginToken = function (userId, connection, newToken) {                                              // 582
  removeConnectionFromToken(connection.id);                                                                      // 583
  Accounts._setAccountData(connection.id, 'loginToken', newToken);                                               // 584
                                                                                                                 // 585
  if (newToken) {                                                                                                // 586
    if (! _.has(connectionsByLoginToken, newToken))                                                              // 587
      connectionsByLoginToken[newToken] = [];                                                                    // 588
    connectionsByLoginToken[newToken].push(connection.id);                                                       // 589
                                                                                                                 // 590
    // Now that we've added the connection to the                                                                // 591
    // connectionsByLoginToken map for the token, the connection will                                            // 592
    // be closed if the token is removed from the database.  However                                             // 593
    // at this point the token might have already been deleted, which                                            // 594
    // wouldn't have closed the connection because it wasn't in the                                              // 595
    // map yet.                                                                                                  // 596
    //                                                                                                           // 597
    // We also did need to first add the connection to the map above                                             // 598
    // (and now remove it here if the token was deleted), because we                                             // 599
    // could be getting a response from the database that the token                                              // 600
    // still exists, but then it could be deleted in another fiber                                               // 601
    // before our `findOne` call returns... and then that other fiber                                            // 602
    // would need for the connection to be in the map for it to close                                            // 603
    // the connection.                                                                                           // 604
    //                                                                                                           // 605
    // We defer this check because there's no need for it to be on the critical                                  // 606
    // path for login; we just need to ensure that the connection will get                                       // 607
    // closed at some point if the token has been deleted.                                                       // 608
    Meteor.defer(function () {                                                                                   // 609
      if (! Meteor.users.findOne({                                                                               // 610
        _id: userId,                                                                                             // 611
        "services.resume.loginTokens.hashedToken": newToken                                                      // 612
      })) {                                                                                                      // 613
        removeConnectionFromToken(connection.id);                                                                // 614
        connection.close();                                                                                      // 615
      }                                                                                                          // 616
    });                                                                                                          // 617
  }                                                                                                              // 618
};                                                                                                               // 619
                                                                                                                 // 620
// Close all open connections associated with any of the tokens in                                               // 621
// `tokens`.                                                                                                     // 622
var closeConnectionsForTokens = function (tokens) {                                                              // 623
  _.each(tokens, function (token) {                                                                              // 624
    if (_.has(connectionsByLoginToken, token)) {                                                                 // 625
      // safety belt. close should defer potentially yielding callbacks.                                         // 626
      Meteor._noYieldsAllowed(function () {                                                                      // 627
        _.each(connectionsByLoginToken[token], function (connectionId) {                                         // 628
          var connection = Accounts._getAccountData(connectionId, 'connection');                                 // 629
          if (connection)                                                                                        // 630
            connection.close();                                                                                  // 631
        });                                                                                                      // 632
      });                                                                                                        // 633
    }                                                                                                            // 634
  });                                                                                                            // 635
};                                                                                                               // 636
                                                                                                                 // 637
                                                                                                                 // 638
// Login handler for resume tokens.                                                                              // 639
Accounts.registerLoginHandler("resume", function(options) {                                                      // 640
  if (!options.resume)                                                                                           // 641
    return undefined;                                                                                            // 642
                                                                                                                 // 643
  check(options.resume, String);                                                                                 // 644
                                                                                                                 // 645
  var hashedToken = Accounts._hashLoginToken(options.resume);                                                    // 646
                                                                                                                 // 647
  // First look for just the new-style hashed login token, to avoid                                              // 648
  // sending the unhashed token to the database in a query if we don't                                           // 649
  // need to.                                                                                                    // 650
  var user = Meteor.users.findOne(                                                                               // 651
    {"services.resume.loginTokens.hashedToken": hashedToken});                                                   // 652
                                                                                                                 // 653
  if (! user) {                                                                                                  // 654
    // If we didn't find the hashed login token, try also looking for                                            // 655
    // the old-style unhashed token.  But we need to look for either                                             // 656
    // the old-style token OR the new-style token, because another                                               // 657
    // client connection logging in simultaneously might have already                                            // 658
    // converted the token.                                                                                      // 659
    user = Meteor.users.findOne({                                                                                // 660
      $or: [                                                                                                     // 661
        {"services.resume.loginTokens.hashedToken": hashedToken},                                                // 662
        {"services.resume.loginTokens.token": options.resume}                                                    // 663
      ]                                                                                                          // 664
    });                                                                                                          // 665
  }                                                                                                              // 666
                                                                                                                 // 667
  if (! user)                                                                                                    // 668
    return {                                                                                                     // 669
      error: new Meteor.Error(403, "You've been logged out by the server. Please log in again.")                 // 670
    };                                                                                                           // 671
                                                                                                                 // 672
  // Find the token, which will either be an object with fields                                                  // 673
  // {hashedToken, when} for a hashed token or {token, when} for an                                              // 674
  // unhashed token.                                                                                             // 675
  var oldUnhashedStyleToken;                                                                                     // 676
  var token = _.find(user.services.resume.loginTokens, function (token) {                                        // 677
    return token.hashedToken === hashedToken;                                                                    // 678
  });                                                                                                            // 679
  if (token) {                                                                                                   // 680
    oldUnhashedStyleToken = false;                                                                               // 681
  } else {                                                                                                       // 682
    token = _.find(user.services.resume.loginTokens, function (token) {                                          // 683
      return token.token === options.resume;                                                                     // 684
    });                                                                                                          // 685
    oldUnhashedStyleToken = true;                                                                                // 686
  }                                                                                                              // 687
                                                                                                                 // 688
  var tokenExpires = Accounts._tokenExpiration(token.when);                                                      // 689
  if (new Date() >= tokenExpires)                                                                                // 690
    return {                                                                                                     // 691
      userId: user._id,                                                                                          // 692
      error: new Meteor.Error(403, "Your session has expired. Please log in again.")                             // 693
    };                                                                                                           // 694
                                                                                                                 // 695
  // Update to a hashed token when an unhashed token is encountered.                                             // 696
  if (oldUnhashedStyleToken) {                                                                                   // 697
    // Only add the new hashed token if the old unhashed token still                                             // 698
    // exists (this avoids resurrecting the token if it was deleted                                              // 699
    // after we read it).  Using $addToSet avoids getting an index                                               // 700
    // error if another client logging in simultaneously has already                                             // 701
    // inserted the new hashed token.                                                                            // 702
    Meteor.users.update(                                                                                         // 703
      {                                                                                                          // 704
        _id: user._id,                                                                                           // 705
        "services.resume.loginTokens.token": options.resume                                                      // 706
      },                                                                                                         // 707
      {$addToSet: {                                                                                              // 708
        "services.resume.loginTokens": {                                                                         // 709
          "hashedToken": hashedToken,                                                                            // 710
          "when": token.when                                                                                     // 711
        }                                                                                                        // 712
      }}                                                                                                         // 713
    );                                                                                                           // 714
                                                                                                                 // 715
    // Remove the old token *after* adding the new, since otherwise                                              // 716
    // another client trying to login between our removing the old and                                           // 717
    // adding the new wouldn't find a token to login with.                                                       // 718
    Meteor.users.update(user._id, {                                                                              // 719
      $pull: {                                                                                                   // 720
        "services.resume.loginTokens": { "token": options.resume }                                               // 721
      }                                                                                                          // 722
    });                                                                                                          // 723
  }                                                                                                              // 724
                                                                                                                 // 725
  return {                                                                                                       // 726
    userId: user._id,                                                                                            // 727
    stampedLoginToken: {                                                                                         // 728
      token: options.resume,                                                                                     // 729
      when: token.when                                                                                           // 730
    }                                                                                                            // 731
  };                                                                                                             // 732
});                                                                                                              // 733
                                                                                                                 // 734
// (Also used by Meteor Accounts server and tests).                                                              // 735
//                                                                                                               // 736
Accounts._generateStampedLoginToken = function () {                                                              // 737
  return {token: Random.id(), when: (new Date)};                                                                 // 738
};                                                                                                               // 739
                                                                                                                 // 740
///                                                                                                              // 741
/// TOKEN EXPIRATION                                                                                             // 742
///                                                                                                              // 743
                                                                                                                 // 744
var expireTokenInterval;                                                                                         // 745
                                                                                                                 // 746
// Deletes expired tokens from the database and closes all open connections                                      // 747
// associated with these tokens.                                                                                 // 748
//                                                                                                               // 749
// Exported for tests. Also, the arguments are only used by                                                      // 750
// tests. oldestValidDate is simulate expiring tokens without waiting                                            // 751
// for them to actually expire. userId is used by tests to only expire                                           // 752
// tokens for the test user.                                                                                     // 753
var expireTokens = Accounts._expireTokens = function (oldestValidDate, userId) {                                 // 754
  var tokenLifetimeMs = getTokenLifetimeMs();                                                                    // 755
                                                                                                                 // 756
  // when calling from a test with extra arguments, you must specify both!                                       // 757
  if ((oldestValidDate && !userId) || (!oldestValidDate && userId)) {                                            // 758
    throw new Error("Bad test. Must specify both oldestValidDate and userId.");                                  // 759
  }                                                                                                              // 760
                                                                                                                 // 761
  oldestValidDate = oldestValidDate ||                                                                           // 762
    (new Date(new Date() - tokenLifetimeMs));                                                                    // 763
  var userFilter = userId ? {_id: userId} : {};                                                                  // 764
                                                                                                                 // 765
                                                                                                                 // 766
  // Backwards compatible with older versions of meteor that stored login token                                  // 767
  // timestamps as numbers.                                                                                      // 768
  Meteor.users.update(_.extend(userFilter, {                                                                     // 769
    $or: [                                                                                                       // 770
      { "services.resume.loginTokens.when": { $lt: oldestValidDate } },                                          // 771
      { "services.resume.loginTokens.when": { $lt: +oldestValidDate } }                                          // 772
    ]                                                                                                            // 773
  }), {                                                                                                          // 774
    $pull: {                                                                                                     // 775
      "services.resume.loginTokens": {                                                                           // 776
        $or: [                                                                                                   // 777
          { when: { $lt: oldestValidDate } },                                                                    // 778
          { when: { $lt: +oldestValidDate } }                                                                    // 779
        ]                                                                                                        // 780
      }                                                                                                          // 781
    }                                                                                                            // 782
  }, { multi: true });                                                                                           // 783
  // The observe on Meteor.users will take care of closing connections for                                       // 784
  // expired tokens.                                                                                             // 785
};                                                                                                               // 786
                                                                                                                 // 787
maybeStopExpireTokensInterval = function () {                                                                    // 788
  if (_.has(Accounts._options, "loginExpirationInDays") &&                                                       // 789
      Accounts._options.loginExpirationInDays === null &&                                                        // 790
      expireTokenInterval) {                                                                                     // 791
    Meteor.clearInterval(expireTokenInterval);                                                                   // 792
    expireTokenInterval = null;                                                                                  // 793
  }                                                                                                              // 794
};                                                                                                               // 795
                                                                                                                 // 796
expireTokenInterval = Meteor.setInterval(expireTokens,                                                           // 797
                                         EXPIRE_TOKENS_INTERVAL_MS);                                             // 798
                                                                                                                 // 799
///                                                                                                              // 800
/// CREATE USER HOOKS                                                                                            // 801
///                                                                                                              // 802
                                                                                                                 // 803
var onCreateUserHook = null;                                                                                     // 804
Accounts.onCreateUser = function (func) {                                                                        // 805
  if (onCreateUserHook)                                                                                          // 806
    throw new Error("Can only call onCreateUser once");                                                          // 807
  else                                                                                                           // 808
    onCreateUserHook = func;                                                                                     // 809
};                                                                                                               // 810
                                                                                                                 // 811
// XXX see comment on Accounts.createUser in passwords_server about adding a                                     // 812
// second "server options" argument.                                                                             // 813
var defaultCreateUserHook = function (options, user) {                                                           // 814
  if (options.profile)                                                                                           // 815
    user.profile = options.profile;                                                                              // 816
  return user;                                                                                                   // 817
};                                                                                                               // 818
                                                                                                                 // 819
// Called by accounts-password                                                                                   // 820
Accounts.insertUserDoc = function (options, user) {                                                              // 821
  // - clone user document, to protect from modification                                                         // 822
  // - add createdAt timestamp                                                                                   // 823
  // - prepare an _id, so that you can modify other collections (eg                                              // 824
  // create a first task for every new user)                                                                     // 825
  //                                                                                                             // 826
  // XXX If the onCreateUser or validateNewUser hooks fail, we might                                             // 827
  // end up having modified some other collection                                                                // 828
  // inappropriately. The solution is probably to have onCreateUser                                              // 829
  // accept two callbacks - one that gets called before inserting                                                // 830
  // the user document (in which you can modify its contents), and                                               // 831
  // one that gets called after (in which you should change other                                                // 832
  // collections)                                                                                                // 833
  user = _.extend({createdAt: new Date(), _id: Random.id()}, user);                                              // 834
                                                                                                                 // 835
  var fullUser;                                                                                                  // 836
  if (onCreateUserHook) {                                                                                        // 837
    fullUser = onCreateUserHook(options, user);                                                                  // 838
                                                                                                                 // 839
    // This is *not* part of the API. We need this because we can't isolate                                      // 840
    // the global server environment between tests, meaning we can't test                                        // 841
    // both having a create user hook set and not having one set.                                                // 842
    if (fullUser === 'TEST DEFAULT HOOK')                                                                        // 843
      fullUser = defaultCreateUserHook(options, user);                                                           // 844
  } else {                                                                                                       // 845
    fullUser = defaultCreateUserHook(options, user);                                                             // 846
  }                                                                                                              // 847
                                                                                                                 // 848
  _.each(validateNewUserHooks, function (hook) {                                                                 // 849
    if (!hook(fullUser))                                                                                         // 850
      throw new Meteor.Error(403, "User validation failed");                                                     // 851
  });                                                                                                            // 852
                                                                                                                 // 853
  var userId;                                                                                                    // 854
  try {                                                                                                          // 855
    userId = Meteor.users.insert(fullUser);                                                                      // 856
  } catch (e) {                                                                                                  // 857
    // XXX string parsing sucks, maybe                                                                           // 858
    // https://jira.mongodb.org/browse/SERVER-3069 will get fixed one day                                        // 859
    if (e.name !== 'MongoError') throw e;                                                                        // 860
    var match = e.err.match(/^E11000 duplicate key error index: ([^ ]+)/);                                       // 861
    if (!match) throw e;                                                                                         // 862
    if (match[1].indexOf('$emails.address') !== -1)                                                              // 863
      throw new Meteor.Error(403, "Email already exists.");                                                      // 864
    if (match[1].indexOf('username') !== -1)                                                                     // 865
      throw new Meteor.Error(403, "Username already exists.");                                                   // 866
    // XXX better error reporting for services.facebook.id duplicate, etc                                        // 867
    throw e;                                                                                                     // 868
  }                                                                                                              // 869
  return userId;                                                                                                 // 870
};                                                                                                               // 871
                                                                                                                 // 872
var validateNewUserHooks = [];                                                                                   // 873
Accounts.validateNewUser = function (func) {                                                                     // 874
  validateNewUserHooks.push(func);                                                                               // 875
};                                                                                                               // 876
                                                                                                                 // 877
// XXX Find a better place for this utility function                                                             // 878
// Like Perl's quotemeta: quotes all regexp metacharacters. See                                                  // 879
//   https://github.com/substack/quotemeta/blob/master/index.js                                                  // 880
var quotemeta = function (str) {                                                                                 // 881
    return String(str).replace(/(\W)/g, '\\$1');                                                                 // 882
};                                                                                                               // 883
                                                                                                                 // 884
// Helper function: returns false if email does not match company domain from                                    // 885
// the configuration.                                                                                            // 886
var testEmailDomain = function (email) {                                                                         // 887
  var domain = Accounts._options.restrictCreationByEmailDomain;                                                  // 888
  return !domain ||                                                                                              // 889
    (_.isFunction(domain) && domain(email)) ||                                                                   // 890
    (_.isString(domain) &&                                                                                       // 891
      (new RegExp('@' + quotemeta(domain) + '$', 'i')).test(email));                                             // 892
};                                                                                                               // 893
                                                                                                                 // 894
// Validate new user's email or Google/Facebook/GitHub account's email                                           // 895
Accounts.validateNewUser(function (user) {                                                                       // 896
  var domain = Accounts._options.restrictCreationByEmailDomain;                                                  // 897
  if (!domain)                                                                                                   // 898
    return true;                                                                                                 // 899
                                                                                                                 // 900
  var emailIsGood = false;                                                                                       // 901
  if (!_.isEmpty(user.emails)) {                                                                                 // 902
    emailIsGood = _.any(user.emails, function (email) {                                                          // 903
      return testEmailDomain(email.address);                                                                     // 904
    });                                                                                                          // 905
  } else if (!_.isEmpty(user.services)) {                                                                        // 906
    // Find any email of any service and check it                                                                // 907
    emailIsGood = _.any(user.services, function (service) {                                                      // 908
      return service.email && testEmailDomain(service.email);                                                    // 909
    });                                                                                                          // 910
  }                                                                                                              // 911
                                                                                                                 // 912
  if (emailIsGood)                                                                                               // 913
    return true;                                                                                                 // 914
                                                                                                                 // 915
  if (_.isString(domain))                                                                                        // 916
    throw new Meteor.Error(403, "@" + domain + " email required");                                               // 917
  else                                                                                                           // 918
    throw new Meteor.Error(403, "Email doesn't match the criteria.");                                            // 919
});                                                                                                              // 920
                                                                                                                 // 921
///                                                                                                              // 922
/// MANAGING USER OBJECTS                                                                                        // 923
///                                                                                                              // 924
                                                                                                                 // 925
// Updates or creates a user after we authenticate with a 3rd party.                                             // 926
//                                                                                                               // 927
// @param serviceName {String} Service name (eg, twitter).                                                       // 928
// @param serviceData {Object} Data to store in the user's record                                                // 929
//        under services[serviceName]. Must include an "id" field                                                // 930
//        which is a unique identifier for the user in the service.                                              // 931
// @param options {Object, optional} Other options to pass to insertUserDoc                                      // 932
//        (eg, profile)                                                                                          // 933
// @returns {Object} Object with token and id keys, like the result                                              // 934
//        of the "login" method.                                                                                 // 935
//                                                                                                               // 936
Accounts.updateOrCreateUserFromExternalService = function(                                                       // 937
  serviceName, serviceData, options) {                                                                           // 938
  options = _.clone(options || {});                                                                              // 939
                                                                                                                 // 940
  if (serviceName === "password" || serviceName === "resume")                                                    // 941
    throw new Error(                                                                                             // 942
      "Can't use updateOrCreateUserFromExternalService with internal service "                                   // 943
        + serviceName);                                                                                          // 944
  if (!_.has(serviceData, 'id'))                                                                                 // 945
    throw new Error(                                                                                             // 946
      "Service data for service " + serviceName + " must include id");                                           // 947
                                                                                                                 // 948
  // Look for a user with the appropriate service user id.                                                       // 949
  var selector = {};                                                                                             // 950
  var serviceIdKey = "services." + serviceName + ".id";                                                          // 951
                                                                                                                 // 952
  // XXX Temporary special case for Twitter. (Issue #629)                                                        // 953
  //   The serviceData.id will be a string representation of an integer.                                         // 954
  //   We want it to match either a stored string or int representation.                                         // 955
  //   This is to cater to earlier versions of Meteor storing twitter                                            // 956
  //   user IDs in number form, and recent versions storing them as strings.                                     // 957
  //   This can be removed once migration technology is in place, and twitter                                    // 958
  //   users stored with integer IDs have been migrated to string IDs.                                           // 959
  if (serviceName === "twitter" && !isNaN(serviceData.id)) {                                                     // 960
    selector["$or"] = [{},{}];                                                                                   // 961
    selector["$or"][0][serviceIdKey] = serviceData.id;                                                           // 962
    selector["$or"][1][serviceIdKey] = parseInt(serviceData.id, 10);                                             // 963
  } else {                                                                                                       // 964
    selector[serviceIdKey] = serviceData.id;                                                                     // 965
  }                                                                                                              // 966
                                                                                                                 // 967
  var user = Meteor.users.findOne(selector);                                                                     // 968
                                                                                                                 // 969
  if (user) {                                                                                                    // 970
    // We *don't* process options (eg, profile) for update, but we do replace                                    // 971
    // the serviceData (eg, so that we keep an unexpired access token and                                        // 972
    // don't cache old email addresses in serviceData.email).                                                    // 973
    // XXX provide an onUpdateUser hook which would let apps update                                              // 974
    //     the profile too                                                                                       // 975
    var setAttrs = {};                                                                                           // 976
    _.each(serviceData, function(value, key) {                                                                   // 977
      setAttrs["services." + serviceName + "." + key] = value;                                                   // 978
    });                                                                                                          // 979
                                                                                                                 // 980
    // XXX Maybe we should re-use the selector above and notice if the update                                    // 981
    //     touches nothing?                                                                                      // 982
    Meteor.users.update(user._id, {$set: setAttrs});                                                             // 983
    return {                                                                                                     // 984
      type: serviceName,                                                                                         // 985
      userId: user._id                                                                                           // 986
    };                                                                                                           // 987
  } else {                                                                                                       // 988
    // Create a new user with the service data. Pass other options through to                                    // 989
    // insertUserDoc.                                                                                            // 990
    user = {services: {}};                                                                                       // 991
    user.services[serviceName] = serviceData;                                                                    // 992
    return {                                                                                                     // 993
      type: serviceName,                                                                                         // 994
      userId: Accounts.insertUserDoc(options, user)                                                              // 995
    };                                                                                                           // 996
  }                                                                                                              // 997
};                                                                                                               // 998
                                                                                                                 // 999
                                                                                                                 // 1000
///                                                                                                              // 1001
/// PUBLISHING DATA                                                                                              // 1002
///                                                                                                              // 1003
                                                                                                                 // 1004
// Publish the current user's record to the client.                                                              // 1005
Meteor.publish(null, function() {                                                                                // 1006
  if (this.userId) {                                                                                             // 1007
    return Meteor.users.find(                                                                                    // 1008
      {_id: this.userId},                                                                                        // 1009
      {fields: {profile: 1, username: 1, emails: 1}});                                                           // 1010
  } else {                                                                                                       // 1011
    return null;                                                                                                 // 1012
  }                                                                                                              // 1013
}, /*suppress autopublish warning*/{is_auto: true});                                                             // 1014
                                                                                                                 // 1015
// If autopublish is on, publish these user fields. Login service                                                // 1016
// packages (eg accounts-google) add to these by calling                                                         // 1017
// Accounts.addAutopublishFields Notably, this isn't implemented with                                            // 1018
// multiple publishes since DDP only merges only across top-level                                                // 1019
// fields, not subfields (such as 'services.facebook.accessToken')                                               // 1020
var autopublishFields = {                                                                                        // 1021
  loggedInUser: ['profile', 'username', 'emails'],                                                               // 1022
  otherUsers: ['profile', 'username']                                                                            // 1023
};                                                                                                               // 1024
                                                                                                                 // 1025
// Add to the list of fields or subfields to be automatically                                                    // 1026
// published if autopublish is on. Must be called from top-level                                                 // 1027
// code (ie, before Meteor.startup hooks run).                                                                   // 1028
//                                                                                                               // 1029
// @param opts {Object} with:                                                                                    // 1030
//   - forLoggedInUser {Array} Array of fields published to the logged-in user                                   // 1031
//   - forOtherUsers {Array} Array of fields published to users that aren't logged in                            // 1032
Accounts.addAutopublishFields = function(opts) {                                                                 // 1033
  autopublishFields.loggedInUser.push.apply(                                                                     // 1034
    autopublishFields.loggedInUser, opts.forLoggedInUser);                                                       // 1035
  autopublishFields.otherUsers.push.apply(                                                                       // 1036
    autopublishFields.otherUsers, opts.forOtherUsers);                                                           // 1037
};                                                                                                               // 1038
                                                                                                                 // 1039
if (Package.autopublish) {                                                                                       // 1040
  // Use Meteor.startup to give other packages a chance to call                                                  // 1041
  // addAutopublishFields.                                                                                       // 1042
  Meteor.startup(function () {                                                                                   // 1043
    // ['profile', 'username'] -> {profile: 1, username: 1}                                                      // 1044
    var toFieldSelector = function(fields) {                                                                     // 1045
      return _.object(_.map(fields, function(field) {                                                            // 1046
        return [field, 1];                                                                                       // 1047
      }));                                                                                                       // 1048
    };                                                                                                           // 1049
                                                                                                                 // 1050
    Meteor.server.publish(null, function () {                                                                    // 1051
      if (this.userId) {                                                                                         // 1052
        return Meteor.users.find(                                                                                // 1053
          {_id: this.userId},                                                                                    // 1054
          {fields: toFieldSelector(autopublishFields.loggedInUser)});                                            // 1055
      } else {                                                                                                   // 1056
        return null;                                                                                             // 1057
      }                                                                                                          // 1058
    }, /*suppress autopublish warning*/{is_auto: true});                                                         // 1059
                                                                                                                 // 1060
    // XXX this publish is neither dedup-able nor is it optimized by our special                                 // 1061
    // treatment of queries on a specific _id. Therefore this will have O(n^2)                                   // 1062
    // run-time performance every time a user document is changed (eg someone                                    // 1063
    // logging in). If this is a problem, we can instead write a manual publish                                  // 1064
    // function which filters out fields based on 'this.userId'.                                                 // 1065
    Meteor.server.publish(null, function () {                                                                    // 1066
      var selector;                                                                                              // 1067
      if (this.userId)                                                                                           // 1068
        selector = {_id: {$ne: this.userId}};                                                                    // 1069
      else                                                                                                       // 1070
        selector = {};                                                                                           // 1071
                                                                                                                 // 1072
      return Meteor.users.find(                                                                                  // 1073
        selector,                                                                                                // 1074
        {fields: toFieldSelector(autopublishFields.otherUsers)});                                                // 1075
    }, /*suppress autopublish warning*/{is_auto: true});                                                         // 1076
  });                                                                                                            // 1077
}                                                                                                                // 1078
                                                                                                                 // 1079
// Publish all login service configuration fields other than secret.                                             // 1080
Meteor.publish("meteor.loginServiceConfiguration", function () {                                                 // 1081
  var ServiceConfiguration =                                                                                     // 1082
    Package['service-configuration'].ServiceConfiguration;                                                       // 1083
  return ServiceConfiguration.configurations.find({}, {fields: {secret: 0}});                                    // 1084
}, {is_auto: true}); // not techincally autopublish, but stops the warning.                                      // 1085
                                                                                                                 // 1086
// Allow a one-time configuration for a login service. Modifications                                             // 1087
// to this collection are also allowed in insecure mode.                                                         // 1088
Meteor.methods({                                                                                                 // 1089
  "configureLoginService": function (options) {                                                                  // 1090
    check(options, Match.ObjectIncluding({service: String}));                                                    // 1091
    // Don't let random users configure a service we haven't added yet (so                                       // 1092
    // that when we do later add it, it's set up with their configuration                                        // 1093
    // instead of ours).                                                                                         // 1094
    // XXX if service configuration is oauth-specific then this code should                                      // 1095
    //     be in accounts-oauth; if it's not then the registry should be                                         // 1096
    //     in this package                                                                                       // 1097
    if (!(Accounts.oauth                                                                                         // 1098
          && _.contains(Accounts.oauth.serviceNames(), options.service))) {                                      // 1099
      throw new Meteor.Error(403, "Service unknown");                                                            // 1100
    }                                                                                                            // 1101
                                                                                                                 // 1102
    var ServiceConfiguration =                                                                                   // 1103
      Package['service-configuration'].ServiceConfiguration;                                                     // 1104
    if (ServiceConfiguration.configurations.findOne({service: options.service}))                                 // 1105
      throw new Meteor.Error(403, "Service " + options.service + " already configured");                         // 1106
    ServiceConfiguration.configurations.insert(options);                                                         // 1107
  }                                                                                                              // 1108
});                                                                                                              // 1109
                                                                                                                 // 1110
                                                                                                                 // 1111
///                                                                                                              // 1112
/// RESTRICTING WRITES TO USER OBJECTS                                                                           // 1113
///                                                                                                              // 1114
                                                                                                                 // 1115
Meteor.users.allow({                                                                                             // 1116
  // clients can modify the profile field of their own document, and                                             // 1117
  // nothing else.                                                                                               // 1118
  update: function (userId, user, fields, modifier) {                                                            // 1119
    // make sure it is our record                                                                                // 1120
    if (user._id !== userId)                                                                                     // 1121
      return false;                                                                                              // 1122
                                                                                                                 // 1123
    // user can only modify the 'profile' field. sets to multiple                                                // 1124
    // sub-keys (eg profile.foo and profile.bar) are merged into entry                                           // 1125
    // in the fields list.                                                                                       // 1126
    if (fields.length !== 1 || fields[0] !== 'profile')                                                          // 1127
      return false;                                                                                              // 1128
                                                                                                                 // 1129
    return true;                                                                                                 // 1130
  },                                                                                                             // 1131
  fetch: ['_id'] // we only look at _id.                                                                         // 1132
});                                                                                                              // 1133
                                                                                                                 // 1134
/// DEFAULT INDEXES ON USERS                                                                                     // 1135
Meteor.users._ensureIndex('username', {unique: 1, sparse: 1});                                                   // 1136
Meteor.users._ensureIndex('emails.address', {unique: 1, sparse: 1});                                             // 1137
Meteor.users._ensureIndex('services.resume.loginTokens.hashedToken',                                             // 1138
                          {unique: 1, sparse: 1});                                                               // 1139
Meteor.users._ensureIndex('services.resume.loginTokens.token',                                                   // 1140
                          {unique: 1, sparse: 1});                                                               // 1141
// For taking care of logoutOtherClients calls that crashed before the tokens                                    // 1142
// were deleted.                                                                                                 // 1143
Meteor.users._ensureIndex('services.resume.haveLoginTokensToDelete',                                             // 1144
                          { sparse: 1 });                                                                        // 1145
// For expiring login tokens                                                                                     // 1146
Meteor.users._ensureIndex("services.resume.loginTokens.when", { sparse: 1 });                                    // 1147
                                                                                                                 // 1148
///                                                                                                              // 1149
/// CLEAN UP FOR `logoutOtherClients`                                                                            // 1150
///                                                                                                              // 1151
                                                                                                                 // 1152
var deleteSavedTokens = function (userId, tokensToDelete) {                                                      // 1153
  if (tokensToDelete) {                                                                                          // 1154
    Meteor.users.update(userId, {                                                                                // 1155
      $unset: {                                                                                                  // 1156
        "services.resume.haveLoginTokensToDelete": 1,                                                            // 1157
        "services.resume.loginTokensToDelete": 1                                                                 // 1158
      },                                                                                                         // 1159
      $pullAll: {                                                                                                // 1160
        "services.resume.loginTokens": tokensToDelete                                                            // 1161
      }                                                                                                          // 1162
    });                                                                                                          // 1163
  }                                                                                                              // 1164
};                                                                                                               // 1165
                                                                                                                 // 1166
Meteor.startup(function () {                                                                                     // 1167
  // If we find users who have saved tokens to delete on startup, delete them                                    // 1168
  // now. It's possible that the server could have crashed and come back up                                      // 1169
  // before new tokens are found in localStorage, but this shouldn't happen very                                 // 1170
  // often. We shouldn't put a delay here because that would give a lot of power                                 // 1171
  // to an attacker with a stolen login token and the ability to crash the                                       // 1172
  // server.                                                                                                     // 1173
  var users = Meteor.users.find({                                                                                // 1174
    "services.resume.haveLoginTokensToDelete": true                                                              // 1175
  }, {                                                                                                           // 1176
    "services.resume.loginTokensToDelete": 1                                                                     // 1177
  });                                                                                                            // 1178
  users.forEach(function (user) {                                                                                // 1179
    deleteSavedTokens(user._id, user.services.resume.loginTokensToDelete);                                       // 1180
  });                                                                                                            // 1181
});                                                                                                              // 1182
                                                                                                                 // 1183
///                                                                                                              // 1184
/// LOGGING OUT DELETED USERS                                                                                    // 1185
///                                                                                                              // 1186
                                                                                                                 // 1187
// When login tokens are removed from the database, close any sessions                                           // 1188
// logged in with those tokens.                                                                                  // 1189
//                                                                                                               // 1190
// Because we upgrade unhashed login tokens to hashed tokens at login                                            // 1191
// time, sessions will only be logged in with a hashed token.  Thus we                                           // 1192
// only need to pull out hashed tokens here.                                                                     // 1193
var closeTokensForUser = function (userTokens) {                                                                 // 1194
  closeConnectionsForTokens(_.compact(_.pluck(userTokens, "hashedToken")));                                      // 1195
};                                                                                                               // 1196
                                                                                                                 // 1197
// Like _.difference, but uses EJSON.equals to compute which values to return.                                   // 1198
var differenceObj = function (array1, array2) {                                                                  // 1199
  return _.filter(array1, function (array1Value) {                                                               // 1200
    return ! _.some(array2, function (array2Value) {                                                             // 1201
      return EJSON.equals(array1Value, array2Value);                                                             // 1202
    });                                                                                                          // 1203
  });                                                                                                            // 1204
};                                                                                                               // 1205
                                                                                                                 // 1206
Meteor.users.find({}, { fields: { "services.resume": 1 }}).observe({                                             // 1207
  changed: function (newUser, oldUser) {                                                                         // 1208
    var removedTokens = [];                                                                                      // 1209
    if (newUser.services && newUser.services.resume &&                                                           // 1210
        oldUser.services && oldUser.services.resume) {                                                           // 1211
      removedTokens = differenceObj(oldUser.services.resume.loginTokens || [],                                   // 1212
                                    newUser.services.resume.loginTokens || []);                                  // 1213
    } else if (oldUser.services && oldUser.services.resume) {                                                    // 1214
      removedTokens = oldUser.services.resume.loginTokens || [];                                                 // 1215
    }                                                                                                            // 1216
    closeTokensForUser(removedTokens);                                                                           // 1217
  },                                                                                                             // 1218
  removed: function (oldUser) {                                                                                  // 1219
    if (oldUser.services && oldUser.services.resume)                                                             // 1220
      closeTokensForUser(oldUser.services.resume.loginTokens || []);                                             // 1221
  }                                                                                                              // 1222
});                                                                                                              // 1223
                                                                                                                 // 1224
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/accounts-base/url_server.js                                                                          //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
// XXX These should probably not actually be public?                                                             // 1
                                                                                                                 // 2
Accounts.urls = {};                                                                                              // 3
                                                                                                                 // 4
Accounts.urls.resetPassword = function (token) {                                                                 // 5
  return Meteor.absoluteUrl('#/reset-password/' + token);                                                        // 6
};                                                                                                               // 7
                                                                                                                 // 8
Accounts.urls.verifyEmail = function (token) {                                                                   // 9
  return Meteor.absoluteUrl('#/verify-email/' + token);                                                          // 10
};                                                                                                               // 11
                                                                                                                 // 12
Accounts.urls.enrollAccount = function (token) {                                                                 // 13
  return Meteor.absoluteUrl('#/enroll-account/' + token);                                                        // 14
};                                                                                                               // 15
                                                                                                                 // 16
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package['accounts-base'] = {
  Accounts: Accounts
};

})();
