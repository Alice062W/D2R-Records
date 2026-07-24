import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../../../messages/en.json';
import LogFindForm from './LogFindForm';

function renderForm() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <LogFindForm onSaved={vi.fn()} onCancel={vi.fn()} />
    </NextIntlClientProvider>
  );
}

describe('LogFindForm', () => {
  it('keeps the Cancel/Save buttons in a footer separate from the scrollable field area, so they stay visible without scrolling', () => {
    renderForm();
    const saveButton = screen.getByRole('button', { name: 'Save' });
    const footer = saveButton.closest('div');
    expect(footer).toHaveClass('shrink-0'); // footer doesn't shrink/scroll with the field list
    // The field area (item select, act/area, etc.) lives in a sibling
    // scrollable container, not the same div as the buttons.
    const itemSelectLabel = screen.getByText('Item');
    const scrollArea = itemSelectLabel.closest('div.overflow-y-auto');
    expect(scrollArea).not.toBeNull();
    expect(scrollArea).not.toBe(footer);
  });

  it('Save is disabled until an item is selected', () => {
    renderForm();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });
});
