import React from 'react';
import ui from 'beercss';
import { InventoryCard } from '../components/InventoryCard';
import { InventoryCardSkeleton } from '../components/InventoryCardSkeleton';
import { useInventory } from '../hooks/useInventory';

export const InventoryPage: React.FC = () => {
  const { items, loading, error, provider } = useInventory();
  const itemCount = items.length;

  const openDialog = (id: string) => {
    void ui(`#${id}`);
  };

  const closeDialog = (id?: string) => {
    const dialogs = id
      ? [document.getElementById(id) as HTMLDialogElement | null]
      : [
          document.getElementById('dialog-coming-soon-s') as HTMLDialogElement | null,
          document.getElementById('dialog-coming-soon-m') as HTMLDialogElement | null,
        ];

    dialogs.forEach((dialog) => {
      if (dialog) {
        const overlay = dialog.previousElementSibling;
        if (overlay && overlay.classList.contains('overlay')) {
          overlay.classList.remove('active');
        }
        dialog.classList.remove('active');
        if (dialog.open) {
          dialog.close();
        }
      }
    });
  };

  const renderFloatingBar = (dialogId: string) => (
    <nav className="center-align tiny-space">
      <nav className="toolbar secondary-container medium-elevate">
        <span className="bold">{itemCount} ชุด</span>
        <button
          className="circle transparent no-margin"
          type="button"
          onClick={() => openDialog(dialogId)}
          aria-label="แก้ไข"
          title="แก้ไข"
        >
          <i>edit</i>
        </button>
        <button
          className="circle transparent no-margin"
          type="button"
          onClick={() => openDialog(dialogId)}
          aria-label="จัดเรียง"
          title="จัดเรียง"
        >
          <i>sort</i>
        </button>
      </nav>
      <button
        className="extra circle primary medium-elevate no-margin"
        type="button"
        onClick={() => openDialog(dialogId)}
        aria-label="เพิ่มชุด"
        title="เพิ่มชุด"
      >
        <i>add</i>
      </button>
    </nav>
  );

  const renderDialogContent = (dialogId: string) => (
    <>
      <h5>Coming soon</h5>
      <p>Thanks for your interest :)</p>
      <nav className="right-align">
        <button
          className="border"
          type="button"
          onClick={() => closeDialog(dialogId)}
        >
          ปิด
        </button>
      </nav>
    </>
  );

  return (
    <>
      {loading ? (
        <div className="grid" aria-busy="true" aria-label="กำลังโหลดรายการสินค้า">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="s12 m6 l4">
              <InventoryCardSkeleton />
            </div>
          ))}
        </div>
      ) : error ? (
        <article className="border error-container round margin">
          <div className="row items-center">
            <i className="error-text">error</i>
            <div className="max">
              <h6 className="bold no-margin error-text">เกิดข้อผิดพลาดในการโหลดข้อมูล</h6>
              <p className="no-margin secondary-text">{error.message}</p>
            </div>
          </div>
        </article>
      ) : items.length === 0 ? (
        <div className="center-align middle-align padding" style={{ minHeight: '50vh' }}>
          <i className="extra secondary-text">inventory_2</i>
          <h5 className="secondary-text">ไม่พบรายการเสื้อผ้าในคลัง</h5>
          <p className="secondary-text">
            {provider === 'firebase'
              ? 'คุณสามารถใช้คำสั่ง pnpm seed:firestore เพื่อนำเข้าข้อมูลจำลองเริ่มต้น'
              : 'ยังไม่มีข้อมูลในคลังสินค้า'}
          </p>
        </div>
      ) : (
        <div className="grid">
          {items.map((item) => (
            <div key={item.id} className="s12 m6 l4">
              <InventoryCard item={item} />
            </div>
          ))}
        </div>
      )}

      {/* Spacing using Beer CSS built-in helpers */}
      <div className="extra-space"></div>
      <div className="large-space"></div>

      {/* Small screens: centered floating bottom toolbar */}
      <div className="fixed bottom center margin front s">
        {renderFloatingBar('dialog-coming-soon-s')}
      </div>

      {/* Medium & Large screens: right-aligned floating bottom toolbar */}
      <div className="fixed bottom right margin front m l">
        {renderFloatingBar('dialog-coming-soon-m')}
      </div>

      {/* Small screens: Bottom Dialog */}
      <dialog id="dialog-coming-soon-s" className="bottom medium-padding s">
        {renderDialogContent('dialog-coming-soon-s')}
      </dialog>

      {/* Medium & Large screens: Default Centered Dialog */}
      <dialog id="dialog-coming-soon-m" className="medium-padding m l">
        {renderDialogContent('dialog-coming-soon-m')}
      </dialog>
    </>
  );
};
