import * as cheerio from "cheerio";
import { configDotenv } from "dotenv";

configDotenv();

export async function bank_info() {
    const response = await fetch(process.env.BANK_URL);

    if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const ifscRegex = /\b[A-Z]{4}0[A-Z0-9]{6}\b/;
    const emailRegex =
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const phoneRegex = /\b\d{7,12}\b/;

    const branches = [];

    // Find every element containing an IFSC
    $("body *").each((_, element) => {
        const elementText = $(element)
            .text()
            .replace(/\s+/g, " ")
            .trim();

        const ifscMatch = elementText.match(ifscRegex);

        if (!ifscMatch) {
            return;
        }

        /*
         * Don't process huge parent containers.
         *
         * Find the closest ancestor which contains:
         * - exactly one IFSC
         * - Branch Address
         */
        let card = $(element);

        while (card.length) {
            const text = card
                .text()
                .replace(/\s+/g, " ")
                .trim();

            const ifscs = text.match(
                /\b[A-Z]{4}0[A-Z0-9]{6}\b/g
            ) || [];

            if (
                ifscs.length === 1 &&
                /Branch\s+Address/i.test(text)
            ) {
                break;
            }

            card = card.parent();
        }

        if (!card.length) {
            return;
        }

        const text = card
            .text()
            .replace(/\s+/g, " ")
            .trim();

        /*
         * Prevent processing the same card multiple times.
         */
        const ifsc = ifscMatch[0];

        if (branches.some(branch => branch.ifsc === ifsc)) {
            return;
        }

        /*
         * Bank name
         *
         * Your screenshot has names in headings,
         * so try heading elements first.
         */
        let name = null;

        card.find("h1, h2, h3, h4, h5, h6, strong, b").each((_, el) => {
            if (!name) {
                const value = $(el)
                    .text()
                    .replace(/\s+/g, " ")
                    .trim();

                if (
                    value &&
                    !/IFSC|Email|Phone|Address/i.test(value)
                ) {
                    name = value;
                }
            }
        });

        /*
         * Address
         */
        let address = null;

        const addressMatch = text.match(
            /Branch\s+Address\s*:\s*(.*?)(?=\s+Email\s*:|\s+Phone\s*:|$)/i
        );

        if (addressMatch) {
            address = addressMatch[1].trim();
        }

        /*
         * Email
         *
         * Your website uses:
         * [at] and [dot]
         *
         * so normal email regex won't work.
         */
        let email = null;

        const emailMatch = text.match(
            /Email\s*:\s*([^\s]+)/i
        );

        if (emailMatch) {
            email = emailMatch[1]
                .replace(/\[at\]/gi, "@")
                .replace(/\[dot\]/gi, ".");
        }

        /*
         * Phone
         */
        let phone = null;

        const phoneMatch = text.match(
            /Phone\s*:\s*(\d{7,12})/i
        );

        if (phoneMatch) {
            phone = phoneMatch[1];
        }

        branches.push({
            name,
            ifsc,
            address,
            email,
            phone
        });
    });

    return branches;
}