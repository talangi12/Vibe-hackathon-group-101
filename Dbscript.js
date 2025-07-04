// 1. Getting Firebase All Set Up
const firebaseConfig = {
  apiKey: "54362"
  authDomain: "GROUP 101. firebaseapp.com",
 databaseURL:
  projectId: " GROUP 101D",
  storageBucket:" GROUP 101.appspot.com",
  messagingSenderId: "PLPD",
  appId: "Shopping list"
};

firebase.initializeApp(firebaseConfig);

// Grab our Firebase tools!
const auth = firebase.auth();
const db = firebase.database();

// A bunch of variables to grab our HTML elements 
const authEmailInput = document.getElementById('auth-email');
const authPasswordInput = document.getElementById('auth-password');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');
const currentUserEmailSpan = document.getElementById('current-user-email');
const userUidSpan = document.getElementById('user-uid');
const userHouseholdIdSpan = document.getElementById('user-household-id');

const userInfoSection = document.getElementById('user-info');
const householdSection = document.getElementById('household-section');
const noHouseholdDiv = document.getElementById('no-household');
const householdDetailsDiv = document.getElementById('household-details');
const householdNameSpan = document.getElementById('household-name');
const householdIdSpan = document.getElementById('household-id');
const householdMembersUl = document.getElementById('household-members');
const newHouseholdNameInput = document.getElementById('new-household-name');
const createHouseholdBtn = document.getElementById('create-household-btn');
const joinHouseholdIdInput = document.getElementById('join-household-id');
const joinHouseholdBtn = document.getElementById('join-household-btn');

const listSection = document.getElementById('list-section');
const currentListNameSpan = document.getElementById('current-list-name');
const newItemNameInput = document.getElementById('new-item-name');
const newItemQtyInput = document.getElementById('new-item-qty');
const newItemCostInput = document.getElementById('new-item-cost');
const addItemBtn = document.getElementById('add-item-btn');
const shoppingListUl = document.getElementById('shopping-list');
const totalListCostSpan = document.getElementById('total-list-cost');
const costSplitDetailsUl = document.getElementById('cost-split-details');

// Keeping track of who's logged in and what household they're in
let currentUserId = null;
let currentUserHouseholdId = null;
let currentListRef = null; // A direct link to our active shopping list in the database
let currentHouseholdMembers = {}; // A little cache to remember household member names

// A super handy function to show/hide parts of the app based on user's status
function updateUI() {
    if (currentUserId) { // If someone is logged in...
        // Hide login/signup, show logout
        authEmailInput.style.display = 'none';
        authPasswordInput.style.display = 'none';
        loginBtn.style.display = 'none';
        signupBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
        userInfoSection.style.display = 'block'; // Show user details
        householdSection.style.display = 'block'; // Show household section

        currentUserEmailSpan.textContent = auth.currentUser.email;
        userUidSpan.textContent = currentUserId;

        // Determining if this user belongs to a household
        db.ref(`users/${currentUserId}/householdId`).once('value', snapshot => {
            currentUserHouseholdId = snapshot.val();
            userHouseholdIdSpan.textContent = currentUserHouseholdId || 'None yet!';

            if (currentUserHouseholdId) { // If they're in a household...
                noHouseholdDiv.style.display = 'none'; // Hide the "no household" message
                householdDetailsDiv.style.display = 'block'; // Show household info
                listSection.style.display = 'block'; // Show the shopping list!
                listenToHouseholdData(currentUserHouseholdId); // Start listening for live household updates
            } else { // If no household...
                noHouseholdDiv.style.display = 'block'; // Show the "no household" message
                householdDetailsDiv.style.display = 'none';
                listSection.style.display = 'none';
                // Clean up any old list listeners if they just left a household
                if (currentListRef) {
                    currentListRef.off();
                    shoppingListUl.innerHTML = ''; // Clear the list display
                    currentListRef = null;
                }
            }
        });
    } else { // If no one is logged in...
        // Show login/signup, hide logout
        authEmailInput.style.display = 'inline-block';
        authPasswordInput.style.display = 'inline-block';
        loginBtn.style.display = 'inline-block';
        signupBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
        currentUserEmailSpan.textContent = 'Not logged in';
        userUidSpan.textContent = 'N/A';
        userHouseholdIdSpan.textContent = 'N/A';
        userInfoSection.style.display = 'none';
        householdSection.style.display = 'none';
        listSection.style.display = 'none';
        noHouseholdDiv.style.display = 'block';
        householdDetailsDiv.style.display = 'none';
        // Clear everything out on logout
        if (currentListRef) {
            currentListRef.off();
            shoppingListUl.innerHTML = '';
            currentListRef = null;
        }
        householdMembersUl.innerHTML = '';
        currentHouseholdMembers = {};
        totalListCostSpan.textContent = '0 KES';
        costSplitDetailsUl.innerHTML = '';
    }
}

