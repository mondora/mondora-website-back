(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var _ = Package.underscore._;
var Random = Package.random.Random;
var check = Package.check.check;
var Match = Package.check.Match;
var WebApp = Package.webapp.WebApp;
var main = Package.webapp.main;
var WebAppInternals = Package.webapp.WebAppInternals;
var Accounts = Package['accounts-base'].Accounts;
var Oauth = Package.oauth.Oauth;

(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                 //
// packages/accounts-oauth/oauth_common.js                                                                         //
//                                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                   //
Accounts.oauth = {};                                                                                               // 1
                                                                                                                   // 2
var services = {};                                                                                                 // 3
                                                                                                                   // 4
// Helper for registering OAuth based accounts packages.                                                           // 5
// On the server, adds an index to the user collection.                                                            // 6
Accounts.oauth.registerService = function (name) {                                                                 // 7
  if (_.has(services, name))                                                                                       // 8
    throw new Error("Duplicate service: " + name);                                                                 // 9
  services[name] = true;                                                                                           // 10
                                                                                                                   // 11
  if (Meteor.server) {                                                                                             // 12
    // Accounts.updateOrCreateUserFromExternalService does a lookup by this id,                                    // 13
    // so this should be a unique index. You might want to add indexes for other                                   // 14
    // fields returned by your service (eg services.github.login) but you can do                                   // 15
    // that in your app.                                                                                           // 16
    Meteor.users._ensureIndex('services.' + name + '.id',                                                          // 17
                              {unique: 1, sparse: 1});                                                             // 18
  }                                                                                                                // 19
};                                                                                                                 // 20
                                                                                                                   // 21
Accounts.oauth.serviceNames = function () {                                                                        // 22
  return _.keys(services);                                                                                         // 23
};                                                                                                                 // 24
                                                                                                                   // 25
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                 //
// packages/accounts-oauth/oauth_server.js                                                                         //
//                                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                   //
// Listen to calls to `login` with an oauth option set. This is where                                              // 1
// users actually get logged in to meteor via oauth.                                                               // 2
Accounts.registerLoginHandler(function (options) {                                                                 // 3
  if (!options.oauth)                                                                                              // 4
    return undefined; // don't handle                                                                              // 5
                                                                                                                   // 6
  check(options.oauth, {credentialToken: String});                                                                 // 7
                                                                                                                   // 8
  if (!Oauth.hasCredential(options.oauth.credentialToken)) {                                                       // 9
    // OAuth credentialToken is not recognized, which could be either                                              // 10
    // because the popup was closed by the user before completion, or                                              // 11
    // some sort of error where the oauth provider didn't talk to our                                              // 12
    // server correctly and closed the popup somehow.                                                              // 13
    //                                                                                                             // 14
    // We assume it was user canceled and report it as such, using a                                               // 15
    // numeric code that the client recognizes (XXX this will get                                                  // 16
    // replaced by a symbolic error code at some point                                                             // 17
    // https://trello.com/c/kMkw800Z/53-official-ddp-specification). This                                          // 18
    // will mask failures where things are misconfigured such that the                                             // 19
    // server doesn't see the request but does close the window. This                                              // 20
    // seems unlikely.                                                                                             // 21
    //                                                                                                             // 22
    // XXX we want `type` to be the service name such as "facebook"                                                // 23
    return { type: "oauth",                                                                                        // 24
             error: new Meteor.Error(                                                                              // 25
               Accounts.LoginCancelledError.numericError, "Login canceled") };                                     // 26
  }                                                                                                                // 27
  var result = Oauth.retrieveCredential(options.oauth.credentialToken);                                            // 28
  if (result instanceof Error)                                                                                     // 29
    // We tried to login, but there was a fatal error. Report it back                                              // 30
    // to the user.                                                                                                // 31
    throw result;                                                                                                  // 32
  else                                                                                                             // 33
    return Accounts.updateOrCreateUserFromExternalService(result.serviceName, result.serviceData, result.options); // 34
});                                                                                                                // 35
                                                                                                                   // 36
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package['accounts-oauth'] = {};

})();
