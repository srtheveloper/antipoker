export type ActionType = 'check' | 'bet' | 'call' | 'raise' | 'fold';

export class Player {
  id: string;
  name: string;
  chips: number;
  initialChips: number;
  cards: string[];
  currentBet: number;
  folded: boolean;
  acted: boolean;
  isAllIn: boolean;
  hasRebought: boolean;
  isSpectator: boolean;

  constructor(id: string, name: string, chips: number) {
    this.id = id;
    this.name = name;
    this.chips = chips;
    this.initialChips = chips; // Track original buy in
    this.cards = [];
    this.currentBet = 0;
    this.folded = false;
    this.acted = false;
    this.isAllIn = false;
    this.hasRebought = false;
    this.isSpectator = false;
  }

  resetForNewHand() {
    this.cards = [];
    this.currentBet = 0;
    this.folded = false;
    this.acted = false;
    // reset allin unless they have 0 chips
    this.isAllIn = this.chips === 0;
  }
}
