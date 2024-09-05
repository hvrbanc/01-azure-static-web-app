const clientId = "c909cc86-8295-418b-9d6a-9a1f64359d7f"; //<= Change this
const tenantId = "57952406-af28-43c8-b4de-a4e06f57476d"; //<= Change this
const OauthEndpoint = "https://login.microsoftonline.com/57952406-af28-43c8-b4de-a4e06f57476d/oauth2/v2.0/authorize?"
const redirectUrl = "https://proud-beach-0a63d8303.5.azurestaticapps.net/";
const AuthUrl = OauthEndpoint + "client_id=" + clientId + "&response_type=code&response_mode=query&scope=openid%20profile%20email%20offline_access%20phone" + "&redirect_uri=" + redirectUrl;
var urlParams;
var authCode ;

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

//function to start a popup for authentication
function StartAuth(){

  const url = OauthEndpoint + "client_id=" + clientId + "&response_type=code&response_mode=query&scope=openid%20profile%20email%20offline_access%20phone" + "&redirect_uri=" + redirectUrl
  let params = `popup=true,scrollbars=no,resizable=no,status=no,location=no,toolbar=no,menubar=no,width=600,height=300,left=100,top=100`;
  const popup = window.open(url,"AuthWindow", params);
  const checkPopup = setInterval(() => {
    if (popup.window.location.href.includes(redirectUrl)) {
      urlParams = new URLSearchParams(popup.window.location.search); // Get the authorization response which is added as a query string from the redirect URL
      authCode = urlParams.has('code') ? urlParams.get('code'):""; // Get code from the query string
      console.log("authCode in StartAuth function: ",authCode);
      localStorage.setItem("authCode", authCode);
      popup.close();
      location.reload();
    }
    if (!popup || !popup.closed) return;
    clearInterval(checkPopup);
  }, 1000);
}


// Custom Auth Provider Plugin registration
Genesys('registerPlugin', 'AuthProvider', (AuthProvider) => {

    //get authcode from 302 response
    //const urlParams = new URLSearchParams(window.location.search); // Get the authorization response which is added as a query string from the redirect URL
    //const authCode = urlParams.has('code') ? urlParams.get('code'):""; // Get code from the query string

    //get authcode from storage and write log
    authCode = localStorage.authCode;
    console.log("authCode in AuthProvider: ",authCode);
  
    /* Register Command - mandatory */
  
    AuthProvider.registerCommand('getAuthCode', (e) => {

      e.resolve({
          authCode: authCode,           // pass your authorization code here
          redirectUri: redirectUrl,     // pass the redirection URI configured in your Authentication provider here
          //nonce: <your nonce>,        // pass the random string preferably in uuid format. Applicable for OKTA provider.
          //maxAge: <your maxAge>,      // pass elapsed time in seconds. Applicable for OKTA provider and it is an optional parameter.
          //codeVerifier: verifier        // pass your code verifier here when PKCE flow is enabled
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
  
    /* Handle logout
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
    //Published when the your AuthProvider.getAuthCode command fails to resolve with the authCode and redirectUri
    console.log("Auth plugin is Auth.authError.");  
    
    //when auth error start authentication
    //old method without pop-up
    //const url = OauthEndpoint + "client_id=" + clientId + "&response_type=code&response_mode=query&scope=openid%20profile%20email%20offline_access%20phone" + "&redirect_uri=" + redirectUrl
    //console.log("transferred url:",url);
    //window.location.replace(url);

    //method with pop-up
    StartAuth();
  });

  Genesys("subscribe", "Auth.authProviderError", function() {
    console.log("Auth plugin authProviderError.")
  });

  Genesys("subscribe", "Auth.tokenError", function() {
    console.log("Auth plugin token error.")
  });

  Genesys("subscribe", "Auth.error", function() {
    //Published when the JWT exchange request fails
    console.log("Auth plugin is Auth.error.");

    //when auth error start authentication
    //old method without pop-up
    //const url = OauthEndpoint + "client_id=" + clientId + "&response_type=code&response_mode=query&scope=openid%20profile%20email%20offline_access%20phone" + "&redirect_uri=" + redirectUrl
    //console.log("transferred url:",url);
    //window.location.replace(url);

    //method with pop-up
    StartAuth();
  });


  // Messenger plugin events
  Genesys("subscribe", "Messenger.ready", function() {
    console.log("Messenger ready. Open Messanger directly");
    Genesys("command","Messenger.open",{}, 
      () => {
       /*fulfilled callback*/
       console.log('Messenger opened');
      },
      (error) => {
       /*rejected callback*/
       console.log("Couldn't open messenger.", error);
      }
    );
  });


  Genesys("subscribe", "Messenger.opened", function() {
    console.log("Messenger opened. ");
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