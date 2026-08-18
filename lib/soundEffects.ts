/**
 * Sound effects and vibration utilities with continuous playback
 */

// Create audio context for generating beep sounds
let audioContext: (AudioContext | null) = null;
let oscillatorRef: OscillatorNode | null = null;
let gainNodeRef: GainNode | null = null;
let vibrateIntervalRef: NodeJS.Timeout | null = null;

function getAudioContext() {
  if (!audioContext && typeof window !== 'undefined') {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      // Resume audio context if suspended
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
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
 * Start continuous beep sound (bypass system volume)
 * @param frequency - Frequency in Hz
 * @param volume - Volume (0-1, use high value like 0.8-1.0)
 */
export function startContinuousBeep(frequency = 600, volume = 0.9) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    // Stop any existing oscillator
    stopContinuousBeep();

    oscillatorRef = ctx.createOscillator();
    gainNodeRef = ctx.createGain();

    oscillatorRef.connect(gainNodeRef);
    gainNodeRef.connect(ctx.destination);

    oscillatorRef.frequency.value = frequency;
    oscillatorRef.type = 'sine';

    // Set to FULL volume - bypasses system volume
    gainNodeRef.gain.setValueAtTime(volume, ctx.currentTime);

    oscillatorRef.start();
    console.log('Continuous beep started at', volume, 'volume');
  } catch (error) {
    console.log('Continuous beep error:', error);
  }
}

/**
 * Stop continuous beep sound
 */
export function stopContinuousBeep() {
  try {
    if (oscillatorRef) {
      oscillatorRef.stop();
      oscillatorRef = null;
    }
    if (gainNodeRef) {
      gainNodeRef = null;
    }
    console.log('Continuous beep stopped');
  } catch (error) {
    console.log('Error stopping beep:', error);
  }
}

/**
 * Start continuous vibration pattern
 * @param pattern - Array of vibration durations
 */
export function startContinuousVibration(pattern: number[] = [200, 100]) {
  // Stop existing vibration
  stopContinuousVibration();

  if (typeof window !== 'undefined' && navigator.vibrate) {
    let index = 0;
    vibrateIntervalRef = setInterval(() => {
      try {
        navigator.vibrate(pattern[index % pattern.length]);
        index++;
        console.log('Vibration triggered:', pattern[index % pattern.length]);
      } catch (error) {
        console.log('Vibration error:', error);
      }
    }, pattern.reduce((a, b) => a + b, 0)); // Repeat pattern duration
  } else {
    console.log('Vibration API not available');
  }
}

/**
 * Stop continuous vibration
 */
export function stopContinuousVibration() {
  if (vibrateIntervalRef) {
    clearInterval(vibrateIntervalRef);
    vibrateIntervalRef = null;
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(0); // Stop any ongoing vibration
    }
    console.log('Continuous vibration stopped');
  }
}

/**
 * Play popup/alert sound (lower pitch, longer) - LOUD
 */
export function playPopupSound() {
  playBeep(600, 400, 0.8);
}

/**
 * Play button click sound (higher pitch, short)
 */
export function playClickSound() {
  playBeep(1000, 120, 0.6);
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

    gainNode.gain.setValueAtTime(0.9, ctx.currentTime);
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
  vibrate(80);
}

/**
 * Longer vibration + popup sound (for alerts/popups)
 */
export function triggerAlertFeedback() {
  playPopupSound();
  vibrate([150, 75, 150]);
}

/**
 * Warning feedback (scare sound + strong vibration)
 */
export function triggerWarnFeedback() {
  playWarnSound();
  vibrate([300, 150, 300, 150, 300]);
}

/**
 * Start continuous alert feedback (for popups that stay open)
 * Plays continuous beep + vibration until stopped
 */
export function startContinuousAlertFeedback() {
  console.log('Starting continuous alert feedback...');
  startContinuousBeep(600, 0.95); // Very loud alert sound
  startContinuousVibration([200, 100, 200, 100]); // Repeating vibration pattern
}

/**
 * Stop continuous alert feedback
 */
export function stopContinuousAlertFeedback() {
  console.log('Stopping continuous alert feedback...');
  stopContinuousBeep();
  stopContinuousVibration();
}