// 2. User Authentication: 
loginBtn.addEventListener('click', async () => {
    const email = authEmailInput.value;
    const password = authPasswordInput.value;
    try {
        await auth.signInWithEmailAndPassword(email, password);
        alert('🥳 Logged in successfully! Welcome back!');
    } catch (error) {
        alert('😩 Login failed: ' + error.message);
    }
});

signupBtn.addEventListener('click', async () => {
    const email = authEmailInput.value;
    const password = authPasswordInput.value;
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        // Once signed up, immediately create a basic user profile in our database
        await db.ref(`users/${userCredential.user.uid}`).set({
            email: userCredential.user.email,
            name: userCredential.user.email.split('@')[0], // Just use part of the email for a simple name
            householdId: null // They start without a household
        });
        alert('🎉 Signed up successfully! You can now log in and create/join a household!');
    } catch (error) {
        alert('😔 Sign up failed: ' + error.message);
    }
});

logoutBtn.addEventListener('click', async () => {
    try {
        await auth.signOut();
        alert('👋 See you next time! Logged out.');
    } catch (error) {
        alert('Something went wrong during logout: ' + error.message);
    }
});

// Firebase automatically tells us when the login status changes! Super helpful!
auth.onAuthStateChanged(user => {
    if (user) {
        currentUserId = user.uid;
    } else {
        currentUserId = null;
    }
    updateUI(); // And update our display accordingly
});

// -- 3. Household Management: 
createHouseholdBtn.addEventListener('click', async () => {
    if (!currentUserId) {
        alert('Please log in first to create a household.');
        return;
    }
    const householdName = newHouseholdNameInput.value.trim();
    if (!householdName) {
        alert('Please give your new household a name!');
        return;
    }

    try {
        const newHouseholdRef = db.ref('households').push(); // Firebase gives us a unique ID!
        const newHouseholdId = newHouseholdRef.key;
        const newHouseholdData = {
            name: householdName,
            members: {
                [currentUserId]: true // You're the first member!
            }
        };
        await newHouseholdRef.set(newHouseholdData);

        // Don't forget to link *your* user profile to this new household!
        await db.ref(`users/${currentUserId}/householdId`).set(newHouseholdId);
        currentUserHouseholdId = newHouseholdId; // Update our local tracking
        newHouseholdNameInput.value = ''; // Clear the input
        alert('🏡 Your household was created successfully! Get ready to shop!');
    } catch (error) {
        alert('Oops! Failed to create household: ' + error.message);
    }
});

