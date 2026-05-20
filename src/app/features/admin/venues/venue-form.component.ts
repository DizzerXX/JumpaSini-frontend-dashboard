import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GoogleMap, MapMarker } from '@angular/google-maps';
import { VenueManagementService } from '../../../core/services/venue-management.service';
import { VENUE_TYPES, VenueModel } from '../../../core/models/venue.model';

@Component({
  selector: 'app-venue-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, GoogleMap, MapMarker],
  templateUrl: './venue-form.component.html',
  styleUrl: './venue-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VenueFormComponent implements OnInit {
  private readonly service = inject(VenueManagementService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly venueTypes = VENUE_TYPES;
  readonly editId = signal<string | null>(null);
  readonly isEdit = computed(() => this.editId() !== null);
  readonly loading = signal(false);
  readonly loadingVenue = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    address: ['', Validators.required],
    latitude: [3.139, [Validators.required, Validators.min(2.5), Validators.max(6.5)]],
    longitude: [101.6869, [Validators.required, Validators.min(99.5), Validators.max(104.5)]],
    type: ['mall', Validators.required],
    is_halal: [null as boolean | null],
    is_halal_verified: [false],
    google_place_id: [''],
    google_rating: [null as number | null],
    phone: [''],
    website: [''],
  });

  // Map state
  readonly mapCenter = computed<google.maps.LatLngLiteral>(() => ({
    lat: this.form.getRawValue().latitude,
    lng: this.form.getRawValue().longitude,
  }));

  readonly mapOptions: google.maps.MapOptions = {
    zoom: 14,
    disableDefaultUI: true,
    zoomControl: true,
  };

  readonly markerOptions: google.maps.MarkerOptions = { draggable: false };

  get markerPosition(): google.maps.LatLngLiteral {
    const v = this.form.getRawValue();
    return { lat: v.latitude, lng: v.longitude };
  }

  get isHalalValue(): boolean | null {
    return this.form.get('is_halal')?.value ?? null;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId.set(id);
      this.loadVenue(id);
    }

    // Disable is_halal_verified if is_halal is not true
    this.form.get('is_halal')?.valueChanges.subscribe((val) => {
      const verifiedCtrl = this.form.get('is_halal_verified');
      if (val !== true) {
        verifiedCtrl?.setValue(false);
        verifiedCtrl?.disable();
      } else {
        verifiedCtrl?.enable();
      }
    });
  }

  setIsHalal(value: boolean | null): void {
    this.form.patchValue({ is_halal: value });
  }

  submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);

    const raw = this.form.getRawValue();
    const payload = {
      name: raw.name,
      address: raw.address,
      latitude: Number(raw.latitude),
      longitude: Number(raw.longitude),
      type: raw.type as any,
      is_halal: raw.is_halal,
      is_halal_verified: raw.is_halal_verified,
      google_place_id: raw.google_place_id || null,
      google_rating: raw.google_rating,
      phone: raw.phone || null,
      website: raw.website || null,
    };

    const request$ = this.isEdit()
      ? this.service.updateVenue(this.editId()!, payload)
      : this.service.createVenue(payload);

    request$.subscribe({
      next: () => this.router.navigate(['/admin/venues']),
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to save venue.');
        this.loading.set(false);
      },
    });
  }

  private loadVenue(id: string): void {
    this.loadingVenue.set(true);
    // Fetch all venues and find the one — admin list returns all
    this.service.getVenues({ page: 1, per_page: 200 }).subscribe({
      next: (res) => {
        const venue = res.data.find((v: VenueModel) => v.id === id);
        if (venue) {
          this.form.patchValue({
            name: venue.name,
            address: venue.address,
            latitude: venue.latitude,
            longitude: venue.longitude,
            type: venue.type,
            is_halal: venue.is_halal,
            is_halal_verified: venue.is_halal_verified,
            google_place_id: venue.google_place_id ?? '',
            google_rating: venue.google_rating,
            phone: venue.phone ?? '',
            website: venue.website ?? '',
          });
        }
        this.loadingVenue.set(false);
      },
      error: () => this.loadingVenue.set(false),
    });
  }
}
