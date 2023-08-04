function updateAccounts() {
  console.log("inFunction");
  fetch('/getAccounts')
    .then(response => response.json())
    .then(accounts => {
      console.log("response recieved");
      const accountsDiv = document.getElementById('allAccounts');
      const fromDiv = document.getElementById('fromInput');
      fromDiv.innerHTML = "";
      // Clear the accounts list
      accountsDiv.innerHTML = '';
      // Add each account to the list
      let accountsCount = 0;
      for (const account of accounts) {
        accountsCount++;
        const div = document.createElement('div');
        div.className = 'circle-account-name';
        div.textContent = account.email.charAt(0).toUpperCase();
        const option = document.createElement('option');
        option.value = account.id;
        option.innerHTML = account.email;
        option.name = account.email;
        fromDiv.appendChild(option);
        // Store the account ID in a data attribute
        div.dataset.accountId = account.id;
        div.onclick = function () {
          // When the circle is clicked, fetch emails for the associated account
          updateInbox(this.dataset.accountId);
        };
        accountsDiv.appendChild(div);
      }

      // Call the function to get recent mails and display them
      if (accountsCount > 0) {
        updateInbox(accounts[0].id); // Fetch emails for the first account by default
        setAccount(accounts[0].id);
      }

    })
    .catch(error => {
      console.error('Error:', error);
    });
}

function setAccount(accountId) {
  console.log("in set account");
  let inboxFolderButton = document.getElementById('inboxFolderButton');
  inboxFolderButton.dataset.accountId = accountId;
  let sentFolderButton = document.getElementById('sentFolderButton');
  sentFolderButton.dataset.accountId = accountId;
  let draftsFolderButton = document.getElementById('draftsFolderButton');
  draftsFolderButton.dataset.accountId = accountId;
  let trashFolderButton = document.getElementById('trashFolderButton');
  trashFolderButton.dataset.accountId = accountId;
  let addFolderButton = document.getElementById('addFolderButton');
  addFolderButton.dataset.accountId = accountId;

  getFolderList();
}

// New function to fetch recent mails and update the inbox
async function updateInbox(accountId, folderId = 'inbox') {




  let [folderList, emails] = await Promise.all([
    getFolders(accountId),
    getEmails(accountId, folderId)
  ]);

  console.log("in update inbox", folderList);

  let inboxEmailsDiv = document.getElementById('inbox-emails');

  inboxEmailsDiv.innerHTML = "";

  for (let email of emails) {
    console.log(email);
    let emailDiv = document.createElement("div");
    inboxEmailsDiv.appendChild(emailDiv);
    emailDiv.classList.add("email-container");
    emailDiv.setAttribute("id", `emailContainer${email.UID}`);
    let folderDropDown = document.createElement("div");
    folderDropDown.setAttribute("id", `folderDropDown${email.UID}`);
    folderDropDown.classList.add("folderDropDown");

    folderList.forEach(function (item) {
      console.log("Folder List Item");
      console.log(item);
      let folderElement = document.createElement("div");
      folderElement.classList.add("folderDropDownItem");
      folderElement.setAttribute("onclick", `moveToFolder(${email.UID}, ${item.folder_id})`);
      // folderElement.addEventListener("click", (event) => {
      //   console.log("folder clicked");
      //   event.stopPropagation();
      //   moveToFolder(email.UID, item.folderId)
      // });
      folderElement.innerHTML = item.folder_name;
      folderDropDown.appendChild(folderElement);
    })


    let popupMenu = document.createElement("div");
    popupMenu.classList.add("popup-menu");
    popupMenu.setAttribute("id", `popupMenu${email.UID}`);

    let trashButton = document.createElement("i");
    trashButton.setAttribute("id", `trashButton${email.UID}`);
    trashButton.classList.add("far");
    trashButton.classList.add("fa-trash-can");
    trashButton.classList.add("btn");

    let folderButton = document.createElement("i");
    folderButton.classList.add("far");
    folderButton.classList.add("fa-folder");
    folderButton.classList.add("btn");
    folderButton.classList.add("folderButton");

    folderButton.appendChild(folderDropDown);

    let flagButton = document.createElement("i");
    flagButton.classList.add("far");
    flagButton.classList.add("fa-flag");
    flagButton.classList.add("btn");
    let circleButton = document.createElement("i");
    circleButton.classList.add("far");
    circleButton.classList.add("fa-circle");
    circleButton.classList.add("btn");



    popupMenu.appendChild(trashButton);
    popupMenu.appendChild(folderButton);
    popupMenu.appendChild(flagButton);
    popupMenu.appendChild(circleButton);
    emailDiv.appendChild(popupMenu);

    emailDiv.addEventListener("click", function (event) {
      console.log(event.target);
      if (document.getElementById(`popupMenu${email.UID}`).contains(event.target)) return;
      displayEmail(accountId, email.UID)
    });

    emailDiv.innerHTML += `
      
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
    
      `;

    document.getElementById(`trashButton${email.UID}`).addEventListener("click", function (event) {
      event.stopPropagation();
      deleteSingle(accountId, email.UID);

    });



  }


}

