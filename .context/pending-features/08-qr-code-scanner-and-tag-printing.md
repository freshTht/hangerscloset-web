# Feature 08: QR Code Scanner & Physical Hanger Tag Printing

- **Priority**: Rank #8 (Showroom Operations & In-Store Speed)
- **RICE Score**: **3.4** (Reach: 6, Impact: 2, Confidence: 85%, Effort: 3.0)
- **Status**: Ready for `/plan`

---

## 1. Problem Statement & Business Benefit
In a physical clothing boutique or warehouse with 100+ garments hanging on racks, many dresses looks visually similar (e.g. multiple pink off-shoulder satin gowns from different brands or sizes). When a customer walks in to try on or return a dress, staff have to search through text lists.

### Key Benefits:
- **Instant Scan-to-Sheet**: Staff points their mobile phone camera at a QR code on the hanger; the web app immediately opens that item's detail/edit sheet with zero typing.
- **Physical Hanger Label Sheet Generator**: Generates print-ready PDF/HTML sheets formatted for standard sticker/card label sizes (e.g. Avery 8-label or thermal tag printer) containing:
  - SKU Code (e.g. `AVL01`)
  - QR Code encoding item web link or SKU
  - Brand & Item Name
  - Size & Color
  - Rental Prices (1 วัน, 3 วัน, 5 วัน)

---

## 2. User Scenarios & UX Flow

### A. Scanning a Garment (In-Store Checkout / Return)
1. Staff taps the camera scan button (`qr_code_scanner`) in the navigation bar or top header.
2. A lightweight in-browser camera viewfinder dialog opens (using `html5-qrcode` or BarcodeDetector API).
3. The camera identifies the QR tag (e.g. `AVL01`) in $<500\text{ms}$.
4. Haptic vibration feedback confirms the scan, viewfinder closes, and the item sheet for `AVL01` opens instantly.

### B. Printing Hanger Tags
1. From Inventory Selection Mode (Feature 03) or an individual item sheet, staff clicks **"พิมพ์ป้ายแขวน (Print Hanger Tags)"**.
2. A print preview dialog displays formatted hanger cards:
   - Option to select paper size: `A4 (8 ป้ายต่อแผ่น)` or `Thermal Tag Printer (50x80mm)`.
3. Clicking **"พิมพ์ (Print)"** triggers native browser `window.print()` with `@media print` CSS rules hiding all navigation and displaying crisp black-and-white tags.

---

## 3. Technical Architecture

- **Scanning**: Lightweight web camera scanner utilizing the browser `BarcodeDetector` API with `html5-qrcode` fallback for iOS Safari.
- **QR Generation**: Client-side QR generation using `qrcode` or `qrcode.react` (renders SVG or Canvas directly in DOM without external image API calls).
- **Deep Linking**: QR code encodes a clean direct URL: `https://hangerscloset.web.app/inventory?code=AVL01`.

---

## 4. UI Implementation Guidelines (Beer CSS)
- **Scan Trigger Button**:
  - Outlined circular icon button on mobile app bar: `<button className="circle transparent"><i>qr_code_scanner</i></button>`.
- **Viewfinder Modal**:
  - Full-screen or large modal with camera feed, guide reticle, and flash/torch toggle.
- **Print Styles**:
  - Clean `@media print` stylesheet isolating `.hanger-tag` elements, ensuring page breaks after each tag or sheet.

---

## 5. Acceptance Criteria
- [ ] Mobile camera scanner recognizes QR codes and automatically routes to the scanned item.
- [ ] QR code generator creates high-contrast, easily scannable codes for all item SKUs.
- [ ] Print preview arranges hanger tags on standard grid layouts without page overflow.
- [ ] Works offline/locally with zero external server dependencies for QR generation.

---

## 6. Agent Kickoff Prompt
```text
Please implement Feature 08: QR Code Scanner & Physical Hanger Tag Printing as defined in .context/pending-features/08-qr-code-scanner-and-tag-printing.md.
First, run /plan to design the camera scanner dialog, QR code generator component, print-ready CSS layout, and toolbar scan trigger. Ensure high performance and touch ergonomics.
```
