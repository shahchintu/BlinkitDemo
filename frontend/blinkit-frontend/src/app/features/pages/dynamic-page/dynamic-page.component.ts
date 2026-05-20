import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PagesService, PageContent } from '../../../core/services/pages.service';

@Component({
  selector: 'app-dynamic-page',
  standalone: true,
  imports: [RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Breadcrumb -->
    @if (!isLoading() && page()) {
      <div class="bg-white border-b border-[#F0F0F0]">
        <div class="max-w-[860px] mx-auto px-4 py-3
                    flex items-center gap-2
                    text-[13px] text-[#666]">
          <a routerLink="/"
             class="hover:text-[#0C831F] transition">
            Home
          </a>
          <span class="material-icons text-[14px]">
            chevron_right
          </span>
          <span class="text-[#1A1A1A] font-medium">
            {{page()?.title}}
          </span>
        </div>
      </div>
    }

    <div class="max-w-[860px] mx-auto px-4 py-8 pb-16">

      <!-- Loading skeleton -->
      @if (isLoading()) {
        <div class="bg-white rounded-[20px] p-8 md:p-12">
          <div class="skeleton h-8 w-1/2 
                      rounded-lg mb-3"></div>
          <div class="skeleton h-4 w-1/4 
                      rounded mb-8"></div>
          @for (i of [1,2,3,4]; track i) {
            <div class="mb-8 font-normal">
              <div class="skeleton h-5 w-1/3 
                          rounded mb-3"></div>
              <div class="skeleton h-3 w-full 
                          rounded mb-2"></div>
              <div class="skeleton h-3 w-5/6 
                          rounded mb-2"></div>
              <div class="skeleton h-3 w-4/6 
                          rounded"></div>
            </div>
          }
        </div>
      }

      <!-- Error state -->
      @if (!isLoading() && error()) {
        <div class="bg-white rounded-[20px] p-12 
                    text-center">
          <span class="material-icons text-[64px] 
                       text-[#E0E0E0] mb-4 block">
            search_off
          </span>
          <h2 class="text-[20px] font-bold 
                     text-[#1A1A1A] mb-2">
            Page Not Found
          </h2>
          <p class="text-[14px] text-[#666] mb-6">
            The page you are looking for does not exist.
          </p>
          <a routerLink="/"
             class="bg-[#0C831F] text-white 
                    rounded-[10px] px-6 py-3 
                    text-[14px] font-semibold
                    hover:bg-[#0a6b19] transition
                    inline-block">
            Go Home
          </a>
        </div>
      }

      <!-- Page content -->
      @if (!isLoading() && page()) {
        <div class="bg-white rounded-[20px] 
                    shadow-card overflow-hidden">

          <!-- Page header -->
          <div class="bg-gradient-to-r from-[#0C831F] 
                      to-[#1DB954] px-8 md:px-12 py-10">
            <h1 class="text-[32px] md:text-[40px] 
                       font-black text-white 
                       leading-tight mb-2">
              {{page()?.title}}
            </h1>
            @if (page()?.lastUpdated) {
              <p class="text-white/70 text-[13px]">
                Last updated: {{page()?.lastUpdated}}
              </p>
            }
          </div>

          <!-- Quick navigation for long pages -->
          @if ((page()?.sections?.length ?? 0) > 3) {
            <div class="px-8 md:px-12 py-5 
                        bg-[#F8FFF8] border-b 
                        border-[#E8F5E9]">
              <p class="text-[12px] font-semibold 
                        text-[#666] uppercase 
                        tracking-wide mb-3">
                Quick Navigation
              </p>
              <div class="flex flex-wrap gap-2">
                @for (section of page()?.sections; 
                      track section.heading) {
                  <a [href]="'#' + toAnchor(section.heading)"
                     class="text-[12px] font-medium
                            text-[#0C831F] bg-[#F0FFF4]
                            border border-[#C8E6C9]
                            rounded-full px-3 py-1
                            hover:bg-[#0C831F] 
                            hover:text-white transition">
                    {{section.heading}}
                  </a>
                }
              </div>
            </div>
          }

          <!-- Sections -->
          <div class="px-8 md:px-12 py-8 
                      divide-y divide-[#F5F5F5]">
            @for (section of page()?.sections; 
                  track section.heading;
                  let i = $index) {
              <div [id]="toAnchor(section.heading)"
                   class="py-8 first:pt-0 last:pb-0 
                           scroll-mt-24">

                <!-- Section number + heading -->
                <div class="flex items-start gap-3 mb-4">
                  <div class="w-8 h-8 rounded-full 
                              bg-[#F0FFF4] border 
                              border-[#C8E6C9]
                              flex items-center 
                              justify-center flex-shrink-0 
                              mt-0.5">
                    <span class="text-[13px] font-bold 
                                 text-[#0C831F]">
                      {{i + 1}}
                    </span>
                  </div>
                  <h2 class="text-[20px] font-bold 
                             text-[#1A1A1A] leading-tight">
                    {{section.heading}}
                  </h2>
                </div>

                <!-- Section content -->
                <div class="ml-11">
                  @for (line of splitContent(section.content);
                        track $index) {
                    @if (line.trim()) {
                      <p class="text-[15px] text-[#444] 
                                leading-relaxed mb-3
                                last:mb-0">
                        {{line.trim()}}
                      </p>
                    }
                  }
                </div>

              </div>
            }
          </div>

          <!-- Footer of page -->
          <div class="px-8 md:px-12 py-6 
                      bg-[#F8F8F8] border-t 
                      border-[#F0F0F0]
                      flex flex-col sm:flex-row 
                      items-center justify-between gap-4">
            
            <div class="flex items-center gap-2">
              <div class="bg-[#F8C200] rounded-[8px] 
                          px-2.5 py-1">
                <span class="text-[#0C831F] font-black 
                             italic text-[16px]">
                  blinkit
                </span>
              </div>
              <span class="text-[13px] text-[#666]">
                clone project
              </span>
            </div>

            <div class="flex gap-4">
              <a routerLink="/pages/privacy"
                 class="text-[13px] text-[#666] 
                        hover:text-[#0C831F] transition">
                Privacy Policy
              </a>
              <a routerLink="/pages/terms"
                 class="text-[13px] text-[#666] 
                        hover:text-[#0C831F] transition">
                Terms
              </a>
              <a routerLink="/pages/contact"
                 class="text-[13px] text-[#666] 
                        hover:text-[#0C831F] transition">
                Contact
              </a>
            </div>

          </div>

        </div>
      }

      <!-- Related pages -->
      @if (!isLoading() && page()) {
        <div class="mt-6 grid grid-cols-2 
                    md:grid-cols-4 gap-3">
          @for (link of relatedPages(); track link.slug) {
            <a [routerLink]="['/pages', link.slug]"
               class="bg-white rounded-[14px] 
                      border border-[#F0F0F0] p-4
                      hover:border-[#0C831F] 
                      hover:shadow-card transition
                      flex flex-col items-center 
                      text-center cursor-pointer group">
              <span class="material-icons text-[28px] 
                           text-[#CCC] mb-2 
                           group-hover:text-[#0C831F] 
                           transition">
                {{link.icon}}
              </span>
              <span class="text-[13px] font-semibold 
                           text-[#1A1A1A] 
                           group-hover:text-[#0C831F] 
                           transition">
                {{link.title}}
              </span>
            </a>
          }
        </div>
      }

    </div>
  `
})
export class DynamicPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly pagesService = inject(PagesService);

  readonly page = signal<PageContent | null>(null);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const slug = params['slug'];
      if (slug) {
        this.loadPage(slug);
      }
    });
  }

  private loadPage(slug: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.pagesService.getPage(slug).subscribe({
      next: (data) => {
        this.page.set(data);
        this.isLoading.set(false);
        // Update browser tab title
        document.title = `${data.title} — Blinkit Clone`;
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: () => {
        this.error.set('Page not found');
        this.isLoading.set(false);
      }
    });
  }

  toAnchor(heading: string): string {
    return heading
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  splitContent(content: string): string[] {
    // Split by newlines for multi-paragraph content
    return content.split('\n').filter(l => l.trim());
  }

  readonly relatedPages = computed(() => {
    const current = this.page()?.slug;
    const all = [
      { slug: 'about', title: 'About Us', icon: 'info' },
      { slug: 'careers', title: 'Careers', icon: 'work' },
      { slug: 'press', title: 'Press', icon: 'newspaper' },
      { slug: 'blog', title: 'Blog', icon: 'article' },
      { slug: 'contact', title: 'Contact', icon: 'mail' },
      { slug: 'privacy', title: 'Privacy', icon: 'security' },
      { slug: 'terms', title: 'Terms', icon: 'gavel' },
    ];
    // Show 4 pages that are NOT current
    return all
      .filter(p => p.slug !== current)
      .slice(0, 4);
  });
}
