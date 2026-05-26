import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { ImageUploadService } from '../../../core/services/image-upload.service';

/**
 * Reusable dual-mode image picker.
 *
 * Upload tab  — drag-and-drop / click-to-browse with live preview,
 *               replace button, and upload badge.
 * URL tab     — plain text URL entry with live preview + tips.
 *
 * ADD-mode flow (entityId === ''):
 *   The selected file is held in pendingFile().
 *   The parent calls uploadPendingFile(realId) after the entity is saved
 *   to finalise the upload and receive the permanent URL.
 *
 * EDIT-mode flow (entityId known):
 *   File uploads happen immediately; the real URL is emitted straight away.
 */
@Component({
  selector: 'app-image-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-3">

      <!-- Label -->
      @if (label) {
        <label class="text-[13px] font-semibold text-[#1A1A1A]">{{ label }}</label>
      }

      <!-- Mode toggle -->
      <div class="flex bg-[#F8F8F8] rounded-[10px] p-1">
        <button type="button"
          (click)="mode.set('upload')"
          [class]="'flex-1 py-2 rounded-[8px] text-[13px] font-semibold transition ' +
                    (mode() === 'upload'
                      ? 'bg-white shadow-sm text-[#1A1A1A]'
                      : 'text-[#666] hover:text-[#1A1A1A]')">
          📁 Upload File
        </button>
        <button type="button"
          (click)="mode.set('url')"
          [class]="'flex-1 py-2 rounded-[8px] text-[13px] font-semibold transition ' +
                    (mode() === 'url'
                      ? 'bg-white shadow-sm text-[#1A1A1A]'
                      : 'text-[#666] hover:text-[#1A1A1A]')">
          🔗 Image URL
        </button>
      </div>

      <!-- ───────────── UPLOAD MODE ───────────── -->
      @if (mode() === 'upload') {

        @if (!previewUrl()) {
          <!-- Drop zone (shown when no image selected yet) -->
          <div
            (click)="fileInput.click()"
            (drop)="onDrop($event)"
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave()"
            [class]="'border-2 border-dashed rounded-[14px] p-6 text-center cursor-pointer transition select-none ' +
                      (isDragOver()
                        ? 'border-[#0C831F] bg-[#F0FFF4]'
                        : 'border-[#E0E0E0] hover:border-[#0C831F] hover:bg-[#F8FFF8]')">
            <div class="w-12 h-12 bg-[#F0FFF4] rounded-full flex items-center justify-center mx-auto mb-3">
              <span class="material-icons text-[24px] text-[#0C831F]">cloud_upload</span>
            </div>
            <p class="text-[14px] font-semibold text-[#1A1A1A] mb-1">
              Click to upload or drag &amp; drop
            </p>
            <p class="text-[12px] text-[#999]">JPG, PNG, WebP · Max 5 MB</p>

            <input #fileInput type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              class="hidden"
              (change)="onFileSelect($event)" />
          </div>
        }

        @if (previewUrl()) {
          <!-- Preview card (shown after image is selected / uploaded) -->
          <div class="relative rounded-[14px] overflow-hidden border border-[#E0E0E0] bg-[#F8F8F8]"
               style="height: 200px;">

            <img [src]="previewUrl()" [alt]="label"
                 class="w-full h-full object-contain p-2"
                 (error)="previewUrl.set('')" />

            <!-- Uploading overlay -->
            @if (isUploading()) {
              <div class="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                <div class="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <p class="text-white text-[13px] font-semibold">Uploading…</p>
              </div>
            }

            <!-- Action buttons (Replace / Remove) -->
            @if (!isUploading()) {
              <div class="absolute top-2 right-2 flex gap-2">
                <button type="button"
                  (click)="fileInput2.click()"
                  class="bg-white rounded-[8px] px-3 py-1.5 text-[12px] font-semibold text-[#1A1A1A]
                         shadow-sm hover:bg-[#F8F8F8] transition flex items-center gap-1">
                  <span class="material-icons text-[14px]">swap_horiz</span>
                  Replace
                </button>
                <button type="button"
                  (click)="removeImage()"
                  class="bg-white rounded-[8px] px-2 py-1.5 text-[12px] font-semibold text-[#F44336]
                         shadow-sm hover:bg-[#FFEBEE] transition flex items-center justify-center">
                  <span class="material-icons text-[14px]">delete</span>
                </button>
              </div>
            }

            <!-- Source badge -->
            @if (!isUploading()) {
              <div class="absolute bottom-2 left-2">
                @if (uploadService.isUploadedImage(previewUrl())) {
                  <span class="bg-[#0C831F] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    📁 Uploaded
                  </span>
                } @else {
                  <span class="bg-[#1565C0] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    🔗 URL
                  </span>
                }
              </div>
            }

            <!-- Hidden input for Replace -->
            <input #fileInput2 type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              class="hidden"
              (change)="onFileSelect($event)" />
          </div>
        }
      }

      <!-- ───────────── URL MODE ───────────── -->
      @if (mode() === 'url') {
        <div class="space-y-3">

          <!-- URL text input -->
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-[18px] text-[#999]">
              link
            </span>
            <input type="url"
              [value]="urlInput()"
              (input)="onUrlChange($any($event.target).value)"
              placeholder="https://images.unsplash.com/..."
              class="w-full pl-9 pr-4 h-[44px] border border-[#E0E0E0] rounded-[10px]
                     text-[14px] outline-none focus:border-[#0C831F] transition bg-white" />
          </div>

          <!-- URL preview -->
          @if (previewUrl() && mode() === 'url') {
            <div class="relative rounded-[14px] overflow-hidden border border-[#E0E0E0] bg-[#F8F8F8]"
                 style="height: 160px;">
              <img [src]="previewUrl()" [alt]="label"
                   class="w-full h-full object-contain p-2"
                   (error)="previewUrl.set('')" />

              <div class="absolute top-2 right-2">
                <button type="button"
                  (click)="removeImage()"
                  class="bg-white rounded-[8px] px-2 py-1 text-[12px] text-[#F44336]
                         shadow-sm hover:bg-[#FFEBEE] transition flex items-center gap-1">
                  <span class="material-icons text-[14px]">close</span>
                  Clear
                </button>
              </div>

              <div class="absolute bottom-2 left-2">
                <span class="bg-[#1565C0] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  🔗 URL Image
                </span>
              </div>
            </div>
          }

          <!-- Tips -->
          <div class="bg-[#F8F8F8] rounded-[10px] p-3">
            <p class="text-[11px] text-[#666] font-semibold mb-1">💡 Free image URLs:</p>
            <p class="text-[11px] text-[#999]">
              Unsplash: https://images.unsplash.com/photo-xxx?w=400&amp;h=400&amp;fit=crop
            </p>
            <p class="text-[11px] text-[#999]">
              Picsum: https://picsum.photos/seed/word/400/400
            </p>
          </div>
        </div>
      }

      <!-- ───────────── Error ───────────── -->
      @if (uploadError()) {
        <div class="flex items-center gap-2 bg-[#FFEBEE] rounded-[10px] px-3 py-2">
          <span class="material-icons text-[#F44336] text-[16px]">error_outline</span>
          <p class="text-[12px] text-[#F44336] font-medium">{{ uploadError() }}</p>
        </div>
      }

    </div>
  `,
})
export class ImagePickerComponent implements OnInit {
  @Input() entityId = '';
  @Input() entityType: 'product' | 'category' | 'variant' = 'product';
  @Input() currentImageUrl = '';
  @Input() label = '';
  @Output() readonly imageUrlChange = new EventEmitter<string>();

  // `protected` so the template can call uploadService.isUploadedImage()
  protected readonly uploadService = inject(ImageUploadService);

  readonly mode        = signal<'upload' | 'url'>('upload');
  readonly previewUrl  = signal('');
  readonly urlInput    = signal('');
  readonly isUploading = signal(false);
  readonly uploadError = signal<string | null>(null);
  readonly isDragOver  = signal(false);
  readonly pendingFile = signal<File | null>(null);

  ngOnInit(): void {
    this.previewUrl.set(this.currentImageUrl);
    // Switch to URL mode when the existing image is not an uploaded file
    if (this.currentImageUrl && !this.uploadService.isUploadedImage(this.currentImageUrl)) {
      this.mode.set('url');
      this.urlInput.set(this.currentImageUrl);
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.handleFile(file);
    input.value = ''; // reset so the same file can be re-selected
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.handleFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(): void {
    this.isDragOver.set(false);
  }

  private handleFile(file: File): void {
    const error = this.uploadService.validateFile(file);
    if (error) { this.uploadError.set(error); return; }

    this.uploadError.set(null);

    // Show a local DataURL preview immediately — zero latency
    const reader = new FileReader();
    reader.onload = (e) => this.previewUrl.set(e.target?.result as string);
    reader.readAsDataURL(file);

    if (this.entityId) {
      this.doUpload(file);
    } else {
      // Entity not saved yet — hold the file and emit a temporary blob URL
      this.pendingFile.set(file);
      this.imageUrlChange.emit(URL.createObjectURL(file));
    }
  }

  private doUpload(file: File): void {
    this.isUploading.set(true);
    this.uploadFile$(file).subscribe({
      next: (url) => {
        this.previewUrl.set(url);
        this.imageUrlChange.emit(url);
        this.isUploading.set(false);
        this.pendingFile.set(null);
      },
      error: () => {
        this.uploadError.set('Upload failed. Please try again.');
        this.isUploading.set(false);
      },
    });
  }

  onUrlChange(url: string): void {
    this.urlInput.set(url);
    this.previewUrl.set(url);
    this.imageUrlChange.emit(url);
  }

  removeImage(): void {
    this.previewUrl.set('');
    this.urlInput.set('');
    this.pendingFile.set(null);
    this.imageUrlChange.emit('');
  }

  /**
   * Called by the parent after the entity has been persisted and its real ID is known.
   * Uploads any pending file and emits the permanent URL.
   * Returns of(previewUrl()) immediately when there is no pending file.
   */
  uploadPendingFile(entityId: string): Observable<string> {
    const file = this.pendingFile();
    if (!file) return of(this.previewUrl());

    this.entityId = entityId;
    return this.uploadFile$(file).pipe(
      map((url) => {
        this.previewUrl.set(url);
        this.pendingFile.set(null);
        return url;
      }),
    );
  }

  private uploadFile$(file: File): Observable<string> {
    if (this.entityType === 'category') {
      return this.uploadService.uploadCategoryImage(this.entityId, file).pipe(map(r => r.url));
    }
    if (this.entityType === 'variant') {
      return this.uploadService.uploadVariantImage(this.entityId, file).pipe(map(r => r.url));
    }
    return this.uploadService.uploadProductImage(this.entityId, file).pipe(map(r => r.url));
  }
}
