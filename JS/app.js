/***********************************************************************
 * app.js*
 
 *api - ל FAJAX קוד הלקוח: מאזין לפעולות המשתמש ומבצע קריאות 
 ***********************************************************************/


function retryApiCall(apiFunc, retries = 3, delay = 1000) {
  return new Promise((resolve, reject) => {
    function attempt(remainingRetries) {
      apiFunc()
        .then(resolve)
        .catch(err => {
          if (remainingRetries > 0) {
            console.warn("⏳ מנסה שוב...");
            setTimeout(() => attempt(remainingRetries - 1), delay);
          }
          else {
            reject("❌ הבקשה נכשלה לאחר מספר ניסיונות.");
          }
        });
    }
    attempt(retries);
  });
}


// פונקציית עזר ליצירת Promise מה-XMLHttpRequest המדומה
function callApi(method, url, data = null) {
  return new Promise((resolve, reject) => {
    const xhr = new FXMLHttpRequest();
    xhr.open(method, url);

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        }
        else {
          let msg = "שגיאת שרת (" + xhr.status + ")";
          // ננסה לקרוא msg מ-body
          try {
            const errObj = JSON.parse(xhr.responseText);
            if (errObj.error) {
              msg = errObj.error;
            } else if (errObj.message) {
              msg = errObj.message;
            }
          } catch (e) { }
          reject(msg);
        }
      }
    };


    //(JSON-כ) שליחת הנתונים 
    xhr.send(data ? JSON.stringify(data) : null);
  });
}

//========================= API-עטיפות שימושיות ל ======================//
function apiRegisterUser(username, password) {
  return callApi("POST", "/api/register", { username, password });
}
function apiLoginUser(username, password) {
  return callApi("POST", "/api/login", { username, password });
}
function apiLogoutUser() {
  return callApi("POST", "/api/logout");
}
function apiGetContacts() {
  return retryApiCall(() => callApi("GET", "/api/contacts"));
}
function apiAddContact(contact) {
  return retryApiCall(() => callApi("POST", "/api/contacts", contact));
}
function apiUpdateContact(contact) {
  return retryApiCall(() => callApi("PUT", "/api/contacts", contact));
}
function apiDeleteContact(id) {
  return retryApiCall(() => callApi("DELETE", "/api/contacts/" + id));
}
function apiDeleteMultipleContacts(idsArray) {
  return retryApiCall(() => callApi("DELETE", "/api/contacts", { ids: idsArray }));
}


