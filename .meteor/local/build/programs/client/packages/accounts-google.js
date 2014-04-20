//////////////////////////////////////////////////////////////////////////
//                                                                      //
// This is a generated file. You can view the original                  //
// source in your browser if your browser supports source maps.         //
//                                                                      //
// If you are using Chrome, open the Developer Tools and click the gear //
// icon in its lower right corner. In the General Settings panel, turn  //
// on 'Enable source maps'.                                             //
//                                                                      //
// If you are using Firefox 23, go to `about:config` and set the        //
// `devtools.debugger.source-maps-enabled` preference to true.          //
// (The preference should be on by default in Firefox 24; versions      //
// older than 23 do not support source maps.)                           //
//                                                                      //
//////////////////////////////////////////////////////////////////////////


(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var _ = Package.underscore._;
var Random = Package.random.Random;
var Accounts = Package['accounts-base'].Accounts;
var Google = Package.google.Google;

(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                     //
// packages/accounts-google/google.js                                                                  //
//                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                       //
Accounts.oauth.registerService('google');                                                              // 1
                                                                                                       // 2
if (Meteor.isClient) {                                                                                 // 3
  Meteor.loginWithGoogle = function(options, callback) {                                               // 4
    // support a callback without options                                                              // 5
    if (! callback && typeof options === "function") {                                                 // 6
      callback = options;                                                                              // 7
      options = null;                                                                                  // 8
    }                                                                                                  // 9
                                                                                                       // 10
    var credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(callback); // 11
    Google.requestCredential(options, credentialRequestCompleteCallback);                              // 12
  };                                                                                                   // 13
} else {                                                                                               // 14
  Accounts.addAutopublishFields({                                                                      // 15
    forLoggedInUser: _.map(                                                                            // 16
      // publish access token since it can be used from the client (if                                 // 17
      // transmitted over ssl or on                                                                    // 18
      // localhost). https://developers.google.com/accounts/docs/OAuth2UserAgent                       // 19
      // refresh token probably shouldn't be sent down.                                                // 20
      Google.whitelistedFields.concat(['accessToken', 'expiresAt']), // don't publish refresh token    // 21
      function (subfield) { return 'services.google.' + subfield; }),                                  // 22
                                                                                                       // 23
    forOtherUsers: _.map(                                                                              // 24
      // even with autopublish, no legitimate web app should be                                        // 25
      // publishing all users' emails                                                                  // 26
      _.without(Google.whitelistedFields, 'email', 'verified_email'),                                  // 27
      function (subfield) { return 'services.google.' + subfield; })                                   // 28
  });                                                                                                  // 29
}                                                                                                      // 30
                                                                                                       // 31
/////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package['accounts-google'] = {};

})();

//# sourceMappingURL=9ef9953d728cd324cfd7280e7b31c1b89ce5eed5.map
