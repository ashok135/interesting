'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, MessageCircle, X, Send, ShoppingBag, Check, Package, RotateCcw, Truck, PhoneCall } from 'lucide-react';
import { Mascot } from 'page-mascot';
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
  suggestions?: string[];
}

const STARTER_PROMPTS = [
  '📦 Where is my order?',
  '🌰 Best seeds under ₹500',
  '🔄 Return & Refund policy',
  '🎁 Luxury gift hampers',
];

function preprocessText(raw: string): string {
  let s = raw;
  // Auto-link "My Account > Orders"
  if (!s.includes('](/account)')) {
    s = s.replace(/My Account\s*>\s*Orders(?:\s*page)?/gi, '[My Account > Orders](/account)');
  }
  // Auto-link phone numbers
  if (!s.includes('](tel:')) {
    s = s.replace(/\+91\s*99948\s*47167/g, '[+91 99948 47167](tel:+919994847167)');
    s = s.replace(/\+91\s*91763\s*67777/g, '[+91 99948 47167](tel:+919994847167)');
  }
  // Auto-link emails
  if (!s.includes('](mailto:')) {
    s = s.replace(/support@intersting\.duckdns\.org/g, '[support@intersting.duckdns.org](mailto:support@intersting.duckdns.org)');
    s = s.replace(/hello@interesting\.co\.in/g, '[hello@interesting.co.in](mailto:hello@interesting.co.in)');
  }
  // Auto-link Return & Refund Policy — ONLY matches the exact phrase "Return Policy" or "Return & Refund Policy"
  if (!s.includes('](/returns)')) {
    s = s.replace(/\bReturn\s*(?:&\s*Refund\s*)?Policy\b/gi, '[Return & Refund Policy](/returns)');
  }
  // Auto-link Shipping Policy — ONLY matches the exact phrase "Shipping Policy"
  if (!s.includes('](/shipping)')) {
    s = s.replace(/\bShipping\s*(?:&\s*Delivery\s*)?Policy\b/gi, '[Shipping Policy](/shipping)');
  }
  // Auto-link FAQ & Payments — ONLY matches the uppercase abbreviation "FAQ" as a standalone word
  if (!s.includes('](/faq)')) {
    s = s.replace(/\bFAQ\b(?:\s*&\s*Payments?)?/g, '[FAQ & Payments](/faq)');
  }
  // Auto-link Terms & Privacy — ONLY matches the exact phrase "Terms & Privacy" or "Terms and Privacy"
  if (!s.includes('](/terms)')) {
    s = s.replace(/\bTerms\s*(?:&|and)\s*Privacy\b/gi, '[Terms & Privacy](/terms)');
  }
  return s;
}

