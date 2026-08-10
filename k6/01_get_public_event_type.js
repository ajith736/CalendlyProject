import http from 'k6/http';
import { check } from 'k6';
import { Rate } from 'k6/metrics';

const publicEventSuccess = new Rate('public_event_success');

export const options = {
    stages: [
        { duration: '30s', target: 25 },
        { duration: '30s', target: 50 },
        { duration: '30s', target: 100 },
        { duration: '30s', target: 200 },
        { duration: '30s', target: 300 },
        { duration: '30s', target: 400 },
        { duration: '30s', target: 500 },
        { duration: '30s', target: 0 },
    ],

    thresholds: {
        http_req_failed: ['rate<0.05'],
        public_event_success: ['rate>0.95'],

        http_req_duration: [
            'p(95)<1000',
            'p(99)<2000',
        ],

        http_req_waiting: ['p(95)<500'],
    },
};

export default function () {
    const baseUrl =
        __ENV.BASE_URL || 'http://localhost:3001';

    const userId =
        __ENV.USER_ID || '1';

    const slug =
        __ENV.EVENT_SLUG || '30-min-meeting';

    const url =
        `${baseUrl}/api/public/users/${userId}/event-types/${slug}`;

    const res = http.get(url);

    const passed = check(res, {
        'status is 200': (r) =>
            r.status === 200,

        'response is JSON': (r) =>
            r.headers['Content-Type']?.includes('application/json'),

        'API success is true': (r) => {
            try {
                const body = r.json();
                return body?.success === true;
            } catch {
                return false;
            }
        },

        'eventType and host exist': (r) => {
            try {
                const body = r.json();

                return !!(
                    body?.data?.eventType &&
                    body?.data?.host
                );
            } catch {
                return false;
            }
        },
    });

    publicEventSuccess.add(passed);
}