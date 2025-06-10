import AudioManager from './audio.js';
import LocalStorageManager, { GameState } from './localstorage.js';

// Game state
let currentWord = '';
let letterSlots: HTMLElement[] = [];
let currentLetterIndex = 0;
let score = 0;
let completedWords: string[] = [];
let allWords: string[] = [];
let sessionWords: string[] = [];
let congratsOverlay: HTMLElement | null = null;
let congratsConfettiInterval: number | null = null;
let currentWordIndex = 0;

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

// Add a category display element below the word container
let categoryElement = document.getElementById('category-display') as HTMLElement;
if (!categoryElement) {
    categoryElement = document.createElement('div');
    categoryElement.id = 'category-display';
    categoryElement.style.textAlign = 'center';
    categoryElement.style.fontSize = '1.25rem';
    categoryElement.style.fontWeight = '500';
    categoryElement.style.marginTop = '16px';
    wordContainer.parentNode?.insertBefore(categoryElement, wordContainer.nextSibling);
}

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
    congratsOverlay = document.getElementById('congrats-overlay');
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

// Update state in localStorage
function saveGameState() {
    LocalStorageManager.setState({
        score,
        completedWords,
        sessionWords,
        allWords,
        currentWordIndex,
    });
}

// Restore state from localStorage if present
function restoreGameState() {
    const state = LocalStorageManager.getState();
    if (state) {
        score = state.score;
        completedWords = state.completedWords;
        sessionWords = state.sessionWords;
        allWords = state.allWords;
        currentWordIndex = state.currentWordIndex ?? 0;
        updateScore();
        updateCompletedWordsList();
        return true;
    }
    return false;
}

// Start the game
async function startGame() {
    console.log('startGame called!');
    startScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    if (!restoreGameState()) {
        score = 0;
        updateScore();
        completedWords = [];
        updateCompletedWordsList();
        const categories = await window.DatabaseManager.getCategories();
        allWords = [];
        for (const category of categories) {
            const categoryWords = await window.DatabaseManager.getWordsByCategory(category);
            allWords.push(...categoryWords);
        }
        sessionWords = shuffleArray([...allWords]);
        currentWordIndex = 0;
    }
    saveGameState();
    loadNewWord();
}

// Helper to update the category display
async function updateCategoryDisplay(word: string) {
    if (!word) {
        categoryElement.textContent = '';
        return;
    }
    // Use a new public method to get the category
    if (window.DatabaseManager.getCategoryForWord) {
        const category = await window.DatabaseManager.getCategoryForWord(word);
        let label = category || '';
        categoryElement.textContent = label;
    } else {
        categoryElement.textContent = '';
    }
}