joinHouseholdBtn.addEventListener('click', async () => {
    if (!currentUserId) {
        alert('Please log in first to join a household.');
        return;
    }
    const householdIdToJoin = joinHouseholdIdInput.value.trim();
    if (!householdIdToJoin) {
        alert('Please enter the Household ID you want to join.');
        return;
    }

    try {
        // First, let's make sure that household actually exists!
        const householdSnapshot = await db.ref(`households/${householdIdToJoin}`).once('value');
        if (!householdSnapshot.exists()) {
            alert('🚫 That Household ID does not exist. Double-check it!');
            return;
        }

        // Add yourself to the household's member list
        await db.ref(`households/${householdIdToJoin}/members/${currentUserId}`).set(true);
        // And update your user profile
        await db.ref(`users/${currentUserId}/householdId`).set(householdIdToJoin);
        currentUserHouseholdId = householdIdToJoin; // Update our local tracking
        joinHouseholdIdInput.value = ''; // Clear the input
        alert('🥳 You successfully joined the household! Happy shopping!');
    } catch (error) {
        alert('Failed to join household: ' + error.message);
    }
});

// This function keeps our UI updated with live household data
function listenToHouseholdData(householdId) {
    if (!householdId) return;

    // Listen for general household info (name, members, current list)
    db.ref(`households/${householdId}`).on('value', householdSnapshot => {
        const householdData = householdSnapshot.val();
        if (householdData) {
            householdNameSpan.textContent = householdData.name;
            householdIdSpan.textContent = householdId;

            // Display members (and fetch their names if needed)
            householdMembersUl.innerHTML = ''; // Clear previous members
            currentHouseholdMembers = {}; // Reset our cache
            if (householdData.members) {
                Object.keys(householdData.members).forEach(memberUid => {
                    // Fetch each member's name from the 'users' path
                    db.ref(`users/${memberUid}/name`).once('value', userSnapshot => {
                        const memberName = userSnapshot.val() || `Mysterious Shopper (${memberUid.substring(0, 5)}...)`;
                        currentHouseholdMembers[memberUid] = memberName; // Store name in cache
                        const li = document.createElement('li');
                        li.textContent = memberName;
                        householdMembersUl.appendChild(li);
                    });
                });
            }

            // Let's check which shopping list is currently active
            const currentListId = householdData.currentShoppingListId;
            if (currentListId) {
                currentListNameSpan.textContent = 'Loading list name...';
                db.ref(`households/${householdId}/shoppingLists/${currentListId}/name`).once('value', nameSnapshot => {
                    currentListNameSpan.textContent = nameSnapshot.val() || 'Unnamed List';
                });
                listenToShoppingListItems(householdId, currentListId); // Start listening to the items in this list
                listenToCostSummary(householdId, currentListId); // And the cost summary!
            } else {
                currentListNameSpan.textContent = 'No active list (let\'s make one!)';
                // For simplicity in this demo, let's auto-create a default list if none exists
                createDefaultShoppingList(householdId);
            }
        } else {
            // Uh oh, the household might have been deleted or you left it. Update UI!
            currentUserHouseholdId = null;
            updateUI();
        }
    });
}

// Just a little helper to ensure every new household gets a first shopping list
async function createDefaultShoppingList(householdId) {
    
    const householdRef = db.ref(`households/${householdId}`);
    const householdSnap = await householdRef.once('value');
    if (householdSnap.val() && householdSnap.val().currentShoppingListId) {
        return; 
    }

    try {
        const newListRef = db.ref(`households/${householdId}/shoppingLists`).push(); // Get a fresh list ID
        const newListId = newListRef.key;
        await newListRef.set({
            name: "Our First Shopping List",
            createdAt: new Date().toISOString(),
            createdBy: currentUserId,
            items: {}, 
            totalCost: 0,
            costSplit: {}
        });
        await householdRef.update({ currentShoppingListId: newListId }); // Set this as the active list
        alert('🛒 Your first shopping list is ready!');
    } catch (error) {
        console.error('Error creating default list:', error);
        alert('Failed to create default list: ' + error.message);
    }
}


