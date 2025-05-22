export interface GameState {
    score: number;
    completedWords: string[];
    sessionWords: string[];
    allWords: string[];
    currentWordIndex: number;
}

const STORAGE_KEY = 'spellingGameState';

class LocalStorageManager {
    static getState(): GameState | null {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return null;
        try {
            return JSON.parse(data) as GameState;
        } catch {
            return null;
        }
    }

    static setState(state: GameState) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    static clearState() {
        localStorage.removeItem(STORAGE_KEY);
    }
}

export default LocalStorageManager; 