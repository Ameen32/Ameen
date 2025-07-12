// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAzb3jbndemY5w3nkwk-sdIxLmYV0Qj9WQ",
    authDomain: "sahithyotsav-results-288f2.firebaseapp.com",
    databaseURL: "https://sahithyotsav-results-288f2-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "sahithyotsav-results-288f2",
    storageBucket: "sahithyotsav-results-288f2.firebasestorage.app",
    messagingSenderId: "601783689113",
    appId: "1:601783689113:web:cba8bff9cdc4a1aac43d08"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const initialScreen = document.getElementById('initial-screen');
const getResultsBtn = document.getElementById('get-results-btn');
const chatbotScreen = document.getElementById('chatbot-screen');
const chatArea = document.getElementById('chat-area');
const startButton = document.getElementById('start-button');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

let currentCategory = '';

// ഓട്ടോ ഇമേജ് സ്ലൈഡറിനായുള്ള ചിത്രങ്ങൾ
// നിങ്ങൾക്ക് ഇവിടെ കൂടുതൽ ചിത്രങ്ങൾ ചേർക്കാം. ഈ ചിത്രങ്ങൾ നിങ്ങളുടെ പ്രോജക്റ്റിന്റെ അതേ ഫോൾഡറിൽ അല്ലെങ്കിൽ കൃത്യമായ പാതയിൽ ഉണ്ടായിരിക്കണം.
const adImages = [
    'ad_image1.jpeg', // നിങ്ങളുടെ പരസ്യ ചിത്രങ്ങളുടെ പേരുകൾ ഇവിടെ നൽകുക
    'ad_image2.jpeg',
    'ad_image3.jpeg'
];
let currentSlide = 0;
let slideInterval;

// ചാറ്റ് ഏരിയയിലേക്ക് ടൈപ്പിംഗ് ആനിമേഷനോടുകൂടിയ ഒരു സന്ദേശം ചേർക്കുന്ന ഫംഗ്ഷൻ.
function addMessage(text, sender, isTyping = false, callback = null, isHtml = false) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    const bubble = document.createElement('div');
    bubble.classList.add('message-bubble');
    messageDiv.appendChild(bubble);
    chatArea.appendChild(messageDiv);
    chatArea.scrollTop = chatArea.scrollHeight; // താഴേക്ക് സ്ക്രോൾ ചെയ്യുന്നു (പുതിയ സന്ദേശം കാണാൻ)

    if (isTyping) {
        let i = 0;
        const typingInterval = setInterval(() => {
            if (i < text.length) {
                bubble.textContent += text.charAt(i);
                i++;
                chatArea.scrollTop = chatArea.scrollHeight;
            } else {
                clearInterval(typingInterval);
                if (callback) callback();
            }
        }, 30); // ടൈപ്പിംഗ് വേഗത
    } else {
        if (isHtml) {
            bubble.innerHTML = text;
        } else {
            bubble.textContent = text;
        }
        chatArea.scrollTop = chatArea.scrollHeight;
        if (callback) callback();
    }
    return bubble; // ലോഡിംഗ് സ്പിന്നർ പോലുള്ള അപ്ഡേറ്റുകൾക്കായി ബബിൾ എലമെന്റ് തിരികെ നൽകുന്നു.
}

// കാറ്റഗറി ബട്ടണുകൾ കാണിക്കുന്നതിനുള്ള ഫംഗ്ഷൻ.
function showCategoryButtons() {
    addMessage("Please select a category to view results.", 'bot', true, () => {
        console.log("Attempting to fetch categories from Firebase 'results' path...");
        // Firebase-ലെ 'results' പാതയിൽ നിന്ന് കാറ്റഗറികൾ എടുക്കാൻ ശ്രമിക്കുന്നു.
        database.ref('results').once('value', (snapshot) => {
            if (snapshot.exists()) {
                const allResults = snapshot.val();
                console.log("All results fetched:", allResults);
                // എല്ലാ ഫലങ്ങളും ലഭിച്ചു.

                const uniqueCategories = new Set();
                for (let key in allResults) {
                    if (allResults.hasOwnProperty(key) && allResults[key].category) {
                        uniqueCategories.add(allResults[key].category);
                    }
                }

                const categoryNames = Array.from(uniqueCategories);
                console.log("Unique Categories found:", categoryNames);
                // കണ്ടെത്തിയ കാറ്റഗറികൾ.

                if (categoryNames.length > 0) {
                    const buttonsContainer = document.createElement('div');
                    buttonsContainer.classList.add('category-buttons', 'message', 'bot');

                    categoryNames.forEach(category => {
                        const button = document.createElement('button');
                        button.textContent = category;
                        button.addEventListener('click', () => handleCategorySelection(category));
                        buttonsContainer.appendChild(button);
                    });
                    chatArea.appendChild(buttonsContainer);
                    chatArea.scrollTop = chatArea.scrollHeight;
                } else {
                    console.log("No unique categories found in 'results' path.");
                    // 'results' പാതയിൽ തനതായ കാറ്റഗറികളൊന്നും കണ്ടെത്തിയില്ല.
                    addMessage("Sorry, no categories found at the moment.", 'bot');
                }
            } else {
                console.log("No data found in Firebase at 'results' path.");
                // Firebase-ലെ 'results' പാതയിൽ ഡാറ്റയൊന്നും കണ്ടെത്തിയില്ല.
                addMessage("Sorry, no results found at the moment.", 'bot');
            }
        }, (error) => {
            console.error("Error fetching results for categories:", error);
            // കാറ്റഗറികൾ എടുക്കുന്നതിൽ പിശക് സംഭവിച്ചു.
            addMessage("There was an error loading categories. Please try again later.", 'bot');
        });
    });
}

