import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface PageSection {
  heading: string;
  content: string;
}

export interface PageContent {
  slug: string;
  title: string;
  lastUpdated: string;
  sections: PageSection[];
}

@Injectable({ providedIn: 'root' })
export class PagesService {
  private readonly http = inject(HttpClient);

  getPage(slug: string): Observable<PageContent> {
    return this.http.get<PageContent>(
      `/api/pages/${slug}`
    ).pipe(
      catchError(() => throwError(
        () => new Error('Page not found')
      ))
    );
  }
}
