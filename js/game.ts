import AudioManager from './audio.js';

// Game state
let currentWord = '';
let letterSlots: HTMLElement[] = [];
let currentLetterIndex = 0;
let score = 0;
let completedWords: string[] = [];

// DOM Elements
const startScreen = document.getElementById('start-screen') as HTMLElement;
const gameScreen = document.getElementById('game-screen') as HTMLElement;
const playButton = document.getElementById('play-button') as HTMLButtonElement;
const speakButton = document.getElementById('speak-button') as HTMLButtonElement;
const wordContainer = document.getElementById('word-container') as HTMLElement;
const resultMessage = document.getElementById('result-message') as HTMLElement;
const scoreElement = document.getElementById('score') as HTMLElement;
const dolphinContainer = document.getElementById('dolphin-container') as HTMLElement;
const confettiContainer = document.getElementById('confetti-container') as HTMLElement;
const audioIndicator = document.getElementById('audio-indicator') as HTMLElement;
const wrongLetterMessage = document.getElementById('wrong-letter-message') as HTMLElement;
const completedWordsList = document.getElementById('completed-words-list') as HTMLElement;

// Show/hide audio indicator
function showAudioIndicator() {
    if (audioIndicator) audioIndicator.classList.remove('hidden');
}
function hideAudioIndicator() {
    if (audioIndicator) audioIndicator.classList.add('hidden');
}

// Show/hide wrong letter message
function showWrongLetterMessage() {
    if (wrongLetterMessage) wrongLetterMessage.classList.remove('hidden');
}
function hideWrongLetterMessage() {
    if (wrongLetterMessage) wrongLetterMessage.classList.add('hidden');
}

// Initialize the game
function initGame() {
    console.log('DOMContentLoaded: Initializing game...');
    if (!playButton) {
        console.error('Play button not found!');
    } else {
        console.log('Play button found, adding event listener.');
        playButton.addEventListener('click', startGame);
    }
    if (!speakButton) {
        console.error('Speak button not found!');
    } else {
        console.log('Speak button found, adding event listener.');
        speakButton.addEventListener('click', async () => {
            showAudioIndicator();
            await AudioManager.playWord(currentWord);
            hideAudioIndicator();
        });
    }
    document.addEventListener('keydown', handleKeyPress);
}

// Start the game
function startGame() {
    console.log('startGame called!');
    startScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    score = 0;
    updateScore();
    loadNewWord();
}

// Load a new word
async function loadNewWord() {
    try {
        const word = await window.DatabaseManager.getRandomWord();
        if (!word) {
            throw new Error('No words available');
        }
        currentWord = word;
        setupLetterSlots();
        AudioManager.playWord(currentWord);
    } catch (error) {
        console.error('Error loading word:', error);
        resultMessage.textContent = 'Error loading word. Please try again.';
    }
}

// Setup letter slots for the current word
function setupLetterSlots() {
    wordContainer.innerHTML = '';
    letterSlots = [];
    currentLetterIndex = 0;

    for (let i = 0; i < currentWord.length; i++) {
        const slot = document.createElement('div');
        slot.className = 'letter-slot bg-gray-200 w-12 h-12 flex items-center justify-center text-2xl font-bold rounded';
        wordContainer.appendChild(slot);
        letterSlots.push(slot);
    }
}

// Handle keyboard input
function handleKeyPress(event: KeyboardEvent) {
    if (currentLetterIndex >= currentWord.length) return;

    const key = event.key.toUpperCase();
    if (key === 'BACKSPACE' || key === 'DELETE') {
        handleBackspace();
        return;
    }

    if (/^[A-Z]$/.test(key)) {
        const slot = letterSlots[currentLetterIndex];
        const correctLetter = currentWord[currentLetterIndex];
        if (key === correctLetter) {
            slot.textContent = key;
            slot.classList.remove('bg-gray-200');
            slot.classList.add('bg-blue-200');
            currentLetterIndex++;
            if (currentLetterIndex === currentWord.length) {
                checkWord();
            }
        } else {
            // Incorrect letter: turn red, shake, say 'Nope!', then clear
            slot.textContent = key;
            slot.classList.remove('bg-gray-200');
            slot.classList.add('letter-incorrect');
            showWrongLetterMessage();
            AudioManager.speakFeedback('Nope!').then(() => {
                hideWrongLetterMessage();
            });
            // Remove after animation
            slot.addEventListener('animationend', function handler() {
                slot.textContent = '';
                slot.classList.remove('letter-incorrect');
                slot.classList.add('bg-gray-200');
                slot.removeEventListener('animationend', handler);
            });
        }
    }
}