// കാറ്റഗറി തിരഞ്ഞെടുക്കുന്നത് കൈകാര്യം ചെയ്യുന്നതിനുള്ള ഫംഗ്ഷൻ.
function handleCategorySelection(category) {
    addMessage(category, 'user');
    currentCategory = category;
    addMessage(`Please select a program for ${category}:`, 'bot', true, () => {
        showProgramButtons(category);
    });
}

// ഒരു പ്രത്യേക കാറ്റഗറിക്കുള്ള പ്രോഗ്രാം ബട്ടണുകൾ കാണിക്കുന്നതിനുള്ള ഫംഗ്ഷൻ.
function showProgramButtons(category) {
    database.ref('results').once('value', (snapshot) => {
        if (snapshot.exists()) {
            const allResults = snapshot.val();
            const uniquePrograms = new Set();

            for (let key in allResults) {
                if (allResults.hasOwnProperty(key) && allResults[key].category === category && allResults[key].program) {
                    uniquePrograms.add(allResults[key].program);
                }
            }

            const programNames = Array.from(uniquePrograms);
            console.log(`Unique Programs for ${category}:`, programNames);
            // ${category} നായുള്ള തനതായ പ്രോഗ്രാമുകൾ.

            if (programNames.length > 0) {
                const buttonsContainer = document.createElement('div');
                buttonsContainer.classList.add('program-buttons', 'message', 'bot');

                programNames.forEach(program => {
                    const button = document.createElement('button');
                    button.textContent = program;
                    button.addEventListener('click', () => handleProgramSelection(category, program));
                    buttonsContainer.appendChild(button);
                });
                chatArea.appendChild(buttonsContainer);
                chatArea.scrollTop = chatArea.scrollHeight;
            } else {
                console.log(`No programs found for category: ${category}`);
                // ${category} എന്ന കാറ്റഗറിക്ക് പ്രോഗ്രാമുകളൊന്നും കണ്ടെത്തിയില്ല.
                addMessage(`No programs found for ${category} at the moment.`, 'bot');
            }
        } else {
            console.log("No data found in Firebase at 'results' path for programs.");
            // പ്രോഗ്രാമുകൾക്കായി Firebase-ലെ 'results' പാതയിൽ ഡാറ്റയൊന്നും കണ്ടെത്തിയില്ല.
            addMessage("Sorry, no results found at the moment.", 'bot');
        }
    }, (error) => {
        console.error("Error fetching programs:", error);
        // പ്രോഗ്രാമുകൾ എടുക്കുന്നതിൽ പിശക് സംഭവിച്ചു.
        addMessage("There was an error loading programs. Please try again later.", 'bot');
    });
}

