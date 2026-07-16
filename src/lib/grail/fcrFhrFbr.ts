export interface StatColumn {
  label: string;
  rows: Record<number, string>;
}

export interface FcrFhrFbrTable {
  id: string;
  className: string;
  fcr: StatColumn[];
  fhr: StatColumn[];
  fbr: StatColumn[];
}

// Hand-transcribed from d2r.world (https://d2r.world/en-US/info/character/fcr-fhr-fbr),
// this session, per this project's established policy for curated/deterministic content
// with no reliable raw-data equivalent (breakpoint frame counts come from each
// skill/action's internal animation-length data, not a plain vendored JSON field — see
// the design spec). Blank cells mean no breakpoint exists at that frame count for that
// column; they are omitted from `rows` rather than filled in.
export const FCR_FHR_FBR_TABLES: FcrFhrFbrTable[] = [
  {
    id: 'amazon',
    className: 'Amazon',
    fcr: [{ label: '', rows: {
      11: '152%', 12: '99%', 13: '68%', 14: '48%', 15: '32%', 16: '22%', 17: '14%', 18: '7%', 19: '0%',
    } }],
    fhr: [{ label: '', rows: {
      3: '600%', 4: '174%', 5: '86%', 6: '52%', 7: '32%', 8: '20%', 9: '13%', 10: '6%', 11: '0%',
    } }],
    fbr: [
      { label: '1H swinging weapon', rows: {
        5: '480%', 6: '200%', 7: '120%', 8: '80%', 9: '56%', 10: '40%', 11: '29%', 12: '23%', 13: '15%', 14: '11%', 15: '6%', 16: '4%', 17: '0%',
      } },
      { label: 'Other weapons', rows: {
        1: '600%', 2: '86%', 3: '32%', 4: '13%', 5: '0%',
      } },
    ],
  },
  {
    id: 'assassin',
    className: 'Assassin',
    fcr: [{ label: '', rows: {
      9: '174%', 10: '102%', 11: '65%', 12: '42%', 13: '27%', 14: '16%', 15: '8%', 16: '0%',
    } }],
    fhr: [{ label: '', rows: {
      3: '200%', 4: '86%', 5: '48%', 6: '27%', 7: '15%', 8: '7%', 9: '0%',
    } }],
    fbr: [{ label: '', rows: {
      1: '600%', 2: '86%', 3: '32%', 4: '13%', 5: '0%',
    } }],
  },
  {
    id: 'barbarian',
    className: 'Barbarian',
    fcr: [{ label: '', rows: {
      7: '200%', 8: '105%', 9: '63%', 10: '37%', 11: '20%', 12: '9%', 13: '0%',
    } }],
    fhr: [{ label: '', rows: {
      3: '200%', 4: '86%', 5: '48%', 6: '27%', 7: '15%', 8: '7%', 9: '0%',
    } }],
    fbr: [{ label: '', rows: {
      2: '280%', 3: '86%', 4: '42%', 5: '20%', 6: '9%', 7: '0%',
    } }],
  },
  {
    id: 'druid-human',
    className: 'Druid Human Form',
    fcr: [{ label: '', rows: {
      10: '163%', 11: '99%', 12: '68%', 13: '46%', 14: '30%', 15: '19%', 16: '10%', 17: '4%', 18: '0%',
    } }],
    fhr: [
      { label: '1H swinging weapon', rows: {
        4: '456%', 5: '174%', 6: '99%', 7: '63%', 8: '42%', 9: '29%', 10: '19%', 11: '13%', 12: '7%', 13: '3%', 14: '0%',
      } },
      { label: 'Other weapons', rows: {
        4: '377%', 5: '152%', 6: '86%', 7: '56%', 8: '39%', 9: '26%', 10: '16%', 11: '10%', 12: '5%', 13: '0%',
      } },
    ],
    fbr: [{ label: '', rows: {
      3: '600%', 4: '174%', 5: '86%', 6: '52%', 7: '32%', 8: '20%', 9: '13%', 10: '6%', 11: '0%',
    } }],
  },
  {
    id: 'druid-bear',
    className: 'Druid Bear Form',
    fcr: [{ label: '', rows: {
      9: '163%', 10: '99%', 11: '63%', 12: '40%', 13: '26%', 14: '15%', 15: '7%', 16: '0%',
    } }],
    fhr: [{ label: '', rows: {
      4: '360%', 5: '152%', 6: '86%', 7: '54%', 8: '37%', 9: '24%', 10: '16%', 11: '10%', 12: '5%', 13: '0%',
    } }],
    fbr: [{ label: '', rows: {
      4: '223%', 5: '109%', 6: '65%', 7: '40%', 8: '27%', 9: '16%', 10: '10%', 11: '5%', 12: '0%',
    } }],
  },
  {
    id: 'druid-wolf',
    className: 'Druid Wolf Form',
    fcr: [{ label: '', rows: {
      9: '157%', 10: '95%', 11: '60%', 12: '40%', 13: '26%', 14: '14%', 15: '6%', 16: '0%',
    } }],
    fhr: [{ label: '', rows: {
      2: '280%', 3: '86%', 4: '42%', 5: '20%', 6: '9%', 7: '0%',
    } }],
    fbr: [{ label: '', rows: {
      3: '200%', 4: '86%', 5: '48%', 6: '27%', 7: '15%', 8: '7%', 9: '0%',
    } }],
  },
  {
    id: 'necromancer',
    className: 'Necromancer/Warlock',
    fcr: [{ label: '', rows: {
      9: '125%', 10: '75%', 11: '48%', 12: '30%', 13: '18%', 14: '9%', 15: '0%',
    } }],
    fhr: [{ label: '', rows: {
      4: '377%', 5: '152%', 6: '86%', 7: '56%', 8: '39%', 9: '26%', 10: '16%', 11: '10%', 12: '5%', 13: '0%',
    } }],
    fbr: [{ label: '', rows: {
      3: '600%', 4: '174%', 5: '86%', 6: '52%', 7: '32%', 8: '20%', 9: '13%', 10: '6%', 11: '0%',
    } }],
  },
  {
    id: 'necromancer-vampire',
    className: 'Necromancer Vampire Form',
    fcr: [{ label: '', rows: {
      13: '180%', 14: '120%', 15: '86%', 16: '65%', 17: '48%', 18: '35%', 19: '24%', 20: '18%', 21: '11%', 22: '6%', 23: '0%',
    } }],
    fhr: [{ label: '', rows: {
      6: '117%', 7: '72%', 8: '48%', 9: '34%', 10: '24%', 11: '16%', 12: '10%', 13: '6%', 14: '2%', 15: '0%',
    } }],
    fbr: [{ label: '', rows: {
      3: '600%', 4: '174%', 5: '86%', 6: '52%', 7: '32%', 8: '20%', 9: '13%', 10: '6%', 11: '0%',
    } }],
  },
  {
    id: 'paladin',
    className: 'Paladin',
    fcr: [
      { label: 'other spells', rows: {
        9: '125%', 10: '75%', 11: '48%', 12: '30%', 13: '18%', 14: '9%', 15: '0%',
      } },
      { label: 'Fist of the Heavens', rows: {
        17: '86%', 18: '39%', 19: '0%',
      } },
    ],
    fhr: [
      { label: 'Spears and staves', rows: {
        4: '280%', 5: '129%', 6: '75%', 7: '48%', 8: '32%', 9: '20%', 10: '13%', 11: '7%', 12: '3%', 13: '0%',
      } },
      { label: 'Other weapons', rows: {
        3: '200%', 4: '86%', 5: '48%', 6: '27%', 7: '15%', 8: '7%', 9: '0%',
      } },
    ],
    fbr: [
      { label: 'Normal', rows: {
        1: '600%', 2: '86%', 3: '32%', 4: '13%', 5: '0%',
      } },
      { label: 'Holy Shield', rows: {
        1: '86%', 2: '0%',
      } },
    ],
  },
  {
    id: 'sorceress',
    className: 'Sorceress',
    fcr: [
      { label: 'other spells', rows: {
        7: '200%', 8: '105%', 9: '63%', 10: '37%', 11: '20%', 12: '9%', 13: '0%',
      } },
      { label: 'Lightning / Chain Lightning', rows: {
        11: '194%', 12: '117%', 13: '78%', 14: '52%', 15: '35%', 16: '23%', 17: '15%', 18: '7%', 19: '0%',
      } },
    ],
    fhr: [{ label: '', rows: {
      5: '280%', 6: '142%', 7: '86%', 8: '60%', 9: '42%', 10: '30%', 11: '20%', 12: '14%', 13: '9%', 14: '5%', 15: '0%',
    } }],
    fbr: [{ label: '', rows: {
      3: '200%', 4: '86%', 5: '48%', 6: '27%', 7: '15%', 8: '7%', 9: '0%',
    } }],
  },
];
