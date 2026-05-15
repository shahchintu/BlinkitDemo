import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

interface BlinkitPlusStatus {
  isActive: boolean;
  expiresAt: string | null;
}

@Component({
  selector: 'app-blinkit-plus',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink],
  template: `
    <div class="min-h-screen bg-[#F8F8F8]">
      <div class="max-w-xl mx-auto px-4 py-8">

        <!-- Back link -->
        <a routerLink="/account" class="text-sm text-[#666666] hover:text-[#0C831F] transition-colors mb-6 inline-block">
          ← Back to Account
        </a>

        @if (loading()) {
          <div class="bg-white rounded-[20px] p-8 animate-pulse">
            <div class="h-6 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
            <div class="h-14 bg-gray-200 rounded w-1/3 mx-auto"></div>
          </div>
        } @else if (status()?.isActive) {
          <!-- Subscribed state -->
          <div class="bg-gradient-to-br from-[#0C831F] to-[#1DB954] rounded-[20px] p-8 text-white text-center">
            <span class="inline-block bg-white/20 rounded-full px-4 py-1 text-[14px] font-semibold mb-4">⭐ Blinkit Plus</span>
            <p class="text-[28px] font-black">You're a member!</p>
            @if (status()?.expiresAt) {
              <p class="text-sm opacity-80 mt-2">
                Active until {{ status()!.expiresAt! | date:'d MMM yyyy' }}
              </p>
            }
          </div>

          <div class="mt-6 grid grid-cols-3 gap-4">
            @for (benefit of benefits; track benefit.icon) {
              <div class="bg-white rounded-[16px] p-4 text-center shadow-sm border border-[#E0E0E0]">
                <div class="text-2xl mb-2">{{ benefit.icon }}</div>
                <p class="font-semibold text-xs text-[#1A1A1A]">{{ benefit.title }}</p>
                <p class="text-[10px] text-[#666666] mt-0.5">{{ benefit.subtitle }}</p>
              </div>
            }
          </div>
        } @else {
          <!-- Not subscribed — hero -->
          <div class="bg-gradient-to-br from-[#0C831F] to-[#1DB954] rounded-[20px] p-8 text-white text-center">
            <span class="inline-block bg-white/20 rounded-full px-4 py-1 text-[14px] font-semibold mb-4">⭐ Blinkit Plus</span>
            <p class="text-[48px] font-black leading-none">₹99</p>
            <p class="text-lg font-normal opacity-80 mt-1">per month</p>
            <p class="text-sm opacity-70 mt-3">Your Blinkit, unlimited.</p>
          </div>

          <!-- Benefits -->
          <div class="mt-6 grid grid-cols-3 gap-4">
            @for (benefit of benefits; track benefit.icon) {
              <div class="bg-white rounded-[16px] p-4 text-center shadow-sm border border-[#E0E0E0]">
                <div class="text-2xl mb-2">{{ benefit.icon }}</div>
                <p class="font-semibold text-xs text-[#1A1A1A]">{{ benefit.title }}</p>
                <p class="text-[10px] text-[#666666] mt-0.5">{{ benefit.subtitle }}</p>
              </div>
            }
          </div>

          <!-- Extra perks list -->
          <div class="mt-6 bg-white rounded-[16px] border border-[#E0E0E0] divide-y divide-[#F2F2F2]">
            @for (perk of perks; track perk.label) {
              <div class="flex items-center gap-3 px-5 py-4">
                <span class="text-[#0C831F] text-lg">✓</span>
                <div>
                  <p class="font-semibold text-[14px] text-[#1A1A1A]">{{ perk.label }}</p>
                  <p class="text-[12px] text-[#666666]">{{ perk.desc }}</p>
                </div>
              </div>
            }
          </div>

          <button
            class="w-full mt-6 bg-[#0C831F] text-white rounded-[16px] h-[56px] font-bold text-[16px] hover:bg-[#0a6b19] transition-colors disabled:opacity-60 shadow-[0_4px_16px_rgba(12,131,31,0.3)]"
            [disabled]="subscribing()"
            (click)="subscribe()">
            {{ subscribing() ? 'Processing...' : 'Get Blinkit Plus — ₹99/mo' }}
          </button>

          <p class="text-center text-[12px] text-[#666666] mt-3">Cancel anytime · No questions asked</p>
        }
      </div>
    </div>
  `,
})
export class BlinkitPlusComponent implements OnInit {
  private readonly http = inject(HttpClient);

  readonly status = signal<BlinkitPlusStatus | null>(null);
  readonly loading = signal(true);
  readonly subscribing = signal(false);

  readonly benefits = [
    { icon: '🚚', title: 'Free Delivery', subtitle: 'On every order' },
    { icon: '💸', title: '5% Extra Off', subtitle: 'On all products' },
    { icon: '⚡', title: 'Early Access', subtitle: 'Offers & launches' },
  ];

  readonly perks = [
    { label: 'Always free delivery', desc: 'No minimum order required' },
    { label: '5% extra discount', desc: 'On top of existing offers' },
    { label: 'Priority support', desc: 'Skip the queue, get faster help' },
    { label: 'Early access to deals', desc: 'Flash sales before everyone else' },
  ];

  ngOnInit(): void {
    this.http.get<BlinkitPlusStatus>('/api/blinkit-plus/status').subscribe({
      next: s => { this.status.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  subscribe(): void {
    this.subscribing.set(true);
    this.http.post<BlinkitPlusStatus>('/api/blinkit-plus/subscribe', {}).subscribe({
      next: s => { this.status.set(s); this.subscribing.set(false); },
      error: () => this.subscribing.set(false),
    });
  }
}
