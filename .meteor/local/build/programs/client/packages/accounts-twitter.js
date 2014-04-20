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
var Twitter = Package.twitter.Twitter;
var HTTP = Package.http.HTTP;

(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                     //
// packages/accounts-twitter/twitter.js                                                                //
//                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                       //
Accounts.oauth.registerService('twitter');                                                             // 1
                                                                                                       // 2
if (Meteor.isClient) {                                                                                 // 3
  Meteor.loginWithTwitter = function(options, callback) {                                              // 4
    // support a callback without options                                                              // 5
    if (! callback && typeof options === "function") {                                                 // 6
      callback = options;                                                                              // 7
      options = null;                                                                                  // 8
    }                                                                                                  // 9
                                                                                                       // 10
    var credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(callback); // 11
    Twitter.requestCredential(options, credentialRequestCompleteCallback);                             // 12
  };                                                                                                   // 13
} else {                                                                                               // 14
  var autopublishedFields = _.map(                                                                     // 15
    // don't send access token. https://dev.twitter.com/discussions/5025                               // 16
    Twitter.whitelistedFields.concat(['id', 'screenName']),                                            // 17
    function (subfield) { return 'services.twitter.' + subfield; });                                   // 18
                                                                                                       // 19
  Accounts.addAutopublishFields({                                                                      // 20
    forLoggedInUser: autopublishedFields,                                                              // 21
    forOtherUsers: autopublishedFields                                                                 // 22
  });                                                                                                  // 23
}                                                                                                      // 24
                                                                                                       // 25
/////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package['accounts-twitter'] = {};

})();

//# sourceMappingURL=a1c5862c55c6bf951b845bee147062ac1d5fb3d4.map
