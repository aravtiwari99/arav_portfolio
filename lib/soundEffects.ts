/**
 * Sound effects and vibration utilities
 */

// Create audio context for generating beep sounds
let audioContext: (AudioContext | null) = null;

function getAudioContext() {
  if (!audioContext && typeof window !== 'undefined') {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.log('AudioContext not available:', error);
    }
  }
  return audioContext;
}

/**
 * Play a beep sound using Web Audio API
 * @param frequency - Frequency in Hz (default: 800)
 * @param duration - Duration in milliseconds (default: 200)
 * @param volume - Volume (0-1, default: 0.5)
 */
export function playBeep(frequency = 800, duration = 200, volume = 0.5) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration / 1000);
  } catch (error) {
    console.log('Beep sound error:', error);
  }
}

/**
 * Play popup/alert sound (lower pitch, longer) - LOUD
 */
export function playPopupSound() {
  playBeep(600, 400, 0.6); // Increased volume to 0.6
}

/**
 * Play button click sound (higher pitch, short)
 */
export function playClickSound() {
  playBeep(1000, 120, 0.4); // Increased volume to 0.4
}

/**
 * Play warning/scare sound (descending pitch) - VERY LOUD
 */
export function playWarnSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';

    // Descending pitch effect
    oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.4);

    gainNode.gain.setValueAtTime(0.7, ctx.currentTime); // Increased to 0.7
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);
  } catch (error) {
    console.log('Warn sound error:', error);
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
      console.log('Vibration triggered:', pattern);
    } catch (error) {
      console.log('Vibration error:', error);
    }
  } else {
    console.log('Vibration API not available');
  }
}

/**
 * Short vibration + click sound (for button clicks)
 */
export function triggerClickFeedback() {
  playClickSound();
  vibrate(80); // Increased to 80ms vibration
}

/**
 * Longer vibration + popup sound (for alerts/popups)
 */
export function triggerAlertFeedback() {
  playPopupSound();
  vibrate([150, 75, 150]); // Longer vibration pattern
}

/**
 * Warning feedback (scare sound + strong vibration)
 */
export function triggerWarnFeedback() {
  playWarnSound();
  vibrate([300, 150, 300, 150, 300]); // Much stronger vibration pattern
}
