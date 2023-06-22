// const { response } = require("express");

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
          console.log(email);
          let emailHTML = `
          <div class="email-container" id= "emailContainer${email.UID}" onclick = "displayEmail(${email.UID}, ${accountId})">
            <div class="popup-menu">
              <i class="far fa-trash-can btn" onclick = "deleteSingle(${accountId},${email.UID})"></i>
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
      

      function displayEmail(uid, accountId) {
        let mainDiv = document.querySelector('main');
        let inboxDiv = document.getElementById('inbox');
        let contentDiv = document.getElementById('email-content-container');
        
        // Add 'open' class to the main and inbox divs
        mainDiv.classList.add('open');
        mainDiv.classList.remove('closed')
        inboxDiv.classList.add('open');
        inboxDiv.classList.remove('closed');
        console.log(`in display email/${uid}`);
      let url = `/displayEmail/${accountId}/${uid}`;
      
      fetch(url)
        .then(response => response.json())
        .then(email => {
          console.log(email);
          contentDiv.innerHTML = email;
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
      
      // function deleteSingle(accountId, uid){
      //   const config = {
      //     method:'POST',
      //     headers: {
      //       'Content-Type': 'application/json'
      //     },
      //     body: {"uids": uid}

      //   }

      //   fetch(`deleteMail/${accountId}`, config)
      //   .then(response => response.json())
      //   .then(response => {console.log(response);})
      //   .catch(err => console.error(err));

      //   let email= document.getElementById('emailContainer'+ uid);
      //   email.remove();
      // } 

      async function deleteSingle(accountId, uid) {
        try {
          const config = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ uids: uid }) // Convert the object to JSON string
          };
      
          const response = await fetch(`deleteMail/${accountId}`, config);
          const data = await response.json();
      
          console.log(data);
      
          // Remove the email container from the DOM
          let email = document.getElementById('emailContainer' + uid);
          email.remove();
        } catch (err) {
          console.error(err);
        }
      }
      
        function getLabelList(){

          fetch('/getLabelList')
          .then(response => response.json())
          .then(labels => {
            console.log("response recieved-getlabellist");
            const labelsDiv = document.getElementById('labelsList');
            // Clear the labels list
            labelsDiv.innerHTML = '';
            // Add each label to the list
            let labelsCount = 0;
            console.log(labels);
            for (const label of labels) {
                labelsCount++;
                console.log(label);
                const div = document.createElement('div');
                div.className = 'label-list-item';
                div.textContent = label.label_name;
                console.log(label.label_name);
                // Store the label ID in a data attribute
                div.dataset.labelID = label.labelID;
                div.onclick = function() {
                    // When the circle is clicked, fetch emails for the associated account
                    getEmailsByLabel(this.dataset.labelID);
                };
                labelsDiv.appendChild(div);
            }
          })
        }



      document.addEventListener('DOMContentLoaded', (event) => {
        updateAccounts();
      
        getLabelList();

        // CKEditor
        ClassicEditor
        .create(document.querySelector("#email-reply-location"))
        .then(editor => {
          console.log("CKEditor initialized");
        })
        .catch(error => {
          console.error(error);
        });
      })
      
    let replyButton = document.getElementById('replyButton');
    let replyAllButton = document.getElementById('replyAllButton');
    let forwardButton = document.getElementById('forwardButton');
    let emailReplyContainer = document.getElementById('email-reply-container');
    let editorInstance = null;

    function showEditor() {
      emailReplyContainer.classList.remove('hidden');
      emailReplyContainer.style.display='block';
    }
    
    replyButton.addEventListener('click', showEditor);
    replyAllButton.addEventListener('click', showEditor);
    forwardButton.addEventListener('click', showEditor);