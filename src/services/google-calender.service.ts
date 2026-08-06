import { google } from "googleapis";
import { GOOGLE_CALENDAR_ID, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, GOOGLE_REFRESH_TOKEN, GOOGLE_SENDER_EMAIL } from "../config/env.js";
import { findBookingById } from "../repositories/booking.repository.js";
import { notFound } from "../utils/api-error.js";

const SCOPES = [    
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/userinfo.email',
];

export function isProjectCalendarConfigured() : boolean {
    return Boolean(
        GOOGLE_CLIENT_ID &&
        GOOGLE_CLIENT_SECRET &&
        GOOGLE_REDIRECT_URI &&
        GOOGLE_REFRESH_TOKEN
    );
}

export function getGoogleOauthClient() {
    if (!isProjectCalendarConfigured()) {
        throw new Error('Google Calendar is not configured');
    }
    return new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI
    );
}

export function getSetupAuthUrl() {     // Generates the Google OAuth URL to redirect users to the consent screen.
    const client = getGoogleOauthClient();
    return client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
        state: 'setup'
    });
}

export async function exchangeSetupCode(code: string) {
    const client = getGoogleOauthClient();

    const { tokens } = await client.getToken(code)

    if (!tokens.refresh_token) {
        throw new Error('No refresh token found');
    }

    client.setCredentials(tokens);

    const oauth2 = google.oauth2({
        version: 'v2',
        auth: client
    }); // using this oauth2 client object we can get the user's info

    const { data } = await oauth2.userinfo.get(); // failing
    // ideally here we should store it in redis
    return {
        refresh_token: tokens.refresh_token,
        email: data.email ?? GOOGLE_SENDER_EMAIL
    }
}

export function getGoogleCalendarClient(): InstanceType<typeof google.auth.OAuth2> {
    if(!isProjectCalendarConfigured()) {
        throw new Error('Google project calendar is not configured');
    }

    const client = getGoogleOauthClient();

    client.setCredentials({
        refresh_token: GOOGLE_REFRESH_TOKEN // this should be ideally brought from redis
    });

    return client;
}

export async function createGoogleCalendarEvent(bookingId: number) {
    const booking = await findBookingById(bookingId);

    if(!booking || booking.status !== 'CONFIRMED') {
       throw notFound('Booking not found or not confirmed');
    }

    const client = getGoogleCalendarClient();

    const calendar = await google.calendar({
        version: 'v3',
        auth: client
    });

    const event = await calendar.events.insert({
        calendarId: GOOGLE_CALENDAR_ID,
        conferenceDataVersion: 1,
        sendUpdates: 'all',
        requestBody: {
            summary: `${booking.eventType.title} with ${booking.host.name} is confirmed`,
            description: [
                booking.eventType.description,
                booking.inviteeNotes ? `Invitee note: ${booking.inviteeNotes}` : '',
            ].join('\n\n'),
            start: {
                dateTime: booking.slot.startAt.toISOString(),
                timeZone: booking.host.timezone,
            },
            end: {
                dateTime: booking.slot.endAt.toISOString(),
                timeZone: booking.host.timezone,
            },
            attendees: [
                { email: booking.host.email, displayName: booking.host.name },
                { email: booking.inviteeEmail, displayName: booking.inviteeName },
            ],
            conferenceData: {
                createRequest: {
                    requestId: booking.id.toString(),
                    conferenceSolutionKey: {
                        type: 'hangoutsMeet',
                    }
                }
            }
        }
    });

    const meetLink = event.data.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video')?.uri ?? 
    event.data.hangoutLink ?? null;

    if(!event.data.id || !meetLink) {
        throw new Error('Failed to create Google Calendar event');
    }

    return {
        meetLink,
        calendarEventId: event.data.id,
    }

    
}