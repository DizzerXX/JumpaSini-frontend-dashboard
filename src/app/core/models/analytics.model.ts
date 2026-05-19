export interface AnalyticsOverview {
  totalSessions: number;
  activeSessions: number;
  completedSessions: number;
  totalParticipants: number;
  avgParticipantsPerSession: number;
  totalVenueSearches: number;
  totalHalalReports: number;
  popularVenueTypes: { type: string; count: number }[];
  popularAreas: { area: string; count: number }[];
  sessionsToday: number;
  sessionsThisWeek: number;
}
