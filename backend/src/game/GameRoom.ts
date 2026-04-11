import { Player } from './Player';
import { Deck } from './Deck';
// @ts-ignore
import { Hand } from 'pokersolver';
import { CardGroup, OddsCalculator } from 'poker-odds-calculator';

export type GamePhase = 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'gameOver';

export class GameRoom {
  id: string;
  players: Player[];
  deck: Deck;
  communityCards: string[];
  pot: number;
  currentBet: number;
  phase: GamePhase;
  logs: string[];
  
  globalChips: number;
  smallBlind: number;
  bigBlind: number;
  allowRebuy: boolean;
  
  dealerIndex: number;
  currentPlayerIndex: number;
  showdownData: any;

  broadcast: () => void;

  constructor(id: string, globalChips: number = 1000, smallBlind: number = 10, allowRebuy: boolean = false, broadcast: () => void = () => {}) {
    this.id = id;
    this.players = [];
    this.deck = new Deck();
    this.communityCards = [];
    this.pot = 0;
    this.currentBet = 0;
    this.phase = 'waiting';
    this.logs = [];
    this.globalChips = globalChips;
    this.smallBlind = smallBlind;
    this.bigBlind = smallBlind * 2;
    this.allowRebuy = allowRebuy;
    this.dealerIndex = 0;
    this.currentPlayerIndex = 0;
    this.showdownData = null;
    this.broadcast = broadcast;
  }

  playerRebuy(playerId: string) {
      if (!this.allowRebuy) return;
      const player = this.players.find(p => p.id === playerId);
      if (player && player.chips === 0 && !player.hasRebought) {
          player.chips = player.initialChips;
          player.hasRebought = true;
          this.addLog(`${player.name} rebought $${player.initialChips}!`);
      }
  }

  playerSpectate(playerId: string) {
      const player = this.players.find(p => p.id === playerId);
      if (player && player.chips === 0) {
          player.isSpectator = true;
          this.addLog(`${player.name} entered spectator mode.`);
      }
  }

  addLog(msg: string) {
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      this.logs.push(`[${time}] ${msg}`);
      if (this.logs.length > 50) this.logs.shift();
  }

  addPlayer(id: string, name: string): Player | null {
    if (this.phase !== 'waiting') return null; 
    if (this.players.length >= 8) return null; // MAX 8 SEATS
    
    const player = new Player(id, name, this.globalChips);
    this.players.push(player);
    this.addLog(`${name} joined the table.`);
    return player;
  }

  removePlayer(id: string) {
    const player = this.players.find(p => p.id === id);
    if (player) {
      this.addLog(`${player.name} left the room.`);
      if (this.phase !== 'waiting') player.folded = true; 
      this.players = this.players.filter(p => p.id !== id);
      if (this.players.length === 1 && this.phase !== 'waiting' && this.phase !== 'showdown' && this.phase !== 'gameOver') {
         this.endHand();
      }
    }
  }

  startGame() {
    if (this.players.length < 2) return false;
    this.dealerIndex = Math.floor(Math.random() * this.players.length);
    this.addLog("Game started!");
    this.startHand();
    return true;
  }

  startHand() {
    for (const player of this.players) {
        if (player.chips === 0) player.isSpectator = true;
    }

    const playingPlayers = this.players.filter(p => !p.isSpectator);

    if (playingPlayers.length === 1 && this.players.length > 1) {
        this.phase = 'gameOver';
        this.showdownData = {
            winners: [playingPlayers[0].name],
            winnerIds: [playingPlayers[0].id],
            amount: playingPlayers[0].chips,
            hand: "GRAND WINNER",
            potSize: 0,
            isGameOver: true
        };
        return;
    }

    if (playingPlayers.length < 2) {
        this.phase = 'waiting';
        this.addLog("Waiting for more players to continue...");
        return;
    }

    this.deck.reset();
    this.communityCards = [];
    this.pot = 0;
    this.showdownData = null;
    this.currentBet = this.bigBlind;
    this.phase = 'preflop';

    for (const player of playingPlayers) {
        player.resetForNewHand();
        player.cards = this.deck.draw(2);
    }

    this.dealerIndex = this.dealerIndex % playingPlayers.length;
    let sbIndex = (this.dealerIndex + 1) % playingPlayers.length;
    let bbIndex = (this.dealerIndex + 2) % playingPlayers.length;

    if (playingPlayers.length === 2) {
        sbIndex = this.dealerIndex;
        bbIndex = (this.dealerIndex + 1) % playingPlayers.length;
    }

    this.placeBet(playingPlayers[sbIndex], this.smallBlind);
    this.placeBet(playingPlayers[bbIndex], this.bigBlind);

    const bbPlayerId = playingPlayers[bbIndex].id;
    this.currentPlayerIndex = this.players.findIndex(p => p.id === playingPlayers[(bbIndex + 1) % playingPlayers.length].id);
    this.addLog(`New hand started. Dealer is ${playingPlayers[this.dealerIndex].name}.`);
  }

