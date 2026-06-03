import express from 'express';

const app = express();

app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        timeStamp: new Date().toISOString()
    })
});

export {app};