// പ്രോഗ്രാം തിരഞ്ഞെടുക്കുന്നത് കൈകാര്യം ചെയ്യുന്നതിനുള്ള ഫംഗ്ഷൻ.
function handleProgramSelection(category, program) {
    addMessage(program, 'user');

    // Add a message with a loading spinner
    // ഒരു ലോഡിംഗ് സ്പിന്നറോടുകൂടിയ സന്ദേശം ചേർക്കുന്നു.
    const loadingMessageBubble = addMessage('Loading image...', 'bot', false, null, true);
    const loadingSpinner = document.createElement('div');
    loadingSpinner.classList.add('loading-spinner');
    loadingMessageBubble.appendChild(loadingSpinner);


    database.ref('results').once('value', (snapshot) => {
        // Remove loading spinner once data is fetched (success or failure)
        // ഡാറ്റ ലഭിച്ചാൽ (വിജയിച്ചാലും പരാജയപ്പെട്ടാലും) ലോഡിംഗ് സ്പിന്നർ നീക്കം ചെയ്യുക.
        loadingSpinner.remove();
        loadingMessageBubble.textContent = ''; // Clear "Loading image..." text
        // "Loading image..." എന്ന ടെക്സ്റ്റ് ക്ലിയർ ചെയ്യുന്നു.

        if (snapshot.exists()) {
            const allResults = snapshot.val();
            let imageUrl = null;

            for (let key in allResults) {
                if (allResults.hasOwnProperty(key) && allResults[key].category === category && allResults[key].program === program) {
                    imageUrl = allResults[key].imageUrl;
                    break;
                }
            }

            if (imageUrl) {
                const imageResultDiv = document.createElement('div');
                imageResultDiv.classList.add('image-result'); // No 'message' or 'bot' class here, it's inside the bubble
                // ഇവിടെ 'message' അല്ലെങ്കിൽ 'bot' ക്ലാസ് ഇല്ല, ഇത് ബബിളിനുള്ളിലാണ്.
                
                const img = document.createElement('img');
                img.src = imageUrl;
                img.alt = program;
                img.onload = () => {
                    chatArea.scrollTop = chatArea.scrollHeight; // Scroll to bottom after image loads
                    // ചിത്രം ലോഡ് ചെയ്ത ശേഷം താഴേക്ക് സ്ക്രോൾ ചെയ്യുന്നു.
                };
                img.onerror = () => {
                    loadingMessageBubble.textContent = "Error loading image."; // Update text if error loading image
                    // ചിത്രം ലോഡ് ചെയ്യുന്നതിൽ പിശകുണ്ടെങ്കിൽ ടെക്സ്റ്റ് അപ്ഡേറ്റ് ചെയ്യുന്നു.
                    chatArea.scrollTop = chatArea.scrollHeight;
                };
                imageResultDiv.appendChild(img);

                const downloadIcon = document.createElement('button');
                downloadIcon.classList.add('download-icon');
                downloadIcon.title = 'Download Image';
                downloadIcon.addEventListener('click', () => downloadImage(imageUrl, program));
                imageResultDiv.appendChild(downloadIcon);
                
                loadingMessageBubble.appendChild(imageResultDiv); // Append the image result to the existing bubble
                // നിലവിലുള്ള ബബിളിലേക്ക് ഇമേജ് റിസൾട്ട് ചേർക്കുന്നു.
                chatArea.scrollTop = chatArea.scrollHeight;
            } else {
                loadingMessageBubble.textContent = "Image not found for this program."; // Update text if not found
                // ചിത്രം കണ്ടെത്തിയില്ലെങ്കിൽ ടെക്സ്റ്റ് അപ്ഡേറ്റ് ചെയ്യുന്നു.
                chatArea.scrollTop = chatArea.scrollHeight;
            }
        } else {
            loadingMessageBubble.textContent = "No results found in Firebase."; // Update text if no data
            // ഡാറ്റ ഇല്ലെങ്കിൽ ടെക്സ്റ്റ് അപ്ഡേറ്റ് ചെയ്യുന്നു.
            chatArea.scrollTop = chatArea.scrollHeight;
        }
    }, (error) => {
        loadingSpinner.remove(); // Ensure spinner is removed on error
        // പിശക് സംഭവിച്ചാൽ സ്പിന്നർ നീക്കം ചെയ്തിട്ടുണ്ടെന്ന് ഉറപ്പാക്കുക.
        loadingMessageBubble.textContent = 'There was an error loading the image. Please try again later.'; // Update text on error
        // പിശക് സംഭവിച്ചാൽ ടെക്സ്റ്റ് അപ്ഡേറ്റ് ചെയ്യുന്നു.
        console.error('Error fetching image URL:', error);
        chatArea.scrollTop = chatArea.scrollHeight;
    });
}

