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
var HTTP = Package.http.HTTP;
var Template = Package.templating.Template;
var Oauth = Package.oauth.Oauth;
var Random = Package.random.Random;
var ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;
var UI = Package.ui.UI;
var Handlebars = Package.ui.Handlebars;
var HTML = Package.htmljs.HTML;

/* Package-scope variables */
var Twitter;

(function () {

///////////////////////////////////////////////////////////////////////////////////////////
//                                                                                       //
// packages/twitter/template.twitter_configure.js                                        //
//                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////
                                                                                         //
                                                                                         // 1
Template.__define__("configureLoginServiceDialogForTwitter", (function() {               // 2
  var self = this;                                                                       // 3
  var template = this;                                                                   // 4
  return [ HTML.Raw("<p>\n    First, you'll need to register your app on Twitter. Follow these steps:\n  </p>\n  "), HTML.OL(HTML.Raw('\n    <li>\n      Visit <a href="https://dev.twitter.com/apps/new" target="_blank">https://dev.twitter.com/apps/new</a>\n    </li>\n    '), HTML.LI("\n      Set Callback URL to: ", HTML.SPAN({
    "class": "url"                                                                       // 6
  }, function() {                                                                        // 7
    return Spacebars.mustache(self.lookup("siteUrl"));                                   // 8
  }, "_oauth/twitter?close"), "\n    "), "\n  ") ];                                      // 9
}));                                                                                     // 10
                                                                                         // 11
///////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////////////
//                                                                                       //
// packages/twitter/twitter_configure.js                                                 //
//                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////
                                                                                         //
Template.configureLoginServiceDialogForTwitter.siteUrl = function () {                   // 1
  // Twitter doesn't recognize localhost as a domain name                                // 2
  return Meteor.absoluteUrl({replaceLocalhost: true});                                   // 3
};                                                                                       // 4
                                                                                         // 5
Template.configureLoginServiceDialogForTwitter.fields = function () {                    // 6
  return [                                                                               // 7
    {property: 'consumerKey', label: 'Consumer key'},                                    // 8
    {property: 'secret', label: 'Consumer secret'}                                       // 9
  ];                                                                                     // 10
};                                                                                       // 11
///////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////////////
//                                                                                       //
// packages/twitter/twitter_client.js                                                    //
//                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////
                                                                                         //
Twitter = {};                                                                            // 1
                                                                                         // 2
// Request Twitter credentials for the user                                              // 3
// @param options {optional}  XXX support options.requestPermissions                     // 4
// @param credentialRequestCompleteCallback {Function} Callback function to call on      // 5
//   completion. Takes one argument, credentialToken on success, or Error on             // 6
//   error.                                                                              // 7
Twitter.requestCredential = function (options, credentialRequestCompleteCallback) {      // 8
  // support both (options, callback) and (callback).                                    // 9
  if (!credentialRequestCompleteCallback && typeof options === 'function') {             // 10
    credentialRequestCompleteCallback = options;                                         // 11
    options = {};                                                                        // 12
  }                                                                                      // 13
                                                                                         // 14
  var config = ServiceConfiguration.configurations.findOne({service: 'twitter'});        // 15
  if (!config) {                                                                         // 16
    credentialRequestCompleteCallback && credentialRequestCompleteCallback(new ServiceConfiguration.ConfigError("Service not configured"));
    return;                                                                              // 18
  }                                                                                      // 19
                                                                                         // 20
  var credentialToken = Random.id();                                                     // 21
  // We need to keep credentialToken across the next two 'steps' so we're adding         // 22
  // a credentialToken parameter to the url and the callback url that we'll be returned  // 23
  // to by oauth provider                                                                // 24
                                                                                         // 25
  // url back to app, enters "step 2" as described in                                    // 26
  // packages/accounts-oauth1-helper/oauth1_server.js                                    // 27
  var callbackUrl = Meteor.absoluteUrl('_oauth/twitter?close&state=' + credentialToken); // 28
                                                                                         // 29
  // url to app, enters "step 1" as described in                                         // 30
  // packages/accounts-oauth1-helper/oauth1_server.js                                    // 31
  var loginUrl = '/_oauth/twitter/?requestTokenAndRedirect='                             // 32
        + encodeURIComponent(callbackUrl)                                                // 33
        + '&state=' + credentialToken;                                                   // 34
                                                                                         // 35
  Oauth.showPopup(                                                                       // 36
    loginUrl,                                                                            // 37
    _.bind(credentialRequestCompleteCallback, null, credentialToken)                     // 38
  );                                                                                     // 39
};                                                                                       // 40
                                                                                         // 41
///////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package.twitter = {
  Twitter: Twitter
};

})();

//# sourceMappingURL=508d0992e5c386703bb28403771d67f8039d1997.map
