// Audio management for the spelling game
class AudioManager {
    // ElevenLabs API configuration
    private get apiKey(): string {
        // @ts-ignore
        const key = (window as any).ELEVENLABS_API_KEY;
        if (!key) {
            throw new Error('ElevenLabs API key is not set.');
        }
        return key;
    }
    private voiceId: string = 'JBFqnCBsd6RMkjVDRZzb';
    private modelId: string = 'eleven_multilingual_v2';
    
    // Voice settings
    private voiceSettings = {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true
    };

    // Play a sound effect using ElevenLabs
    async playSound(soundName: string): Promise<void> {
        let text: string;
        switch(soundName) {
            case 'correct':
                text = 'Correct!';
                break;
            case 'wrong':
                text = 'Try again!';
                break;
            case 'success':
                text = 'Great job!';
                break;
            default:
                return;
        }
        
        try {
            await this.playWord(text);
        } catch (error) {
            console.warn('Audio playback failed:', error);
        }
    }
    
    // Play word pronunciation
    async playWord(word: string): Promise<void> {
        try {
            const audio = await this.textToSpeech(word);
            const audioUrl = URL.createObjectURL(audio);
            
            // Create and configure audio element
            const audioElement = new Audio();
            
            // Set up event listeners
            const playPromise = new Promise<void>((resolve, reject) => {
                audioElement.addEventListener('canplaythrough', () => resolve(), { once: true });
                audioElement.addEventListener('error', (e) => reject(e), { once: true });
            });
            
            // Set source and load
            audioElement.src = audioUrl;
            audioElement.load();
            
            // Wait for audio to be ready
            await playPromise;
            
            // Play the audio
            await audioElement.play();
            
            // Clean up
            audioElement.addEventListener('ended', () => {
                URL.revokeObjectURL(audioUrl);
            });
        } catch (error) {
            console.error('Error playing word:', error);
            throw error;
        }
    }
    
    // Convert text to speech using ElevenLabs API
    private async textToSpeech(text: string): Promise<Blob> {
        try {
            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`, {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': this.apiKey
                },
                body: JSON.stringify({
                    text: text,
                    model_id: this.modelId,
                    voice_settings: this.voiceSettings
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            return new Blob([arrayBuffer], { type: 'audio/mpeg' });
        } catch (error) {
            console.error('ElevenLabs API error:', error);
            throw error;
        }
    }

    // Speak feedback using ElevenLabs API
    async speakFeedback(text: string): Promise<void> {
        try {
            await this.playWord(text);
        } catch (error) {
            console.error('Error speaking feedback:', error);
        }
    }
}

export default new AudioManager(); 