import { Request, Response } from "express";
import { badRequest } from "../utils/api-error.js";
import { exchangeSetupCode } from "../services/google-calender.service.js";

export const setupGoogleCallback = async (req: Request, res: Response) => {
    const code = req.query.code as string | undefined;

    console.log('code', code);

    if(!code) throw badRequest('No code provided');

    const { refreshToken, email } = await exchangeSetupCode(code);

    res.status(200).json({
        success: true,
        data: {
            refreshToken,
            email
        }
    })
}