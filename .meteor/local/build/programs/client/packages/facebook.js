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
var Template = Package.templating.Template;
var Random = Package.random.Random;
var ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;
var UI = Package.ui.UI;
var Handlebars = Package.ui.Handlebars;
var HTML = Package.htmljs.HTML;

/* Package-scope variables */
var Facebook;

(function () {

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// packages/facebook/template.facebook_configure.js                                    //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
                                                                                       // 1
Template.__define__("configureLoginServiceDialogForFacebook", (function() {            // 2
  var self = this;                                                                     // 3
  var template = this;                                                                 // 4
  return [ HTML.Raw("<p>\n    First, you'll need to register your app on Facebook. Follow these steps:\n  </p>\n  "), HTML.OL(HTML.Raw('\n    <li>\n      Visit <a href="https://developers.facebook.com/apps" target="_blank">https://developers.facebook.com/apps</a>\n    </li>\n    <li>\n      Select "Apps", then "Create a New App". (You don\'t need to enter a namespace.)\n    </li>\n    <li>\n      Select "Settings" and enter a "Contact Email".  Then select "Add Platform"\n      and choose "Website".\n    </li>\n    '), HTML.LI("\n      Set Site URL to: ", HTML.SPAN({
    "class": "url"                                                                     // 6
  }, function() {                                                                      // 7
    return Spacebars.mustache(self.lookup("siteUrl"));                                 // 8
  }), "\n    "), HTML.Raw('\n    <li>\n      Select "Status" and make the app and all its live features available to\n      the general public.\n    </li>\n    <li>\n      Select "Dashboard".\n    </li>\n  ')) ];
}));                                                                                   // 10
                                                                                       // 11
/////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// packages/facebook/facebook_configure.js                                             //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
Template.configureLoginServiceDialogForFacebook.siteUrl = function () {                // 1
  return Meteor.absoluteUrl();                                                         // 2
};                                                                                     // 3
                                                                                       // 4
Template.configureLoginServiceDialogForFacebook.fields = function () {                 // 5
  return [                                                                             // 6
    {property: 'appId', label: 'App ID'},                                              // 7
    {property: 'secret', label: 'App Secret'}                                          // 8
  ];                                                                                   // 9
};                                                                                     // 10
/////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// packages/facebook/facebook_client.js                                                //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
Facebook = {};                                                                         // 1
                                                                                       // 2
// Request Facebook credentials for the user                                           // 3
//                                                                                     // 4
// @param options {optional}                                                           // 5
// @param credentialRequestCompleteCallback {Function} Callback function to call on    // 6
//   completion. Takes one argument, credentialToken on success, or Error on           // 7
//   error.                                                                            // 8
Facebook.requestCredential = function (options, credentialRequestCompleteCallback) {   // 9
  // support both (options, callback) and (callback).                                  // 10
  if (!credentialRequestCompleteCallback && typeof options === 'function') {           // 11
    credentialRequestCompleteCallback = options;                                       // 12
    options = {};                                                                      // 13
  }                                                                                    // 14
                                                                                       // 15
  var config = ServiceConfiguration.configurations.findOne({service: 'facebook'});     // 16
  if (!config) {                                                                       // 17
    credentialRequestCompleteCallback && credentialRequestCompleteCallback(new ServiceConfiguration.ConfigError("Service not configured"));
    return;                                                                            // 19
  }                                                                                    // 20
                                                                                       // 21
  var credentialToken = Random.id();                                                   // 22
  var mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent); // 23
  var display = mobile ? 'touch' : 'popup';                                            // 24
                                                                                       // 25
  var scope = "email";                                                                 // 26
  if (options && options.requestPermissions)                                           // 27
    scope = options.requestPermissions.join(',');                                      // 28
                                                                                       // 29
  var loginUrl =                                                                       // 30
        'https://www.facebook.com/dialog/oauth?client_id=' + config.appId +            // 31
        '&redirect_uri=' + Meteor.absoluteUrl('_oauth/facebook?close') +               // 32
        '&display=' + display + '&scope=' + scope + '&state=' + credentialToken;       // 33
                                                                                       // 34
  Oauth.showPopup(                                                                     // 35
    loginUrl,                                                                          // 36
    _.bind(credentialRequestCompleteCallback, null, credentialToken)                   // 37
  );                                                                                   // 38
};                                                                                     // 39
                                                                                       // 40
/////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package.facebook = {
  Facebook: Facebook
};

})();

//# sourceMappingURL=3bfdff08028929022710990293f3f55250d741aa.map
