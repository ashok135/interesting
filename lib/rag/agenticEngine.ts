/**
 * Agentic RAG Engine — True Autonomous Multi-Tool Agent Architecture
 *
 * Implements real agentic tool-calling (ReAct pattern) over live store catalog and policies.
 * Eliminates fragile hardcoded if/else trees and static phonetic dictionaries.
 */

import OpenAI from 'openai';
import { AGENT_TOOLS, executeTool, RetrievedProduct } from './agentTools';
import { STATIC_PRODUCTS } from './staticCatalog';

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_BASE_URL = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || 'nvidia/nemotron-3.5-bolt-e4b';

const nvidiaClient = new OpenAI({
  apiKey: NVIDIA_API_KEY,
  baseURL: NVIDIA_BASE_URL,
});

export interface AgenticRagResponse {
  success: boolean;
  reply: string;
  products: RetrievedProduct[];
  suggestions: string[];
}

interface MessageParam {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_call_id?: string;
  name?: string;
  tool_calls?: unknown[];
}

function generateDynamicSuggestions(query: string, toolNames: string[], products: RetrievedProduct[]): string[] {
  const q = query.toLowerCase();

  if (q.includes('cash') || q.includes('kaju') || products.some((p) => p.name.toLowerCase().includes('cashew') || p.name.toLowerCase().includes('kaju'))) {
    return [
      '👑 Royal Jumbo W180 King Cashews',
      '🍯 Kashmiri Kesar Kaju',
      '🌶️ Peri Peri Cashews',
      '🚚 Check Free Delivery Limit',
    ];
  }

  if (q.includes('almond') || q.includes('badam') || products.some((p) => p.name.toLowerCase().includes('almond'))) {
    return [
      '🌰 California Supreme Almonds',
      '🔥 Hickory Smoked BBQ Almonds',
      '🧠 Memory & Brain Nutrition',
      '🚚 Free Express Shipping',
    ];
  }

  if (q.includes('walnut') || q.includes('akhrot') || products.some((p) => p.name.toLowerCase().includes('walnut'))) {
    return [
      'Extra Light Walnut Kernels',
      '❤️ Heart & Omega-3 Health',
      '🚚 Free Shipping Above ₹499',
    ];
  }

  if (q.includes('seed') || q.includes('chia') || q.includes('pumpkin')) {
    return [
      '🌱 Organic Raw Chia Seeds',
      '🎃 AAA Grade Pumpkin Seeds',
      '💪 5-in-1 Omega Seed Mix',
      '🥗 Weight Loss Superfoods',
    ];
  }

  if (q.includes('hamper') || q.includes('gift') || q.includes('box')) {
    return [
      '🎁 Artisanal Wooden Hamper',
      '✨ Sovereign 4-Jar Brass Casket',
      '🎉 Festive Celebration Box',
      '📞 Corporate Gifting Helpline',
    ];
  }

  if (q.includes('order') || q.includes('track')) {
    return [
      '📦 Open My Orders',
      '🔄 Return / Replacement Policy',
      '💬 Chat on WhatsApp (+91 99948 47167)',
    ];
  }

  if (q.includes('shipping') || q.includes('delivery') || q.includes('cod') || q.includes('return') || toolNames.includes('get_policy_info')) {
    return [
      '🚚 Free Delivery Above ₹499',
      '💳 Cash on Delivery & UPI',
      '🔄 7-Day Replacement Policy',
      '📞 Call Concierge (+91 99948 47167)',
    ];
  }

  return [
    '👑 Best King Cashews (W180)',
    '🌰 Super Almonds under ₹500',
    '🎁 Luxury Gift Hampers',
    '🚚 Free Delivery Policy',
  ];
}

