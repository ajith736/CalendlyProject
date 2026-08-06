import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, GOOGLE_USER_EMAIL } from "../config/env.js";

import { google } from 'googleapis';

const SCOPES = [    
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
];

export function isprojectCalendarConfigured(): boolean {
    return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_REDIRECT_URI);
}

export function getGoogleOauthClient() {
    if (!isprojectCalendarConfigured()) {
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

    const { data } = await oauth2.userinfo.get();

    return {
        refresh_token: tokens.refresh_token,
        email: data.email ?? GOOGLE_USER_EMAIL
    }
}

