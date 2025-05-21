# Spelling Game

Welcome to the 8-bit Spelling Game! Test your spelling skills in this fun, retro-styled educational game.

## How to Play

1. Click "START" to begin the game
2. Click the "🔊 Hear Word" button to hear the word you need to spell
3. Type the letters on your keyboard to spell the word
4. For each correct letter:
   - The letter appears in its slot
   - A happy dolphin animation plays
5. For incorrect letters:
   - A "Wrong Letter" message appears
   - The letter is not added
6. Complete the word correctly to:
   - Hear a success message
   - See celebratory confetti
   - Add points to your score
7. Keep playing to improve your score!

![Spelling Game Screenshot](docs/images/screenshot.png)
*Screenshot: Spelling Game in action!*

## Requirements
- Node.js
- npm
- ElevenLabs API Key (for text-to-speech) - Get one at [ElevenLabs](https://elevenlabs.io)

## Setup
1. Install dependencies:
   ```sh
   make setup
   ```
2. Build the project:
   ```sh
   make build
   ```

## Running the Game
You **must** provide your ElevenLabs API key to run the game. Use the `ELEVENLABS_API_KEY` environment variable:

```sh
ELEVENLABS_API_KEY=your_key_here make run
```

**Note:**  
Replace `your_key_here` (or `dummykey`) with your actual ElevenLabs API key.  
You can obtain a free API key by signing up at [https://elevenlabs.io](https://elevenlabs.io).

This will start a local server at [http://localhost:8000](http://localhost:8000).

## Development
To start the dev server with live reload (rebuild on changes):

```sh
ELEVENLABS_API_KEY=your_key_here make dev
```

## Technical Overview

- **SQLite in the Browser:** The app uses [sql.js](https://github.com/sql-js/sql.js), a JavaScript/WebAssembly port of SQLite, to manage the word list and categories entirely in the browser. This allows for fast, persistent, and flexible word storage and retrieval without a backend server.
- **ElevenLabs API for Text-to-Speech:** All word pronunciations and feedback are generated in real time using the [ElevenLabs](https://elevenlabs.io) API. The API key is injected at runtime for security, and the app sends requests to ElevenLabs to generate natural-sounding speech for each word or feedback phrase.
- **Audio Playback:** The app dynamically creates audio elements to play the ElevenLabs-generated speech. It manages playback state, feedback, and error handling, and provides visual indicators when audio is playing.
- **TypeScript & ES Modules:** The codebase is written in TypeScript for type safety and maintainability, and uses modern ES module imports/exports for clean structure and browser compatibility.

## Notes
- The API key is injected at runtime and never hardcoded in the source code.
- If you do not provide the API key, the server will not start.

## License

This project is licensed under the [MIT License](LICENSE).