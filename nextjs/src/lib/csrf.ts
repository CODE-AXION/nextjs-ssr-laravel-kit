import crypto from "crypto";
import { NextApiRequest } from "next";
import { CsrfTokens } from "@/types/auth";

const secretKey = process.env.CSRF_SECRET_KEY;


export const generateCsrfToken = (): CsrfTokens => {
    const token = crypto.randomBytes(32).toString('hex'); // Random token
    const signature = crypto.createHmac('sha256', secretKey).update(token).digest('hex');

    return { token, signature };
};

export const verifyCsrfToken = (token: string, signature: string, bodyToken: string): boolean => {
    const validSignature = crypto.createHmac('sha256', secretKey).update(token).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(validSignature)) && token === bodyToken;
};

/**
 * Default Value function, checking req.body
 * and req.query for the csrf token
 * 
 * @param req - Next.js API request object
 * @return csrf token string if found, null if not found
 */
export const defaultValue = (req: NextApiRequest): string | null => {
    return (req.body && req.body._csrf) ||
    (req.body && req.body.csrf_token) ||
    (req.headers && req.headers['csrf_token']) ||
    (req.headers && req.headers['csrf-token']) ||
    (req.headers && req.headers['xsrf-token']) ||
    (req.headers && req.headers['x-csrf-token']) ||
    (req.headers && req.headers['x-xsrf-token']);
};
