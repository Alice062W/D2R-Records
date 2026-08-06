import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import QuestList from './QuestList';
import messages from '../../../messages/en.json';

type LocalizedText = { en: string; 'zh-TW': string; 'zh-CN': string };
type SampleQuest = {
  id: number;
  key: string;
  act: number;
  order: number;
  optional: boolean;
  icon: string;
  rewardImage: string | null;
  reward: LocalizedText | null;
  name: LocalizedText;
  objectives: LocalizedText[];
};

const sampleQuests: SampleQuest[] = [
  {
    id: 923, key: 'qstsa2q1', act: 2, order: 1, optional: true,
    icon: 'quests/icons/qstsa2q1.png', rewardImage: null, reward: null,
    name: { en: "Radament's Lair", 'zh-TW': 'x', 'zh-CN': 'x' },
    objectives: [
      { en: "Find Radament's Lair in the Lut Gholein sewers.", 'zh-TW': 'x', 'zh-CN': 'x' },
      { en: 'Kill Radament.', 'zh-TW': 'x', 'zh-CN': 'x' },
    ],
  },
  {
    id: 924, key: 'qstsa2q2', act: 2, order: 2, optional: false,
    icon: 'quests/icons/qstsa2q2.png', rewardImage: null, reward: null,
    name: { en: 'The Horadric Staff', 'zh-TW': 'x', 'zh-CN': 'x' },
    objectives: [
      { en: 'Retrieve the Staff of Kings.', 'zh-TW': 'x', 'zh-CN': 'x' },
    ],
  },
  {
    id: 899, key: 'qstsa1q1', act: 1, order: 1, optional: true,
    icon: 'quests/icons/qstsa1q1.png', rewardImage: null,
    reward: { en: 'A permanent +1 skill point.', 'zh-TW': 'x', 'zh-CN': 'x' },
    name: { en: 'Den of Evil', 'zh-TW': 'x', 'zh-CN': 'x' },
    objectives: [{ en: 'Clear the Den of Evil.', 'zh-TW': 'x', 'zh-CN': 'x' }],
  },
  {
    id: 900, key: 'qstsa1q2', act: 1, order: 2, optional: false,
    icon: 'quests/icons/qstsa1q2.png', rewardImage: 'quests/rewards/qstsa1q2.png', reward: null,
    name: { en: 'Sisters\' Burial Grounds', 'zh-TW': 'x', 'zh-CN': 'x' },
    objectives: [{ en: 'Defeat Bloodraven.', 'zh-TW': 'x', 'zh-CN': 'x' }],
  },
];

describe('QuestList', () => {
  it('shows only the selected Act\'s quest icons', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <QuestList quests={sampleQuests} locale="en" />
      </NextIntlClientProvider>
    );
    // Defaults to Act 1 -- only Den of Evil visible.
    expect(screen.getByRole('button', { name: /Den of Evil/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Radament's Lair/i })).not.toBeInTheDocument();
  });

  it('switches Act and shows that Act\'s quests', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <QuestList quests={sampleQuests} locale="en" />
      </NextIntlClientProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'II' }));
    expect(screen.getByRole('button', { name: /Radament's Lair/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /The Horadric Staff/i })).toBeInTheDocument();
  });

  it('selecting a quest shows its objectives and an Optional badge', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <QuestList quests={sampleQuests} locale="en" />
      </NextIntlClientProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: /Den of Evil/i }));
    expect(screen.getByText('Clear the Den of Evil.')).toBeInTheDocument();
    expect(screen.getByText(messages.Items.questOptionalLabel)).toBeInTheDocument();
  });

  it('required quests do not show the Optional badge', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <QuestList quests={sampleQuests} locale="en" />
      </NextIntlClientProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'II' }));
    fireEvent.click(screen.getByRole('button', { name: /The Horadric Staff/i }));
    expect(screen.queryByText(messages.Items.questOptionalLabel)).not.toBeInTheDocument();
  });

  it('shows the reward image when a quest has a rewardImage', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <QuestList quests={sampleQuests} locale="en" />
      </NextIntlClientProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: /Sisters' Burial Grounds/i }));
    const img = container.querySelector('img[src*="quests/rewards/qstsa1q2.png"]');
    expect(img).not.toBeNull();
    expect(screen.queryByText(messages.Items.questNoReward)).not.toBeInTheDocument();
  });

  it('shows the no-reward fallback text when a quest has no rewardImage or reward text', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <QuestList quests={sampleQuests} locale="en" />
      </NextIntlClientProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'II' }));
    fireEvent.click(screen.getByRole('button', { name: /The Horadric Staff/i }));
    expect(screen.getByText(messages.Items.questNoReward)).toBeInTheDocument();
  });

  it('shows reward text when a quest has a reward field', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <QuestList quests={sampleQuests} locale="en" />
      </NextIntlClientProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: /Den of Evil/i }));
    expect(screen.getByText('A permanent +1 skill point.')).toBeInTheDocument();
    expect(screen.queryByText(messages.Items.questNoReward)).not.toBeInTheDocument();
  });

  it('shows an optional indicator on the grid icon for optional quests', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <QuestList quests={sampleQuests} locale="en" />
      </NextIntlClientProvider>
    );
    const optionalButton = screen.getByRole('button', { name: /Den of Evil/i });
    expect(optionalButton.querySelector('[data-testid="quest-optional-indicator"]')).not.toBeNull();
  });

  it('does not show an optional indicator on the grid icon for required quests', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <QuestList quests={sampleQuests} locale="en" />
      </NextIntlClientProvider>
    );
    const requiredButton = screen.getByRole('button', { name: /Sisters' Burial Grounds/i });
    expect(requiredButton.querySelector('[data-testid="quest-optional-indicator"]')).toBeNull();
  });
});
