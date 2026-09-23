export const SOCKET_EVENTS = {
  jobNew: "job:new",
  jobOffer: "job:offer",
  jobOfferAccepted: "job:offer:accepted",
  jobClosed: "job:closed",
  jobStatusChanged: "job:status:changed",
  jobCancelled: "job:cancelled",
  locationUpdate: "location:update",
  locationTrackStart: "location:track:start",
  locationTrackStop: "location:track:stop",
  chatMessage: "chat:message",
  chatRead: "chat:read",
  notification: "notification:new",
  negotiationOffer: "negotiation:offer",
  negotiationAccepted: "negotiation:accepted",
} as const;

export const SOCKET_ROOMS = {
  user: (userId: string) => `user:${userId}`,
  job: (jobId: string) => `job:${jobId}`,
} as const;

export const CHAT_EVENT = {
  join: "chat:join",
  leave: "chat:leave",
  send: "chat:send",
  receive: "chat:message",
  read: "chat:read",
} as const;

export const NOTIFICATION_EVENT = {
  receive: "notification:new",
} as const;