function getEmails(accountId, folderId) {
  var url = `/getFolderEmails/${accountId}/${folderId}`
  return fetch(url)
    .then(response => response.json())
    .catch(error => {
      console.error('Error:', error);
    });
}


function displayEmail(accountId, uid) {
  let mainDiv = document.querySelector('main');
  let inboxDiv = document.getElementById('inbox');
  let contentDiv = document.getElementById('email-content-container');
  let trashButton = document.getElementById('reply-menu-trash');

  trashButton.dataset.uid = uid;
  trashButton.dataset.accountId = accountId;


  // Add 'open' class to the main and inbox divs
  mainDiv.classList.add('open');
  mainDiv.classList.remove('closed')
  inboxDiv.classList.add('open');
  inboxDiv.classList.remove('closed');
  let url = `/displayEmail/${accountId}/${uid}`;

  fetch(url)
    .then(response => response.json())
    .then(email => {
      contentDiv.innerHTML = email;
    })
}

function closeEmail() {
  let mainDiv = document.querySelector('main');
  let inboxDiv = document.getElementById('inbox');
  mainDiv.classList.remove('open');
  mainDiv.classList.add('closed');
  inboxDiv.classList.remove('open');
  inboxDiv.classList.add('closed');
}



async function deleteSingle(accountId, uid) {


  fetch(`deleteEmail/${accountId}/${uid}`)
    .then(response => response.json())
    .then(response => {
      console.log(response);
    })

  document.getElementById(`emailContainer${uid}`).remove();

  let openId = document.getElementById(`reply-menu-trash`).dataset.uid;
  console.log("openId " + openId);
  if (openId == uid) {
    closeEmail();
  }

}



function getLabelList() {

  fetch('/getLabels')
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

        const colorDiv = document.createElement('div');
        colorDiv.className = 'label-color-icon';
        colorDiv.style.backgroundColor = label.color;


        const div = document.createElement('div');
        div.className = 'label-list-item folder-item';
        div.textContent = label.label_name;
        console.log(label.label_name);
        // Store the label ID in a data attribute
        div.dataset.labelID = label.labelID;
        div.onclick = function () {
          // When the circle is clicked, fetch emails for the associated account
          getEmailsByLabel(this.dataset.labelID);
        };

        div.appendChild(colorDiv);
        labelsDiv.appendChild(div);
      }
    })
}

function getEmailsByLabel(labelID) {

}

function addLabelpopup() {

  const popupContainer = document.getElementById("popupContainer");
  const popup = document.createElement("div");
  popup.className = "popup";

  // Create the label input field
  const labelInput = document.createElement("input");
  labelInput.type = "text";
  labelInput.placeholder = "Enter label name";
  popup.appendChild(labelInput);

  // Create the submit button
  const submitButton = document.createElement("button");
  submitButton.textContent = "Submit";
  submitButton.addEventListener("click", function () {
    const labelName = labelInput.value;
    addLabel(labelName);
    closePopup();
  });
  popup.appendChild(submitButton);

  // Append the popup to the container
  popupContainer.appendChild(popup);

  // Set focus on the input field
  labelInput.focus();

}

