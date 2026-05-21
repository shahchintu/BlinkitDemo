import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import * as L from 'leaflet';
import { TrackingData } from '../../../core/services/tracking.service';

@Component({
  selector: 'app-delivery-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      [id]="mapId"
      class="w-full rounded-[16px] border border-[#E0E0E0]"
      style="height: 340px; overflow: hidden; position: relative;"
    ></div>
  `,
})
export class DeliveryMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() trackingData!: TrackingData;
  @Input() mapId = 'delivery-map';

  private map?: L.Map;
  private partnerMarker?: L.Marker;
  private retryCount = 0;

  ngAfterViewInit(): void {
    // Double rAF: first frame queues after JS, second fires after browser completes layout pass
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.initMap();
      });
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['trackingData'] && this.map) {
      this.updatePartnerMarker();
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private initMap(): void {
    if (!this.trackingData) return;

    // Guard: do not call L.map() until the container has real pixel dimensions
    const container = document.getElementById(this.mapId);
    if (!container || container.clientWidth === 0) {
      if (this.retryCount < 10) {
        this.retryCount++;
        setTimeout(() => this.initMap(), 100);
      }
      return;
    }

    const { darkStore, customerLocation } = this.trackingData;
    const centerLat = (darkStore.lat + customerLocation.lat) / 2;
    const centerLng = (darkStore.lng + customerLocation.lng) / 2;

    this.map = L.map(this.mapId, {
      center: [centerLat, centerLng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    // ESRI World Imagery — free satellite, no API key
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19, attribution: '© Esri' },
    ).addTo(this.map);

    // ESRI labels overlay — road/place names on top of satellite
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19, opacity: 0.8 },
    ).addTo(this.map);

    this.addMarkers();
    this.addRouteLine();
    this.fitBounds();
  }

  private addMarkers(): void {
    if (!this.map) return;
    const { darkStore, deliveryPartner, customerLocation } = this.trackingData;

    const storeIcon = L.divIcon({
      html: `<div style="background:#0C831F;width:36px;height:36px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:16px;">🏪</div>`,
      className: '',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    L.marker([darkStore.lat, darkStore.lng], { icon: storeIcon })
      .addTo(this.map)
      .bindPopup(`<b>${darkStore.name}</b><br>${darkStore.address}`);

    const partnerIcon = L.divIcon({
      html: `<div style="background:#F8C200;width:40px;height:40px;border-radius:50%;border:3px solid white;box-shadow:0 2px 12px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:20px;">🛵</div>`,
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    this.partnerMarker = L.marker([deliveryPartner.lat, deliveryPartner.lng], { icon: partnerIcon })
      .addTo(this.map)
      .bindPopup(`<b>${deliveryPartner.name}</b><br>Your delivery partner`);

    const customerIcon = L.divIcon({
      html: `<div style="background:#F44336;width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
      className: '',
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });

    L.marker([customerLocation.lat, customerLocation.lng], { icon: customerIcon })
      .addTo(this.map)
      .bindPopup('<b>Your Location</b>');
  }

  private addRouteLine(): void {
    if (!this.map) return;
    const { darkStore, customerLocation } = this.trackingData;

    L.polyline(
      [[darkStore.lat, darkStore.lng], [customerLocation.lat, customerLocation.lng]],
      { color: '#0C831F', weight: 3, opacity: 0.6, dashArray: '8, 8' },
    ).addTo(this.map);
  }

  private fitBounds(): void {
    if (!this.map) return;
    const { darkStore, customerLocation } = this.trackingData;

    this.map.fitBounds(
      [[darkStore.lat, darkStore.lng], [customerLocation.lat, customerLocation.lng]],
      { padding: [40, 40] },
    );
  }

  private updatePartnerMarker(): void {
    const { deliveryPartner } = this.trackingData;
    this.partnerMarker?.setLatLng([deliveryPartner.lat, deliveryPartner.lng]);
  }
}
