// Get the modal
var modal = document.getElementById("addAccountModal");

// Get the button that opens the modal
var btn = document.getElementById("addAccountButton");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks the button, open the modal
btn.onclick = function() {
  modal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
  modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}



const form = document.getElementById('addAccountForm');
    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const formData = new FormData(form);

        const data = {};
        for (let [key, value] of formData) {
            data[key] = value;
        }

        fetch('/addAccount', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            const messageElement = document.getElementById('message');
            
            if(data.status === 'success'){
                messageElement.textContent = "Account added successfully";
                messageElement.style.color = "green";
                updateAccounts();
                console.log("Account added successfully");
            } else {
                messageElement.textContent = "Error adding account";
                messageElement.style.color = "red";
                console.log("Error adding account");
            }
            // close the modal
            document.getElementById('addAccountModal').style.display = "none";
          })
          .catch(error => {
            const messageElement = document.getElementById('message');
            messageElement.textContent = "Error: " + error;
            messageElement.style.color = "red";
            console.log('Error:', error)
        });
    });

    function updateAccounts() {
        console.log("inFunction");
        fetch('/accounts')
          .then(response => response.json())
          .then(accounts => {
            console.log("response recieved");
            const accountsDiv = document.getElementById('allAccounts');
            // Clear the accounts list
            accountsDiv.innerHTML = '';
            // Add each account to the list
            let accountsCount = 0;
            for (const account of accounts) {
                accountsCount++;
              const div = document.createElement('div');
              div.className = 'circle-account-name';
              div.textContent = account.email.charAt(0).toUpperCase();
              accountsDiv.appendChild(div);
            }

             // Call the function to get recent mails and display them
            if(accountsCount > 0) {
                updateInbox();
            }
             

          })
          .catch(error => {
            console.error('Error:', error);
          });
      }


let lastUIDFetched = 0; // UID of the oldest email fetched
let firstUIDFetched = Infinity; // UID of the most recent email fetched
const pageSize = 10; // Number of emails to fetch at once


      // New function to fetch recent mails and update the inbox
      function updateInbox() {
        let url = '/getRecentMail';
        if (firstUIDFetched !== Infinity) {
        url += `/${lastUIDFetched + 1}/${firstUIDFetched + pageSize}`
        } else {
        url += `/*/${pageSize}`
        }

        fetch(url)
          .then(response => response.json())
          .then(emails => {
            let inboxEmailsDiv = document.getElementById('inbox-emails');
            // Don't clear the inbox - we will be adding to it
            for (let email of emails) {
              let emailHTML = `
                <div onclick="displayEmail(${JSON.stringify(email).split('"').join("&quot;")})">
                    <div class="sender-line">
                        <h3><strong>${email.from}</strong></h3>
                        <p class="inbox-open-email-time">${email.date}</p>
                    </div>
                    <div class="subject-line"><p>${email.subject}</p></div>
                    <div class="teaser-line"><p>${email.teaser}</p></div>
                    <div class="email-border"></div>
                </div>
              `;
              inboxEmailsDiv.innerHTML += emailHTML;
            }
            if (emails.length > 0) {
              lastUIDFetched = Math.min(lastUIDFetched, emails[emails.length - 1].uid);
              firstUIDFetched = Math.max(firstUIDFetched, emails[0].uid);
            }
          })
          .catch(error => {
            console.error('Error:', error);
          });
      }
      

      function displayEmail(email) {
        let mainDiv = document.querySelector('main');
        let inboxDiv = document.getElementById('inbox');
        let contentDiv = document.getElementById('email-content-container');
        
        // Add 'open' class to the main and inbox divs
        mainDiv.classList.add('open');
        mainDiv.classList.remove('closed')
        inboxDiv.classList.add('open');
        inboxDiv.classList.remove('closed');
      
        // Use HTML if it exists, otherwise use text
        if (email.html && email.html.trim() !== "") {
          contentDiv.innerHTML = email.html;
        } else {
          // For text, replace newlines with <br> for proper formatting
          contentDiv.innerHTML = `<p>${email.body.split('\n').join('<br>')}</p>`;
        }
      }
      
      
      
      

      document.addEventListener('DOMContentLoaded', (event) => {
        updateAccounts();
        
      })
      
      