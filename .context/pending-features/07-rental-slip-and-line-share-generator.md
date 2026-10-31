# Feature 07: Rental Slip & Line Share Generator

- **Priority**: Rank #7 (Customer Communication & Social Commerce)
- **RICE Score**: **5.8** (Reach: 8, Impact: 2, Confidence: 90%, Effort: 2.5)
- **Status**: Ready for `/plan`

---

## 1. Problem Statement & Business Benefit
In Thailand and Southeast Asia, clothing rental businesses conduct most customer interactions through **Line Official Account (Line OA)**, Instagram Direct Message, and Facebook Messenger. 

When a customer books a dress, staff currently take manual screenshots, scribble prices in photo editing apps, or copy-paste text blocks. This looks unprofessional, takes 5–10 minutes per booking, and leads to mistakes in bank account numbers, dates, or deposit amounts.

### Key Benefits:
- **Instant Brand Slip Creation**: Generates a branded, elegant booking slip card in 1 click.
- **One-Tap Share & Copy**: Directly copies the rendered image to the system clipboard or triggers native Web Share API (`navigator.share`) on mobile devices to send straight into Line chat.
- **Clear Rental Terms**: Includes standard terms (dry cleaning rules, late return penalty per day, and deposit refund instructions) on the slip to prevent customer disputes.

---

## 2. Slip Content & Visual Layout

The generated slip is designed in standard 4:5 vertical aspect ratio (ideal for mobile phone screens and Line chats):

```
+---------------------------------------------------+
|               HANGER'S CLOSET                     |
|           ใบยืนยันการเช่าชุด (RENTAL SLIP)           |
+---------------------------------------------------+
|  [ Dress Photo ]     รหัส: AVL01                  |
|  (Aspect 1:1)        ชื่อ: Avaalene Blue Gown     |
|                      แบรนด์: Avaalene             |
|                      ไซส์: M | สี: Blue            |
+---------------------------------------------------+
|  ผู้เช่า: คุณพลอยไพลิน (Line: ploy_2026)          |
|  วันรับชุด: 14 พ.ย. 2026 (วันศุกร์)                 |
|  วันคืนชุด: 16 พ.ย. 2026 (วันอาทิตย์)               |
|  ระยะเวลาเช่า: 3 วัน                               |
+---------------------------------------------------+
|  ค่าเช่าชุด (Rental Fee):                500 ฿    |
|  เงินมัดจำ (Security Deposit):         1,000 ฿    |
|  ยอดชำระรวม (Total Due):               1,500 ฿    |
+---------------------------------------------------+
|  การชำระเงิน: โอนผ่านธนาคารกสิกรไทย                  |
|  เลขที่บัญชี: xxx-x-xxxxx-x (บจก. แฮงเกอร์ส คลอเซ็ท)  |
+---------------------------------------------------+
|  * ข้อกำหนด: กรุณาอย่าซักเอง ทางร้านซักแห้งให้         |
|  * คืนเงินมัดจำภายใน 24 ชม. หลังตรวจรับสภาพชุด        |
+---------------------------------------------------+
```

---

## 3. Technical Architecture & Libraries

- **Image Generation**: Uses `html-to-image` or lightweight canvas renderer to convert the React DOM element into a crisp PNG (`scale: 2` for Retina sharpness).
- **Clipboard API**:
  ```ts
  const blob = await htmlToImage.toBlob(slipRef.current);
  await navigator.clipboard.write([
    new ClipboardItem({ 'image/png': blob })
  ]);
  ```
- **Web Share API**: Fallback on mobile browsers:
  ```ts
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({ files: [file], title: `Rental Slip - ${order.itemCode}` });
  }
  ```

---

## 4. UI Implementation Guidelines (Beer CSS)
- **Modal Preview**:
  - Displays the generated slip in a clean modal dialog (`dialog.modal`).
  - Action footer buttons:
    - **"คัดลอกรูปภาพ (Copy Image)"**: `<button className="primary round"><i>content_copy</i> คัดลอกรูป</button>`
    - **"แชร์ไปที่ Line (Share)"**: `<button className="border round"><i>share</i> แชร์</button>`
    - **"ดาวน์โหลด (Save)"**: `<button className="circle transparent"><i>download</i></button>`
- Toast notification confirming successful image copy: `<div className="snackbar active">คัดลอกใบจองเรียบร้อยแล้ว</div>`.

---

## 5. Acceptance Criteria
- [ ] Any booking order can generate a clean, branded booking slip in 1 click.
- [ ] Renders crisp text and images at 2x resolution.
- [ ] Desktop users can click "Copy" and immediately paste (`Ctrl+V` / `Cmd+V`) into Line Desktop or web chats.
- [ ] Mobile users can trigger native share sheet to Line, Instagram, or WhatsApp.
- [ ] Includes all dates, deposit amounts, pricing, and care instructions clearly.

---

## 6. Agent Kickoff Prompt
```text
Please implement Feature 07: Rental Slip & Line Share Generator as specified in .context/pending-features/07-rental-slip-and-line-share-generator.md.
First, run /plan to design the slip preview component, image rasterization pipeline, clipboard/share utilities, and action button integration in Orders and Item sheets.
```
