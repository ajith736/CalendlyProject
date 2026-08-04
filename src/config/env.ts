import 'dotenv/config';

export const PORT = process.env.PORT || 3000;
export const DATABASE_URL = process.env.DATABASE_URL ||'';
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const SLOT_GENRATION_DAYS = Number(process.env.SLOT_GENRATION_DAYS) || 30;

export const TEMPORAL_ADDRESS = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
export const TEMPORAL_NAMESPACE = process.env.TEMPORAL_NAMESPACE || 'default';
export const TEMPORAL_TASK_QUEUE = process.env.TEMPORAL_TASK_QUEUE || 'calendly-tasks';

export const TEMPORAL_ENABLED = 'true'; // write a function which can
// determine if temporal is enabled based on some health checks

export const SMTP_HOST = process.env.SMTP_HOST || 'localhost';
export const SMTP_PORT = Number(process.env.SMTP_PORT) || 1025;
export const SMTP_USER = process.env.SMTP_USER || '';
export const SMTP_PASSWORD = process.env.SMTP_PASSWORD || '';
export const EMAIL_FROM = process.env.EMAIL_FROM || 'Calendly <no-reply@calendly.com>';