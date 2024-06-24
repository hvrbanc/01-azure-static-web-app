//declare global variables
var verifier;
var challenge;
const clientId = "9f6c1080-7900-46cb-813f-50422dfeab73"; //<= Change this
const tenantId = "57952406-af28-43c8-b4de-a4e06f57476d"; //<= Change this
const OauthEndpoint = "https://login.microsoftonline.com/57952406-af28-43c8-b4de-a4e06f57476d/oauth2/v2.0/authorize?"
const redirectUrl = "https://proud-beach-0a63d8303.5.azurestaticapps.net/";


//Custom messenger from Genesys messenger configuration
(function (g, e, n, es, ys) {
    g['_genesysJs'] = e;
    g[e] = g[e] || function () {
      (g[e].q = g[e].q || []).push(arguments)
    };
    g[e].t = 1 * new Date();
    g[e].c = es;
    ys = document.createElement('script'); ys.async = 1; ys.src = n; ys.charset = 'utf-8'; document.head.appendChild(ys);
  })(window, 'Genesys', 'https://apps.mypurecloud.de/genesys-bootstrap/genesys.min.js', {
    environment: 'prod-euc1',
    deploymentId: '3761bdd3-8876-4087-b514-98d6bdf6b003'
  });




// Custom Auth Provider Plugin registration
Genesys('registerPlugin', 'AuthProvider', (AuthProvider) => {

    //get authcode from 302 response
    const urlParams = new URLSearchParams(window.location.search); // Get the authorization response which is added as a query string from the redirect URL
    const authCode = urlParams.has('code') ? urlParams.get('code'):""; // Get code from the query string

    //get code verifier from local storage
    verifier = JSON.parse(localStorage.getItem("code_verifier"));
    console.log("URLParams: ", urlParams);
    console.log("authCode: ",authCode);
    console.log("verifier: ", verifier);
    console.log("redirectURL: ", redirectUrl);
  
    /* Register Command - mandatory */
  
    AuthProvider.registerCommand('getAuthCode', (e) => {

      e.resolve({
          authCode: authCode,           // pass your authorization code here
          redirectUri: redirectUrl,     // pass the redirection URI configured in your Authentication provider here
          //nonce: <your nonce>,        // pass the random string preferably in uuid format. Applicable for OKTA provider.
          //maxAge: <your maxAge>,      // pass elapsed time in seconds. Applicable for OKTA provider and it is an optional parameter.
          codeVerifier: verifier        // pass your code verifier here when PKCE flow is enabled
          //iss: <your iss>,            // pass your iss here. It is an optional parameter provided in the authorization response by your Authentication provider.
      });
    });
  
    AuthProvider.registerCommand('reAuthenticate', (e) => {
      
      // Messenger will call this command when current refreshToken and/or authCode are no more valid. Brand can add logic here to simply re-login and resolve this command after successful login so that Messenger can get the new authCode. (In case when browser needs to reload for a login, there is no need to resolve this command). Note: After a successful re-login, calling the getAuthCode command is taken care internally and there is no need to call it explicitly again.
  
      //document.getElementById('myLoginButton').click(); // simulate the login button click
      e.resolve();
    });
  
    /* Subscribe to Auth plugin events */
  
     AuthProvider.subscribe('Auth.loggedOut', () => {
       // This event is published across the browser tabs/devices where the user is logged in, so you can do something on logout.
          // For example, clear any authenticated flags that you might have set during login.
     });
  
    /* Subscribe to Auth plugin events - optional */
  
    AuthProvider.subscribe('Auth.authError', (error) => {
  
      // This event is published across the browser tabs/devices where the user is logged in, so you can do something on logout.
      // For example, clear any authenticated flags that you might have set during login.
    });
  
   /* Click Handlers */
  
   /*
    // Handle logout
    document.getElementById('LogOutButton').onclick = function () {
  
      AuthProvider.command('Auth.logout').then(() => {
        console.log("logged out");
        // Do something on logout.
        // For example, clear any authenticated flags that you might have set on login
      });
    };
    */
  
    // Tell Messenger that your plugin is ready (mandatory)
    AuthProvider.ready();
  });





//Events that could be useful to handle
// Auth provider events

Genesys("subscribe", "Auth.ready", function() {
    console.log("Auth plugin is ready.")
  });

  Genesys("subscribe", "Auth.authenticating", function() {
    console.log("Auth plugin authenticating.")
  });

  Genesys("subscribe", "Auth.authenticated", function() {
    console.log("Auth plugin authenticated")
  });

  Genesys("subscribe", "Auth.authError", function() {

    //when auth error start authentication
    console.log("Auth plugin is Auth.authError.");

        //create code verifier
        function generateCodeVerifier(length) {
            let text = '';
            const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
            for (let i = 0; i < length; i++) {
               text += possible.charAt(Math.floor(Math.random() * possible.length));
            }
           return text;
           }
           
           //create Code challenge
           function generateCodeChallenge(verifier) {
            return base64URL(CryptoJS.SHA256(verifier)); // eslint-disable-line
           }
           function base64URL(data) {
            return data.toString(CryptoJS.enc.Base64).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_'); // eslint-disable-line
           }
          
          verifier = generateCodeVerifier(43); //Generate code verifier for PKCE support in OAuth
          challenge = generateCodeChallenge(verifier); // eslint-disable-line //Generate code challenge for PKCE support in OAuth
          const url = OauthEndpoint + "client_id=" + clientId + "&response_type=code&response_mode=query&scope=openid%20profile%20email%20offline_access%20phone" + "&redirect_uri=" + redirectUrl + "&code_challenge_method=S256&code_challenge=" + challenge +"&audience=appointments:api&state=xyzABC123"
          console.log("transferred url:",url);
          console.log("verifier: ", verifier);
          console.log("challenge: ", challenge);
        
          //save code verifier in storage
          localStorage.setItem("code_verifier", JSON.stringify(verifier));
          localStorage.setItem("code_challenge", JSON.stringify(challenge));
          
          //call Microsoft auth endpoint
          //location.href=url;
          window.location.replace(url);
        
        });
  
  

  Genesys("subscribe", "Auth.authProviderError", function() {
    console.log("Auth plugin authProviderError.")
  });

  Genesys("subscribe", "Auth.tokenError", function() {
    console.log("Auth plugin token error.")
  });

  Genesys("subscribe", "Auth.error", function() {
    console.log("Auth plugin is Auth.error.")
  });


  // Messenger plugin events
  Genesys("subscribe", "Messenger.ready", function() {
    console.log("Messenger ready.");
  });


  Genesys("subscribe", "Messenger.opened", function() {
    console.log("Messenger opened.")
  });

  Genesys("subscribe", "Messenger.closed", function() {
    console.log("Messenger closed.")
  });



  //conversation events
  Genesys("subscribe", "Conversations.ready", function(){
    console.log("Conversation ready.");
  });

  Genesys("subscribe", "Conversations.open", function(){
    console.log("Conversation open.");
  });

  Genesys("subscribe", "Conversations.started", function(){
    console.log("Conversation started.");
  });

  Genesys("subscribe", "Conversations.closed", function(){
    console.log("Conversation closed.");
  });

  Genesys("subscribe", "Conversations.error", function(){
    console.log("Conversation error.");
  });