import React, { useState, useRef, useEffect } from 'react';
import type { Customer } from '../types/customer';
import { matchesCustomerQuery, type NewCustomerInput } from '../services/customers';
import { Stack } from './Stack';
import { useIsMobile } from '../hooks/useIsMobile';
import './CustomerPicker.css';

export interface CustomerPickerProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
  onCreateCustomer: (data: NewCustomerInput) => Promise<Customer>;
  disabled?: boolean;
}

export const CustomerPicker: React.FC<CustomerPickerProps> = ({
  customers,
  selectedCustomer,
  onSelectCustomer,
  onCreateCustomer,
  disabled = false,
}) => {
  const isMobile = useIsMobile();
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
      <article className="border surface-container-low small-padding no-margin">
        <div className="hc-customer-selected-row">
          <div className="hc-customer-selected-info">
            <i className="primary-text hc-customer-selected-icon">
              person
            </i>
            <div className="hc-customer-selected-details">
              <span className="bold truncate">{selectedCustomer.name}</span>
              <span className="small-text secondary-text truncate">
                {selectedCustomer.phone}
                {selectedCustomer.lineId
                  ? ` • Line: ${selectedCustomer.lineId}`
                  : ''}
              </span>
            </div>
          </div>
          {!disabled && (
            <button
              type="button"
              className="border small no-margin hc-customer-action-btn"
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
          )}
        </div>
      </article>
    );
  }

  if (isCreatingNew) {
    return (
      <article className="border surface-container-low hc-medium-padding no-margin">
        <Stack orientation="column" gap="medium">
          <div className="hc-customer-create-header">
            <div className="hc-customer-create-title">
              <i className="primary-text">person_add</i>
              <span className="bold">เพิ่มลูกค้าใหม่</span>
            </div>
            <button
              type="button"
              className="circle transparent small no-margin"
              onClick={() => setIsCreatingNew(false)}
              aria-label="ยกเลิกการเพิ่มลูกค้าใหม่"
            >
              <i>close</i>
            </button>
          </div>

          {createError && (
            <p className="error-text small-text no-margin">{createError}</p>
          )}

          <div className="grid no-margin hc-customer-form-grid">
            <div className="s12 m6">
              <div className="field label border no-margin">
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
              <div className="field label border no-margin">
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
              <div className="field label border no-margin">
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
              <div className="field label border no-margin">
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

          <div className="hc-customer-create-footer">
            <button
              type="button"
              className="border small no-margin hc-customer-action-btn"
              onClick={() => setIsCreatingNew(false)}
              disabled={savingCustomer}
            >
              ยกเลิก
            </button>
            <button
              type="button"
              className="primary small no-margin hc-customer-action-btn"
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
          </div>
        </Stack>
      </article>
    );
  }

  return (
    <div ref={containerRef} className="hc-customer-picker-container">
      <div className={`hc-customer-search-row ${isMobile ? 'mobile' : ''}`.trim()}>
        <div className="hc-customer-input-wrapper">
          <div className="field label prefix border no-margin max">
            <i className="front">person_search</i>
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
          </div>

          {isDropdownOpen && (
            <div className="card surface-container-high small-padding no-margin medium-elevate hc-customer-dropdown">
              <Stack orientation="column" gap="tiny">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((cust) => (
                    <button
                      key={cust.id}
                      type="button"
                      className="transparent left-align no-margin hc-customer-dropdown-item"
                      onClick={() => {
                        onSelectCustomer(cust);
                        setIsDropdownOpen(false);
                        setSearchTerm('');
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
                  className="border small no-margin hc-customer-dropdown-add-btn"
                  onClick={handleOpenCreateForm}
                >
                  <i>add</i>
                  <span>+ เพิ่มลูกค้าใหม่</span>
                </button>
              </Stack>
            </div>
          )}
        </div>

        <button
          type="button"
          className={`border no-margin medium-text hc-customer-add-btn ${isMobile ? 'mobile' : ''}`.trim()}
          onClick={handleOpenCreateForm}
          title="เพิ่มลูกค้าใหม่"
        >
          <i>person_add</i>
          <span>+ เพิ่มลูกค้าใหม่</span>
        </button>
      </div>
    </div>
  );
};