function getFolderList(accountId = 0) {

  if (accountId === 0) {
    accountId = document.getElementById('inboxFolderButton').dataset.accountId;
  }

  fetch(`/getFolders/${accountId}`)
    .then(response => response.json())
    .then(folders => {
      console.log("response recieved-getfolderlist");
      const foldersDiv = document.getElementById('addedFoldersList');
      // Clear the labels list
      foldersDiv.innerHTML = '';
      // Add each label to the list
      let foldersCount = 0;

      for (const folder of folders) {
        foldersCount++;



        const div = document.createElement('div');
        div.className = 'folder-item';
        div.textContent = folder.folder_name;

        // Store the label ID in a data attribute
        div.dataset.folderId = folder.folder_id;
        div.onclick = function () {
          // When the circle is clicked, fetch emails for the associated account
          getEmailsByLabel(this.dataset.labelID);
        };

        foldersDiv.appendChild(div);
      }
    })
}

function getFolders(accountId) {
  console.log("in getFolders");
  return fetch(`/getFolders/${accountId}`)
    .then(response => response.json())
    .then(folders => {
      console.log("in fetch folders", folders);
      return folders;

    })

}

function moveToFolder(uid, folderId) {
  fetch(`/moveToFolder/${uid}/${folderId}`)
    .then(console.log("movefolder"));
}


function addLabel(labelName) {
  // Function to handle label addition
  // Replace with your desired logic
  console.log("Adding label:", labelName);
  labelName = String(labelName);
  fetch(`/addLabel/${labelName}`)
    .then(response => response.json())
    .then(response => {
      console.log(response);
      getLabelList();
    });
}

function closePopup() {
  // Function to close the popup
  const popupContainer = document.getElementById("popupContainer");
  popupContainer.innerHTML = "";
}

function toggleFolderList() {

  let list = document.getElementById('addedFoldersList');
  list.classList.toggle('hidden');
  let toggle = document.getElementById('folderToggle');
  toggle.classList.toggle('fa-angle-up');
  toggle.classList.toggle('fa-angle-down');
}

function toggleLabelList() {

  let list = document.getElementById('labelsList');
  list.classList.toggle('hidden');
  let toggle = document.getElementById('labelToggle');
  toggle.classList.toggle('fa-angle-up');
  toggle.classList.toggle('fa-angle-down');
}

function addFolderpopup(accountId) {

  const popupContainer = document.getElementById("popupContainer");
  const popup = document.createElement("div");
  popup.className = "popup";

  // Create the label input field
  const folderInput = document.createElement("input");
  folderInput.type = "text";
  folderInput.placeholder = "Enter folder name";
  popup.appendChild(folderInput);

  // Create the submit button
  const submitButton = document.createElement("button");
  submitButton.textContent = "Submit";
  submitButton.addEventListener("click", function () {
    const folderName = folderInput.value;
    addFolder(accountId, folderName);
    closePopup();
  });
  popup.appendChild(submitButton);

  // Append the popup to the container
  popupContainer.appendChild(popup);

  // Set focus on the input field
  folderInput.focus();

}

function addFolder(accountID, folderName) {
  // Function to handle Folder addition
  // Replace with your desired logic
  console.log("Adding Folder:", folderName);
  folderName = String(folderName);
  fetch(`/addFolder/${accountID}/${folderName}`)
    .then(response => response.json())
    .then(response => {
      console.log(response);
      getFolderList();
    });
}


/******************************************************************
 * Open Compose
 * Use: Adjusts CSS classes to open the compose window
 * 
 * ****************************************************************/
