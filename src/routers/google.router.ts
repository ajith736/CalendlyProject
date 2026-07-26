import { Router } from "express";
import { setupGoogleCallback } from "../controllers/google.controller.js";

export const googleIntegrationRouter: Router = Router();

googleIntegrationRouter.get('/callback', setupGoogleCallback);