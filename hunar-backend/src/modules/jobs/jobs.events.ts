// Realtime (Socket.IO) event names for the worker-side marketplace (Shafqat Ullah's modules).
// Namespace: '/' (general job + offer updates).

export const JOB_EVENTS = {
  jobNew: 'job:new',
  jobOffer: 'job:offer',
  jobOfferAccepted: 'job:offer:accepted',
  jobClosed: 'job:closed',
  jobStatusChanged: 'job:status:changed',
  jobCancelled: 'job:cancelled',
} as const;

export const LOCATION_EVENTS = {
  locationUpdate: 'location:update',
  locationWorker: 'location:worker',
  locationTrackStart: 'location:track:start',
  locationTrackStop: 'location:track:stop',
} as const;

export const ROOM_PREFIX = {
  user: 'user:',
  job: 'job:',
} as const;

export function userRoom(userId: string): string {
  return `${ROOM_PREFIX.user}${userId}`;
}

export function jobRoom(jobId: string): string {
  return `${ROOM_PREFIX.job}${jobId}`;
}
