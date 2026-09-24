export const isReviewableSession = session => ['completed', 'aborted', 'failed'].includes(session?.status);
