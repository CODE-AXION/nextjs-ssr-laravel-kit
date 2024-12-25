import { generateCsrfToken } from "@/lib/csrf";
import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { token, signature } = generateCsrfToken();   

    let csrfCookiePrefix = process.env.ENVIRONMENT === 'local' ? '' : process.env.COOKIE_PREFIX;

    // Using signed cookies to prevent CSRF
    // https://owasp.org/www-chapter-london/assets/slides/David_Johansson-Double_Defeat_of_Double-Submit_Cookie.pdf
    // https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html

    // Securing cookies using OWASP recommendations
    // https://owasp.org/www-chapter-london/assets/slides/OWASPLondon20171130_Cookie_Security_Myths_Misconceptions_David_Johansson.pdf

    // create http only cookie with the token
    res.setHeader('Set-Cookie', [
        `${csrfCookiePrefix}csrf_token=${token}; HttpOnly; Path=/; Secure; SameSite=Lax; Max-Age=3600`,
        `${csrfCookiePrefix}csrf_signature=${signature}; HttpOnly; Path=/; Secure; SameSite=Lax; Max-Age=3600`,
    ]);

    res.status(200).json({ token, signature });
}

