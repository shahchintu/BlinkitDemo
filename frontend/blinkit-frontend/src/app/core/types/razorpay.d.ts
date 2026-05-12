import { RazorpayOptions, RazorpaySuccessResponse } from '../models';

interface RazorpayInstance {
  open(): void;
  on(event: 'payment.failed', handler: (error: unknown) => void): void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions & {
      handler: (response: RazorpaySuccessResponse) => void;
    }) => RazorpayInstance;
  }
}
