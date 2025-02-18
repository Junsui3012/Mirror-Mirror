document.addEventListener("DOMContentLoaded", () => {
    startCamera();
    document.getElementById("startListening").addEventListener("click", startListening);
});

let mediaRecorder;
let audioChunks = [];

// Access front camera
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        document.getElementById("video").srcObject = stream;
    } catch (error) {
        console.error("Error accessing camera:", error);
    }
}

// Voice recognition function
function startListening() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        alert("Your browser does not support Speech Recognition. Try using Google Chrome.");
        return;
    }

    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
        console.log("Listening...");
        document.getElementById("status").innerText = "Listening...";
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        document.getElementById("status").innerText = "Error: " + event.error;
    };

    recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
        console.log("Recognized:", transcript);

        if (transcript.includes("mirror mirror")) {
            document.getElementById("status").innerText = "Recording Audio...";
            recognition.stop(); // Stop listening before recording
            startRecording();
        }
    };

    recognition.start();
}

// Start recording audio immediately and update status in real-time
function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstart = () => {
            console.log("Recording started...");
            document.getElementById("status").innerText = "Recording... Speak now!";

            // Apply mirror blur/dark effect
            document.getElementById("video").classList.add("recording");
        };

        mediaRecorder.onstop = () => {
            console.log("Recording stopped.");
            document.getElementById("status").innerText = "Recording Stopped. Saving...";
        
            const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
            sendAudio(audioBlob);
        
            // Fetch text and read it aloud after audio is sent
            fetchAndSpeakText();
        
            // Remove blur effect when recording stops
            document.getElementById("video").classList.remove("recording");
        };

        mediaRecorder.start();

        // Stop recording after 5 seconds
        setTimeout(() => {
            mediaRecorder.stop();
        }, 7000);
    }).catch(error => {
        console.error("Error accessing microphone:", error);
    });
}
// Send audio to server
function sendAudio(blob) {
    const formData = new FormData();
    formData.append("audio", blob, "recorded_audio.wav");

    fetch("/save_audio", {
        method: "POST",
        body: formData
    }).then(response => response.text())
    .then(data => console.log("Server Response:", data))
    .catch(error => console.error("Error:", error));
}

// Function to fetch the text file from Flask and play it as speech
function fetchAndSpeakText() {
    fetch("/get_text")
        .then(response => response.text())
        .then(text => {
            console.log("Received text:", text);
            document.getElementById("status").innerText = "Speaking...";
            speakText(text); // Read text aloud
        })
        .catch(error => console.error("Error fetching text file:", error));
}

// Function to convert text to speech
function speakText(text) {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1.0; // Adjust speed if needed

    utterance.onend = () => {
        document.getElementById("status").innerText = "Ready. Say 'Mirror Mirror' again.";
    };

    synth.speak(utterance);
}
