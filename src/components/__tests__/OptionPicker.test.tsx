import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OptionPicker } from '../OptionPicker';

describe('OptionPicker Component (Docked for all screen sizes)', () => {
  const mockOptions = ['Avaalene', 'Duex', 'Feelfree', 'Serlyn'];
  const onChangeSpy = vi.fn();
  const onAddOptionSpy = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input displaying value when closed', () => {
    render(
      <OptionPicker
        id="field-brand"
        name="brand"
        label="แบรนด์ *"
        icon="sell"
        value="Duex"
        options={mockOptions}
        onChange={onChangeSpy}
        onAddOption={onAddOptionSpy}
      />
    );

    const input = screen.getByLabelText(/แบรนด์/i);
    expect(input).toHaveAttribute('type', 'search');
    expect(input).toHaveValue('Duex');
    expect(screen.queryByText('Avaalene')).not.toBeInTheDocument();
  });

  it('opens docked dropdown on focus with empty search input and hint suggesting new ones can be added', () => {
    render(
      <OptionPicker
        id="field-brand"
        name="brand"
        label="แบรนด์ *"
        icon="sell"
        value="Duex"
        options={mockOptions}
        onChange={onChangeSpy}
        onAddOption={onAddOptionSpy}
      />
    );

    const input = screen.getByLabelText(/แบรนด์/i);
    // Focus opens the docked dropdown and resets search input to empty
    fireEvent.focus(input);
    expect(input).toHaveValue('');
    // Hint text suggests new options can be added
    expect(input).toHaveAttribute('placeholder', 'ค้นหา หรือเพิ่มแบรนด์ใหม่...');

    // All options are visible in the docked dropdown
    expect(screen.getByText('Avaalene')).toBeInTheDocument();
    expect(screen.getByText('Duex')).toBeInTheDocument();
    expect(screen.getByText('Feelfree')).toBeInTheDocument();
    expect(screen.getByText('Serlyn')).toBeInTheDocument();

    // Selected option has non-border primary styling with checkmark
    const selectedBtn = screen.getByRole('button', { name: /Duex/i });
    expect(selectedBtn).toHaveClass('primary');
    expect(selectedBtn).not.toHaveClass('border');

    // Unselected options have border styling
    const unselectedBtn = screen.getByRole('button', { name: 'Avaalene' });
    expect(unselectedBtn).toHaveClass('border');
    expect(unselectedBtn).not.toHaveClass('primary');
  });

  it('shows standard search placeholder when onAddOption is not provided', () => {
    render(
      <OptionPicker
        id="field-brand"
        name="brand"
        label="แบรนด์ *"
        icon="sell"
        value="Duex"
        options={mockOptions}
        onChange={onChangeSpy}
      />
    );

    const input = screen.getByLabelText(/แบรนด์/i);
    fireEvent.focus(input);
    expect(input).toHaveAttribute('placeholder', 'ค้นหาแบรนด์...');
  });

  it('scrolls down inside the menu to the selected chip when opened', async () => {
    const scrollIntoViewMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    render(
      <OptionPicker
        id="field-brand"
        name="brand"
        label="แบรนด์ *"
        icon="sell"
        value="Serlyn"
        options={mockOptions}
        onChange={onChangeSpy}
      />
    );

    const input = screen.getByLabelText(/แบรนด์/i);
    fireEvent.focus(input);

    // Wait for the smooth scroll timeout to trigger
    await waitFor(
      () => {
        expect(scrollIntoViewMock).toHaveBeenCalled();
      },
      { timeout: 300 }
    );
  });

  it('filters options in docked dropdown when typing in search field', () => {
    render(
      <OptionPicker
        id="field-brand"
        name="brand"
        label="แบรนด์ *"
        icon="sell"
        value=""
        options={mockOptions}
        onChange={onChangeSpy}
        onAddOption={onAddOptionSpy}
      />
    );

    const input = screen.getByLabelText(/แบรนด์/i);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'feel' } });

    expect(screen.getByText('Feelfree')).toBeInTheDocument();
    expect(screen.queryByText('Avaalene')).not.toBeInTheDocument();
    expect(screen.queryByText('Serlyn')).not.toBeInTheDocument();
    expect(onChangeSpy).toHaveBeenCalledWith('feel');
  });

  it('selects an option from docked dropdown on click and closes dropdown', () => {
    render(
      <OptionPicker
        id="field-brand"
        name="brand"
        label="แบรนด์ *"
        icon="sell"
        value=""
        options={mockOptions}
        onChange={onChangeSpy}
        onAddOption={onAddOptionSpy}
      />
    );

    const input = screen.getByLabelText(/แบรนด์/i);
    fireEvent.focus(input);

    const serlynBtn = screen.getByRole('button', { name: 'Serlyn' });
    fireEvent.click(serlynBtn);

    expect(onChangeSpy).toHaveBeenCalledWith('Serlyn');
    // Docked dropdown should close
    expect(screen.queryByRole('button', { name: 'Avaalene' })).not.toBeInTheDocument();
  });

  it('allows adding a new option in docked dropdown', async () => {
    render(
      <OptionPicker
        id="field-brand"
        name="brand"
        label="แบรนด์ *"
        icon="sell"
        value=""
        options={mockOptions}
        onChange={onChangeSpy}
        onAddOption={onAddOptionSpy}
      />
    );

    const input = screen.getByLabelText(/แบรนด์/i);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'NewBrand' } });

    const addBtn = screen.getByRole('button', { name: /เพิ่ม "NewBrand"/i });
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(onAddOptionSpy).toHaveBeenCalledWith('NewBrand');
      expect(onChangeSpy).toHaveBeenCalledWith('NewBrand');
    });
    // Dropdown closes after adding
    expect(screen.queryByRole('button', { name: /เพิ่ม "NewBrand"/i })).not.toBeInTheDocument();
  });

  it('clears search input via clear button when typing', () => {
    render(
      <OptionPicker
        id="field-brand"
        name="brand"
        label="แบรนด์ *"
        icon="sell"
        value="Duex"
        options={mockOptions}
        onChange={onChangeSpy}
      />
    );

    const input = screen.getByLabelText(/แบรนด์/i);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'SearchVal' } });

    const clearBtn = screen.getByLabelText('ล้างค่า');
    fireEvent.click(clearBtn);

    expect(onChangeSpy).toHaveBeenCalledWith('');
    expect(input).toHaveValue('');
  });

  it('toggles docked dropdown on trailing trigger button click', () => {
    render(
      <OptionPicker
        id="field-brand"
        name="brand"
        label="แบรนด์ *"
        icon="sell"
        value="Duex"
        options={mockOptions}
        onChange={onChangeSpy}
      />
    );

    const triggerBtn = screen.getByLabelText('แสดงตัวเลือก');
    fireEvent.click(triggerBtn);

    // Docked card opens
    expect(screen.getByText('Avaalene')).toBeInTheDocument();

    // Clicking trigger button again closes the docked card
    fireEvent.click(triggerBtn);
    expect(screen.queryByText('Avaalene')).not.toBeInTheDocument();
  });

  it('closes docked dropdown on Escape key', () => {
    render(
      <OptionPicker
        id="field-brand"
        name="brand"
        label="แบรนด์ *"
        icon="sell"
        value="Duex"
        options={mockOptions}
        onChange={onChangeSpy}
      />
    );

    const input = screen.getByLabelText(/แบรนด์/i);
    fireEvent.focus(input);
    expect(screen.getByText('Avaalene')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByText('Avaalene')).not.toBeInTheDocument();
  });

  it('closes docked dropdown when clicking outside', () => {
    render(
      <div>
        <div data-testid="outside">Outside Area</div>
        <OptionPicker
          id="field-brand"
          name="brand"
          label="แบรนด์ *"
          icon="sell"
          value="Duex"
          options={mockOptions}
          onChange={onChangeSpy}
        />
      </div>
    );

    const input = screen.getByLabelText(/แบรนด์/i);
    fireEvent.focus(input);
    expect(screen.getByText('Avaalene')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByText('Avaalene')).not.toBeInTheDocument();
  });

  it('aligns dropdown left when inside a side sheet on landscape/desktop (1024x768) so it does not overflow left', () => {
    // Simulate 1024x768 landscape viewport
    window.innerWidth = 1024;
    window.innerHeight = 768;

    const { container } = render(
      <dialog
        open
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          width: '512px',
          height: '768px',
        }}
      >
        {/* Brand picker situated in column 1 (left side of sheet) */}
        <div style={{ width: '150px' }}>
          <OptionPicker
            id="field-brand"
            name="brand"
            label="แบรนด์ *"
            icon="sell"
            value="Duex"
            options={mockOptions}
            onChange={onChangeSpy}
          />
        </div>
      </dialog>
    );

    const dialog = container.querySelector('dialog')!;
    const fieldContainer = container.querySelector('.field') as HTMLElement;

    // Mock bounding client rects for dialog and field container
    // Dialog sits at x: 512 to 1024
    vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue({
      left: 512,
      right: 1024,
      top: 0,
      bottom: 768,
      width: 512,
      height: 768,
      x: 512,
      y: 0,
      toJSON: () => {},
    });

    // Field sits at x: 532 (near left edge of dialog)
    vi.spyOn(fieldContainer, 'getBoundingClientRect').mockReturnValue({
      left: 532,
      right: 682,
      top: 200,
      bottom: 248,
      width: 150,
      height: 48,
      x: 532,
      y: 200,
      toJSON: () => {},
    });

    const input = screen.getByLabelText(/แบรนด์/i);
    fireEvent.focus(input);

    // Dropdown should be open
    expect(screen.getByText('Avaalene')).toBeInTheDocument();

    // The dropdown card should be aligned to left (left: 0), NOT right: 0
    const dropdownCard = container.querySelector('.card.surface-container-high') as HTMLElement;
    expect(dropdownCard).toHaveStyle({ left: '0px' });
  });
});