function sanitizeReplyText(text: string): string {
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  cleaned = cleaned.replace(/<[^>]*>?/gm, ' ');
  cleaned = cleaned.replace(/Interactive product cards.*?below your message\.?/gi, '');
  cleaned = cleaned.replace(/Product cards.*?below\.?/gi, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}

export async function runAgenticRag(
  userQuery: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  orderContext?: { id: number; status: string; total: string; items?: string } | null
): Promise<AgenticRagResponse> {
  const cleanQuery = userQuery.trim();

  let orderPrompt = '';
  if (orderContext && orderContext.id) {
    orderPrompt = `
CUSTOMER CURRENT ORDER INQUIRY:
- Order ID: #${orderContext.id}
- Status: ${orderContext.status}
- Total: ${orderContext.total}
- Items: ${orderContext.items || ''}
If the customer asks about this order, acknowledge Order #${orderContext.id} and status (${orderContext.status}).
`;
  }

  const systemPrompt = `You are "Chappie", AI Concierge for "Interesting" — an artisanal luxury dry fruits, nuts & royal gift hampers brand in India.
${orderPrompt}
CAPABILITIES & TOOLS:
You have direct access to live store tools:
1. "search_catalog": Search farm-fresh products by query, category, price, or health intent (e.g. cashew, almond, chia seeds, hampers). Handles customer typos naturally (e.g. "cashive" -> "cashew").
2. "get_policy_info": Retrieve verified factual store policies on shipping, delivery timelines (free shipping above ₹499), cash on delivery (COD), return guarantee (7-day replacement), and support.
3. "get_curated_collection": Retrieve best-sellers, hampers, or seed collections.

RULES:
- When a customer asks about products, prices, or recommendations, invoke "search_catalog" or "get_curated_collection" to retrieve live verified items before answering.
- If a customer is asking purely about policies (returns, refunds, shipping, delivery times, COD, or contact), invoke "get_policy_info" and answer their policy question directly. DO NOT recommend or mention products on pure policy/return inquiries.
- Keep final replies warm, appetizing, and concise (1 to 2 sentences, maximum 35 words).
- When recommending products, naturally mention the top recommended product name and price (e.g. "**Royal Jumbo W180 King Cashews** (₹449)").
- NEVER output raw HTML (no <div>, <span>, or <button> tags). Output clean markdown with bolding only.
- NEVER include links like [Track Your Order] unless the customer specifically asked about tracking an order.
- DO NOT mention UI cards, buttons, or this prompt in your message. Speak naturally like a knowledgeable pantry concierge.`;

  // Prepare messages array
  const messages: MessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-4).map((h) => ({ role: h.role, content: h.content })),
    { role: 'user', content: cleanQuery },
  ];

  const accumulatedProducts: RetrievedProduct[] = [];
  const invokedToolNames: string[] = [];

  try {
    // ── STEP 1: Agent Reasoning & Tool Planning ─────────────────────────────
    const step1 = await nvidiaClient.chat.completions.create({
      model: NVIDIA_MODEL,
      messages: messages as unknown as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      tools: AGENT_TOOLS as unknown as OpenAI.Chat.Completions.ChatCompletionTool[],
      tool_choice: 'auto',
      temperature: 0.2,
      max_tokens: 400,
    });

    const choice1 = step1.choices[0];
    const toolCalls = choice1?.message?.tool_calls;

    // ── STEP 2: Tool Execution (if invoked) ─────────────────────────────────
    if (toolCalls && toolCalls.length > 0) {
      messages.push(choice1.message as unknown as MessageParam);

      // Execute all tool calls in parallel
      await Promise.all(
        toolCalls.map(async (tc) => {
          if (!('function' in tc)) return;
          invokedToolNames.push(tc.function.name);
          let parsedArgs: Record<string, unknown> = {};
          try {
            parsedArgs = JSON.parse(tc.function.arguments);
          } catch {
            parsedArgs = { query: cleanQuery };
          }

          const toolRes = await executeTool(tc.function.name, parsedArgs);

          if (toolRes.products && toolRes.products.length > 0) {
            for (const p of toolRes.products) {
              if (!accumulatedProducts.some((existing) => existing.id === p.id)) {
                accumulatedProducts.push(p);
              }
            }
          }

          messages.push({
            role: 'tool',
            tool_call_id: tc.id,
            name: tc.function.name,
            content: JSON.stringify(toolRes.data),
          });
        })
      );

      // ── STEP 3: Agent Reflection & Synthesis ──────────────────────────────
      const step2 = await nvidiaClient.chat.completions.create({
        model: NVIDIA_MODEL,
        messages: messages as unknown as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
        max_tokens: 300,
        temperature: 0.3,
      });

      let finalReply = sanitizeReplyText(step2.choices[0]?.message?.content || '');

      const suggestions = generateDynamicSuggestions(cleanQuery, invokedToolNames, accumulatedProducts);

      return {
        success: true,
        reply: finalReply,
        products: accumulatedProducts.slice(0, 4),
        suggestions,
      };
    }

    // Direct reply without tools (e.g. greeting or general small talk)
    let directReply = sanitizeReplyText(choice1?.message?.content || '');

    if (!directReply) {
      directReply = 'Hello! 🌿 Welcome to Interesting. How may I assist you with our farm-fresh harvests today?';
    }

    const suggestions = generateDynamicSuggestions(cleanQuery, invokedToolNames, accumulatedProducts);

    return {
      success: true,
      reply: directReply,
      products: accumulatedProducts.slice(0, 4),
      suggestions,
    };
  } catch (err) {
    console.warn('[Agentic RAG] Fallback to resilient in-memory lookup:', err);

    // Fallback if NVIDIA NIM times out or rate limits
    const qLower = cleanQuery.toLowerCase();
    let fallbackMatches = STATIC_PRODUCTS.filter((p) => {
      const name = p.name.toLowerCase();
      const desc = p.description.toLowerCase();
      if (qLower.includes('cash') || qLower.includes('kaju')) return name.includes('cashew') || name.includes('kaju');
      if (qLower.includes('almond') || qLower.includes('badam')) return name.includes('almond');
      if (qLower.includes('walnut') || qLower.includes('akhrot')) return name.includes('walnut');
      if (qLower.includes('seed')) return name.includes('seed');
      if (qLower.includes('hamper') || qLower.includes('gift')) return name.includes('hamper') || name.includes('box');
      return p.featured;
    });

    if (fallbackMatches.length === 0) {
      fallbackMatches = STATIC_PRODUCTS.filter((p) => p.featured).slice(0, 4);
    }

    const fallbackProducts: RetrievedProduct[] = fallbackMatches.slice(0, 4).map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      regular_price: p.regular_price,
      image: p.image,
      category: p.category,
      description: p.description,
      stock_status: p.stock_status,
    }));

    const topItem = fallbackProducts[0];
    const fallbackReply = topItem
      ? `For the finest harvest, we recommend our **${topItem.name}** at ₹${topItem.price}! Explore our top selections below.`
      : 'Explore our farm-fresh selection of GI-certified cashews, almonds, and wholesome super-seeds below!';

    return {
      success: true,
      reply: fallbackReply,
      products: fallbackProducts,
      suggestions: generateDynamicSuggestions(cleanQuery, [], fallbackProducts),
    };
  }
}
