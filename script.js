

// Ensure Firebase is initialized in firebase-config.js or directly here
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// Import the functions you need from the SDKs you need

// TODO: Add SDKs for Firebase products that you want to use
const firebaseConfig = {
  apiKey: "AIzaSyAyI9UU2vw4bMj20grFVvDN1QWVx7VkG0w",
  authDomain: "sahithyotsavresults.firebaseapp.com",
  databaseURL: "https://sahithyotsavresults-default-rtdb.firebaseio.com",
  projectId: "sahithyotsavresults",
  storageBucket: "sahithyotsavresults.firebasestorage.app",
  messagingSenderId: "1026183092726",
  appId: "1:1026183092726:web:fc3c32f77d992b1e414fd7",
  measurementId: "G-SE7HHH66LP"
};
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
<script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore-compat.js"></script>
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

// Initialize Firebase

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
// const db = firebase.firestore();

// DOM Elements
const landingPage = document.getElementById('landing-page');
const chatPage = document.getElementById('chat-page');
const getResultsButton = document.getElementById('get-results-button');
const startAppButtonLanding = document.getElementById('start-app-button-landing');
const startChatButton = document.getElementById('start-chat-button');
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const backgroundImageContainer = document.querySelector('.background-image-container');

let currentStep = 0; // To manage the bot's conversation flow
let selectedCategory = null;
let typingEffectInterval;

// Function to get URL parameter for background image
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Set background image from URL parameter on load
document.addEventListener('DOMContentLoaded', () => {
    const bgImageUrl = getUrlParameter('bg');
    if (bgImageUrl) {
        backgroundImageContainer.style.backgroundImage = `url('${bgImageUrl}')`;
    }
});

// Helper function to simulate typing effect
function typeMessage(element, text, callback) {
    let i = 0;
    element.textContent = ''; // Clear existing content
    typingEffectInterval = setInterval(() => {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom
        } else {
            clearInterval(typingEffectInterval);
            if (callback) callback();
        }
    }, 30); // Typing speed
}

// Function to add a bot message to the chat
function addBotMessage(text, type = 'text') {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'bot-message');
    messageDiv.innerHTML = `
        <div class="avatar">🤖</div>
        <div class="message-content" id="temp-message-content"></div>
    `;
    chatMessages.appendChild(messageDiv);
    const tempMessageContent = messageDiv.querySelector('#temp-message-content');
    tempMessageContent.removeAttribute('id'); // Remove ID to prevent duplicates
    typeMessage(tempMessageContent, text, () => {
        chatMessages.scrollTop = chatMessages.scrollHeight; // Ensure it scrolls to bottom after typing
    });
}

// Function to add a user message to the chat
function addUserMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'user-message');
    messageDiv.innerHTML = `
        <div class="message-content">${text}</div>
        <div class="avatar">👤</div>
    `;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Function to add selectable buttons (categories or programs)
function addSelectableButtons(buttons, clickHandler) {
    const buttonsContainer = document.createElement('div');
    buttonsContainer.classList.add('message', 'bot-message');
    buttonsContainer.innerHTML = `<div class="avatar">🤖</div><div class="message-content buttons-wrapper"></div>`;
    const wrapper = buttonsContainer.querySelector('.buttons-wrapper');

    buttons.forEach(buttonText => {
        const button = document.createElement('span');
        button.classList.add('selectable-button');
        button.textContent = buttonText;
        button.addEventListener('click', () => {
            if (!button.classList.contains('selected')) {
                // Deselect previous buttons if only one selection is allowed per step
                wrapper.querySelectorAll('.selectable-button').forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');
                addUserMessage(buttonText); // Show user's selection
                clickHandler(buttonText);
            }
        });
        wrapper.appendChild(button);
    });
    chatMessages.appendChild(buttonsContainer);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Function to display result card with image and download option
async function displayResultCard(programName, imageUrl, participants) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('message', 'bot-message');
    cardDiv.innerHTML = `
        <div class="avatar">🤖</div>
        <div class="message-content result-card">
            <h3>${programName} Results</h3>
            ${imageUrl ? `<img src="${imageUrl}" alt="${programName} result">` : ''}
            <p>Participants:</p>
            <ul>
                ${participants.map(p => `<li>${p.name} (ID: ${p.id})</li>`).join('')}
            </ul>
            ${imageUrl ? `<span class="download-icon" data-image-url="${imageUrl}">⬇️</span>` : ''}
        </div>
    `;
    chatMessages.appendChild(cardDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Add event listener for download icon
    if (imageUrl) {
        cardDiv.querySelector('.download-icon').addEventListener('click', (e) => {
            const url = e.target.dataset.imageUrl;
            downloadImage(url, programName + '_result.jpg');
        });
    }
}

// Function to download image
function downloadImage(url, filename) {
    fetch(url)
        .then(response => response.blob())
        .then(blob => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href); // Clean up the URL object
        })
        .catch(e => console.error("Error downloading image:", e));
}