function openCompose() {
  let inbox = document.getElementById('inbox');
  let main = document.querySelector('main');
  let editor = document.getElementById('email-reply-container');
  let replyMenu = document.getElementById('reply-menu');
  let emailContentContainer = document.getElementById('email-content-container');
  inbox.classList.remove('closed');
  inbox.classList.add('open');
  main.classList.remove('closed');
  main.classList.add('open');
  editor.classList.remove('hidden');
  editor.style.display = 'block';
  replyMenu.classList.add('hidden');
  emailContentContainer.classList.add('hidden');

}


/******************************************************************
 * Open Reply
 * Use: Pulls values from original email, opens the editor, and pre-populates the reply values
 * 
 * ****************************************************************/
function openReply() {
  let inbox = document.getElementById('inbox');
  let main = document.querySelector('main');
  let editor = document.getElementById('email-reply-container');
  let replyMenu = document.getElementById('reply-menu');
  let emailContentContainer = document.getElementById('email-content-container');
  let fromInput = document.getElementById('fromInput');
  let toInput = document.getElementById('toInput');
  let subjectInput = document.getElementById('subject');
  let editorElement = document.getElementById('editorElementId');

  // Get the email details from the original email view
  let originalFrom = document.getElementById('originalFrom').innerText;
  let originalTo = document.getElementById('originalTo').innerText;
  let originalSubject = document.getElementById('originalSubject').innerText;
  let originalContent = document.getElementById('originalContent').innerText;

  // Populate the fields in the reply form
  fromInput.value = originalFrom;
  toInput.value = originalTo;
  subjectInput.value = `Re: ${originalSubject}`;
  editorElement.innerHTML = `\n\n\n-------- Original Message --------\nFrom: ${originalFrom}\nTo: ${originalTo}\nSubject: ${originalSubject}\n\n${originalContent}`;

  inbox.classList.remove('closed');
  inbox.classList.add('open');
  main.classList.remove('closed');
  main.classList.add('open');
  editor.classList.remove('hidden');
  editor.style.display = 'block';
  replyMenu.classList.add('hidden');
  emailContentContainer.classList.add('hidden');
}

/******************************************************************
 * Save Draft
 * Use: Pulls the values from the input fields and saves a draft in the database
 * 
 * ****************************************************************/
