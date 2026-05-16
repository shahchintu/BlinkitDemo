import {
  ChangeDetectionStrategy, Component
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AccountSidebarComponent } from '../../../shared/components/account-sidebar/account-sidebar.component';

@Component({
  selector: 'app-account',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, AccountSidebarComponent],
  template: `
    <div class="bg-[#F0F0F5] min-h-screen">
      <div class="max-w-[1000px] mx-auto px-4 py-6 grid grid-cols-[240px_1fr] gap-6 items-start lg:grid-cols-[240px_1fr]">

        <!-- Left sidebar -->
        <app-account-sidebar class="self-start sticky top-24 block" />

        <!-- Right content: child route renders here -->
        <div>
          <router-outlet />
        </div>

      </div>
    </div>
  `,
})
export class AccountComponent {
}
