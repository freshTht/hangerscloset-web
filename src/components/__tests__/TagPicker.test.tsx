import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TagPicker } from '../TagPicker';

describe('TagPicker Component', () => {
  const availableTags = ['Dress', 'Party', 'Evening', 'Beach set', 'Suit'];
  const onChangeSpy = vi.fn();
  const onAddTagSpy = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders selected tags as chips with close buttons and hashtag icon', () => {
    render(
      <TagPicker
        id="field-tags"
        selectedTags={['Dress', 'Party']}
        availableTags={availableTags}
        onChange={onChangeSpy}
        onAddTag={onAddTagSpy}
      />
    );

    expect(screen.getByText('Dress')).toBeInTheDocument();
    expect(screen.getByText('Party')).toBeInTheDocument();
    expect(screen.getByLabelText('ลบแท็ก Dress')).toBeInTheDocument();
    expect(screen.getByLabelText('ลบแท็ก Party')).toBeInTheDocument();

    // Check hashtag icon button is rendered
    expect(screen.getByLabelText('แสดงรายการแท็ก')).toBeInTheDocument();
  });

  it('hides already added tags from the docked search menu', () => {
    render(
      <TagPicker
        id="field-tags"
        selectedTags={['Dress']}
        availableTags={availableTags}
        onChange={onChangeSpy}
        onAddTag={onAddTagSpy}
      />
    );

    const input = screen.getByRole('searchbox');
    fireEvent.focus(input);

    // Unselected tags should be present in the dropdown menu
    expect(screen.getByRole('button', { name: /Party/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Evening/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Beach set/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Suit/i })).toBeInTheDocument();

    // Already selected 'Dress' must NOT be in the dropdown options
    expect(screen.queryByRole('button', { name: /^addDress$/i })).not.toBeInTheDocument();
  });

  it('adds an unselected tag when clicked from the dropdown and clears search', () => {
    render(
      <TagPicker
        id="field-tags"
        selectedTags={['Dress']}
        availableTags={availableTags}
        onChange={onChangeSpy}
        onAddTag={onAddTagSpy}
      />
    );

    const input = screen.getByRole('searchbox');
    fireEvent.focus(input);

    const partyBtn = screen.getByRole('button', { name: /Party/i });
    fireEvent.click(partyBtn);

    expect(onChangeSpy).toHaveBeenCalledWith(['Dress', 'Party']);
    expect(input).toHaveValue('');
  });

  it('filters available tags when typing into the search input', () => {
    render(
      <TagPicker
        id="field-tags"
        selectedTags={[]}
        availableTags={availableTags}
        onChange={onChangeSpy}
        onAddTag={onAddTagSpy}
      />
    );

    const input = screen.getByRole('searchbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'eve' } });

    expect(screen.getByRole('button', { name: /Evening/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Party/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Dress/i })).not.toBeInTheDocument();
  });

  it('allows adding a new tag via the add button in the dropdown', async () => {
    render(
      <TagPicker
        id="field-tags"
        selectedTags={['Dress']}
        availableTags={availableTags}
        onChange={onChangeSpy}
        onAddTag={onAddTagSpy}
      />
    );

    const input = screen.getByRole('searchbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Sparkle' } });

    const addBtn = screen.getByRole('button', { name: /เพิ่ม "Sparkle"/i });
    expect(addBtn).toBeInTheDocument();
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(onAddTagSpy).toHaveBeenCalledWith('Sparkle');
      expect(onChangeSpy).toHaveBeenCalledWith(['Dress', 'Sparkle']);
    });
    expect(input).toHaveValue('');
  });

  it('adds a new tag when Enter key is pressed in the search input', async () => {
    render(
      <TagPicker
        id="field-tags"
        selectedTags={['Dress']}
        availableTags={availableTags}
        onChange={onChangeSpy}
        onAddTag={onAddTagSpy}
      />
    );

    const input = screen.getByRole('searchbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Casual' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(onAddTagSpy).toHaveBeenCalledWith('Casual');
      expect(onChangeSpy).toHaveBeenCalledWith(['Dress', 'Casual']);
    });
  });

  it('removes a selected tag when the close button on its chip is clicked', () => {
    render(
      <TagPicker
        id="field-tags"
        selectedTags={['Dress', 'Party']}
        availableTags={availableTags}
        onChange={onChangeSpy}
        onAddTag={onAddTagSpy}
      />
    );

    const removePartyBtn = screen.getByLabelText('ลบแท็ก Party');
    fireEvent.click(removePartyBtn);

    expect(onChangeSpy).toHaveBeenCalledWith(['Dress']);
  });

  it('closes docked dropdown on Escape key', () => {
    render(
      <TagPicker
        id="field-tags"
        selectedTags={[]}
        availableTags={availableTags}
        onChange={onChangeSpy}
      />
    );

    const input = screen.getByRole('searchbox');
    fireEvent.focus(input);
    expect(screen.getByRole('button', { name: /Party/i })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('button', { name: /Party/i })).not.toBeInTheDocument();
  });

  it('closes docked dropdown when clicking outside', () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <TagPicker
          id="field-tags"
          selectedTags={[]}
          availableTags={availableTags}
          onChange={onChangeSpy}
        />
      </div>
    );

    const input = screen.getByRole('searchbox');
    fireEvent.focus(input);
    expect(screen.getByRole('button', { name: /Party/i })).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByRole('button', { name: /Party/i })).not.toBeInTheDocument();
  });
});
