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
var Oauth = Package.oauth.Oauth;
var _ = Package.underscore._;
var Template = Package.templating.Template;
var Random = Package.random.Random;
var ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;
var UI = Package.ui.UI;
var Handlebars = Package.ui.Handlebars;
var HTML = Package.htmljs.HTML;

/* Package-scope variables */
var Github;

(function () {

////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                            //
// packages/github/template.github_configure.js                                               //
//                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                              //
                                                                                              // 1
Template.__define__("configureLoginServiceDialogForGithub", (function() {                     // 2
  var self = this;                                                                            // 3
  var template = this;                                                                        // 4
  return [ HTML.Raw("<p>\n    First, you'll need to get a Github Client ID. Follow these steps:\n  </p>\n  "), HTML.OL(HTML.Raw('\n    <li>\n      Visit <a href="https://github.com/settings/applications/new" target="blank">https://github.com/settings/applications/new</a>\n    </li>\n    '), HTML.LI("\n      Set Homepage URL to: ", HTML.SPAN({
    "class": "url"                                                                            // 6
  }, function() {                                                                             // 7
    return Spacebars.mustache(self.lookup("siteUrl"));                                        // 8
  }), "\n    "), "\n    ", HTML.LI("\n      Set Authorization callback URL to: ", HTML.SPAN({ // 9
    "class": "url"                                                                            // 10
  }, function() {                                                                             // 11
    return Spacebars.mustache(self.lookup("siteUrl"));                                        // 12
  }, "_oauth/github?close"), "\n    "), "\n  ") ];                                            // 13
}));                                                                                          // 14
                                                                                              // 15
////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                            //
// packages/github/github_configure.js                                                        //
//                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                              //
Template.configureLoginServiceDialogForGithub.siteUrl = function () {                         // 1
  return Meteor.absoluteUrl();                                                                // 2
};                                                                                            // 3
                                                                                              // 4
Template.configureLoginServiceDialogForGithub.fields = function () {                          // 5
  return [                                                                                    // 6
    {property: 'clientId', label: 'Client ID'},                                               // 7
    {property: 'secret', label: 'Client Secret'}                                              // 8
  ];                                                                                          // 9
};                                                                                            // 10
////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                            //
// packages/github/github_client.js                                                           //
//                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                              //
Github = {};                                                                                  // 1
                                                                                              // 2
// Request Github credentials for the user                                                    // 3
// @param options {optional}                                                                  // 4
// @param credentialRequestCompleteCallback {Function} Callback function to call on           // 5
//   completion. Takes one argument, credentialToken on success, or Error on                  // 6
//   error.                                                                                   // 7
Github.requestCredential = function (options, credentialRequestCompleteCallback) {            // 8
  // support both (options, callback) and (callback).                                         // 9
  if (!credentialRequestCompleteCallback && typeof options === 'function') {                  // 10
    credentialRequestCompleteCallback = options;                                              // 11
    options = {};                                                                             // 12
  }                                                                                           // 13
                                                                                              // 14
  var config = ServiceConfiguration.configurations.findOne({service: 'github'});              // 15
  if (!config) {                                                                              // 16
    credentialRequestCompleteCallback && credentialRequestCompleteCallback(new ServiceConfiguration.ConfigError("Service not configured"));
    return;                                                                                   // 18
  }                                                                                           // 19
  var credentialToken = Random.id();                                                          // 20
                                                                                              // 21
  var scope = (options && options.requestPermissions) || [];                                  // 22
  var flatScope = _.map(scope, encodeURIComponent).join('+');                                 // 23
                                                                                              // 24
  var loginUrl =                                                                              // 25
        'https://github.com/login/oauth/authorize' +                                          // 26
        '?client_id=' + config.clientId +                                                     // 27
        '&scope=' + flatScope +                                                               // 28
        '&redirect_uri=' + Meteor.absoluteUrl('_oauth/github?close') +                        // 29
        '&state=' + credentialToken;                                                          // 30
                                                                                              // 31
                                                                                              // 32
  Oauth.showPopup(                                                                            // 33
    loginUrl,                                                                                 // 34
    _.bind(credentialRequestCompleteCallback, null, credentialToken),                         // 35
    {width: 900, height: 450}                                                                 // 36
  );                                                                                          // 37
};                                                                                            // 38
                                                                                              // 39
////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package.github = {
  Github: Github
};

})();

//# sourceMappingURL=86bfe4a125709e69ca8020123c5c76956f686b70.map