function renderFormattedText(text: string, onLinkClick: () => void) {
  const processed = preprocessText(text);
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(processed)) !== null) {
    if (match.index > lastIndex) {
      parts.push(processed.slice(lastIndex, match.index));
    }

    const label = match[1];
    const url = match[2];

    if (url.startsWith('/')) {
      parts.push(
        <Link
          key={`link-${match.index}`}
          href={url}
          onClick={onLinkClick}
          className={styles.bubbleLink}
        >
          {label}
        </Link>
      );
    } else {
      parts.push(
        <a
          key={`link-${match.index}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.bubbleLink}
        >
          {label}
        </a>
      );
    }

    lastIndex = linkRegex.lastIndex;
  }

  if (lastIndex < processed.length) {
    parts.push(processed.slice(lastIndex));
  }

  return parts.length > 0 ? parts : processed;
}

export default function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<number[]>([]);

  // Hold-to-Dismiss Session State
  const [isDismissed, setIsDismissed] = useState(false);
  const [showRemoveZone, setShowRemoveZone] = useState(false);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoHideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isHoldingRef = useRef(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { addItem, openDrawer, itemCount } = useCartContext();
  const { showSuccess } = useToast();

  // Restore dismissal preference for current session
  useEffect(() => {
    try {
      if (sessionStorage.getItem('chappie_dismissed') === 'true') {
        setIsDismissed(true);
      }
    } catch {
      // Storage access check
    }
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    isHoldingRef.current = false;

    // Trigger bottom "X" dismiss target when held for 400ms
    holdTimerRef.current = setTimeout(() => {
      isHoldingRef.current = true;
      setShowRemoveZone(true);

      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = setTimeout(() => {
        setShowRemoveZone(false);
      }, 5000);
    }, 400);
  };

  const handlePointerUp = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    // Quick tap/click: play boop reaction then open chat
    if (!isHoldingRef.current) {
      setTimeout(() => setIsOpen(true), 350);
    }
  };

  const handleDismissSession = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      sessionStorage.setItem('chappie_dismissed', 'true');
    } catch {
      // Storage access check
    }
    setIsDismissed(true);
    setShowRemoveZone(false);
  };

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
        suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
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
      {/* 1. Interactive Cursor-Tracking Mascot Trigger */}
      {!isOpen && !isDismissed && (
        <div
          className={`${styles.mascotTriggerContainer} ${itemCount > 0 ? styles.withFloatingCart : ''}`}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => {
            if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
          }}
          title="Click to chat • Hold to remove for this session"
        >
          {/* Floating Speech Pill Badge */}
          <button
            type="button"
            className={styles.speechPill}
            aria-label="Ask Chappie AI"
          >
            <span className={styles.onlinePulseDot} />
            <span className={styles.speechText}>Ask Chappie AI</span>
            <Sparkles size={13} className={styles.sparkleIcon} />
          </button>

          {/* Interactive Mascot that follows cursor and reacts */}
          <div className={styles.mascotFloatWrap}>
            <div className={styles.mascotScale}>
              <Mascot
                directions="/mascots/toaster-directions.webp"
                reactions="/mascots/toaster-reactions.webp"
                size={82}
                label="Chappie AI Mascot"
              />
            </div>
            <div className={styles.groundShadow} />
          </div>
        </div>
      )}

      {/* Bottom Session Dismiss Target (Revealed when user holds Chappie) */}
      {showRemoveZone && !isDismissed && !isOpen && (
        <div className={styles.bottomDismissOverlay}>
          <button
            type="button"
            className={styles.bottomDismissBtn}
            onClick={handleDismissSession}
            aria-label="Remove Chappie for this session"
          >
            <div className={styles.dismissCircle}>
              <X size={18} strokeWidth={2.5} />
            </div>
            <span className={styles.dismissLabel}>Remove Chappie for this session</span>
          </button>
          <button
            type="button"
            className={styles.dismissCancelBtn}
            onClick={(e) => {
              e.stopPropagation();
              setShowRemoveZone(false);
            }}
          >
            Keep
          </button>
        </div>
      )}

      {/* 2. Interactive Chat Window */}
      {isOpen && (
        <div
          className={styles.chatWindow}
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className={styles.chatHeader}>
            <div className={styles.headerInfo}>
              <div className={styles.avatarWrap}>
                <Mascot
                  directions="/mascots/toaster-directions.webp"
                  reactions="/mascots/toaster-reactions.webp"
                  size={36}
                  label="Chappie AI Mascot"
                />
                <span className={styles.onlineDot} />
              </div>
              <div>
                <h3 className={styles.headerTitle}>Chappie • AI Nutritionist</h3>
                <p className={styles.headerSub}>Farm-Fresh Wellness Concierge • Interesting Pantry</p>
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
                Hello! I&apos;m <strong>Chappie</strong>, your AI concierge for Interesting. Ask me anything about our nuts, super-seeds, dietary advice, or gift hampers!
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
                    <div className={styles.assistantBubble}>
                      {renderFormattedText(msg.content, () => setIsOpen(false))}
                    </div>

                    {/* Quick Action Suggestion Cards / Pills */}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className={styles.actionCardsGrid}>
                        {msg.suggestions.map((actionText) => (
                          <button
                            key={actionText}
                            type="button"
                            onClick={() => handleSendMessage(actionText.replace(/^[^\w]+/, '').trim())}
                            className={styles.actionCardBtn}
                          >
                            {actionText}
                          </button>
                        ))}
                      </div>
                    )}

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
              100% Farm-Fresh • Certified Purity • Express All-India Delivery
            </div>
          </div>
        </div>
      )}
    </>
  );
}
