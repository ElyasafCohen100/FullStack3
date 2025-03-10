/*************************************************
 * api.js
 * "שרת" דמי: רישום/כניסה משתמשים, CRUD אנשי קשר
 * שימוש ב-LocalStorage, מופרד לפי משתמש
 *************************************************/
window.api = (function(){

    // ---- ניהול משתמשים ----
    function loadAllUsers() {
      return JSON.parse(localStorage.getItem("users")) || [];
    }
    function saveAllUsers(users) {
      localStorage.setItem("users", JSON.stringify(users));
    }
  
    function getLoggedInUser() {
      return JSON.parse(localStorage.getItem("loggedInUser"));
    }
    function setLoggedInUser(userOrNull) {
      if (userOrNull) {
        localStorage.setItem("loggedInUser", JSON.stringify(userOrNull));
      } else {
        localStorage.removeItem("loggedInUser");
      }
    }
  
    // ---- ניהול אנשי קשר לפי שם המשתמש ----
    function loadUserContacts(username) {
      const key = "contacts_" + username;
      return JSON.parse(localStorage.getItem(key)) || [];
    }
    function saveUserContacts(username, contacts) {
      const key = "contacts_" + username;
      localStorage.setItem(key, JSON.stringify(contacts));
    }
  
    // ==== פונקציות עסקיות (register, login, logout, וכו') ====
    function register(data) {
      const users = loadAllUsers();
  
      // בדיקה אם כבר קיים שם המשתמש
      if (users.some(u => u.username === data.username)) {
        return {
          status: 400,
          body: { success: false, message: "שם המשתמש כבר קיים" }
        };
      }
  
      // מוסיפים ושומרים
      users.push({ username: data.username, password: data.password });
      saveAllUsers(users);
  
      return {
        status: 200,
        body: { success: true, message: "נרשמת בהצלחה" }
      };
    }
  
    function login(data) {
      const users = loadAllUsers();
      const user = users.find(u => (
        u.username === data.username && u.password === data.password
      ));
  
      if (user) {
        setLoggedInUser(user);
        return {
          status: 200,
          body: { success: true, message: "התחברת בהצלחה" }
        };
      } else {
        return {
          status: 401,
          body: { success: false, message: "שם משתמש או סיסמה לא נכונים" }
        };
      }
    }
    function getContacts(query = "") {
      const user = JSON.parse(localStorage.getItem("loggedInUser"));
      if (!user) {
          return { status: 403, body: { success: false, message: "לא מחובר" } };
      }
      let contacts = loadUserContacts(user.username);  // שליפת אנשי קשר מה-LocalStorage
      
      // אם יש חיפוש לפי שם, סינון רשימת אנשי הקשר
      if (query) {
          contacts = contacts.filter(c => 
              c.firstName.toLowerCase().includes(query.toLowerCase())
          );
      }
  
      return { status: 200, body: { success: true, data: contacts } };
  }
  
    function logout() {
      setLoggedInUser(null);
      return {
        status: 200,
        body: { success: true, message: "התנתקת בהצלחה" }
      };
    }
  
    // ==== CRUD על אנשי קשר ====
    function getContacts() {
      const user = getLoggedInUser();
      if (!user) {
        return { status: 403, body: { success: false, message: "לא מחובר" } };
      }
      const contacts = loadUserContacts(user.username);
      return { status: 200, body: { success: true, data: contacts } };
    }
  
    function addContact(contact) {
      const user = getLoggedInUser();
      if (!user) {
        return { status: 403, body: { success: false, message: "לא מחובר" } };
      }
      const contacts = loadUserContacts(user.username);
      contacts.push(contact);
      saveUserContacts(user.username, contacts);
  
      return { status: 200, body: { success: true, data: contact } };
    }
  
    function updateContact(contact) {
      const user = getLoggedInUser();
      if (!user) {
        return { status: 403, body: { success: false, message: "לא מחובר" } };
      }
      const contacts = loadUserContacts(user.username);
      const index = contacts.findIndex(c => c.id === contact.id);
      if (index === -1) {
        return { status: 404, body: { success: false, message: "איש קשר לא נמצא" } };
      }
      contacts[index] = contact;
      saveUserContacts(user.username, contacts);
  
      return { status: 200, body: { success: true, data: contact } };
    }
  
    function deleteContact(contactId) {
      const user = getLoggedInUser();
      if (!user) {
        return { status: 403, body: { success: false, message: "לא מחובר" } };
      }
      let contacts = loadUserContacts(user.username);
      contacts = contacts.filter(c => c.id !== contactId);
      saveUserContacts(user.username, contacts);
  
      return { status: 200, body: { success: true } };
    }
  
    function deleteMultiple(idsArray) {
      const user = getLoggedInUser();
      if (!user) {
        return { status: 403, body: { success: false, message: "לא מחובר" } };
      }
      let contacts = loadUserContacts(user.username);
      contacts = contacts.filter(c => !idsArray.includes(c.id));
      saveUserContacts(user.username, contacts);
  
      return { status: 200, body: { success: true } };
    }
  
    // ==== הנתב המרכזי (handleRequest) לטיפול בנתיבי ה-API ====
    function handleRequest(method, url, reqData) {
      // רישום
      if (url === "/api/register" && method === "POST") {
        return register(reqData);
      }
      // כניסה
      if (url === "/api/login" && method === "POST") {
        return login(reqData);
      }
      // יציאה
      if (url === "/api/logout" && method === "POST") {
        return logout();
      }
      // שליפת אנשי קשר
      // שליפת אנשי קשר (כולל תמיכה בחיפוש לפי שם)
      if (url.startsWith("/api/contacts?name=") && method === "GET") {
      const query = url.split("=")[1];  // מקבל את הערך אחרי ?name=
      return getContacts(query);
      }
      if (url === "/api/contacts" && method === "GET") {
      return getContacts();  // שליפה רגילה בלי חיפוש
      }

      // הוספת איש קשר
      if (url === "/api/contacts" && method === "POST") {
        return addContact(reqData);
      }
      // עדכון איש קשר
      if (url === "/api/contacts" && method === "PUT") {
        return updateContact(reqData);
      }
      // מחיקה (בודדת או מרובה)
      if (url.startsWith("/api/contacts") && method === "DELETE") {
        // /api/contacts/123  => מחיקה בודדת
        const parts = url.split("/");
        if (parts.length === 4 && parts[3]) {
          const id = parseInt(parts[3]);
          return deleteContact(id);
        } else {
          // ללא ID => מחיקה מרובה
          if (reqData && reqData.ids) {
            return deleteMultiple(reqData.ids);
          }
        }
      }
  
      // ברירת מחדל: לא נמצא
      return { status: 404, body: { error: "Not Found" } };
    }
  
    // מחזירים רק את handleRequest
    return {
      handleRequest
    };
  })();
  