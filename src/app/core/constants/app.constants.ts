export const MAX_PARTICIPANTS = 6;
export const MIN_PARTICIPANTS = 1;

export const KL_SELANGOR_BOUNDS = {
  lat: { min: 2.6, max: 3.9 },
  lng: { min: 101.2, max: 102.0 },
} as const;

export const APP_STRINGS = {
  APP_NAME: 'JumpaSini',
  TAGLINE: 'Find the perfect meetup spot for everyone',

  START_MEETUP: 'Start a Meetup',
  JOIN_MEETUP: 'Join a Meetup',
  NEXT: 'Next',
  BACK: 'Back',
  COPY_LINK: 'Copy Link',
  CONTINUE_TO_RESULTS: 'Continue to Results',

  SETUP_MEETUP: 'Setup Meetup',
  HOW_WILL_YOU_TRAVEL: 'How will everyone travel?',
  WHAT_ARE_YOU_LOOKING_FOR: 'What are you looking for?',
  HALAL_ONLY: 'Halal only',
  FIND_MEETUP_SPOT: 'Find Meetup Spot',

  TRANSPORT_CAR: 'Car',
  TRANSPORT_PUBLIC: 'Public Transport',

  VENUE_MALL: 'Mall',
  VENUE_RESTAURANT: 'Restaurant',
  VENUE_CAFE: 'Cafe',
  VENUE_PARK: 'Park',
  VENUE_BEACH: 'Beach',
  VENUE_WATERFALL: 'Waterfall',
  VENUE_RIVER: 'River',

  ADD_PARTICIPANTS: 'Add Locations',
  ADD_PARTICIPANTS_SUBTITLE: "Add your location to start. Share the code for others to join.",
  YOUR_NAME: 'Your name (optional)',
  SEARCH_LOCATION: 'Search location in KL/Selangor...',
  USE_CURRENT_LOCATION: 'Use my current location',
  ADD_PARTICIPANT: 'Add to list',
  PARTICIPANTS_COUNT: 'participants added',
  MAX_PARTICIPANTS_MSG: 'Maximum 6 participants reached',
  CURRENT_LOCATION_LABEL: 'Current Location',

  SESSION_CODE: 'Session Code',
  SHARE_CODE: 'Share this code with your friends',
  SHAREABLE_LINK: 'Shareable Link',
  LINK_COPIED: 'Link copied to clipboard!',
  CALCULATING_SPOT: 'Calculating best meetup spot...',
  PARTICIPANTS: 'Participants',

  JOIN_SESSION: 'Join Session',
  ENTER_SESSION_CODE: 'Enter session code',
  SESSION_CODE_HINT: 'e.g. XK92-MQ7P',
  JOIN: 'Join',

  ADDRESS_REQUIRED: 'Please enter or search for an address',
  NAME_TOO_LONG: 'Name must be 100 characters or less',
  ADDRESS_TOO_LONG: 'Address must be 255 characters or less',
  LOCATION_OUTSIDE_BOUNDARY: 'Location must be within Klang Valley (KL/Selangor)',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Something went wrong. Please try again.',
  SESSION_NOT_FOUND: 'Session not found or has expired.',
  SESSION_FULL: 'This session already has 6 participants.',
  LOCATION_PERMISSION_DENIED: 'Location permission denied. Please enable it in your browser.',
  LOCATION_UNAVAILABLE: 'Could not get your current location. Please try again.',
  SESSION_CODE_REQUIRED: 'Please enter a session code.',
} as const;
