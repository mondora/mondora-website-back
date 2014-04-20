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
var Accounts = Package['accounts-base'].Accounts;
var Github = Package.github.Github;

(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                     //
// packages/accounts-github/github.js                                                                  //
//                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                       //
Accounts.oauth.registerService('github');                                                              // 1
                                                                                                       // 2
if (Meteor.isClient) {                                                                                 // 3
  Meteor.loginWithGithub = function(options, callback) {                                               // 4
    // support a callback without options                                                              // 5
    if (! callback && typeof options === "function") {                                                 // 6
      callback = options;                                                                              // 7
      options = null;                                                                                  // 8
    }                                                                                                  // 9
                                                                                                       // 10
    var credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(callback); // 11
    Github.requestCredential(options, credentialRequestCompleteCallback);                              // 12
  };                                                                                                   // 13
} else {                                                                                               // 14
  Accounts.addAutopublishFields({                                                                      // 15
    // not sure whether the github api can be used from the browser,                                   // 16
    // thus not sure if we should be sending access tokens; but we do it                               // 17
    // for all other oauth2 providers, and it may come in handy.                                       // 18
    forLoggedInUser: ['services.github'],                                                              // 19
    forOtherUsers: ['services.github.username']                                                        // 20
  });                                                                                                  // 21
}                                                                                                      // 22
                                                                                                       // 23
/////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package['accounts-github'] = {};

})();

//# sourceMappingURL=cd8e0996c426b07b63ab8131432e3cbb1bf3f6b9.map
