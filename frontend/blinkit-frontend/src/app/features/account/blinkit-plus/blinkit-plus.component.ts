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
        <a routerLink="/account" class="text-sm text-[#666666] hover:text-[#0C831F] transition-colors mb-4 inline-block">
          ← Back to Account
        </a>

        @if (loading()) {
          <div class="bg-white rounded-2xl p-8 animate-pulse">
            <div class="h-6 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
            <div class="h-10 bg-gray-200 rounded w-1/3 mx-auto"></div>
          </div>
        } @else if (status()?.isActive) {
          <!-- Subscribed state -->
          <div class="bg-[#4CAF50]/10 border border-[#4CAF50] rounded-xl p-5 text-center">
            <p class="text-[#4CAF50] font-bold text-lg">✓ You're a Blinkit Plus member!</p>
            @if (status()?.expiresAt) {
              <p class="text-sm text-[#666666] mt-1">
                Active until {{ status()!.expiresAt! | date:'d MMM yyyy' }}
              </p>
            }
          </div>
          <div class="mt-6 grid grid-cols-3 gap-4">
            @for (benefit of benefits; track benefit.icon) {
              <div class="bg-white rounded-xl p-4 text-center shadow-sm border border-[#E0E0E0]">
                <div class="text-2xl mb-1">{{ benefit.icon }}</div>
                <p class="font-semibold text-xs">{{ benefit.title }}</p>
                <p class="text-[10px] text-[#666666] mt-0.5">{{ benefit.subtitle }}</p>
              </div>
            }
          </div>
        } @else {
          <!-- Not subscribed state -->
          <div class="bg-gradient-to-r from-[#0C831F] to-green-700 text-white rounded-2xl p-8 text-center">
            <p class="text-2xl font-black mb-1">⭐ Blinkit Plus</p>
            <p class="text-4xl font-black my-3">₹99 <span class="text-lg font-normal">/ month</span></p>
            <p class="text-sm opacity-80">Your Blinkit, unlimited.</p>
          </div>

          <div class="mt-6 grid grid-cols-3 gap-4">
            @for (benefit of benefits; track benefit.icon) {
              <div class="bg-white rounded-xl p-4 text-center shadow-sm border border-[#E0E0E0]">
                <div class="text-2xl mb-1">{{ benefit.icon }}</div>
                <p class="font-semibold text-xs">{{ benefit.title }}</p>
                <p class="text-[10px] text-[#666666] mt-0.5">{{ benefit.subtitle }}</p>
              </div>
            }
          </div>

          <button
            class="w-full mt-6 bg-[#0C831F] text-white rounded-xl py-4 font-semibold text-base hover:bg-green-700 transition-colors disabled:opacity-60"
            [disabled]="subscribing()"
            (click)="subscribe()">
            {{ subscribing() ? 'Processing...' : 'Get Blinkit Plus' }}
          </button>
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
