import { GoogleGenAI } from "@google/genai";
import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/httpError";

type ChatRole = "user" | "model";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

const MAX_HISTORY_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 1200;
const MAX_PRODUCTS_IN_PROMPT = 40;
const MAX_REPLY_LENGTH = 1600;

type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  rating: number;
  description: string;
  createdAt: Date;
};

const toWords = (value: string) =>
  value
    .toLowerCase()
    .split(/[^a-zA-Zа-яА-Я0-9]+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 3);

const ensureHistory = (value: unknown): ChatMessage[] => {
  if (!Array.isArray(value)) {
    throw new HttpError(400, "history must be an array");
  }

  const normalized: ChatMessage[] = value
    .slice(-MAX_HISTORY_MESSAGES)
    .map((item) => {
      const role = (item as { role?: unknown }).role;
      const content = (item as { content?: unknown }).content;

      if (role !== "user" && role !== "model") {
        throw new HttpError(400, "history role must be user or model");
      }

      if (typeof content !== "string") {
        throw new HttpError(400, "history content must be a string");
      }

      const trimmed = content.trim();
      if (!trimmed) {
        throw new HttpError(400, "history content cannot be empty");
      }

      return {
        role,
        content: trimmed.slice(0, MAX_MESSAGE_LENGTH),
      };
    });

  if (normalized.length === 0) {
    throw new HttpError(400, "history cannot be empty");
  }

  return normalized;
};

const buildProductContext = (products: CatalogProduct[]) =>
  products
    .map(
      (product) =>
        `- ${product.name} | slug: ${product.slug} | link: /products/${product.slug} | category: ${product.category} | price: ${product.price} | stock: ${product.stock} | rating: ${product.rating} | description: ${product.description.replace(/\s+/g, " ").slice(0, 260)}`,
    )
    .join("\n");

const sortRelevantProducts = (products: CatalogProduct[], latestUserMessage: string) => {
  const words = new Set(toWords(latestUserMessage));

  const scored = products.map((product) => {
    const haystack = `${product.name} ${product.category} ${product.description}`.toLowerCase();
    let score = 0;

    words.forEach((word) => {
      if (haystack.includes(word)) {
        score += 2;
      }
    });

    if (product.stock > 0) {
      score += 1;
    }

    return { product, score };
  });

  return scored
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      if (b.product.rating !== a.product.rating) {
        return b.product.rating - a.product.rating;
      }

      return b.product.createdAt.getTime() - a.product.createdAt.getTime();
    })
    .slice(0, MAX_PRODUCTS_IN_PROMPT)
    .map(({ product }) => product);
};