// 4. Shopping List Management: 
addItemBtn.addEventListener('click', async () => {
    if (!currentUserId || !currentUserHouseholdId) {
        alert('Please log in and join/create a household before adding items.');
        return;
    }
    const itemName = newItemNameInput.value.trim();
    const itemQty = parseInt(newItemQtyInput.value);
    const itemCost = parseFloat(newItemCostInput.value);

    if (!itemName || isNaN(itemQty) || itemQty <= 0 || isNaN(itemCost) || itemCost < 0) {
        alert('Please enter a valid item name, a positive quantity, and a non-negative cost.');
        return;
    }

    const householdRef = db.ref(`households/${currentUserHouseholdId}`);
    const householdSnap = await householdRef.once('value');
    const currentListId = householdSnap.val()?.currentShoppingListId;

    if (!currentListId) {
        alert('No active shopping list found for this household. Please make sure one exists!');
        return;
    }

    try {
        // Add the new item to the active list!
        await db.ref(`households/${currentUserHouseholdId}/shoppingLists/${currentListId}/items`).push({
            name: itemName,
            quantity: itemQty,
            cost: itemCost,
            purchased: false, // Starts as not purchased
            purchasedBy: null, // Nobody's bought it yet
            addedBy: currentUserId, // Who added this?
            timestamp: new Date().toISOString() // When was it added? (for sorting)
        });
        // Clear the input fields for the next item
        newItemNameInput.value = '';
        newItemQtyInput.value = '1';
        newItemCostInput.value = '0';
    } catch (error) {
        alert('Failed to add item: ' + error.message);
    }
});


// Handling clicks on individual list items (like marking as purchased or deleting)
shoppingListUl.addEventListener('click', async (event) => {
    if (!currentUserId || !currentUserHouseholdId) return; // Make sure we're logged in and in a household

    const listItem = event.target.closest('li[data-item-id]'); // Find the parent list item
    if (!listItem) return; // If it's not an item, do nothing

    const itemId = listItem.dataset.itemId;
    const listId = listItem.dataset.listId; // Get the list ID from the item's data attribute

    const itemPurchasedRef = db.ref(`households/${currentUserHouseholdId}/shoppingLists/${listId}/items/${itemId}/purchased`);
    const itemPurchasedByRef = db.ref(`households/${currentUserHouseholdId}/shoppingLists/${listId}/items/${itemId}/purchasedBy`);


    if (event.target.classList.contains('toggle-purchased-btn')) {
        const isPurchased = listItem.classList.contains('purchased'); // Check current status
        try {
            await itemPurchasedRef.set(!isPurchased); // Toggle the 'purchased' status
            await itemPurchasedByRef.set(isPurchased ? null : currentUserId); // Set/clear who purchased it
        } catch (error) {
            alert('Failed to change purchased status: ' + error.message);
        }
    } else if (event.target.classList.contains('delete-item-btn')) {
        if (confirm('Are you sure you want to remove this item from the list?')) {
            try {
                await db.ref(`households/${currentUserHouseholdId}/shoppingLists/${listId}/items/${itemId}`).remove(); // Bye bye item!
            } catch (error) {
                alert('Failed to delete item: ' + error.message);
            }
        }
    }
});

// 5. Cost splitting 
function calculateAndDisplayCosts_ClientSide(itemsData, membersData) {
    let total = 0;
    const memberCount = Object.keys(membersData).length;

    if (itemsData) {
        Object.values(itemsData).forEach(item => {
            if (item.cost && typeof item.cost === 'number') {
                total += item.cost;
            }
        });
    }

    // For now, a simple equal split among all members
    const costPerMember = memberCount > 0 ? total / memberCount : 0;

    totalListCostSpan.textContent = `${total.toFixed(2)} KES`; // Display the total

    costSplitDetailsUl.innerHTML = ''; // Clear previous split details
    for (const uid in membersData) {
        const li = document.createElement('li');
        const memberName = currentHouseholdMembers[uid] || `Unknown User (${uid.substring(0, 5)}...)`;
        li.textContent = `${memberName}: ${costPerMember.toFixed(2)} KES`; // Display each person's share
        costSplitDetailsUl.appendChild(li);
    }
}

