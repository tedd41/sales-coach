const API = "http://localhost:3001/api/v1";
const REP_ID = "fe807de5-0373-4d1f-9a26-bdc29ec1afde";

const btnGen = document.getElementById("btn-gen");
const btnCopy = document.getElementById("btn-copy");
const emailBody = document.getElementById("email-body");
const draftOut = document.getElementById("draft-out");
const draftSec = document.getElementById("draft-section");
const errorBox = document.getElementById("error-box");
const statusBar = document.getElementById("status-bar");

function setStatus(msg) {
    if (msg) { statusBar.textContent = msg; statusBar.style.display = "block"; }
    else { statusBar.style.display = "none"; }
}

btnGen.addEventListener("click", function () {
    btnGen.disabled = true;
    btnGen.textContent = "Generating...";
    errorBox.style.display = "none";
    draftSec.style.display = "none";
    setStatus("Sending request to backend...");

    var payload = JSON.stringify({ repId: REP_ID, latestUpdate: emailBody.value });

    fetch(API + "/intelligence/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
    })
        .then(function (res) {
            setStatus("Got response: HTTP " + res.status);
            if (!res.ok) throw new Error("HTTP " + res.status);
            return res.json();
        })
        .then(function (json) {
            setStatus(null);
            draftOut.value = (json.data && json.data.message) ? json.data.message : "No reply generated.";
            draftSec.style.display = "block";
            btnCopy.style.display = "block";
            btnGen.disabled = false;
            btnGen.textContent = "✨ Regenerate";
        })
        .catch(function (e) {
            setStatus(null);
            errorBox.innerHTML = "<strong>Failed:</strong> " + e.message;
            errorBox.style.display = "block";
            btnGen.disabled = false;
            btnGen.textContent = "✨ Generate Coaching Reply";
        });
});

btnCopy.addEventListener("click", function () {
    navigator.clipboard.writeText(draftOut.value).catch(function () { });
    btnCopy.textContent = "Copied!";
    setTimeout(function () { btnCopy.textContent = "📋 Copy to Clipboard"; }, 2000);
});

try {
    chrome.runtime.onMessage.addListener(function (msg) {
        if (msg.action === "emailContext" && msg.senderEmail) {
            // TODO (Outlook): emailBody.value = msg.body || "";
            draftSec.style.display = "none";
            errorBox.style.display = "none";
            fetch(API + "/reps/by-email/" + encodeURIComponent(msg.senderEmail))
                .then(function (r) { return r.json(); })
                .then(function (json) {
                    if (json.data) {
                        document.getElementById("rep-name").textContent = json.data.name;
                        document.getElementById("rep-email").textContent = json.data.email;
                        btnGen._repId = json.data.id;
                    }
                }).catch(function () { });
        }
    });
} catch (e) { }
