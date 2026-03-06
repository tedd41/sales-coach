export interface Rep {
  id: string;
  name: string;
  email: string;
}

export type Status = "loading" | "no_item" | "unknown_rep" | "generating" | "done" | "error";
export type Length = "original" | "short" | "medium";
export type Tone = "original" | "professional" | "enthusiastic" | "casual";