const limitReplyLength = (value: string) => {
  const normalized = value.trim();
  if (normalized.length <= MAX_REPLY_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, MAX_REPLY_LENGTH - 1).trimEnd()}…`;
};

const buildFallbackReply = (latestUserMessage: string, products: CatalogProduct[]) => {
  const words = new Set(toWords(latestUserMessage));
  const matched = products.filter((product) => {
    const haystack = `${product.name} ${product.category} ${product.description}`.toLowerCase();
    for (const word of words) {
      if (haystack.includes(word)) {
        return true;
      }
    }
    return false;
  });

  const candidates = (matched.length > 0 ? matched : products)
    .filter((product) => product.stock > 0)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  if (candidates.length === 0) {
    return "Сейчас не могу обратиться к AI-модели. Попробуйте чуть позже, и я подберу товары из каталога со ссылками вида /products/slug.";
  }

  const lines = candidates.map(
    (product) => `- ${product.name} (${product.category}) — /products/${product.slug}`,
  );

  return [
    "Сейчас AI временно недоступен, но вот подходящие варианты из каталога:",
    ...lines,
    "Если нужно, уточните бюджет и критерии, и я сузю подборку.",
  ].join("\n");
};

const logChatRequest = (payload: {
  model: string;
  latencyMs: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  historyCount: number;
  productsInContext: number;
  fallbackUsed: boolean;
  ip: string;
}) => {
  // Structured logs for observability and simple metrics collection.
  console.info(
    JSON.stringify({
      event: "chat_request",
      ...payload,
    }),
  );
};

const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new HttpError(503, "AI assistant is not configured");
  }

  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const client = new GoogleGenAI({ apiKey });

  return {
    modelName,
    client,
  };
};

export class ChatController {
  static async chat(req: Request, res: Response) {
    const startedAt = Date.now();
    try {
      const history = ensureHistory(req.body?.history);

      const allProducts = await prisma.product.findMany({
        select: {
          id: true,
          slug: true,
          name: true,
          category: true,
          price: true,
          stock: true,
          rating: true,
          description: true,
          createdAt: true,
        },
      });

      const latestUserMessage = [...history]
        .reverse()
        .find((item) => item.role === "user")
        ?.content;

      if (!latestUserMessage) {
        throw new HttpError(400, "history must contain at least one user message");
      }

      const relevantProducts = sortRelevantProducts(allProducts, latestUserMessage);
      const ip = req.ip || req.socket.remoteAddress || "unknown";

      const systemPrompt = [
        "Ты AI-консультант интернет-магазина VOLT.",
        "Правила:",
        "1) Отвечай только по товарам, выбору, покупке, доставке и сравнению товаров из каталога ниже.",
        "2) Не выдумывай товары и характеристики. Если нет подходящего товара, так и скажи.",
        "3) Всегда предлагай ссылки строго в формате /products/slug.",
        "4) Отвечай кратко и по делу на русском языке.",
        "5) Если пользователь просит совет, предложи 2-4 подходящих варианта из каталога.",
        "Каталог товаров:",
        buildProductContext(relevantProducts),
      ].join("\n\n");

      const { modelName, client } = getClient();
      let fallbackUsed = false;
      let promptTokens: number | undefined;
      let completionTokens: number | undefined;
      let totalTokens: number | undefined;
      let reply: string;

      try {
        const result = await client.models.generateContent({
          model: modelName,
          contents: history.map((item) => ({
            role: item.role,
            parts: [{ text: item.content }],
          })),
          config: {
            systemInstruction: {
              role: "system",
              parts: [{ text: systemPrompt }],
            },
            temperature: 0.4,
            maxOutputTokens: 700,
          },
        });

        const usage: any = (result as any).usageMetadata || (result as any).response?.usageMetadata;
        promptTokens = usage?.promptTokenCount;
        completionTokens = usage?.candidatesTokenCount || usage?.completionTokenCount;
        totalTokens = usage?.totalTokenCount;

        const resultAny = result as any;
        const aiReply = typeof resultAny.text === "function"
          ? resultAny.text()
          : typeof resultAny.text === "string"
            ? resultAny.text
            : resultAny.candidates?.[0]?.content?.parts?.[0]?.text;
        const normalizedReply = typeof aiReply === "string" ? aiReply.trim() : "";
        if (!normalizedReply) {
          throw new Error("empty-ai-reply");
        }

        reply = limitReplyLength(normalizedReply);
      } catch (_error) {
        fallbackUsed = true;
        reply = limitReplyLength(buildFallbackReply(latestUserMessage, relevantProducts));
      }

      logChatRequest({
        model: modelName,
        latencyMs: Date.now() - startedAt,
        promptTokens,
        completionTokens,
        totalTokens,
        historyCount: history.length,
        productsInContext: relevantProducts.length,
        fallbackUsed,
        ip,
      });

      res.status(200).json({ reply, fallbackUsed });
    } catch (error) {
      const ip = req.ip || req.socket.remoteAddress || "unknown";

      if (error instanceof HttpError) {
        logChatRequest({
          model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
          latencyMs: Date.now() - startedAt,
          historyCount: 0,
          productsInContext: 0,
          fallbackUsed: false,
          ip,
        });
        res.status(error.statusCode).json({ message: error.message });
        return;
      }

      res.status(500).json({ message: "Failed to process chat request" });
    }
  }
}
