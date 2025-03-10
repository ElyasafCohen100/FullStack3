/*************************************************
 * fajax.js*
 
 * Fake AJAX המדמה תקשורת רשת עבור הפרויקט
 *************************************************/
class FXMLHttpRequest {
  constructor() {
    this.readyState = 0;
    this.status = 0;
    this.responseText = "";
    this.onreadystatechange = null;
  }

  open(method, url) {
    this.method = method;
    this.url = url;
    this.readyState = 1;
  }

  send(data = null) {
    const xhr = this;

    // פונקציה פנימית שתיקרא לאחר ה"השהיה"
    function callServer() {
      // מפעילים את הרשת המדומה שלנו
      window.fakeNetwork(xhr.method, xhr.url, data, function (responseObj) {
        xhr.readyState = 4;
        xhr.status = responseObj.status;
        xhr.responseText = JSON.stringify(responseObj.body);

        if (xhr.onreadystatechange) {
          xhr.onreadystatechange();
        }
      });
    }

    callServer();
  }


}

// הופך לגלובלי
window.FXMLHttpRequest = FXMLHttpRequest;

/***********************************************
 * "רשת "דמיונית
 ***********************************************/
window.fakeNetwork = function (method, url, data, callback) {
  let parsedData = null;
  try {
    parsedData = data ? JSON.parse(data) : null;
  } catch (err) { }

  // הסתברות של 20% להשמטת הודעה
  const lossProbability = Math.random();
  if (lossProbability < 0.2) {
    console.warn(`📡 הודעה אבדה ברשת: ${method} ${url}`);
    return;
  }

  // השהיית תשובה אקראית (0-1 שניות)
  const delay = Math.random() * 1000;
  setTimeout(() => {
    const resp = window.api.handleRequest(method, url, parsedData);
    callback(resp);
  }, delay);
};