function saveDraft() {

  const from = document.getElementById('fromInput').name;
  const accountId = document.getElementById('fromInput').value;
  const to = document.getElementById('toInput').value;
  const cc = document.getElementById('cc').value;
  const bcc = document.getElementById('bcc').value;
  const subject = document.getElementById('subject').value;
  const content = editorInstance.getData();


  const emailData = {
    from: from,
    to: to,
    cc: cc,
    bcc: bcc,
    subject: subject,
    content: content,
    accountId: accountId
  };

  fetch(`/saveDraft/${accountId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    })
    .then((data) => {
      console.log(data)
    });
  // For example, you can make an AJAX request to a server-side endpoint
  // to handle the email sending process
  console.log("Saving draft...", emailData);
}

/******************************************************************
 * Send Email
 * Use: Pulls the values from the input fields and sends the email
 * 
 * ****************************************************************/
function sendEmail() {
  // Get the values from the input fields
  const from = document.getElementById('fromInput').value;
  const to = document.getElementById('toInput').value;
  const cc = document.getElementById('cc').value;
  const bcc = document.getElementById('bcc').value;
  const subject = document.getElementById('subject').value;
  const content = editorInstance.getData();

  // Perform any necessary validations on the input values

  // Create an object or perform AJAX request to send the email
  const emailData = {
    from: from,
    to: to,
    cc: cc,
    bcc: bcc,
    subject: subject,
    content: content
  };

  // Replace this with your logic to send the email
  fetch('/sendEmail/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    })
    .then((data) => {
      console.log(data)
    });
  // For example, you can make an AJAX request to a server-side endpoint
  // to handle the email sending process
  console.log("Sending email...", emailData);

  // Reset the input fields and editor content after sending the email
  document.getElementById('fromInput').value = '';
  document.getElementById('toInput').value = '';
  document.getElementById('cc').value = '';
  document.getElementById('bcc').value = '';
  document.getElementById('subject').value = '';
  document.getElementById('editorElementId').value = '';


  clearEditor();
  closeCompose();


  console.log(ClassicEditor.instances);
  for (instance in ClassicEditor.instances) {
    ClassicEditor.instances[instance].updateElement();
    ClassicEditor.instances[instance].setData('');
  }

}
/******************************************************************
 * Load Draft
 * Use: Loads a draft from the database into the editor
 * 
 * ****************************************************************/
function loadDraft(accountId, draftId) {

  let url = `/loadDraft/${accountId}/${draftId}`;
  fetch(url)
    .then(response => response.json())
    .then(email => {
      console.log(email);
      let fromInput = document.getElementById('fromInput');
      let toInput = document.getElementById('toInput');
      let ccInput = document.getElementById('cc');
      let bccInput = document.getElementById('bcc');
      let subjectInput = document.getElementById('subject');
      let editorElement = document.getElementById('editorElementId');

      fromInput.value = email.from;
      toInput.value = email.to;
      ccInput.value = email.cc;
      bccInput.value = email.bcc;
      subjectInput.value = email.subject;
      editorElement.innerHTML = email.content;
    })
}

/******************************************************************
 * clearEditor
 * Use: clears the editor
 * 
 ******************************************************************/

function clearEditor() {
  if (editorInstance) {
    editorInstance.setData('');
  }
}

/******************************************************************
 * Close Compose
 * Use: Close the compose window
 * 
 ******************************************************************/

function closeCompose() {
  let inbox = document.getElementById('inbox');
  let main = document.querySelector('main');
  let editor = document.getElementById('email-reply-container');
  let replyMenu = document.getElementById('reply-menu');
  let emailContentContainer = document.getElementById('email-content-container');
  inbox.classList.add('closed');
  inbox.classList.remove('open');
  main.classList.add('closed');
  main.classList.remove('open');
  editor.classList.add('hidden');
  editor.style.display = 'block';
  replyMenu.classList.remove('hidden');
  emailContentContainer.classList.remove('hidden');

}


/******************************************************************
 * Save and Close
 * Use: Saves the draft, clears send inputs, and closes the compose window
 * 
 ******************************************************************/
function saveAndClose() {
  saveDraft();
  closeCompose();
}

/******************************************************************
 * Code for Opening and displaying the email editor
 * 
 * 
 ******************************************************************/

let replyButton = document.getElementById('replyButton');
let replyAllButton = document.getElementById('replyAllButton');
let forwardButton = document.getElementById('forwardButton');
let emailReplyContainer = document.getElementById('email-reply-container');

function showEditor() {
  emailReplyContainer.classList.remove('hidden');
  emailReplyContainer.style.display = 'block';
}

replyButton.addEventListener('click', showEditor);
replyAllButton.addEventListener('click', showEditor);
forwardButton.addEventListener('click', showEditor);


/******************************************************************
 * Popup Modal for adding accounts
 * 
 * 
 ******************************************************************/



var modal = document.getElementById("addAccountModal");
var btn = document.getElementById("addAccountButton");
var span = document.getElementsByClassName("close")[0];

btn.onclick = function () {
  modal.style.display = "block";
}

span.onclick = function () {
  modal.style.display = "none";
}

var editorInstance = null; // declare editorInstance at the top of your script


// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
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

      if (data.status === 'success') {
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
/******************************************************************
 * Run on page load
 * 
 * 
 ******************************************************************/
document.addEventListener('DOMContentLoaded', (event) => {
  updateAccounts();

  getLabelList();


  // CKEditor
  ClassicEditor
    .create(document.getElementById('editorElementId'))
    .then(editor => {
      editorInstance = editor;
      console.log("CKEditor initialized");
    })
    .catch(error => {
      console.error(error);
    });
})