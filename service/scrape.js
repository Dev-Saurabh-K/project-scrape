import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { configDotenv } from "dotenv";

configDotenv();

export async function bank_info() {
  const loader = new CheerioWebBaseLoader(process.env.BANK_URL);
  const docs = await loader.load();
  const html = docs[0].pageContent;

  // Regex patterns
  const ifscRegex = /[A-Z]{4}0[A-Z0-9]{6}/g;
  const phoneRegex = /\b\d{6,12}\b/g;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g;

  // Extract matches
  const ifscCodes = html.match(ifscRegex) || [];
  const phones = html.match(phoneRegex) || [];
  const emails = html.match(emailRegex) || [];

  // Example: build structured objects
  const branches = [];

  // You’ll need to split the HTML into branch blocks first
  const branchBlocks = html.split(/(?=IFSC)/); // crude split on IFSC keyword

  branchBlocks.forEach(block => {
    const nameMatch = block.match(/([A-Za-z ]+Bank[^\n]+)/);
    const ifscMatch = block.match(ifscRegex);
    const addressMatch = block.match(/Address[:\-]?\s*(.+)/i);
    const emailMatch = block.match(emailRegex);
    const phoneMatch = block.match(phoneRegex);

    if (ifscMatch) {
      branches.push({
        name: nameMatch ? nameMatch[1].trim() : null,
        ifsc: ifscMatch[0],
        address: addressMatch ? addressMatch[1].trim() : null,
        email: emailMatch ? emailMatch[0] : null,
        phone: phoneMatch ? phoneMatch[0] : null,
      });
    }
  });

  return(branches);
}
