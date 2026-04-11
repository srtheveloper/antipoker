// Using standard notation for pokersolver:
// Values: 2, 3, 4, 5, 6, 7, 8, 9, T, J, Q, K, A
// Suits: s, c, h, d

const SUITS = ['s', 'c', 'h', 'd'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

export class Deck {
  cards: string[];

  constructor() {
    this.cards = [];
    this.reset();
  }

  reset() {
    this.cards = [];
    for (const suit of SUITS) {
      for (const value of VALUES) {
        this.cards.push(`${value}${suit}`);
      }
    }
    this.shuffle();
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  draw(count: number = 1): string[] {
    const drawn = [];
    for (let i = 0; i < count; i++) {
        const card = this.cards.pop();
        if (card) drawn.push(card);
    }
    return drawn;
  }
}
