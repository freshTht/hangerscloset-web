# Feature 03: Batch Edit & Selection Management Mode

- **Priority**: Rank #3 (Operational Efficiency)
- **RICE Score**: **6.3** (Reach: 7, Impact: 2, Confidence: 90%, Effort: 2.0)
- **Status**: Ready for `/plan`

---

## 1. Problem Statement & Business Benefit
Updating 20 items one-by-one is tedious and error-prone. In clothing rental operations, staff frequently need to perform batch actions:
- Seasonal tagging (e.g. adding the tag "Summer Collection" to 15 beach dresses).
- Brand-wide price adjustments (e.g. adjusting 1-day rental prices across a designer label).
- Bulk laundry/dry cleaning dispatch.
- Multi-item deletion or archiving.

The floating toolbar in [`InventoryPage.tsx`](file:///Users/fresh/Developers/_projects/_web/hangerscloset-web/src/pages/InventoryPage.tsx) already has an `edit` button (`<i>edit</i>`) explicitly reserved for this workflow.

---

## 2. User Scenarios & UX Flow

### A. Entering Selection Mode
1. Staff clicks the `edit` button in the bottom floating toolbar.
2. The UI enters **Selection Mode**:
   - The floating toolbar changes into a selection action bar:
     - Checkbox toggle: **"เลือกทั้งหมด (43)"** / **"ยกเลิก"**.
     - Selected count pill: **"เลือกแล้ว 5 ชุด"**.
     - Batch action buttons: **"แก้ไขพร้อมกัน"** (`edit_note`), **"ลบที่เลือก"** (`delete`).
   - Each `InventoryCard` reveals a top-left selection checkbox (`<i>check_box_outline_blank</i>` / `<i>check_box</i>`).
   - Tapping anywhere on a card toggles its selection instead of opening the item edit sheet.

### B. Batch Edit Modal
1. Staff selects 5 dresses and clicks **"แก้ไขพร้อมกัน"**.
2. A responsive Batch Edit sheet opens:
   - **ราคาเช่า**: Option to adjust prices by fixed amount (+50฿) or set a new price across all selected.
   - **แท็ก (Tags)**: Add new tags or remove existing tags from all selected items.
   - **สถานะ (Status)**: Batch update status (e.g. sent to laundry).
3. Clicking **"บันทึกการเปลี่ยนแปลง (5 ชุด)"** performs a batch commit in Firestore / mock repository.

---

## 3. Architecture & Data Flow

```ts
export interface BatchUpdatePayload {
  itemIds: string[];
  addTags?: string[];
  removeTags?: string[];
  rentalPricesUpdate?: {
    mode: 'set' | 'adjust';
    oneDay?: number;
    threeDays?: number;
    fiveDays?: number;
  };
  status?: InventoryStatus;
  noteAppend?: string;
}
```

### Repository Extension
```ts
export interface IInventoryRepository {
  // Existing methods...
  batchUpdateItems(payload: BatchUpdatePayload): Promise<void>;
  batchDeleteItems(itemIds: string[]): Promise<void>;
}
```

---

## 4. UI Implementation Guidelines (Beer CSS)
- **Card Selection Overlay**:
  - Selected cards gain `article.border.primary` or subtle primary background tint.
  - Floating circular checkbox positioned top-left over card photo:
    ```html
    <div className="absolute top left margin">
      <label className="checkbox">
        <input type="checkbox" checked={isSelected} onChange={...} />
        <span></span>
      </label>
    </div>
    ```
- **Contextual Selection Toolbar**:
  - Replaces bottom toolbar when `selectedIds.size > 0`:
    `<nav className="fixed bottom center margin front max surface-container-high round medium-elevate">`
- **Confirmation Dialog for Bulk Delete**:
  - Native Beer CSS dialog with warning accent (`dialog.modal`).

---

## 5. Security Rules Verification
- `firestore.rules` already supports updating individual inventory documents if `isAllowedUser()` passes.
- Batch writes via Firestore `writeBatch()` execute atomically within Firestore rule constraints.

---

## 6. Acceptance Criteria
- [ ] Clicking `edit` in toolbar toggles selection mode on/off.
- [ ] Tapping cards in selection mode selects/deselects with visual indicator.
- [ ] "Select All" / "Deselect All" buttons operate across all currently filtered items.
- [ ] Batch editing tags appends tags without removing existing distinct tags.
- [ ] Batch updating prices supports set-value or +/- adjustment.
- [ ] Batch deletion requires double confirmation.
- [ ] Full unit test coverage for selection hook and batch repository methods.

---

## 7. Agent Kickoff Prompt
```text
Please implement Feature 03: Batch Edit & Selection Management Mode as specified in .context/pending-features/03-batch-edit-and-selection-mode.md.
First, run /plan to design the selection state hook, InventoryCard selection overlay, batch action toolbar, and batchUpdateItems repository methods in both mock and Firestore providers. Adhere to Beer CSS standards and verify with pnpm test.
```