// Update loadNewWord to also update the category display
// Load a new word
async function loadNewWord() {
    if (currentWordIndex >= sessionWords.length) {
        showCongratsOverlay();
        return;
    }
    currentWord = sessionWords[currentWordIndex];
    setupLetterSlots();
    AudioManager.playWord(currentWord);
    saveGameState();
    await updateCategoryDisplay(currentWord);
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
    saveGameState();
    
    // Play correct sound and show confetti
    AudioManager.speakFeedback('Correct!');
    createConfetti();
    
    // Move dolphin up
    dolphinContainer.classList.remove('translate-y-full');
    
    // If that was the last word, play final message and show congrats overlay
    if (currentWordIndex + 1 >= sessionWords.length) {
        // Clear letter slots
        wordContainer.innerHTML = '';
        // Hide result message
        resultMessage.textContent = '';
        // Hide dolphin
        dolphinContainer.classList.add('translate-y-full');
        // Play final congratulatory message, then show overlay
        setTimeout(async () => {
            await AudioManager.speakFeedback("You spelled all your spelling words correctly! You're a star!");
            showCongratsOverlay();
        }, 1200); // Give a short delay for the last confetti and sound
        return;
    }
    
    // Wait before loading next word
    setTimeout(() => {
        resultMessage.textContent = '';
        dolphinContainer.classList.add('translate-y-full');
        currentWordIndex++;
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
    saveGameState();
}

// Update score display
function updateScore() {
    scoreElement.textContent = score.toString();
}

// Create confetti animation
function createConfetti(continuous = false) {
    confettiContainer.classList.remove('hidden');
    // Only clear if not continuous
    if (!continuous) confettiContainer.innerHTML = '';
    const colors = ['#FFD700', '#FF69B4', '#00BFFF', '#98FB98', '#FFA07A'];
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        const startX = Math.random() * window.innerWidth;
        const startY = -20;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.random() * 10 + 5;
        const isCircle = Math.random() > 0.5;
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
        confetti.addEventListener('animationend', () => {
            confetti.remove();
            if (!continuous && confettiContainer.children.length === 0) {
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

function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function showCongratsOverlay() {
    if (!congratsOverlay) return;
    congratsOverlay.classList.remove('hidden');
    // Fill overlay with dolphins
    const dolphinsHtml = Array.from({length: 20}).map(() => `<img src='assets/images/dolphin.png' class='w-32 h-32 m-2 inline-block' style='image-rendering: pixelated;'>`).join('');
    congratsOverlay.innerHTML = `
        <div class='flex flex-col items-center justify-center h-full'>
            <h1 class='text-7xl font-bold text-pink-600 mb-8 pixel-text drop-shadow-lg'>CONGRATS!!!</h1>
            <div class='flex flex-wrap justify-center'>${dolphinsHtml}</div>
            <p class='mt-8 text-2xl text-blue-700 font-bold'>You spelled all the words!</p>
            <button id="play-again-btn" class="mt-8 px-8 py-4 bg-pink-500 hover:bg-pink-600 text-white text-2xl font-bold rounded shadow-lg transition">Play again?</button>
        </div>
    `;
    // Start continuous confetti
    if (congratsConfettiInterval) clearInterval(congratsConfettiInterval);
    congratsConfettiInterval = window.setInterval(() => {
        createConfetti(true);
    }, 500);
    // Add event listener to the button
    const playAgainBtn = document.getElementById('play-again-btn');
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', resetGameFromCongrats, { once: true });
    }
}

function hideCongratsOverlay() {
    if (!congratsOverlay) return;
    congratsOverlay.classList.add('hidden');
    congratsOverlay.innerHTML = '';
    if (congratsConfettiInterval) {
        clearInterval(congratsConfettiInterval);
        congratsConfettiInterval = null;
    }
}

function resetGameFromCongrats() {
    hideCongratsOverlay();
    LocalStorageManager.clearState();
    startGame();
}

// --- Floating Settings Button and Menu ---
function createFloatingSettingsMenu() {
    // Only create once
    if (document.getElementById('floating-settings-btn')) return;

    // Floating button
    const btn = document.createElement('button');
    btn.id = 'floating-settings-btn';
    btn.innerHTML = '<svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-1.14 1.952-1.14 2.252 0a1.724 1.724 0 002.573 1.01c.987-.57 2.18.623 1.61 1.61a1.724 1.724 0 001.01 2.573c1.14.3 1.14 1.952 0 2.252a1.724 1.724 0 00-1.01 2.573c.57.987-.623 2.18-1.61 1.61a1.724 1.724 0 00-2.573 1.01c-.3 1.14-1.952 1.14-2.252 0a1.724 1.724 0 00-2.573-1.01c-.987.57-2.18-.623-1.61-1.61a1.724 1.724 0 00-1.01-2.573c-1.14-.3-1.14-1.952 0-2.252a1.724 1.724 0 001.01-2.573c-.57-.987.623-2.18 1.61-1.61.987.57 2.18-.623 1.61-1.61z"/><circle cx="12" cy="12" r="3"/></svg>';
    btn.style.position = 'fixed';
    btn.style.bottom = '32px';
    btn.style.right = '32px';
    btn.style.zIndex = '10000';
    btn.style.background = '#fff';
    btn.style.border = 'none';
    btn.style.borderRadius = '50%';
    btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    btn.style.width = '56px';
    btn.style.height = '56px';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.cursor = 'pointer';
    btn.style.transition = 'background 0.2s';
    btn.onmouseenter = () => btn.style.background = '#f3f4f6';
    btn.onmouseleave = () => btn.style.background = '#fff';

    // Menu
    const menu = document.createElement('div');
    menu.id = 'floating-settings-menu';
    menu.style.position = 'fixed';
    menu.style.bottom = '100px';
    menu.style.right = '32px';
    menu.style.zIndex = '10001';
    menu.style.background = '#fff';
    menu.style.borderRadius = '1rem';
    menu.style.boxShadow = '0 2px 16px rgba(0,0,0,0.18)';
    menu.style.padding = '24px 32px';
    menu.style.display = 'none';
    menu.style.flexDirection = 'column';
    menu.style.alignItems = 'center';
    menu.style.gap = '16px';

    // Play again button
    const playAgainBtn = document.createElement('button');
    playAgainBtn.id = 'floating-play-again-btn';
    playAgainBtn.textContent = 'Play again?';
    playAgainBtn.style.background = '#ec4899';
    playAgainBtn.style.color = '#fff';
    playAgainBtn.style.fontSize = '1.5rem';
    playAgainBtn.style.fontWeight = 'bold';
    playAgainBtn.style.padding = '12px 32px';
    playAgainBtn.style.border = 'none';
    playAgainBtn.style.borderRadius = '0.5rem';
    playAgainBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)';
    playAgainBtn.style.cursor = 'pointer';
    playAgainBtn.style.transition = 'background 0.2s';
    playAgainBtn.onmouseenter = () => playAgainBtn.style.background = '#be185d';
    playAgainBtn.onmouseleave = () => playAgainBtn.style.background = '#ec4899';
    playAgainBtn.onclick = resetGameFromCongrats;

    menu.appendChild(playAgainBtn);
    document.body.appendChild(btn);
    document.body.appendChild(menu);

    // Toggle menu
    btn.onclick = () => {
        menu.style.display = menu.style.display === 'none' ? 'flex' : 'none';
    };
    // Hide menu when clicking outside
    document.addEventListener('mousedown', (e) => {
        if (!menu.contains(e.target as Node) && !btn.contains(e.target as Node)) {
            menu.style.display = 'none';
        }
    });
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    initGame();
    updateCompletedWordsList();
    createFloatingSettingsMenu();

    // If there is a saved game, resume it immediately
    if (LocalStorageManager.getState()) {
        startScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        restoreGameState();
        // If a word is in progress, show it
        if (currentWordIndex < sessionWords.length) {
            currentWord = sessionWords[currentWordIndex];
            setupLetterSlots();
            AudioManager.playWord(currentWord);
            saveGameState();
            await updateCategoryDisplay(currentWord);
        } else {
            showCongratsOverlay();
        }
    }
}); 