// ചിത്രം ഡൗൺലോഡ് ചെയ്യുന്നതിനുള്ള ഫംഗ്ഷൻ.
async function downloadImage(imageUrl, filename) {
    try {
        // fetch അഭ്യർത്ഥനയിൽ ഒരു mode: 'cors' ചേർക്കുക, ഇത് ചില ബ്രൗസറുകളിൽ സഹായകമാകും.
        const response = await fetch(imageUrl, { mode: 'cors' }); 
        
        if (!response.ok) {
            // HTTP സ്റ്റാറ്റസ് 200-299 റേഞ്ചിൽ അല്ലെങ്കിൽ പിശക് കാണിക്കുക.
            throw new Error(`HTTP error! Status: ${response.status} - Could not fetch image.`);
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        // ഫയൽ എക്സ്റ്റൻഷൻ URL-ൽ നിന്ന് കൂടുതൽ കൃത്യമായി കണ്ടെത്താൻ ശ്രമിക്കുക
        // MIME ടൈപ്പ് ഉപയോഗിച്ച് എക്സ്റ്റൻഷൻ കണ്ടെത്തുക
        let fileExtension = 'jpeg'; // default
        if (blob.type.includes('image/png')) {
            fileExtension = 'png';
        } else if (blob.type.includes('image/gif')) {
            fileExtension = 'gif';
        } else if (blob.type.includes('image/webp')) {
            fileExtension = 'webp';
        } 
        // URL-ൽ നിന്ന് തന്നെ അവസാനത്തെ ഭാഗം എടുക്കുക, പക്ഷെ അത് Query parameters ഇല്ലാതെ.
        const urlParts = imageUrl.split('.');
        const lastPart = urlParts[urlParts.length - 1];
        const potentialExt = lastPart.split('?')[0].toLowerCase();

        // അറിയാവുന്ന ചില എക്സ്റ്റൻഷനുകൾക്കായി മാത്രം ഇത് ഉപയോഗിക്കുക
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(potentialExt)) {
            fileExtension = potentialExt;
        }

        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.${fileExtension}`; 
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading image:', error);
        // ഉപയോക്താവിന് കൂടുതൽ വ്യക്തമായ സന്ദേശം നൽകുക
        alert('Failed to download image. Please check your internet connection and try again. If the issue persists, the image might not be available or there\'s a server issue.');
    }
}


// സ്ലൈഡർ ചിത്രങ്ങൾ ലോഡ് ചെയ്യുകയും ഡിസ്പ്ലേ ചെയ്യുകയും ചെയ്യുന്ന ഫംഗ്ഷൻ
function loadSliderImages() {
    const adSlider = document.getElementById('ad-slider');
    const sliderDots = document.getElementById('slider-dots');
    if (!adSlider || !sliderDots) return; // എലമെന്റുകൾ ഉണ്ടോ എന്ന് ഉറപ്പാക്കുക

    adSlider.innerHTML = ''; // നിലവിലുള്ള ചിത്രങ്ങൾ നീക്കം ചെയ്യുക
    sliderDots.innerHTML = ''; // നിലവിലുള്ള ഡോട്ട്സ് നീക്കം ചെയ്യുക

    adImages.forEach((imageSrc, index) => {
        const img = document.createElement('img');
        img.src = imageSrc;
        img.alt = `Ad Image ${index + 1}`;
        adSlider.appendChild(img);

        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (index === 0) {
            dot.classList.add('active');
        }
        dot.addEventListener('click', () => {
            currentSlide = index;
            updateSlider();
            resetSlideInterval();
        });
        sliderDots.appendChild(dot);
    });
}

// സ്ലൈഡർ അപ്ഡേറ്റ് ചെയ്യുന്ന ഫംഗ്ഷൻ
function updateSlider() {
    const adSlider = document.getElementById('ad-slider');
    if (!adSlider || adImages.length === 0) return;

    // ചിത്രങ്ങൾ ലോഡ് ആയതിന് ശേഷം മാത്രമേ clientWidth ഉപയോഗിക്കാവൂ
    const firstImage = adSlider.querySelector('img');
    if (!firstImage || firstImage.clientWidth === 0) {
        // ചിത്രം പൂർണ്ണമായി ലോഡ് ആയിട്ടില്ലെങ്കിൽ, ഒരു ചെറിയ ഡിലേ നൽകി വീണ്ടും ശ്രമിക്കുക
        setTimeout(updateSlider, 50); 
        return;
    }
    const slideWidth = firstImage.clientWidth;
    adSlider.style.transform = `translateX(-${currentSlide * slideWidth}px)`;

    // ഡോട്ട്സ് അപ്ഡേറ്റ് ചെയ്യുക
    document.querySelectorAll('.dot').forEach((dot, index) => {
        if (index === currentSlide) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

// അടുത്ത സ്ലൈഡിലേക്ക് പോകുന്ന ഫംഗ്ഷൻ
function nextSlide() {
    currentSlide = (currentSlide + 1) % adImages.length;
    updateSlider();
}

// സ്ലൈഡ് ഇന്റർവൽ റീസെറ്റ് ചെയ്യുന്ന ഫംഗ്ഷൻ
function resetSlideInterval() {
    clearInterval(slideInterval);
    slideInterval = setInterval(nextSlide, 3000); // 3 സെക്കൻഡ് ഇടവേളയിൽ സ്ലൈഡ് മാറും
}

// Event Listeners
// ഇവന്റ് ലിസണറുകൾ.
getResultsBtn.addEventListener('click', () => {
    initialScreen.classList.remove('active');
    chatbotScreen.classList.add('active');
    clearInterval(slideInterval); // ചാറ്റ്ബോട്ട് സ്ക്രീനിലേക്ക് മാറുമ്പോൾ സ്ലൈഡർ നിർത്തുക
    addMessage("Welcome to the Sahithyotsav Results Bot!", 'bot', true, () => {
        startButton.style.display = 'block'; // സ്റ്റാർട്ട് ബട്ടൺ കാണിക്കുക.
    });
});

startButton.addEventListener('click', () => {
    startButton.style.display = 'none'; // സ്റ്റാർട്ട് ബട്ടൺ മറയ്ക്കുക.
    showCategoryButtons();
});

// പേജ് ലോഡ് ചെയ്യുമ്പോൾ സ്ലൈഡർ ആരംഭിക്കുക
document.addEventListener('DOMContentLoaded', () => {
    if (adImages.length > 0) {
        loadSliderImages();
        // ചിത്രങ്ങൾ ലോഡ് ആകുന്നതുവരെ കാത്തിരിക്കാൻ setTimeout ഉപയോഗിക്കുന്നു
        // ഇത് clientWidth പ്രശ്നം ഒഴിവാക്കാൻ സഹായിക്കും.
        const firstImage = document.querySelector('.ad-slider img');
        if (firstImage) {
            firstImage.onload = () => {
                updateSlider();
                resetSlideInterval();
            };
            // ചിത്രം ചിലപ്പോൾ ക്യാഷിൽ നിന്ന് വരുമ്പോൾ onload ഇവന്റ് ട്രിഗർ ആവില്ല.
            // അതുകൊണ്ട് ചിത്രം ഇതിനകം ലോഡ് ആയിട്ടുണ്ടോ എന്ന് പരിശോധിക്കുക.
            if (firstImage.complete) {
                updateSlider();
                resetSlideInterval();
            }
        } else {
            // ചിത്രങ്ങൾ ഇല്ലെങ്കിൽ, നേരിട്ട് സ്ലൈഡർ അപ്ഡേറ്റ് ചെയ്യുക
            updateSlider();
            resetSlideInterval();
        }
    }
});

// Optional: Enable user input and send button after initial interaction or at a certain point
// For now, they remain disabled as per your HTML
// ഓപ്ഷണൽ: ആദ്യത്തെ ഇടപെടലിന് ശേഷമോ അല്ലെങ്കിൽ ഒരു പ്രത്യേക സമയത്തോ ഉപയോക്തൃ ഇൻപുട്ടും അയയ്‌ക്കാനുള്ള ബട്ടണും പ്രവർത്തനക്ഷമമാക്കുക.
// നിലവിൽ, നിങ്ങളുടെ HTML പ്രകാരം അവ പ്രവർത്തനരഹിതമായി തുടരും.
// userInput.addEventListener('keypress', (e) => {
//        if (e.key === 'Enter') {
//            handleUserInput();
//        }
// });

// sendButton.addEventListener('click', handleUserInput);

// function handleUserInput() {
//        const message = userInput.value.trim();
//        if (message) {
//            addMessage(message, 'user');
//            userInput.value = '';
//            // ഇവിടെ ടൈപ്പ് ചെയ്യാൻ അനുവദിക്കുകയാണെങ്കിൽ ഉപയോക്തൃ ഇൻപുട്ട് പ്രോസസ്സ് ചെയ്യാനുള്ള ലോജിക് ചേർക്കുക.
//            // ഈ ബോട്ടിനെ സംബന്ധിച്ചിടത്തോളം, ഇത് പ്രധാനമായും കാറ്റഗറികൾക്കും പ്രോഗ്രാമുകൾക്കുമുള്ള ബട്ടൺ അധിഷ്ഠിതമാണ്.
//        }
// }
