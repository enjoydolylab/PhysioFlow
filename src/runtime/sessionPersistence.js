// Cleanup failure must not turn a successfully persisted session into a save failure.
export async function persistFinishedSession(session, { saveSession, clearCurrentRun }) {
  await saveSession(session);
  try {
    await clearCurrentRun();
    return { cleanupError: '' };
  } catch (error) {
    return { cleanupError: error.message || String(error) };
  }
}
