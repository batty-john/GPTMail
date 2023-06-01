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
                    // Store the account ID in a data attribute
                    div.dataset.accountId = account.id;
                    div.onclick = function() {
                        // When the circle is clicked, fetch emails for the associated account
                        updateInbox(this.dataset.accountId);
                    };
                    accountsDiv.appendChild(div);
                }
    
                // Call the function to get recent mails and display them
                if (accountsCount > 0) {
                    updateInbox(accounts[0].id); // Fetch emails for the first account by default
                }
    
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }
    


// New function to fetch recent mails and update the inbox
function updateInbox(accountId) {
    let url = `/getUserMail/${accountId}`;
    
  
    fetch(url)
      .then(response => response.json())
      .then(emails => {
        let inboxEmailsDiv = document.getElementById('inbox-emails');
        // Don't clear the inbox - we will be adding to it
        for (let email of emails) {
          let emailHTML = `
          <div class="email-container">
            <div class="popup-menu">
              <i class="far fa-trash-can btn"></i>
              <i class="far fa-folder btn"></i>
              <i class="far fa-flag btn"></i>
              <i class="far fa-star btn"></i>
            </div>
            <div class="sender-line">
              <h3><strong>${email.sender}</strong></h3>
              <p class="inbox-open-email-time">12:26</p>
            </div>
            <div class="subject-line">
              <p>${email.subject}</p>
            </div>
            <div class="teaser-line">
              <p>${email.preheader}</p>
            </div>

            <div class="email-border">
            </div>
        </div>
          `;
          inboxEmailsDiv.innerHTML += emailHTML;
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }
      

      function displayEmail(uid) {
        let mainDiv = document.querySelector('main');
        let inboxDiv = document.getElementById('inbox');
        let contentDiv = document.getElementById('email-content-container');
        
        // Add 'open' class to the main and inbox divs
        mainDiv.classList.add('open');
        mainDiv.classList.remove('closed')
        inboxDiv.classList.add('open');
        inboxDiv.classList.remove('closed');
      let url = `/displayEmail/${uid}`;
      fetch(url)
        .then(respone => response.json())
        .then(email => {

          contentDiv.innerHTML = email.body;
        })
      }
      function closeEmail(){
        let mainDiv = document.querySelector('main');
        let inboxDiv = document.getElementById('inbox');
        mainDiv.classList.remove('open');
        mainDiv.classList.add('closed');
        inboxDiv.classList.remove('open');
        inboxDiv.classList.add('closed');
      }
      
      
      

      document.addEventListener('DOMContentLoaded', (event) => {
        updateAccounts();
        

        // CKEditor
        ClassicEditor
        .create(document.querySelector("#email-reply-container"))
        .then(editor => {
          console.log("CKEditor initialized");
        })
        .catch(error => {
          console.error(error);
        });
      })
      
      