  placeBet(player: Player, amount: number) {
    const actualAmount = Math.min(amount, player.chips);
    player.chips -= actualAmount;
    player.currentBet += actualAmount;
    this.pot += actualAmount;
    if (player.chips === 0) {
        player.isAllIn = true;
        this.addLog(`${player.name} is ALL IN!`);
    }
    player.acted = true;
  }

  playerAction(playerId: string, action: string, amount: number) {
     if (this.phase === 'showdown' || this.phase === 'waiting') {
         return;
     }

     const player = this.players.find(p => p.id === playerId);
     if (!player || player.folded) return;
     if (this.players[this.currentPlayerIndex].id !== playerId) return;
     
     if (action === 'fold') {
         player.folded = true;
         player.acted = true;
         this.addLog(`${player.name} folds.`);
     } else if (action === 'check') {
         if (this.currentBet === player.currentBet) {
            player.acted = true;
            this.addLog(`${player.name} checks.`);
         } else {
            return;
         }
     } else if (action === 'bet' || action === 'raise') {
         const betDifference = amount - player.currentBet;
         const raiseTotalAmountDiff = amount - this.currentBet;
         if (raiseTotalAmountDiff > 0 || player.chips === betDifference) {
             this.placeBet(player, betDifference);
             this.currentBet = Math.max(this.currentBet, player.currentBet);
             
             // Reset acted for others
             this.players.forEach(p => {
                 if (p.id !== player.id && !p.folded && !p.isAllIn) p.acted = false;
             });
             this.addLog(`${player.name} ${action}s to $${amount}.`);
         } else { return; } 
     } else if (action === 'call') {
         const diff = this.currentBet - player.currentBet;
         this.placeBet(player, diff);
         this.addLog(`${player.name} calls $${this.currentBet}.`);
     }

     this.nextTurn();
  }

  nextTurn() {
    const activePlayers = this.players.filter(p => !p.folded && !p.isSpectator);
    
    if (activePlayers.length === 1) {
        this.endHand();
        return;
    }

    const playersWhoCanAct = activePlayers.filter(p => !p.isAllIn);
    const allOthersMatched = playersWhoCanAct.every(p => p.acted && p.currentBet === this.currentBet);
    
    if (allOthersMatched || playersWhoCanAct.length === 0) {
        this.progressPhase();
        return;
    }

    let nextIndex = (this.currentPlayerIndex + 1) % this.players.length;
    let safeguard = 0;
    while ((this.players[nextIndex].folded || this.players[nextIndex].isAllIn || this.players[nextIndex].isSpectator) && safeguard < this.players.length) {
        nextIndex = (nextIndex + 1) % this.players.length;
        safeguard++;
    }
    this.currentPlayerIndex = nextIndex;
  }

  progressPhase() {
      this.players.forEach(p => {
          p.currentBet = 0;
          p.acted = false;
      });
      this.currentBet = 0;

      if (this.phase === 'preflop') {
          this.phase = 'flop';
          this.communityCards = this.deck.draw(3);
          this.addLog(`FLOP: ${this.communityCards.join(' ')}`);
      } else if (this.phase === 'flop') {
          this.phase = 'turn';
          const card = this.deck.draw(1);
          this.communityCards.push(...card);
          this.addLog(`TURN: ${card[0]}`);
      } else if (this.phase === 'turn') {
          this.phase = 'river';
          const card = this.deck.draw(1);
          this.communityCards.push(...card);
          this.addLog(`RIVER: ${card[0]}`);
      } else if (this.phase === 'river') {
          this.phase = 'showdown';
          this.endHand();
          return;
      }

      this.broadcast();

      const playersWhoCanAct = this.players.filter(p => !p.folded && !p.isAllIn && !p.isSpectator);
      if (playersWhoCanAct.length <= 1) {
          // Auto-advance to the next phase after 5 seconds to show the dealt cards
          setTimeout(() => {
              if (this.phase !== 'waiting') {
                 this.progressPhase();
              }
          }, 5000);
      } else {
          let nextIndex = (this.dealerIndex + 1) % this.players.length;
          let count = 0;
          while ((this.players[nextIndex].folded || this.players[nextIndex].isAllIn || this.players[nextIndex].isSpectator) && count < this.players.length) {
              nextIndex = (nextIndex + 1) % this.players.length;
              count++;
          }
          this.currentPlayerIndex = nextIndex;
          this.broadcast();
      }
  }

