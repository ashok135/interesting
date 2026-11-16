'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, MessageCircle, X, Send, ShoppingBag, Check } from 'lucide-react';
import { useCartContext } from '@/store/CartContext';
import { useToast } from '@/store/ToastContext';
import { formatPrice } from '@/lib/utils/formatters';
import type { RetrievedProduct } from '@/lib/rag/catalog';
import styles from './AiAssistant.module.css';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products?: RetrievedProduct[];
}

const STARTER_PROMPTS = [
  '🌰 High protein seeds & nuts',
  '🩺 Best for diabetes & heart health',
  '🎁 Luxury gift hampers under ₹1500',
  '📦 What is your return & shipping policy?',
];

export default function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<number[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { addItem, openDrawer } = useCartContext();
  const { showSuccess } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const historyPayload = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
        }),
      });

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content:
          data.reply ||
          'Here are our recommendations based on our live store inventory!',
        products: Array.isArray(data.products) ? data.products : [],
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content:
            'I had a temporary hiccup retrieving recommendations. Feel free to ask again or explore our catalog directly!',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = (product: RetrievedProduct) => {
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.image,
      stockStatus: (product.stock_status as 'instock' | 'outofstock') || 'instock',
    });

    setAddedIds((prev) => [...prev, product.id]);
    showSuccess(`Added "${product.name}" to your bag!`);
    openDrawer();
  };

  return (
    <>
      {/* 1. Floating Pill Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={styles.triggerBtn}
          aria-label="Ask AI Nutritionist Concierge"
        >
          <Sparkles size={17} className={styles.triggerSparkle} />
          <span>Ask Nutritionist AI</span>
        </button>
      )}

      {/* 2. Interactive Chat Window */}
      {isOpen && (
        <div className={styles.chatWindow} role="dialog" aria-modal="true">
          {/* Header */}
          <div className={styles.chatHeader}>
            <div className={styles.headerInfo}>
              <div className={styles.avatarWrap}>
                <Sparkles size={18} color="#f59e0b" />
                <span className={styles.onlineDot} />
              </div>
              <div>
                <h3 className={styles.headerTitle}>Tara • AI Nutritionist</h3>
                <p className={styles.headerSub}>Live Store Concierge (NVIDIA NIM)</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className={styles.closeBtn}
              aria-label="Close chat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Body */}
          <div className={styles.messagesList}>
            {/* Welcome Greeting */}
            <div className={styles.welcomeCard}>
              <p style={{ margin: '0 0 0.5rem' }}>
                Hello! I&apos;m <strong>Tara</strong>, your AI concierge for Interesting. Ask me anything about our nuts, super-seeds, dietary advice, or gift hampers!
              </p>
              <div className={styles.chipsContainer}>
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSendMessage(prompt.replace(/^[^\w]+/, '').trim())}
                    className={styles.promptChip}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation Flow */}
            {messages.map((msg) => (
              <React.Fragment key={msg.id}>
                {msg.role === 'user' ? (
                  <div className={styles.userRow}>
                    <div className={styles.userBubble}>{msg.content}</div>
                  </div>
                ) : (
                  <div className={styles.assistantRow}>
                    <div className={styles.assistantBubble}>{msg.content}</div>

                    {/* Rich Product Recommendation Cards */}
                    {msg.products && msg.products.length > 0 && (
                      <div className={styles.productCardsStrip}>
                        {msg.products.map((p) => {
                          const isAdded = addedIds.includes(p.id);
                          return (
                            <div key={p.id} className={styles.chatProductCard}>
                              <div className={styles.chatProductThumb}>
                                <Image
                                  src={p.image}
                                  alt={p.name}
                                  fill
                                  sizes="44px"
                                  style={{ objectFit: 'cover' }}
                                  unoptimized
                                />
                              </div>

                              <div className={styles.chatProductInfo}>
                                <Link
                                  href={`/product/${p.slug}`}
                                  className={styles.chatProductName}
                                  title={p.name}
                                  onClick={() => setIsOpen(false)}
                                >
                                  {p.name}
                                </Link>
                                <span className={styles.chatProductPrice}>
                                  {formatPrice(p.price)}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleAddToCart(p)}
                                className={styles.chatAddBtn}
                              >
                                {isAdded ? (
                                  <>
                                    <Check size={12} /> Added
                                  </>
                                ) : (
                                  <>
                                    <ShoppingBag size={12} /> Add
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </React.Fragment>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className={styles.typingIndicator}>
                <span className={styles.typingDot} />
                <span className={styles.typingDot} />
                <span className={styles.typingDot} />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className={styles.chatFooter}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className={styles.inputForm}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about nutrition, gifts, prices..."
                className={styles.chatInput}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className={styles.sendBtn}
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </form>
            <div className={styles.poweredNote}>
              Grounding via Live WooCommerce • NVIDIA Nemotron
            </div>
          </div>
        </div>
      )}
    </>
  );
}
