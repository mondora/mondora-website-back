(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var Random = Package.random.Random;
var ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;
var Oauth = Package.oauth.Oauth;
var _ = Package.underscore._;
var HTTP = Package.http.HTTP;

/* Package-scope variables */
var OAuth1Binding, OAuth1Test;

(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                     //
// packages/oauth1/oauth1_binding.js                                                                   //
//                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                       //
var crypto = Npm.require("crypto");                                                                    // 1
var querystring = Npm.require("querystring");                                                          // 2
                                                                                                       // 3
// An OAuth1 wrapper around http calls which helps get tokens and                                      // 4
// takes care of HTTP headers                                                                          // 5
//                                                                                                     // 6
// @param config {Object}                                                                              // 7
//   - consumerKey (String): oauth consumer key                                                        // 8
//   - secret (String): oauth consumer secret                                                          // 9
// @param urls {Object}                                                                                // 10
//   - requestToken (String): url                                                                      // 11
//   - authorize (String): url                                                                         // 12
//   - accessToken (String): url                                                                       // 13
//   - authenticate (String): url                                                                      // 14
OAuth1Binding = function(config, urls) {                                                               // 15
  this._config = config;                                                                               // 16
  this._urls = urls;                                                                                   // 17
};                                                                                                     // 18
                                                                                                       // 19
OAuth1Binding.prototype.prepareRequestToken = function(callbackUrl) {                                  // 20
  var self = this;                                                                                     // 21
                                                                                                       // 22
  var headers = self._buildHeader({                                                                    // 23
    oauth_callback: callbackUrl                                                                        // 24
  });                                                                                                  // 25
                                                                                                       // 26
  var response = self._call('POST', self._urls.requestToken, headers);                                 // 27
  var tokens = querystring.parse(response.content);                                                    // 28
                                                                                                       // 29
  if (!tokens.oauth_callback_confirmed)                                                                // 30
    throw new Error(                                                                                   // 31
      "oauth_callback_confirmed false when requesting oauth1 token", tokens);                          // 32
                                                                                                       // 33
  self.requestToken = tokens.oauth_token;                                                              // 34
  self.requestTokenSecret = tokens.oauth_token_secret;                                                 // 35
};                                                                                                     // 36
                                                                                                       // 37
OAuth1Binding.prototype.prepareAccessToken = function(query, requestTokenSecret) {                     // 38
  var self = this;                                                                                     // 39
                                                                                                       // 40
  // support implementations that use request token secrets. This is                                   // 41
  // read by self._call.                                                                               // 42
  //                                                                                                   // 43
  // XXX make it a param to call, not something stashed on self? It's                                  // 44
  // kinda confusing right now, everything except this is passed as                                    // 45
  // arguments, but this is stored.                                                                    // 46
  if (requestTokenSecret)                                                                              // 47
    self.accessTokenSecret = requestTokenSecret;                                                       // 48
                                                                                                       // 49
  var headers = self._buildHeader({                                                                    // 50
    oauth_token: query.oauth_token,                                                                    // 51
    oauth_verifier: query.oauth_verifier                                                               // 52
  });                                                                                                  // 53
                                                                                                       // 54
  var response = self._call('POST', self._urls.accessToken, headers);                                  // 55
  var tokens = querystring.parse(response.content);                                                    // 56
                                                                                                       // 57
  self.accessToken = tokens.oauth_token;                                                               // 58
  self.accessTokenSecret = tokens.oauth_token_secret;                                                  // 59
};                                                                                                     // 60
                                                                                                       // 61
OAuth1Binding.prototype.call = function(method, url, params, callback) {                               // 62
  var self = this;                                                                                     // 63
                                                                                                       // 64
  var headers = self._buildHeader({                                                                    // 65
    oauth_token: self.accessToken                                                                      // 66
  });                                                                                                  // 67
                                                                                                       // 68
  if(!params) {                                                                                        // 69
    params = {};                                                                                       // 70
  }                                                                                                    // 71
                                                                                                       // 72
  return self._call(method, url, headers, params, callback);                                           // 73
};                                                                                                     // 74
                                                                                                       // 75
OAuth1Binding.prototype.get = function(url, params, callback) {                                        // 76
  return this.call('GET', url, params, callback);                                                      // 77
};                                                                                                     // 78
                                                                                                       // 79
OAuth1Binding.prototype.post = function(url, params, callback) {                                       // 80
  return this.call('POST', url, params, callback);                                                     // 81
};                                                                                                     // 82
                                                                                                       // 83
OAuth1Binding.prototype._buildHeader = function(headers) {                                             // 84
  var self = this;                                                                                     // 85
  return _.extend({                                                                                    // 86
    oauth_consumer_key: self._config.consumerKey,                                                      // 87
    oauth_nonce: Random.id().replace(/\W/g, ''),                                                       // 88
    oauth_signature_method: 'HMAC-SHA1',                                                               // 89
    oauth_timestamp: (new Date().valueOf()/1000).toFixed().toString(),                                 // 90
    oauth_version: '1.0'                                                                               // 91
  }, headers);                                                                                         // 92
};                                                                                                     // 93
                                                                                                       // 94
OAuth1Binding.prototype._getSignature = function(method, url, rawHeaders, accessTokenSecret, params) { // 95
  var self = this;                                                                                     // 96
  var headers = self._encodeHeader(_.extend(rawHeaders, params));                                      // 97
                                                                                                       // 98
  var parameters = _.map(headers, function(val, key) {                                                 // 99
    return key + '=' + val;                                                                            // 100
  }).sort().join('&');                                                                                 // 101
                                                                                                       // 102
  var signatureBase = [                                                                                // 103
    method,                                                                                            // 104
    self._encodeString(url),                                                                           // 105
    self._encodeString(parameters)                                                                     // 106
  ].join('&');                                                                                         // 107
                                                                                                       // 108
  var signingKey = self._encodeString(self._config.secret) + '&';                                      // 109
  if (accessTokenSecret)                                                                               // 110
    signingKey += self._encodeString(accessTokenSecret);                                               // 111
                                                                                                       // 112
  return crypto.createHmac('SHA1', signingKey).update(signatureBase).digest('base64');                 // 113
};                                                                                                     // 114
                                                                                                       // 115
OAuth1Binding.prototype._call = function(method, url, headers, params, callback) {                     // 116
  var self = this;                                                                                     // 117
                                                                                                       // 118
  // all URLs to be functions to support parameters/customization                                      // 119
  if(typeof url === "function") {                                                                      // 120
    url = url(self);                                                                                   // 121
  }                                                                                                    // 122
                                                                                                       // 123
  // Get the signature                                                                                 // 124
  headers.oauth_signature =                                                                            // 125
    self._getSignature(method, url, headers, self.accessTokenSecret, params);                          // 126
                                                                                                       // 127
  // Make a authorization string according to oauth1 spec                                              // 128
  var authString = self._getAuthHeaderString(headers);                                                 // 129
                                                                                                       // 130
  // Make signed request                                                                               // 131
  try {                                                                                                // 132
    return HTTP.call(method, url, {                                                                    // 133
      params: params,                                                                                  // 134
      headers: {                                                                                       // 135
        Authorization: authString                                                                      // 136
      }                                                                                                // 137
    }, callback);                                                                                      // 138
  } catch (err) {                                                                                      // 139
    throw _.extend(new Error("Failed to send OAuth1 request to " + url + ". " + err.message),          // 140
                   {response: err.response});                                                          // 141
  }                                                                                                    // 142
};                                                                                                     // 143
                                                                                                       // 144
OAuth1Binding.prototype._encodeHeader = function(header) {                                             // 145
  var self = this;                                                                                     // 146
  return _.reduce(header, function(memo, val, key) {                                                   // 147
    memo[self._encodeString(key)] = self._encodeString(val);                                           // 148
    return memo;                                                                                       // 149
  }, {});                                                                                              // 150
};                                                                                                     // 151
                                                                                                       // 152
OAuth1Binding.prototype._encodeString = function(str) {                                                // 153
  return encodeURIComponent(str).replace(/[!'()]/g, escape).replace(/\*/g, "%2A");                     // 154
};                                                                                                     // 155
                                                                                                       // 156
OAuth1Binding.prototype._getAuthHeaderString = function(headers) {                                     // 157
  var self = this;                                                                                     // 158
  return 'OAuth ' +  _.map(headers, function(val, key) {                                               // 159
    return self._encodeString(key) + '="' + self._encodeString(val) + '"';                             // 160
  }).sort().join(', ');                                                                                // 161
};                                                                                                     // 162
                                                                                                       // 163
/////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                     //
// packages/oauth1/oauth1_server.js                                                                    //
//                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                       //
// A place to store request tokens pending verification                                                // 1
var requestTokens = {};                                                                                // 2
                                                                                                       // 3
OAuth1Test = {requestTokens: requestTokens};                                                           // 4
                                                                                                       // 5
// connect middleware                                                                                  // 6
Oauth._requestHandlers['1'] = function (service, query, res) {                                         // 7
                                                                                                       // 8
  var config = ServiceConfiguration.configurations.findOne({service: service.serviceName});            // 9
  if (!config) {                                                                                       // 10
    throw new ServiceConfiguration.ConfigError("Service " + service.serviceName + " not configured");  // 11
  }                                                                                                    // 12
                                                                                                       // 13
  var urls = service.urls;                                                                             // 14
  var oauthBinding = new OAuth1Binding(config, urls);                                                  // 15
                                                                                                       // 16
  if (query.requestTokenAndRedirect) {                                                                 // 17
    // step 1 - get and store a request token                                                          // 18
    var callbackUrl = Meteor.absoluteUrl("_oauth/twitter?close&state=" +                               // 19
                                         query.state);                                                 // 20
                                                                                                       // 21
    // Get a request token to start auth process                                                       // 22
    oauthBinding.prepareRequestToken(callbackUrl);                                                     // 23
                                                                                                       // 24
    // Keep track of request token so we can verify it on the next step                                // 25
    requestTokens[query.state] = {                                                                     // 26
      requestToken: oauthBinding.requestToken,                                                         // 27
      requestTokenSecret: oauthBinding.requestTokenSecret                                              // 28
    };                                                                                                 // 29
                                                                                                       // 30
    // support for scope/name parameters                                                               // 31
    var redirectUrl = undefined;                                                                       // 32
    if(typeof urls.authenticate === "function") {                                                      // 33
      redirectUrl = urls.authenticate(oauthBinding);                                                   // 34
    } else {                                                                                           // 35
      redirectUrl = urls.authenticate + '?oauth_token=' + oauthBinding.requestToken;                   // 36
    }                                                                                                  // 37
                                                                                                       // 38
    // redirect to provider login, which will redirect back to "step 2" below                          // 39
    res.writeHead(302, {'Location': redirectUrl});                                                     // 40
    res.end();                                                                                         // 41
  } else {                                                                                             // 42
    // step 2, redirected from provider login - complete the login                                     // 43
    // process: if the user authorized permissions, get an access                                      // 44
    // token and access token secret and log in as user                                                // 45
                                                                                                       // 46
    // Get the user's request token so we can verify it and clear it                                   // 47
    var requestToken = requestTokens[query.state].requestToken;                                        // 48
    var requestTokenSecret = requestTokens[query.state].requestTokenSecret;                            // 49
    delete requestTokens[query.state];                                                                 // 50
                                                                                                       // 51
    // Verify user authorized access and the oauth_token matches                                       // 52
    // the requestToken from previous step                                                             // 53
    if (query.oauth_token && query.oauth_token === requestToken) {                                     // 54
                                                                                                       // 55
      // Prepare the login results before returning.  This way the                                     // 56
      // subsequent call to the `login` method will be immediate.                                      // 57
                                                                                                       // 58
      // Get the access token for signing requests                                                     // 59
      oauthBinding.prepareAccessToken(query, requestTokenSecret);                                      // 60
                                                                                                       // 61
      // Run service-specific handler.                                                                 // 62
      var oauthResult = service.handleOauthRequest(oauthBinding);                                      // 63
                                                                                                       // 64
      // Add the login result to the result map                                                        // 65
      Oauth._loginResultForCredentialToken[query.state] = {                                            // 66
        serviceName: service.serviceName,                                                              // 67
        serviceData: oauthResult.serviceData,                                                          // 68
        options: oauthResult.options                                                                   // 69
      };                                                                                               // 70
    }                                                                                                  // 71
                                                                                                       // 72
    // Either close the window, redirect, or render nothing                                            // 73
    // if all else fails                                                                               // 74
    Oauth._renderOauthResults(res, query);                                                             // 75
  }                                                                                                    // 76
};                                                                                                     // 77
                                                                                                       // 78
/////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package.oauth1 = {
  OAuth1Binding: OAuth1Binding,
  OAuth1Test: OAuth1Test
};

})();
