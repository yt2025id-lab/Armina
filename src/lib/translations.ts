import en from "@/locales/en.json";
import id from "@/locales/id.json";
import zh from "@/locales/zh.json";

export type Language = "en" | "id" | "zh";

export type Translations = typeof en;

export const translations: Record<Language, Translations> = { en, id, zh };
