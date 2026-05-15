import {
  ChangeDetectionStrategy, Component, signal,
} from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

interface Faq { q: string; a: string; }

const FAQS: Record<string, Faq[]> = {
  Orders: [
    { q: 'How do I track my order?', a: 'Go to My Orders and click View Details to see the 4-step progress tracker.' },
    { q: 'Can I cancel my order?', a: 'Orders can be cancelled before the Packed status. Contact support for help.' },
    { q: 'Can I add items after placing an order?', a: 'Yes! Click "Add Items" on the confirmation page within 5 minutes of placing your order.' },
  ],
  Payments: [
    { q: 'What payment methods are accepted?', a: 'UPI, Credit/Debit Cards, Net Banking, Cash on Delivery, and Pay Later (BNPL — Simpl, LazyPay).' },
    { q: 'How do I apply a coupon?', a: 'Enter your coupon code in the cart sidebar or cart page before proceeding to checkout.' },
    { q: 'Is my payment information secure?', a: 'Yes, all payments are processed by Razorpay with bank-grade 256-bit encryption.' },
  ],
  Delivery: [
    { q: 'How fast is delivery?', a: 'We aim to deliver in 10 minutes from the nearest dark store. Actual time may vary.' },
    { q: 'Is delivery free?', a: 'Delivery is free on orders above ₹199. Subscribe to Blinkit Plus for always-free delivery.' },
    { q: 'Which areas do you deliver to?', a: 'Enter your pincode on the location selector to check availability in your area.' },
  ],
  Account: [
    { q: 'What is Blinkit Plus?', a: 'A ₹99/month subscription offering free delivery on all orders, 5% extra off, and early access to deals.' },
    { q: 'How do I change my delivery address?', a: 'Go to My Account → Addresses to add, edit, or set a default address.' },
    { q: 'How do I reset my password?', a: 'Use the Forgot Password option on the login page to reset via email.' },
  ],
  Refunds: [
    { q: 'How do I request a refund?', a: 'Contact our support chat below. Refunds are processed within 5–7 business days.' },
    { q: 'When will I receive my refund?', a: 'Refunds are credited to your original payment method within 5–7 working days after approval.' },
    { q: 'Can I return a product?', a: 'Yes, most products can be returned within 24 hours of delivery in original condition.' },
  ],
};

@Component({
  selector: 'app-help',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTabsModule, MatIconModule, FormsModule],
  template: `
    <div class="min-h-screen bg-[#F8F8F8]">
      <div class="max-w-4xl mx-auto px-4 py-8">
        <h1 class="text-2xl font-bold text-[#1A1A1A] mb-6">Help & Support</h1>

        <mat-tab-group animationDuration="200ms" class="bg-transparent">
          @for (tab of tabKeys; track tab) {
            <mat-tab [label]="tab">
              <div class="pt-4 space-y-3">
                @for (faq of faqs[tab]; track faq.q) {
                  <div class="bg-white rounded-[16px] border border-[#E0E0E0] overflow-hidden">
                    <button
                      class="w-full px-5 py-4 font-semibold text-[15px] text-[#1A1A1A] text-left flex items-center justify-between cursor-pointer hover:bg-[#F8F8F8] transition-colors"
                      (click)="toggleFaq(tab + faq.q)">
                      <span>{{ faq.q }}</span>
                      <span class="text-[#666666] text-xl leading-none ml-3 flex-shrink-0">
                        {{ expandedFaq() === (tab + faq.q) ? '−' : '+' }}
                      </span>
                    </button>
                    @if (expandedFaq() === (tab + faq.q)) {
                      <p class="px-5 pb-4 text-[14px] text-[#666666] leading-relaxed border-t border-[#F2F2F2] pt-3">
                        {{ faq.a }}
                      </p>
                    }
                  </div>
                }
              </div>
            </mat-tab>
          }
        </mat-tab-group>
      </div>
    </div>

    <!-- Chat bubble -->
    <button
      class="fixed bottom-6 right-6 z-50 bg-[#0C831F] text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center hover:bg-[#0a6b19] transition-colors"
      (click)="chatOpen.set(!chatOpen())">
      <mat-icon class="text-white">{{ chatOpen() ? 'close' : 'chat' }}</mat-icon>
    </button>

    <!-- Chat panel -->
    @if (chatOpen()) {
      <div class="fixed bottom-24 right-4 z-50 w-80 h-96 bg-white rounded-2xl shadow-2xl border border-[#E0E0E0] flex flex-col overflow-hidden">
        <div class="bg-[#0C831F] text-white px-4 py-3 flex justify-between items-center">
          <span class="font-semibold text-sm">🛒 Blinkit Support</span>
          <button class="text-white hover:opacity-70 text-lg leading-none" (click)="chatOpen.set(false)">×</button>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-3">
          <div class="bg-gray-100 rounded-xl rounded-tl-none px-3 py-2 text-sm max-w-[80%]">
            Hi! How can I help you today?
          </div>
          @if (userMessage()) {
            <div class="bg-[#0C831F] text-white rounded-xl rounded-tr-none px-3 py-2 text-sm ml-auto max-w-[80%]">
              {{ userMessage() }}
            </div>
          }
          @if (showAutoReply()) {
            <div class="bg-gray-100 rounded-xl rounded-tl-none px-3 py-2 text-sm max-w-[80%]">
              Thank you for reaching out! Our team will respond within 2 hours. Order issues? Check My Orders.
            </div>
          }
        </div>

        <div class="border-t border-[#E0E0E0] p-3 flex gap-2">
          <input
            [(ngModel)]="chatInput"
            placeholder="Type a message..."
            class="flex-1 border border-[#E0E0E0] rounded-[10px] px-3 py-2 text-sm focus:outline-none focus:border-[#0C831F] transition-colors"
            (keyup.enter)="sendMessage()" />
          <button
            class="bg-[#0C831F] text-white px-4 py-2 rounded-[10px] text-sm font-semibold hover:bg-[#0a6b19] transition-colors disabled:opacity-40"
            [disabled]="!chatInput.trim()"
            (click)="sendMessage()">
            Send
          </button>
        </div>
      </div>
    }
  `,
})
export class HelpComponent {
  readonly chatOpen = signal(false);
  readonly userMessage = signal('');
  readonly showAutoReply = signal(false);
  readonly expandedFaq = signal<string | null>(null);

  chatInput = '';

  readonly faqs = FAQS;
  readonly tabKeys = Object.keys(FAQS);

  toggleFaq(key: string): void {
    this.expandedFaq.set(this.expandedFaq() === key ? null : key);
  }

  sendMessage(): void {
    const msg = this.chatInput.trim();
    if (!msg) return;
    this.userMessage.set(msg);
    this.chatInput = '';
    this.showAutoReply.set(false);
    setTimeout(() => this.showAutoReply.set(true), 1500);
  }
}
