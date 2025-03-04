window.onload = function () {
    const contactForm = document.getElementById("contactForm");
    const contactList = document.getElementById("contactList");
    const deleteSelectedBtn = document.getElementById("deleteSelected");

    let contacts = JSON.parse(localStorage.getItem("contacts")) || [];
    renderContacts();

    // Add Contact
    contactForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const firstName = document.getElementById("firstName").value;
        const lastName = document.getElementById("lastName").value;
        const phone = document.getElementById("phone").value;
        const imageFile = document.getElementById("image").files[0];

        const reader = new FileReader();
        reader.onload = function (e) {
            const newContact = {
                id: Date.now(),
                firstName,
                lastName,
                phone,
                image: e.target.result || "https://via.placeholder.com/50"
            };

            contacts.push(newContact);
            localStorage.setItem("contacts", JSON.stringify(contacts));
            renderContacts();
            contactForm.reset();
        };

        if (imageFile) {
            reader.readAsDataURL(imageFile);
        } else {
            reader.onload();
        }
    });

    // Render Contacts
    function renderContacts() {
        contactList.innerHTML = "";

        contacts.forEach(contact => {
            const contactElement = document.createElement("div");
            contactElement.classList.add("contact");

            contactElement.innerHTML = `
                <input type="checkbox" class="contact-checkbox" data-id="${contact.id}">
                <img src="${contact.image}" alt="${contact.firstName}">
                <div class="contact-info">
                    <strong class="contact-name">${contact.firstName} ${contact.lastName}</strong>
                    <span class="contact-phone">📱 ${contact.phone}</span>
                </div>
                <button class="edit-btn" onclick="editContact(${contact.id})">✏️ Edit</button>
            `;

            contactList.appendChild(contactElement);
        });
    }

    // Edit Contact
    window.editContact = function (id) {
        alert("Edit feature coming soon! 😃");
    };

    // Delete Selected Contacts
    deleteSelectedBtn.addEventListener("click", function () {
        const checkboxes = document.querySelectorAll(".contact-checkbox:checked");
        const selectedIds = Array.from(checkboxes).map(cb => parseInt(cb.dataset.id));

        contacts = contacts.filter(contact => !selectedIds.includes(contact.id));
        localStorage.setItem("contacts", JSON.stringify(contacts));
        renderContacts();
    });
};