// Handle backspace key
function handleBackspace() {
    if (currentLetterIndex > 0) {
        currentLetterIndex--;
        const slot = letterSlots[currentLetterIndex];
        slot.textContent = '';
        slot.classList.remove('bg-blue-200');
        slot.classList.add('bg-gray-200');
    }
}

// Check if the word is correct
function checkWord() {
    const enteredWord = letterSlots.map(slot => slot.textContent).join('');
    
    if (enteredWord === currentWord) {
        handleCorrectWord();
    } else {
        handleWrongWord();
    }
}

// Handle correct word
function handleCorrectWord() {
    score += 10;
    updateScore();
    resultMessage.textContent = 'Correct!';
    resultMessage.className = 'text-center text-2xl font-bold mb-4 h-8 text-green-500';
    
    // Add completed word to the list
    completedWords.push(currentWord);
    updateCompletedWordsList();
    
    // Play correct sound and show confetti
    AudioManager.speakFeedback('Correct!');
    createConfetti();
    
    // Move dolphin up
    dolphinContainer.classList.remove('translate-y-full');
    
    // Wait before loading next word
    setTimeout(() => {
        resultMessage.textContent = '';
        dolphinContainer.classList.add('translate-y-full');
        loadNewWord();
    }, 2000);
}

// Handle wrong word
function handleWrongWord() {
    resultMessage.textContent = 'Try again!';
    resultMessage.className = 'text-center text-2xl font-bold mb-4 h-8 text-red-500';
    AudioManager.playSound('wrong');
    
    // Reset letter slots
    letterSlots.forEach(slot => {
        slot.textContent = '';
        slot.classList.remove('bg-blue-200');
        slot.classList.add('bg-gray-200');
    });
    currentLetterIndex = 0;
}

// Update score display
function updateScore() {
    scoreElement.textContent = score.toString();
}

// Create confetti animation
function createConfetti() {
    confettiContainer.classList.remove('hidden');
    confettiContainer.innerHTML = '';
    
    const colors = ['#FFD700', '#FF69B4', '#00BFFF', '#98FB98', '#FFA07A'];
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        
        // Random position
        const startX = Math.random() * window.innerWidth;
        const startY = -20;
        
        // Random color
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // Random size
        const size = Math.random() * 10 + 5;
        
        // Random shape
        const isCircle = Math.random() > 0.5;
        
        // Random animation duration
        const duration = Math.random() * 3 + 2;
        
        confetti.style.cssText = `
            left: ${startX}px;
            top: ${startY}px;
            background-color: ${color};
            width: ${size}px;
            height: ${size}px;
            border-radius: ${isCircle ? '50%' : '0'};
            animation-duration: ${duration}s;
        `;
        
        confettiContainer.appendChild(confetti);
        
        // Remove confetti after animation
        confetti.addEventListener('animationend', () => {
            confetti.remove();
            if (confettiContainer.children.length === 0) {
                confettiContainer.classList.add('hidden');
            }
        });
    }
}

function updateCompletedWordsList() {
    if (!completedWordsList) return;
    if (completedWords.length === 0) {
        completedWordsList.innerHTML = '';
        return;
    }
    completedWordsList.innerHTML = '<ul>' + completedWords.map(word => `<li>${word}</li>`).join('') + '</ul>';
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initGame();
    updateCompletedWordsList();
    // Browser warning for non-Chrome browsers
    const warning = document.getElementById('browser-warning');
    const ua = window.navigator.userAgent;
    // Chrome UA includes 'Chrome' and not 'Edg' or 'OPR' (Edge/Opera)
    const isChrome = /Chrome\//.test(ua) && !/Edg\//.test(ua) && !/OPR\//.test(ua);
    if (!isChrome && warning) {
        warning.classList.remove('hidden');
    }
}); 