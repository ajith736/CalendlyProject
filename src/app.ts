// Configures the setting for the express app object

import express from 'express';
import { availabilityRouter } from './routers/availability.router.js';
import { bookingRouter } from './routers/booking.router.js';
import { eventTypeRouter } from './routers/event-type.router.js';
import { publicEventRouter } from './routers/public-event-type.router.js';
import { errorHandler } from './middlewares/error-handler.js';
import { routeNotFound } from './middlewares/route-not-found.js';
import { googleIntegrationRouter } from './routers/google.router.js';

const app: Express = express();

app.use(express.json()); // this will help express to deserialize the request body (JSON) into a JavaScript object
app.use(express.text());
app.use(express.urlencoded());

// Custom routes
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
app.use('/api/integrations/google', googleIntegrationRouter);

app.use(routeNotFound);
app.use(errorHandler);

export {app};  