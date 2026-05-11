import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <footer class="bg-[#1A1A1A] text-white mt-16">
      <div class="max-w-screen-xl mx-auto px-4 py-10">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 class="font-semibold mb-3 text-[#F8C200]">Company</h3>
            <ul class="space-y-2 text-sm text-gray-400">
              <li><a href="#" class="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" class="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" class="hover:text-white transition-colors">Press</a></li>
              <li><a href="#" class="hover:text-white transition-colors">Blog</a></li>
            </ul>
          </div>
          <div>
            <h3 class="font-semibold mb-3 text-[#F8C200]">Categories</h3>
            <ul class="space-y-2 text-sm text-gray-400">
              <li><a routerLink="/products" class="hover:text-white transition-colors">Fruits & Vegetables</a></li>
              <li><a routerLink="/products" class="hover:text-white transition-colors">Dairy & Breakfast</a></li>
              <li><a routerLink="/products" class="hover:text-white transition-colors">Snacks</a></li>
              <li><a routerLink="/products" class="hover:text-white transition-colors">Beverages</a></li>
            </ul>
          </div>
          <div>
            <h3 class="font-semibold mb-3 text-[#F8C200]">Help</h3>
            <ul class="space-y-2 text-sm text-gray-400">
              <li><a routerLink="/help" class="hover:text-white transition-colors">FAQ</a></li>
              <li><a routerLink="/help" class="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" class="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" class="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
          <div>
            <h3 class="font-semibold mb-3 text-[#F8C200]">Cities</h3>
            <ul class="space-y-2 text-sm text-gray-400">
              <li>Mumbai</li>
              <li>Delhi</li>
              <li>Bangalore</li>
              <li>Hyderabad</li>
              <li>Chennai</li>
            </ul>
          </div>
        </div>
        <hr class="border-gray-700 mb-4" />
        <div class="flex flex-col md:flex-row justify-between items-center gap-2">
          <div class="flex items-center gap-2">
            <div class="bg-[#0C831F] px-2 py-0.5 rounded">
              <span class="text-[#F8C200] italic font-black text-sm">blinkit</span>
            </div>
            <span class="text-gray-400 text-sm">— Grocery in 10 minutes</span>
          </div>
          <p class="text-gray-500 text-sm">&copy; {{ year }} Blinkit Clone. Built for learning.</p>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  readonly year = new Date().getFullYear();
}
