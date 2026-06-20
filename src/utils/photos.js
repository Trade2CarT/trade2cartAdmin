// Vendor photo fields are inconsistent across schema versions:
// newer registrations use `profilePhotoURL` / `aadhaarPhotoURL` / `panPhotoURL`,
// older/seed data uses `profilePhoto` / `aadhaarPhoto` / `panPhoto`.
// These helpers resolve whichever exists so photos always show when present.

export const vendorPhotoUrl = (v) =>
    v?.profilePhotoURL || v?.profilePhoto || v?.photoURL || v?.photo || '';

export const docPhotoUrl = (v, key) =>
    v?.[`${key}PhotoURL`] || v?.[`${key}Photo`] || '';