//======================= הרצת הקוד אחרי שהעמוד נטען ======================//
window.onload = function () {
  //DOM - אחזור אלמנטים מה//
  const loginSection = document.getElementById("loginSection");
  const registerSection = document.getElementById("registerSection");
  const phoneBookSection = document.getElementById("phoneBookSection");

  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const showRegisterLink = document.getElementById("showRegister");
  const showLoginLink = document.getElementById("showLogin");
  const logoutBtn = document.getElementById("logout");

  // ========== טופס הוספת איש קשר ========== //
  const contactForm = document.getElementById("contactForm");
  const contactList = document.getElementById("contactList");
  const deleteSelectedBtn = document.getElementById("deleteSelected");

  // ===== ניווט בין מסכי כניסה ורישום ==== //
  showRegisterLink.addEventListener("click", function (e) {
    e.preventDefault();
    loginSection.style.display = "none";
    registerSection.style.display = "block";
  });

  showLoginLink.addEventListener("click", function (e) {
    e.preventDefault();
    registerSection.style.display = "none";
    loginSection.style.display = "block";
  });

  // ======== התחברות ====== //
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;

    apiLoginUser(username, password)
      .then(response => {
        alert(response.message);

        // מעבר למסך ספר הטלפונים //
        loginSection.style.display = "none";
        phoneBookSection.style.display = "block";
        renderContacts();
      })
      .catch(err => {
        alert(err);
      });
  });

  // ===== רישום ===== //
  registerForm.addEventListener("submit", function (e) {

    e.preventDefault();
    const username = document.getElementById("registerUsername").value;
    const password = document.getElementById("registerPassword").value;

    apiRegisterUser(username, password)
      .then(response => {
        alert(response.message);

        // מעבר למסך כניסה //
        registerSection.style.display = "none";
        loginSection.style.display = "block";
      })
      .catch(err => {
        alert(err);
      });
  });

  // --- התנתקות --- //
  logoutBtn.addEventListener("click", function () {
    apiLogoutUser()
      .then(() => {
        phoneBookSection.style.display = "none";
        loginSection.style.display = "block";
      })
      .catch(err => alert(err));
  });

  // --- הוספת איש קשר חדש --- //
  contactForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const firstName = document.getElementById("firstName").value;
    const lastName = document.getElementById("lastName").value;
    const phone = document.getElementById("phone").value;
    const imageFile = document.getElementById("image").files[0];

    const reader = new FileReader();
    reader.onload = function (evt) {
      const newContact = {
        id: Date.now(),
        firstName,
        lastName,
        phone,
        image: evt.target.result || "https://via.placeholder.com/50"
      };

      apiAddContact(newContact)
        .then(() => {
          contactForm.reset();
          renderContacts();
        })
        .catch(err => {
          alert(err);
        });
    };

    //Base64 - אם נבחרה תמונה – נקרא אותה כ //
    if (imageFile) {
      reader.readAsDataURL(imageFile);
    } else {
      // אם אין קובץ, נקרא ידנית לצורך המשך //
      reader.onload({ target: { result: "" } });
    }
  });

  // --- מחיקה מרובה --- //
  deleteSelectedBtn.addEventListener("click", function () {
    const checkboxes = document.querySelectorAll(".contact-checkbox:checked");
    if (checkboxes.length === 0) {
      alert("לא נבחרו אנשי קשר למחיקה.");
      return;
    }
    const ids = Array.from(checkboxes).map(cb => parseInt(cb.dataset.id));
    apiDeleteMultipleContacts(ids)
      .then(() => {
        renderContacts();
      })
      .catch(err => alert(err));
  });

  // --- הצגת אנשי קשר --- //
  function renderContacts() {
    apiGetContacts()
      .then(res => {
        if (!res.success) {
          alert(res.message || "שגיאה בשליפת אנשי קשר");
          return;
        }
        const contacts = res.data || [];
        contactList.innerHTML = "";

        contacts.forEach(contact => {
          const div = document.createElement("div");
          div.classList.add("contact");
          div.innerHTML = `
              <input type="checkbox" class="contact-checkbox" data-id="${contact.id}">
              <img src="${contact.image}" alt="contact-img">
              <div class="contact-info">
                <span class="contact-name">${contact.firstName} ${contact.lastName}</span>
                <span class="contact-phone">📱 ${contact.phone}</span>
              </div>
              <!-- כפתור עריכה -->
              <button class="edit-btn">ערוך</button>
              <!-- כפתור מחיקה בודדת -->
              <button class="delete-btn">מחק</button>
            `;

          // כפתור עריכה //
          const editBtn = div.querySelector(".edit-btn");
          editBtn.addEventListener("click", () => {
            editContact(contact);
          });

          // כפתור מחיקה בודדת //
          const deleteBtn = div.querySelector(".delete-btn");
          deleteBtn.addEventListener("click", () => {
            if (confirm("האם למחוק איש קשר זה?")) {
              apiDeleteContact(contact.id)
                .then(() => renderContacts())
                .catch(err => alert(err));
            }
          });

          contactList.appendChild(div);
        });
      })
      .catch(err => {
        alert(err);
      });
  }

  // --- עריכת איש קשר (prompt בסיסי; אפשר לשפר למודאל) --- //
  function editContact(contact) {
    const newFirst = prompt("שם פרטי:", contact.firstName);
    if (newFirst === null) return;
    const newLast = prompt("שם משפחה:", contact.lastName);
    if (newLast === null) return;
    const newPhone = prompt("טלפון:", contact.phone);
    if (newPhone === null) return;

    contact.firstName = newFirst;
    contact.lastName = newLast;
    contact.phone = newPhone;

    apiUpdateContact(contact)
      .then(() => {
        renderContacts();
      })
      .catch(err => alert(err));
  }

}; // end window.onload