// This function listens to the 'totalCost' and 'costSplit' nodes in the database.
// In a production app, these values would be securely updated by a Cloud Function.
function listenToCostSummary(householdId, listId) {
    db.ref(`households/${householdId}/shoppingLists/${listId}`).on('value', snapshot => {
        const listData = snapshot.val();
        if (listData) {
            totalListCostSpan.textContent = `${(listData.totalCost || 0).toFixed(2)} KES`; // Display actual total from DB
            costSplitDetailsUl.innerHTML = ''; // Clear old split
            if (listData.costSplit && Object.keys(listData.costSplit).length > 0) {
                // If we have proper cost split data from the database (Cloud Function)
                for (const uid in listData.costSplit) {
                    const li = document.createElement('li');
                    const memberName = currentHouseholdMembers[uid] || `User (${uid.substring(0, 5)}...)`;
                    li.textContent = `${memberName}: ${listData.costSplit[uid].toFixed(2)} KES`;
                    costSplitDetailsUl.appendChild(li);
                }
            } else {
                 // Fallback for demo: if Cloud Function isn't running, do client-side calculation
                 console.warn("Cloud Function for cost calculation not active or data not ready. Using client-side demo calculation.");
                 calculateAndDisplayCosts_ClientSide(listData.items, currentHouseholdMembers);
            }
        }
    });
}


//  6. Real-Time Updates: 
// This function sets up a listener to keep our shopping list display always fresh
function listenToShoppingListItems(householdId, listId) {
    // If we're already listening to a list, turn it off first to avoid conflicts
    if (currentListRef) {
        currentListRef.off();
    }

    currentListRef = db.ref(`households/${householdId}/shoppingLists/${listId}/items`);

    // 'on' is Firebase's real-time listener! It fires whenever data changes!
    currentListRef.on('value', (snapshot) => {
        shoppingListUl.innerHTML = ''; // Clear the current display (we'll redraw it all)
        const items = snapshot.val(); // Get all the items
        let currentItemsForCalculation = {}; // A temporary holder for client-side demo calculations

        if (items) {
            // Turn our items object into an array so we can sort them nicely by when they were added
            const itemsArray = Object.entries(items).map(([key, value]) => ({ id: key, ...value }));
            itemsArray.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            itemsArray.forEach(item => {
                currentItemsForCalculation[item.id] = item; // Store for the demo calculation
                const li = document.createElement('li');
                li.setAttribute('data-item-id', item.id);
                li.setAttribute('data-list-id', listId); // Crucial for our click handler!
                if (item.purchased) {
                    li.classList.add('purchased'); // Adding a class to style purchased items
                }

                // Making the display pretty!
                const purchasedByText = item.purchasedBy ? ` (bought by ${currentHouseholdMembers[item.purchasedBy] || 'Someone'})` : '';
                const addedByText = currentHouseholdMembers[item.addedBy] || 'Someone';

                li.innerHTML = `
                    <span>
                        <strong>${item.name}</strong> (${item.quantity}${item.unit ? ' ' + item.unit : ''}) - ${item.cost ? item.cost.toFixed(2) + ' KES' : 'No cost set'}
                        <br>
                        <small>Added by ${addedByText}${purchasedByText}</small>
                    </span>
                    <div class="item-actions">
                        <button class="toggle-purchased-btn">${item.purchased ? 'Unmark' : 'Mark'}</button>
                        <button class="delete-item-btn delete">Remove</button>
                    </div>
                `;
                shoppingListUl.appendChild(li); // Adding it to our list on the page
            });
        }
        
        // calculating AndDisplayCosts_ClientSide(currentItemsForCalculation, currentHouseholdMembers);
    }, (error) => {
        console.error('Whoops! Error listening to shopping list items:', error);
    });
}

// Kicking everything off when the script loads!
updateUI();
