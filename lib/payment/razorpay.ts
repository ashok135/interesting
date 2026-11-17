import Razorpay from 'razorpay';
import crypto from 'crypto';

const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || '';
const key_secret = process.env.RAZORPAY_KEY_SECRET || '';

let razorpayInstance: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!key_id || !key_secret) {
    throw new Error('Razorpay credentials (NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET) are missing.');
  }
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id,
      key_secret,
    });
  }
  return razorpayInstance;
}

export interface CreateOrderParams {
  amountInRupees: number;
  receipt?: string;
  notes?: Record<string, string>;
}

export async function createRazorpayOrder({ amountInRupees, receipt, notes }: CreateOrderParams) {
  const rzp = getRazorpay();
  
  // Razorpay expects amount in paise (1 INR = 100 paise)
  const amountInPaise = Math.round(amountInRupees * 100);
  
  if (amountInPaise <= 0) {
    throw new Error('Order amount must be greater than zero.');
  }

  const order = await rzp.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: receipt || `rcpt_${Date.now()}`,
    notes: notes || {},
  });

  return order;
}

export interface VerifySignatureParams {
  orderId: string;
  paymentId: string;
  signature: string;
}

export function verifyRazorpaySignature({ orderId, paymentId, signature }: VerifySignatureParams): boolean {
  if (!key_secret) {
    console.error('RAZORPAY_KEY_SECRET is not configured.');
    return false;
  }

  try {
    const text = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(text)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf8'),
      Buffer.from(signature, 'utf8')
    );
  } catch (err) {
    console.error('Error verifying Razorpay signature:', err);
    return false;
  }
}
