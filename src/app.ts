// Configures the setting for the express app object

import express, { Express } from 'express';
import { availabilityRouter } from './routers/availability.router.js';
import { bookingRouter } from './routers/booking.router.js';
import { eventTypeRouter } from './routers/event-type.router.js';
import { publicEventRouter } from './routers/public-event-type.router.js';
import { errorHandler } from './middlewares/error-handler.js';
import { routeNotFound } from './middlewares/route-not-found.js';
import { availabilityRouter } from './routers/availability.router.js';

const app = express();
app.use(express.json()); // to parse the body of the request (deserialize the body of the request)

app.get('/health', (_req, res) => {
    res.json({
        status: 'ok!',
        timeStamp: new Date().toISOString()
    })
});

app.use("/api/users", userRouter);
app.use('/api/availability', availabilityRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/event-types', eventTypeRouter);
app.use('/api/public', publicEventRouter);
app.use(routeNotFound);
app.use(errorHandler);

export {app};  