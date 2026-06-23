import express from 'express';
import { userRouter } from './routers/user.router.js';
import { errorHandler } from './middlewares/error-handler.js';
import { routeNotFound } from './middlewares/route-not-found.js';

const app = express();
app.use(express.json()); // to parse the body of the request (deserialize the body of the request)

app.get('/health', (_req, res) => {
    res.json({
        status: 'ok!',
        timeStamp: new Date().toISOString()
    })
});

app.use("/api/users",userRouter); // if the route starts with /users , the userRouter will handle it
app.use(routeNotFound);
app.use(errorHandler);

export {app};  