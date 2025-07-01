import { openDB } from 'idb';

const DB_NAME = 'vidyai-offline';
const DB_VERSION = 1;

export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Store for pending submissions when offline
      if (!db.objectStoreNames.contains('pending-submissions')) {
        db.createObjectStore('pending-submissions', { keyPath: 'id', autoIncrement: true });
      }

      // Store for cached feedback
      if (!db.objectStoreNames.contains('feedback-cache')) {
        db.createObjectStore('feedback-cache', { keyPath: 'submissionId' });
      }

      // Store for user preferences
      if (!db.objectStoreNames.contains('preferences')) {
        db.createObjectStore('preferences', { keyPath: 'userId' });
      }

      // Store for offline audio feedback
      if (!db.objectStoreNames.contains('audio-cache')) {
        db.createObjectStore('audio-cache', { keyPath: 'id' });
      }
    }
  });
}

// Submission related operations
export async function savePendingSubmission(submission) {
  const db = await initDB();
  return db.add('pending-submissions', {
    ...submission,
    timestamp: new Date().toISOString()
  });
}

export async function getPendingSubmissions() {
  const db = await initDB();
  return db.getAll('pending-submissions');
}

export async function deletePendingSubmission(id) {
  const db = await initDB();
  return db.delete('pending-submissions', id);
}

// Feedback cache operations
export async function cacheFeedback(feedback) {
  const db = await initDB();
  return db.put('feedback-cache', feedback);
}

export async function getCachedFeedback(submissionId) {
  const db = await initDB();
  return db.get('feedback-cache', submissionId);
}

export async function clearOldFeedbackCache() {
  const db = await initDB();
  const now = new Date();
  const allFeedback = await db.getAll('feedback-cache');
  
  for (const feedback of allFeedback) {
    const feedbackDate = new Date(feedback.timestamp);
    // Clear feedback older than 7 days
    if (now - feedbackDate > 7 * 24 * 60 * 60 * 1000) {
      await db.delete('feedback-cache', feedback.submissionId);
    }
  }
}

// User preferences operations
export async function savePreferences(preferences) {
  const db = await initDB();
  return db.put('preferences', preferences);
}

export async function getPreferences(userId) {
  const db = await initDB();
  return db.get('preferences', userId);
}

// Audio cache operations
export async function cacheAudioFeedback(audioData) {
  const db = await initDB();
  return db.put('audio-cache', {
    ...audioData,
    timestamp: new Date().toISOString()
  });
}

export async function getCachedAudio(id) {
  const db = await initDB();
  return db.get('audio-cache', id);
}

export async function clearOldAudioCache() {
  const db = await initDB();
  const now = new Date();
  const allAudio = await db.getAll('audio-cache');
  
  for (const audio of allAudio) {
    const audioDate = new Date(audio.timestamp);
    // Clear audio older than 3 days
    if (now - audioDate > 3 * 24 * 60 * 60 * 1000) {
      await db.delete('audio-cache', audio.id);
    }
  }
}

// Network status check
export function isOnline() {
  return navigator.onLine;
}

// Register network status listeners
export function registerNetworkListeners(onOnline, onOffline) {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}

// Periodic cache cleanup
export async function cleanupCaches() {
  await Promise.all([
    clearOldFeedbackCache(),
    clearOldAudioCache()
  ]);
}

// Initialize cleanup interval
export function initCacheCleanup() {
  // Run cleanup every 24 hours
  setInterval(cleanupCaches, 24 * 60 * 60 * 1000);
  
  // Run initial cleanup
  cleanupCaches();
}