/**
 * Sound effects and vibration utilities
 */

// Create audio context for generating beep sounds
const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

/**
 * Play a beep sound using Web Audio API
 * @param frequency - Frequency in Hz (default: 800)
 * @param duration - Duration in milliseconds (default: 200)
 * @param volume - Volume (0-1, default: 0.3)
 */
export function playBeep(frequency = 800, duration = 200, volume = 0.3) {
  if (!audioContext) return;

  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
  } catch (error) {
    console.log('Beep sound not supported:', error);
  }
}

/**
 * Play popup/alert sound (lower pitch, longer)
 */
export function playPopupSound() {
  playBeep(600, 300, 0.25);
}

/**
 * Play button click sound (higher pitch, short)
 */
export function playClickSound() {
  playBeep(1000, 100, 0.2);
}

/**
 * Play warning/scare sound (descending pitch)
 */
export function playWarnSound() {
  if (!audioContext) return;

  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';

    // Descending pitch effect
    oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.4);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.4);
  } catch (error) {
    console.log('Warn sound not supported:', error);
  }
}

/**
 * Trigger vibration on mobile devices
 * @param pattern - Vibration pattern in milliseconds
 */
export function vibrate(pattern: number | number[] = 200) {
  if (typeof window !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.log('Vibration not supported:', error);
    }
  }
}

/**
 * Short vibration + click sound (for button clicks)
 */
export function triggerClickFeedback() {
  playClickSound();
  vibrate(50); // 50ms vibration
}

/**
 * Longer vibration + popup sound (for alerts/popups)
 */
export function triggerAlertFeedback() {
  playPopupSound();
  vibrate([100, 50, 100]); // Pattern: vibrate 100ms, pause 50ms, vibrate 100ms
}

/**
 * Warning feedback (scare sound + strong vibration)
 */
export function triggerWarnFeedback() {
  playWarnSound();
  vibrate([200, 100, 200, 100, 200]); // Repeating pattern
}
