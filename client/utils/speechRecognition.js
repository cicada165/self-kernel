/**
 * Speech Recognition Utility
 *
 * Wrapper around Web Speech API for voice input.
 * Works in Chrome, Safari, and Edge.
 */

class SpeechRecognitionManager {
  constructor() {
    // Check for Web Speech API support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Web Speech API not supported in this browser');
      this.supported = false;
      return;
    }

    this.supported = true;
    this.recognition = new SpeechRecognition();
    this.isListening = false;
    this.transcript = '';

    // Configure recognition
    this.recognition.continuous = false; // Stop after one result
    this.recognition.interimResults = true; // Show interim results
    this.recognition.maxAlternatives = 1;

    // Default to English, can be changed
    this.recognition.lang = 'en-US';

    // Event handlers (to be overridden)
    this.onStart = () => {};
    this.onResult = (transcript, isFinal) => {};
    this.onEnd = () => {};
    this.onError = (error) => {};

    this.setupEventListeners();
  }

  /**
   * Setup event listeners for speech recognition
   */
  setupEventListeners() {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.transcript = '';
      this.onStart();
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        this.transcript = finalTranscript;
        this.onResult(finalTranscript, true);
      } else if (interimTranscript) {
        this.onResult(interimTranscript, false);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onEnd();
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;

      let errorMessage = 'Unknown error';
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone found or permission denied.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied.';
          break;
        case 'network':
          errorMessage = 'Network error occurred.';
          break;
        case 'aborted':
          errorMessage = 'Speech recognition aborted.';
          break;
        default:
          errorMessage = `Error: ${event.error}`;
      }

      this.onError(errorMessage);
    };
  }

  /**
   * Start listening for speech
   */
  start() {
    if (!this.supported) {
      this.onError('Speech recognition not supported in this browser');
      return false;
    }

    if (this.isListening) {
      console.warn('Already listening');
      return false;
    }

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      this.onError(error.message);
      return false;
    }
  }

  /**
   * Stop listening
   */
  stop() {
    if (!this.recognition || !this.isListening) return;

    try {
      this.recognition.stop();
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  }

  /**
   * Abort listening immediately
   */
  abort() {
    if (!this.recognition) return;

    try {
      this.recognition.abort();
      this.isListening = false;
    } catch (error) {
      console.error('Error aborting speech recognition:', error);
    }
  }

  /**
   * Set language for recognition
   */
  setLanguage(lang) {
    if (!this.recognition) return;

    const supportedLanguages = [
      'en-US', 'en-GB', 'en-AU', 'en-CA', 'en-IN',
      'es-ES', 'es-MX', 'fr-FR', 'de-DE', 'it-IT',
      'pt-BR', 'pt-PT', 'ru-RU', 'ja-JP', 'ko-KR',
      'zh-CN', 'zh-TW', 'ar-SA', 'nl-NL', 'pl-PL'
    ];

    if (supportedLanguages.includes(lang)) {
      this.recognition.lang = lang;
    } else {
      console.warn(`Language ${lang} not in supported list, but attempting anyway`);
      this.recognition.lang = lang;
    }
  }

  /**
   * Get current transcript
   */
  getTranscript() {
    return this.transcript;
  }

  /**
   * Check if speech recognition is supported
   */
  isSupported() {
    return this.supported;
  }
}

export default SpeechRecognitionManager;
