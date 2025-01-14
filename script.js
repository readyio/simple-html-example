// Production URL's
// var AUTH_URL = "https://oauth.ready.gg" 
// var API_URL = "https://us-central1-readymaster-2b268.cloudfunctions.net/user-signUpAnonymously"

// Staging URL's
var AUTH_URL = "https://staging-oauth.ready.gg" // Staging URL
var API_URL = "https://us-central1-readysandbox.cloudfunctions.net/user-signUpAnonymously"


var appId = ""  
var authWindow = null;


function getWindowOptions(){
  const w = 600;
  const h = 550;
  const dualScreenLeft = window.screenLeft !==  undefined ? window.screenLeft : window.screenX;
  const dualScreenTop = window.screenTop !==  undefined   ? window.screenTop  : window.screenY;

  const width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
  const height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

  const systemZoom = width / window.screen.availWidth;
  const left = (width - w) / 2 / systemZoom + dualScreenLeft;
  const top = (height - h) / 2 / systemZoom + dualScreenTop;


  const windowOptions = `
    location=yes,
    status=yes,
    scrollbars=yes,
    width=${w}, 
    height=${h}, 
    top=0, 
    left=${left}
    `;
    return windowOptions;
}


function openAuthWindow() {
    document.getElementById('loader').style.display = 'block'; // Show the loader when opening window

    const windowOptions = getWindowOptions();
    let url = `${AUTH_URL}/?url_redirect=${window.location.href}&appId=${appId}&returnSecureToken=true`;
    const email = "test@email.com"; // Optional parameter that defines the email of the user automatically.
    const profile = "testProfile"; // Optional parameter that defines the Profile Name of the user automatically.
    const view = "signup";  // Optional parameter that presents the account creation view after page loading.

    // Check if an ID Token already exists and include it in the URL
    const existingIdToken = document.getElementById('guestIdToken').textContent;
    if (existingIdToken) {
        url += `&idToken=${encodeURIComponent(existingIdToken)}`;
    }

    const urlWithEmailAndProfile = `${url}&email=${email}&profile=${profile}&view=${view}`;
    authWindow = window.open(urlWithEmailAndProfile, '_blank', windowOptions);
    document.getElementById('loader').style.display = 'none'; // Ideally, hide when the window is confirmed open

}

window.addEventListener("message", function(e){
  if(e.origin !== AUTH_URL) return;
  var session = e.data.session;
  if (session) {
    document.getElementById('login-success-label').innerHTML = "Login Successful";
    document.getElementById('login-success-userId').innerHTML = session.userId;
    document.getElementById('login-success-idToken').innerHTML = session.idToken;
    document.getElementById('login-success-refreshToken').innerHTML = session.refreshToken;
    document.getElementById('response').style.visibility = "visible";

    if(authWindow && session.closeModal) authWindow.close();
  }
});

async function signUpAnonymously() {
  document.getElementById('loader').style.display = 'block'; // Show the loader
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        appPackageName: 'qnThpH3csJSjy0HRr9mj'
      })
    });
    const data = await response.json();
    if (data.userId && data.idToken && data.refreshToken) {
      document.getElementById('guestUserId').textContent = data.userId;
      document.getElementById('guestIdToken').textContent = data.idToken;
      document.getElementById('guestRefreshToken').textContent = data.refreshToken;
      document.getElementById('guestResponse').style.visibility = 'visible';
    } else {
      alert('Failed to retrieve tokens');
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
  document.getElementById('loader').style.display = 'none'; // Hide the loader
}


function copyToClipboard(elementId) {
  var copyText = document.getElementById(elementId).textContent;
  navigator.clipboard.writeText(copyText).then(function() {
    alert("Copied to clipboard");
  }, function() {
    alert("Failed to copy");
  });
}






