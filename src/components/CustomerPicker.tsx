import React, { useState, useRef, useEffect } from 'react';
import type { Customer } from '../types/customer';
import type { NewCustomerInput } from '../services/customers';
import { matchesCustomerQuery } from '../services/customers';
import { Stack } from './Stack';

export interface CustomerPickerProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
  onCreateCustomer: (data: NewCustomerInput) => Promise<Customer>;
}

export const CustomerPicker: React.FC<CustomerPickerProps> = ({
  customers,
  selectedCustomer,
  onSelectCustomer,
  onCreateCustomer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newLineId, setNewLineId] = useState('');
  const [newNote, setNewNote] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [savingCustomer, setSavingCustomer] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: Event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const filteredCustomers = customers.filter((c) =>
    matchesCustomerQuery(c, searchTerm)
  );

  const handleOpenCreateForm = () => {
    const trimmed = searchTerm.trim();
    const looksLikePhone = /^[0-9-\s+]{4,}$/.test(trimmed);
    setNewName(looksLikePhone ? '' : trimmed);
    setNewPhone(looksLikePhone ? trimmed : '');
    setNewLineId('');
    setNewNote('');
    setCreateError(null);
    setIsDropdownOpen(false);
    setIsCreatingNew(true);
  };

  const handleSaveNewCustomer = async () => {
    setCreateError(null);
    const trimmedName = newName.trim();
    const trimmedPhone = newPhone.trim();

    if (!trimmedName || !trimmedPhone) {
      setCreateError('กรุณากรอกชื่อลูกค้าและเบอร์โทรศัพท์');
      return;
    }

    try {
      setSavingCustomer(true);
      const created = await onCreateCustomer({
        name: trimmedName,
        phone: trimmedPhone,
        lineId: newLineId.trim() || null,
        note: newNote.trim() || null,
      });
      onSelectCustomer(created);
      setIsCreatingNew(false);
      setSearchTerm('');
    } catch (err: unknown) {
      setCreateError(
        err instanceof Error ? err.message : 'ไม่สามารถเพิ่มลูกค้าใหม่ได้'
      );
    } finally {
      setSavingCustomer(false);
    }
  };

  if (selectedCustomer && !isCreatingNew) {
    return (
      <article className="border round surface-container-low small-padding no-margin">
        <Stack
          orientation="row"
          align="center"
          justify="space-between"
          gap="small"
        >
          <Stack orientation="row" align="center" gap="small">
            <i className="primary-text">person</i>
            <Stack orientation="column" gap="none">
              <span className="bold">{selectedCustomer.name}</span>
              <span className="small-text secondary-text">
                {selectedCustomer.phone}
                {selectedCustomer.lineId
                  ? ` • Line: ${selectedCustomer.lineId}`
                  : ''}
              </span>
            </Stack>
          </Stack>
          <button
            type="button"
            className="border small round no-margin"
            onClick={() => {
              onSelectCustomer(null);
              setSearchTerm('');
              setIsDropdownOpen(true);
            }}
            aria-label="เปลี่ยนลูกค้า"
          >
            <i>swap_horiz</i>
            <span>เปลี่ยนลูกค้า</span>
          </button>
        </Stack>
      </article>
    );
  }

  if (isCreatingNew) {
    return (
      <article className="border round surface-container-low medium-padding no-margin">
        <Stack orientation="column" gap="medium">
          <Stack orientation="row" align="center" justify="space-between">
            <Stack orientation="row" align="center" gap="small">
              <i className="primary-text">person_add</i>
              <span className="bold">เพิ่มลูกค้าใหม่</span>
            </Stack>
            <button
              type="button"
              className="circle transparent small no-margin"
              onClick={() => setIsCreatingNew(false)}
              aria-label="ยกเลิกการเพิ่มลูกค้าใหม่"
            >
              <i>close</i>
            </button>
          </Stack>

          {createError && (
            <p className="error-text small-text no-margin">{createError}</p>
          )}

          <div className="grid no-margin" style={{ gap: '12px' }}>
            <div className="s12 m6">
              <div className="field label border round no-margin">
                <input
                  id="new-customer-name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder=" "
                />
                <label htmlFor="new-customer-name">ชื่อลูกค้า *</label>
                <i>person</i>
              </div>
            </div>

            <div className="s12 m6">
              <div className="field label border round no-margin">
                <input
                  id="new-customer-phone"
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder=" "
                />
                <label htmlFor="new-customer-phone">เบอร์โทรศัพท์ *</label>
                <i>call</i>
              </div>
            </div>

            <div className="s12 m6">
              <div className="field label border round no-margin">
                <input
                  id="new-customer-line"
                  type="text"
                  value={newLineId}
                  onChange={(e) => setNewLineId(e.target.value)}
                  placeholder=" "
                />
                <label htmlFor="new-customer-line">Line ID</label>
                <i>chat</i>
              </div>
            </div>

            <div className="s12 m6">
              <div className="field label border round no-margin">
                <input
                  id="new-customer-note"
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder=" "
                />
                <label htmlFor="new-customer-note">หมายเหตุ</label>
                <i>sticky_note_2</i>
              </div>
            </div>
          </div>

          <Stack orientation="row" justify="flex-end" gap="small">
            <button
              type="button"
              className="border small round no-margin"
              onClick={() => setIsCreatingNew(false)}
              disabled={savingCustomer}
            >
              ยกเลิก
            </button>
            <button
              type="button"
              className="primary small round no-margin"
              onClick={handleSaveNewCustomer}
              disabled={savingCustomer}
            >
              {savingCustomer ? (
                <div className="shape loading-indicator small" role="status" />
              ) : (
                <>
                  <i>check</i>
                  <span>บันทึกลูกค้าใหม่</span>
                </>
              )}
            </button>
          </Stack>
        </Stack>
      </article>
    );
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <Stack orientation="row" align="center" gap="small">
        <div className="max field label border round no-margin">
          <input
            id="customer-search-input"
            type="search"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            onClick={() => setIsDropdownOpen(true)}
            placeholder=" "
            autoComplete="off"
          />
          <label htmlFor="customer-search-input">
            ค้นหาลูกค้า (เบอร์โทร หรือ ชื่อ) *
          </label>
          <i>person_search</i>
        </div>
        <button
          type="button"
          className="border round no-margin"
          onClick={handleOpenCreateForm}
          title="เพิ่มลูกค้าใหม่"
          style={{ flexShrink: 0 }}
        >
          <i>person_add</i>
          <span>+ เพิ่มลูกค้าใหม่</span>
        </button>
      </Stack>

      {isDropdownOpen && (
        <div
          className="card surface-container-high round small-padding no-margin medium-elevate"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 100,
            maxHeight: '260px',
            overflowY: 'auto',
          }}
        >
          <Stack orientation="column" gap="tiny">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((cust) => (
                <button
                  key={cust.id}
                  type="button"
                  className="transparent round left-align no-margin"
                  onClick={() => {
                    onSelectCustomer(cust);
                    setIsDropdownOpen(false);
                    setSearchTerm('');
                  }}
                  style={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    minHeight: '48px',
                    padding: '8px 12px',
                  }}
                >
                  <i>person</i>
                  <span className="max left-align">
                    <span className="bold">{cust.name}</span>
                    <span className="small-text secondary-text">
                      {' '}
                      • {cust.phone}
                      {cust.lineId ? ` • ${cust.lineId}` : ''}
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <div className="center-align small-padding">
                <p className="small-text secondary-text no-margin">
                  ไม่พบข้อมูลลูกค้าที่ค้นหา
                </p>
              </div>
            )}

            <button
              type="button"
              className="border small round no-margin"
              onClick={handleOpenCreateForm}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <i>add</i>
              <span>+ เพิ่มลูกค้าใหม่</span>
            </button>
          </Stack>
        </div>
      )}
    </div>
  );
};
