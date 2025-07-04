let items = [];
let members = ["You"];

// ====== VOICE INPUT LOGIC ======
const voiceBtn = document.getElementById("voice-btn");

if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.continuous = false;
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript.trim().toLowerCase();
    console.log("Recognized:", transcript);

    // Simple parsing logic: expects "add [item] [price]"
    const match = transcript.match(/add (.+) (\d+\.?\d*)/i);
    if (match && match.length >= 3) {
      const name = match[1];
      const cost = parseFloat(match[2]);
      items.push({ name, cost });
      renderList();
      updateTotals();
      alert(`Added "${name}" costing KES ${cost}`);
    } else {
      alert("Could not understand. Try saying: 'Add eggs 150'");
    }
  };

  recognition.onerror = function(event) {
    console.error("Speech recognition error:", event.error);
    alert("Voice input failed: " + event.error);
  };

  voiceBtn.addEventListener("click", () => {
    recognition.start();
    voiceBtn.textContent = "🎤 Listening...";
    voiceBtn.disabled = true;

    setTimeout(() => {
      voiceBtn.textContent = "🎤 Add via Voice";
      voiceBtn.disabled = false;
    }, 5000); // stop after 5 seconds
  });

} else {
  voiceBtn.style.display = "none"; // Hide button if not supported
  console.warn("Web Speech API not supported in this browser.");
}

// ====== SHOPPING LIST FUNCTIONS ======

function addItem() {
  const name = document.getElementById("item-name").value.trim();
  const cost = parseFloat(document.getElementById("item-cost").value);

  if (!name || isNaN(cost) || cost <= 0) {
    alert("Please enter valid item name and cost.");
    return;
  }

  items.push({ name, cost });
  document.getElementById("item-name").value = "";
  document.getElementById("item-cost").value = "";
  renderList();
  updateTotals();
}

function removeItem(index) {
  items.splice(index, 1);
  renderList();
  updateTotals();
}

function editItem(index, field, value) {
  items[index][field] = field === "cost" ? parseFloat(value) : value;
  updateTotals();
}

function renderList() {
  const list = document.getElementById("shopping-list");
  list.innerHTML = "";

  items.forEach((item, idx) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <input class="item-input" value="${item.name}" onblur="editItem(${idx}, 'name', this.value)">
      <input class="item-input" type="number" value="${item.cost.toFixed(2)}" step="0.01"
        onblur="editItem(${idx}, 'cost', this.value)">
      <button onclick="removeItem(${idx})" class="small-btn">✕</button>
    `;
    list.appendChild(li);
  });
}

function updateTotals() {
  const total = items.reduce((sum, item) => sum + item.cost, 0);
  document.getElementById("total").textContent = total.toFixed(2);
  updateSplit();
}

function updateSplit() {
  const total = parseFloat(document.getElementById("total").textContent);
  const people = members.length;
  const split = total / people;
  document.getElementById("split").textContent = (isNaN(split) ? 0 : split).toFixed(2);
}

function addMember() {
  const name = prompt("Enter member name:");
  if (name && !members.includes(name)) {
    members.push(name);
    renderMembers();
  }
}

function removeMember(name) {
  members = members.filter(m => m !== name);
  renderMembers();
}

function renderMembers() {
  const container = document.getElementById("members-container");
  container.innerHTML = "";
  members.forEach(member => {
    const tag = document.createElement("div");
    tag.className = "member-tag";
    tag.innerHTML = `${member} <span class="close" onclick="removeMember('${member}')">×</span>`;
    container.appendChild(tag);
  });
  updateSplit();
}

// Initialize
renderMembers();
updateTotals();