// Bot's conversational flow
async function proceedBotFlow(input = null) {
    userInput.disabled = true;
    sendButton.disabled = true;

    switch (currentStep) {
        case 0: // Initial welcome message
            await addBotMessage("Welcome to the Sahithyotsav Results Bot!");
            currentStep = 1;
            break;
        case 1: // Ask to select category (after initial start)
            await addBotMessage("Please select a category to view results.");
            // Fetch categories from Firebase
            try {
                const categoriesSnapshot = await db.collection('categories').get();
                const categories = categoriesSnapshot.docs.map(doc => doc.id); // Get category names
                addSelectableButtons(categories, (category) => {
                    selectedCategory = category;
                    addUserMessage(category); // User's selection
                    proceedBotFlow(); // Continue to next step
                });
            } catch (error) {
                console.error("Error fetching categories:", error);
                addBotMessage("Sorry, I couldn't fetch categories at the moment. Please try again later.");
            }
            break;
        case 2: // Display programs for selected category
            if (selectedCategory) {
                await addBotMessage(`Results for: ${selectedCategory}.`);
                await addBotMessage("Please select a program:");
                try {
                    const programsSnapshot = await db.collection('categories').doc(selectedCategory).collection('programs').get();
                    const programs = programsSnapshot.docs.map(doc => doc.data().name); // Assuming 'name' field
                    addSelectableButtons(programs, (programName) => {
                        addUserMessage(programName); // User's selection
                        proceedBotFlow(programName); // Pass program name to next step
                    });
                } catch (error) {
                    console.error("Error fetching programs:", error);
                    addBotMessage("Sorry, I couldn't fetch programs for this category. Please try again later.");
                }
            } else {
                addBotMessage("Please select a category first.");
                currentStep = 1; // Go back to category selection
                proceedBotFlow();
            }
            break;
        case 3: // Display program results
            if (input) { // Input here is the selected program name
                try {
                    const programDoc = await db.collection('categories').doc(selectedCategory).collection('programs').where('name', '==', input).limit(1).get();
                    if (!programDoc.empty) {
                        const programData = programDoc.docs[0].data();
                        displayResultCard(programData.name, programData.image, programData.participants || []);
                    } else {
                        addBotMessage("Sorry, I couldn't find results for that program.");
                    }
                } catch (error) {
                    console.error("Error fetching program results:", error);
                    addBotMessage("Sorry, I encountered an error while fetching results. Please try again.");
                }
            }
            // After displaying results, you might want to ask if they want to view more
            addBotMessage("Would you like to view results for another program or category? Click 'Start' again to go back to categories.");
            currentStep = 1; // Allow going back to category selection by clicking start
            userInput.disabled = false; // Enable typing for future possible features
            sendButton.disabled = false;
            break;
        default:
            addBotMessage("I'm not sure how to respond to that. Please click 'Start' to begin.");
            currentStep = 1; // Reset to category selection
    }
}

// Event Listeners

// Landing Page Get Results Button
getResultsButton.addEventListener('click', () => {
    landingPage.classList.add('hidden');
    chatPage.classList.remove('hidden');
    proceedBotFlow(); // Start the chat flow with welcome message
});

// Landing Page Start Button (bottom fixed)
startAppButtonLanding.addEventListener('click', () => {
    landingPage.classList.add('hidden');
    chatPage.classList.remove('hidden');
    proceedBotFlow(); // Start the chat flow with welcome message
});

// Chat Page Start Button (bottom fixed)
startChatButton.addEventListener('click', () => {
    // Reset chat state if needed
    chatMessages.innerHTML = ''; // Clear previous messages
    currentStep = 0; // Reset flow to start
    selectedCategory = null;
    proceedBotFlow();
});

// User input (if you want to add free text input later)
sendButton.addEventListener('click', () => {
    const message = userInput.value.trim();
    if (message) {
        addUserMessage(message);
        userInput.value = '';
        // For now, free text input isn't fully implemented for flow control
        // It's primarily for responding to selectable buttons
        addBotMessage("Please use the buttons provided for navigation.");
    }
});

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendButton.click();
    }
});
