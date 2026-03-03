import { getChatCompletion } from "./openaiService";
import { log } from "./logService";

// ---------------------------------------------------------------------------
// Types / Interface
// ---------------------------------------------------------------------------

export interface ParsedEmail {
  text: string;
}

export interface IEmailParser {
  parse(rawHtml: string): Promise<ParsedEmail>;
}

// ---------------------------------------------------------------------------
// GPT-4o implementation
//
// TODO: Replace GptEmailParser with a real HTML stripper (e.g. sanitize-html +
//       quoted-printable) if this POC survives v1. GPT call adds ~300ms + cost
//       per inbound email.
// ---------------------------------------------------------------------------

class GptEmailParser implements IEmailParser {
  async parse(rawHtml: string): Promise<ParsedEmail> {
    const messages = [
      {
        role: "system" as const,
        content: `You are an email body extractor. Your ONLY job is to return the text of the most recent message in an email thread — stripping all HTML tags, quoted reply chains, forwarded headers, and email signatures.

Rules:
1. Return ONLY the most recent message — ignore everything below the first <hr> or "From:" reply header you encounter.
2. Do NOT rephrase, summarize, correct, or change the person's exact words in ANY way — verbatim output only.
3. Strip all HTML tags, inline styles, and encoded entities (&nbsp; &gt; etc.).
4. Return valid JSON with a single key: { "text": "<extracted text>" }
5. If the body is empty or you cannot extract anything meaningful, return { "text": "" }
6. No markdown. No code fences. Raw JSON only.`,
      },
      {
        role: "user" as const,
        content: rawHtml,
      },
    ];

    try {
      const response = await getChatCompletion(messages, 0.0);
      const cleaned = response.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      if (typeof parsed.text !== "string") {
        throw new Error("Unexpected shape — missing text field");
      }

      return { text: parsed.text.trim() };
    } catch (error) {
      log.warn(
        "emailParsingService.GptEmailParser",
        "Failed to parse email body via GPT — falling back to empty string",
        { error: error instanceof Error ? error.message : String(error) },
      );
      return { text: "" };
    }
  }
}

// Singleton — import this everywhere
export const emailParser = new GptEmailParser();