  endHand() {
      if (this.phase === 'showdown' && this.showdownData) return; 
      this.phase = 'showdown';
      const activePlayers = this.players.filter(p => !p.folded && !p.isSpectator);
      
      let winnersNames: string[] = [];
      let handDescription = "";
      let winningAmount = 0;
      let winnerIds: string[] = [];
      
      if (activePlayers.length === 1) {
          winningAmount = this.pot;
          activePlayers[0].chips += winningAmount;
          winnersNames.push(activePlayers[0].name);
          winnerIds.push(activePlayers[0].id);
          handDescription = "Opponents Folded";
          this.addLog(`${activePlayers[0].name} wins $${this.pot} (Everyone folded).`);
      } else if (activePlayers.length > 1) {
          // evaluate hands
          const hands = activePlayers.map(p => {
              const cards = [...p.cards, ...this.communityCards];
              const hand = Hand.solve(cards);
              hand.playerId = p.id;
              return hand;
          });
          
          const winners = Hand.winners(hands);
          winningAmount = Math.floor(this.pot / winners.length);
          
          winners.forEach((w: any) => {
              const p = this.players.find(pl => pl.id === w.playerId);
              if (p) {
                  p.chips += winningAmount;
                  winnersNames.push(p.name);
                  winnerIds.push(p.id);
                  handDescription = w.name; 
              }
          });
          this.addLog(`${winnersNames.join(' and ')} wins $${winningAmount} each with ${handDescription}!`);
      }
      
      this.showdownData = {
          winners: winnersNames,
          winnerIds,
          amount: winningAmount,
          hand: handDescription,
          potSize: this.pot
      };
      
      this.broadcast();
      
      setTimeout(() => {
          this.dealerIndex = this.dealerIndex + 1; // It modulo limits naturally in startHand
          this.startHand();
          this.broadcast();
      }, 10000);
  }

  calculateEquity(playerId: string): number | null {
    const activePlayers = this.players.filter(p => !p.folded && p.cards.length === 2);
    if (activePlayers.length < 2) return 100;

    const player = this.players.find(p => p.id === playerId);
    if (!player || player.folded || player.cards.length !== 2) return null;

    try {
        const board = this.communityCards.length > 0 ? CardGroup.fromString(this.communityCards.join('')) : undefined;
        const hands = activePlayers.map(p => CardGroup.fromString(p.cards.join('')));
        
        const iterations = this.communityCards.length === 0 ? 1000 : 5000;
        const result = OddsCalculator.calculate(hands, board, undefined, iterations);
        
        const playerIndex = activePlayers.findIndex(p => p.id === playerId);
        const equity = result.equities[playerIndex].getEquity();
        return Math.round(equity);
    } catch(e) {
        return null;
    }
  }

  getStateForPlayer(playerId: string) {
    const equity = this.calculateEquity(playerId);

    const playingPlayers = this.players.filter(p => !p.isSpectator);
    const dIndex = this.dealerIndex % (Math.max(1, playingPlayers.length));
    
    let sbIndex = (dIndex + 1) % playingPlayers.length;
    let bbIndex = (dIndex + 2) % playingPlayers.length;
    if (playingPlayers.length === 2) {
        sbIndex = dIndex;
        bbIndex = (dIndex + 1) % playingPlayers.length;
    }

    const dealerId = playingPlayers[dIndex]?.id;
    const sbId = playingPlayers[sbIndex]?.id;
    const bbId = playingPlayers[bbIndex]?.id;

    return {
      id: this.id,
      phase: this.phase,
      pot: this.pot,
      currentBet: this.currentBet,
      communityCards: this.communityCards,
      dealerId,
      sbId,
      bbId,
      currentPlayerIndex: this.currentPlayerIndex,
      showdownData: this.showdownData,
      allowRebuy: this.allowRebuy,
      bigBlind: this.bigBlind,
      logs: this.logs,
      players: this.players.map(p => ({
        ...p,
        equity: p.id === playerId ? equity : null,
        cards: p.id === playerId || this.phase === 'showdown' || p.isSpectator ? p.cards : []
      }))
    }
  }
}
