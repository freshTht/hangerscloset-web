# Feature 10: Rental Analytics & Utilization Dashboard

- **Priority**: Rank #10 (Strategic Business Intelligence)
- **RICE Score**: **2.1** (Reach: 4, Impact: 2, Confidence: 80%, Effort: 3.0)
- **Status**: Ready for `/plan`

---

## 1. Problem Statement & Business Benefit
Without business intelligence, boutique owners guess which dresses to buy or restock. Questions like *"Should we buy more Feelfree beach sets or Serlyn evening gowns?"* or *"What is our fleet utilization rate this weekend?"* cannot be answered accurately from raw inventory lists.

### Key Benefits:
- **Fleet Utilization Rate**: Measures percentage of total wardrobe currently generating rental revenue.
- **Top Performing Garments**: Highlights top 10 most rented dresses and highest revenue earners.
- **Dead Stock Alert**: Flags garments that haven't been rented in >60 days so staff can run promotions or return to consignors.
- **Size & Color Demand Heatmap**: Shows which sizes (S, M, L) and colors (Pink, White, Black) have the highest demand.

---

## 2. Key Metrics & Visual Dashboard

```
+-----------------------------------------------------------------+
|  รายได้ประจำเดือน (October 2026)      ชุดที่ถูกเช่าอยู่ในขณะนี้     |
|  ฿ 48,500 (+18% จากเดือนก่อน)          18 / 43 ชุด (41.8% Utilization)|
+-----------------------------------------------------------------+
|  [ กราฟแท่งรายได้ 7 วันย้อนหลัง / Weekly Revenue Trend ]          |
+-----------------------------------------------------------------+
|  🏆 Top 5 ชุดยอดนิยม (Most Rented)   ⚠️ ชุดที่ไม่ถูกเช่านาน (Dead Stock)|
|  1. AVL01 (Avaalene Blue) - 8 ครั้ง  1. TBB07 - ไม่มีการเช่า 75 วัน     |
|  2. FFR01 (Feelfree Set)  - 6 ครั้ง  2. PRI01 - ไม่มีการเช่า 62 วัน     |
|  3. SER02 (Serlyn Pink)   - 5 ครั้ง  3. SH02  - ไม่มีการเช่า 58 วัน     |
+-----------------------------------------------------------------+
|  ความต้องการตามแบรนด์ (Brand Share)   ความต้องการตามไซส์ (Size Share) |
|  Avaalene: 28%                       Size S: 44%                        |
|  Feelfree: 22%                       Size M: 36%                        |
|  Serlyn:   19%                       Size L: 14%                        |
+-----------------------------------------------------------------+
```

---

## 3. Architecture & Data Aggregation

- **Pure Client Aggregation / Cloud Function**: Computes metrics dynamically from `orders` and `inventory` collections without heavy external analytics SDKs.
- **Lightweight SVG / Beer CSS Charts**: Uses native CSS bars / Beer CSS grid meter shapes or lightweight charts (`xychart-beta` / SVG bars) to avoid bundling heavy chart libraries (maintaining fast bundle size).
- **Time Window Filters**: `สัปดาห์นี้ (This Week)`, `เดือนนี้ (This Month)`, `3 เดือนย้อนหลัง (Quarter)`.

---

## 4. UI Implementation Guidelines (Beer CSS)
- **Stat Cards**:
  `<div className="card fill surface-container-low round padding">`
  with Beer CSS `.h4` typography and sub-labels.
- **Bar Meters**:
  `<progress className="max" value={percentage} max="100"></progress>`
  or custom responsive flex bars styled with theme colors (`var(--primary)`).
- **No Radial Spinners**: Never use `progress.circle`.

---

## 5. Acceptance Criteria
- [ ] Displays overall revenue, booking count, and utilization percentage for selected periods.
- [ ] Correctly identifies top rented garments and idle inventory.
- [ ] Breaks down rental volume by brand, size, and category tags.
- [ ] Respects light and dark mode color palettes seamlessly.
- [ ] Operates smoothly in both mock and Firebase modes.

---

## 6. Agent Kickoff Prompt
```text
Please implement Feature 10: Rental Analytics & Utilization Dashboard as specified in .context/pending-features/10-rental-analytics-and-utilization-dashboard.md.
First, run /plan to design the analytics metrics aggregation pipeline, lightweight SVG/Beer CSS chart widgets, date period selector, and the dedicated Analytics page. Ensure strict compliance with mobile-first guidelines.
```
