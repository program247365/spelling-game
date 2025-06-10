// Initialize SQL.js
const initSqlJs = (window as any).initSqlJs;

// Database management for the spelling game
class DatabaseManager {
    private db: any;
    private initialized: boolean = false;

    constructor() {
        this.initDatabase();
    }

    // Initialize the database
    private async initDatabase() {
        try {
            const SQL = await initSqlJs({
                locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/${file}`
            });

            // Create a new database
            this.db = new SQL.Database();

            // Create tables
            this.createTables();

            // Add some initial words if the database is empty
            await this.addInitialWords();

            this.initialized = true;
            console.log('Database initialized successfully');
        } catch (error) {
            console.error('Error initializing database:', error);
        }
    }

    // Create necessary tables
    private createTables() {
        // Words table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS words (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                word TEXT NOT NULL,
                category TEXT NOT NULL,
                difficulty INTEGER NOT NULL
            )
        `);

        // Used words table to track which words have been used
        this.db.run(`
            CREATE TABLE IF NOT EXISTS used_words (
                word_id INTEGER PRIMARY KEY,
                last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (word_id) REFERENCES words(id)
            )
        `);
    }

    // Add initial words to the database
    private async addInitialWords() {
        const words: { word: string; category: string; difficulty?: number }[] = [
            { word: 'spider', category: 'regular', difficulty: 1 },
            { word: 'water', category: 'regular', difficulty: 1 },
            { word: 'wanted', category: 'regular', difficulty: 1 },
            { word: 'bottles', category: 'regular', difficulty: 1 },
            { word: 'butter', category: 'regular', difficulty: 1 },
            { word: 'middle', category: 'regular', difficulty: 1 },
            { word: 'littlest', category: 'regular', difficulty: 1 },
            { word: 'paddle', category: 'regular', difficulty: 1 },
            { word: 'hurting', category: 'regular', difficulty: 1 },
            { word: 'pudding', category: 'regular', difficulty: 1 },
            { word: 'cattle', category: 'regular', difficulty: 1 },
            { word: 'handle', category: 'regular', difficulty: 1 },
            { word: 'letter', category: 'regular', difficulty: 1 },
            { word: 'ladder', category: 'regular', difficulty: 1 },
            { word: 'bitter', category: 'regular', difficulty: 1 },
            { word: 'cardboard', category: 'review', difficulty: 1 },
            { word: 'ladybug', category: 'review', difficulty: 1 },
            { word: 'quicksand', category: 'review', difficulty: 1 },
            { word: 'bandage', category: 'challenge', difficulty: 1 },
            { word: 'tasted', category: 'challenge', difficulty: 1 }
        ];

        const stmt = this.db.prepare(`
            INSERT OR IGNORE INTO words (word, category, difficulty)
            VALUES (?, ?, ?)
        `);

        words.forEach(({ word, category, difficulty }) => {
            stmt.run([word.toUpperCase(), category, difficulty ?? 1]);
        });

        stmt.free();
    }

    // Get a random word that hasn't been used recently
    async getRandomWord(): Promise<string | null> {
        if (!this.initialized) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return this.getRandomWord();
        }

        try {
            // Get a random word that hasn't been used in the last 5 words
            const result = this.db.exec(`
                SELECT w.word
                FROM words w
                LEFT JOIN used_words uw ON w.id = uw.word_id
                WHERE uw.word_id IS NULL
                OR uw.last_used < datetime('now', '-5 minutes')
                ORDER BY RANDOM()
                LIMIT 1
            `);

            if (result.length === 0 || result[0].values.length === 0) {
                return null;
            }

            const word = result[0].values[0][0];

            // Mark the word as used
            this.db.run(`
                INSERT OR REPLACE INTO used_words (word_id, last_used)
                SELECT id, CURRENT_TIMESTAMP
                FROM words
                WHERE word = ?
            `, [word]);

            return word;
        } catch (error) {
            console.error('Error getting random word:', error);
            return null;
        }
    }

    // Add a new word to the database
    async addWord(word: string, category: string, difficulty: number): Promise<boolean> {
        if (!this.initialized) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return this.addWord(word, category, difficulty);
        }

        try {
            this.db.run(`
                INSERT INTO words (word, category, difficulty)
                VALUES (?, ?, ?)
            `, [word.toUpperCase(), category, difficulty]);
            return true;
        } catch (error) {
            console.error('Error adding word:', error);
            return false;
        }
    }

    // Get all words in a category
    async getWordsByCategory(category: string): Promise<string[]> {
        if (!this.initialized) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return this.getWordsByCategory(category);
        }

        try {
            const result = this.db.exec(`
                SELECT word
                FROM words
                WHERE category = ?
                ORDER BY word
            `, [category]);

            if (result.length === 0) {
                return [];
            }

            return result[0].values.map((row: any[]) => row[0]);
        } catch (error) {
            console.error('Error getting words by category:', error);
            return [];
        }
    }

    // Get all available categories
    async getCategories(): Promise<string[]> {
        if (!this.initialized) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return this.getCategories();
        }

        try {
            const result = this.db.exec(`
                SELECT DISTINCT category
                FROM words
                ORDER BY category
            `);

            if (result.length === 0) {
                return [];
            }

            return result[0].values.map((row: any[]) => row[0]);
        } catch (error) {
            console.error('Error getting categories:', error);
            return [];
        }
    }

    // Get the category for a given word
    async getCategoryForWord(word: string): Promise<string | null> {
        if (!this.initialized) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return this.getCategoryForWord(word);
        }
        try {
            const result = this.db.exec(
                `SELECT category FROM words WHERE word = ?`, [word.toUpperCase()]
            );
            if (result.length > 0 && result[0].values.length > 0) {
                return result[0].values[0][0];
            }
            return null;
        } catch (error) {
            console.error('Error getting category for word:', error);
            return null;
        }
    }
}

// Create and export a singleton instance
const databaseManager = new DatabaseManager();
export default databaseManager;

// Add to window for global access
declare global {
    interface Window {
        DatabaseManager: DatabaseManager;
    }
}
window.DatabaseManager = databaseManager;
// Attach getCategoryForWord to the instance for global access
window.DatabaseManager.getCategoryForWord = databaseManager.getCategoryForWord.bind(databaseManager); 