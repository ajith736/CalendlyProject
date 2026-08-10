import http from 'k6/http';
import { check } from 'k6';
import { Counter, Rate } from 'k6/metrics';

const bookingCreated = new Counter('booking_created');
const bookingRejected = new Counter('booking_rejected');
const validBookingOutcome = new Rate('valid_booking_outcome');

export const options = {
    scenarios: {
        same_slot_contention: {
            executor: 'per-vu-iterations',
            vus: 50,
            iterations: 1,
            maxDuration: '30s',
        },
    },

    thresholds: {
        // Exactly one user should successfully book the slot
        booking_created: ['count==1'],

        // Every request should result in an expected business outcome
        valid_booking_outcome: ['rate>0.99'],
    },
};

export default function () {
    const baseUrl =
        __ENV.BASE_URL || 'http://localhost:3001';

    const userId =
        __ENV.USER_ID || '1';

    const slotId =
        __ENV.SLOT_ID || 'YOUR_SLOT_ID';

    const url = `${baseUrl}/api/bookings`;

    const payload = JSON.stringify({
        slotId,
        inviteeEmail: `loadtest_vu${__VU}@example.com`,
        inviteeName: `VU ${__VU} Tester`,
        inviteeNotes: 'Concurrent booking contention test',
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
        },
    };

    const res = http.post(url, payload, params);

    const isCreated = res.status === 201;
    const isRejected = res.status === 400;

    if (isCreated) {
        bookingCreated.add(1);
    }

    if (isRejected) {
        bookingRejected.add(1);
    }

    validBookingOutcome.add(isCreated || isRejected);

    check(res, {
        'booking created or slot rejected': (r) =>
            r.status === 201 || r.status === 400,

        'no server error': (r) =>
            r.status < 500,
    });
}