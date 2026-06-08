import express from 'express';
import { userRouter } from './routers/user.router.js';


const app = express();

app.get('/health', (_req, res) => {
    res.json({
        status: 'ok!',
        timeStamp: new Date().toISOString()
    })
});

app.use("/api/users",userRouter); // if the route starts with /users , the userRouter will handle it

export {app};