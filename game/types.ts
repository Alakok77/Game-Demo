export type Player = "HUMAN" | "AI";
import type { SynergyCell, ComboState, ComboFeedback, CellCardInfo } from "./synergy";
export type Faction = "RAMA" | "LANKA";

export type Coord = { r: number; c: number };

export type StatusEffect = "damage" | "protected" | "buff" | "willDie" | "hasEscaped";

export type Tile =
  | { kind: "empty" }
  | { kind: "unit"; faction: Faction; templateId?: string; statusEffects?: StatusEffect[] }
  | { kind: "block"; expiresAtTurn: number; owner: Faction | null };

export type Board = Tile[][];

export type CardRarity = "common" | "rare" | "epic";
export type CardTier = "basic" | "hero" | "legendary";
export type EffectType =
  | "unit"
  | "damage"
  | "buff"
  | "aoe"
  | "legendary"
  | "summon"       // creates units on the board
  | "global"       // affects all pieces this turn
  | "passive"      // persistent per-unit effect (curse / aura)
  | "chain"        // bounces between adjacent targets
  | "zone_control" // transforms an area of the board
  | "control";     // removes / displaces a unit temporarily


export type AbilityConfig = {
  trigger: string;
  requiresTarget: boolean;
  selectableTargets?: string;
  action: string;
  result: string;
  ui: string;
  animation: string;
};

export type CardBase = {
  id: string;
  name: string;
  cost: number;
  rarity: CardRarity;
  tier?: CardTier;
  description: string;
  ability: AbilityConfig | null;
  icon?: string;
  image?: string;
  effectType?: EffectType;
  /** Tags used by the synergy engine, e.g. ["monkey", "hanuman"] */
  synergyTags?: string[];
  /** Template-level ID for combo detection, matches templateId in CARD_LIBRARY */
  comboType?: string;
};

export type UnitCard = CardBase & {
  type: "unit";
  unit: { faction: Faction };
};

export type SkillKind =
  | "destroyWeakGroup"
  | "blockTile"
  | "pushUnit"
  | "stormCut";

export type SkillCard = CardBase & {
  type: "skill";
  skill: { kind: SkillKind };
};

export type Card = UnitCard | SkillCard;

export type Move =
  | {
      kind: "playUnit";
      faction: Faction;
      at: Coord;
      fromCardId: string;
      targets?: Coord[];
    }
  | {
      kind: "skillDestroyWeakGroup";
      caster: Faction;
      targetAnyCellInEnemyGroup: Coord;
      fromCardId: string;
      targets?: Coord[];
    }
  | {
      kind: "skillBlockTile";
      caster: Faction;
      at: Coord;
      durationTurns: number;
      fromCardId: string;
      targets?: Coord[];
    }
  | {
      kind: "skillPushUnit";
      caster: Faction;
      from: Coord;
      dir: "up" | "down" | "left" | "right";
      fromCardId: string;
      targets?: Coord[];
    }
  | {
      kind: "skillStormCut";
      caster: Faction;
      center: Coord;
      radius: 1 | 2;
      fromCardId: string;
      targets?: Coord[];
    }
  | {
      kind: "skillUniversal";
      caster: Faction;
      fromCardId: string;
      targets: Coord[];
    }
  | { kind: "pass"; targets?: Coord[] };

export type CaptureEvent = {
  factionCaptured: Faction;
  stonesRemoved: Coord[];
};

export type TerritoryMap = ("none" | Faction)[][];

export type ScoreBreakdown = {
  territory: Record<Faction, number>;
  captures: Record<Faction, number>;
  bonus: Record<Faction, number>;
  total: Record<Faction, number>;
};

export type PreviewResult = {
  ok: boolean;
  reason?:
    | "occupied"
    | "blocked"
    | "outOfBounds"
    | "noCardSelected"
    | "insufficientEnergy"
    | "illegalNoLiberties"
    | "invalidTarget";
  willCapture: CaptureEvent[];
  territoryAfter: ScoreBreakdown;
  territoryBefore: ScoreBreakdown;
  territoryMapAfter: TerritoryMap;
  ghost?: { at: Coord; faction: Faction };
};

export type ActiveEffectPayload = {
  cardName: string;
  icon: string;
  type: string;
  action: string;
  result: string;
};

export type TurnPhase = "menu" | "tutorial" | "deckBuilder" | "player" | "aiThinking" | "gameOver" | "connecting";

export type Settings = {
  beginnerMode: boolean;
  aiLevel: 1 | 2 | 3;
  sound: boolean;
};

export type PlayerState = {
  faction: Faction;
  deck: Card[];
  hand: Card[];
  discard: Card[];
  energy: number;
  captures: number;
  passedLastTurn: boolean;
  mulliganUsed?: boolean;
};

export type TargetSelectionState = {
  cardId: string; // The specific card instance ID
  templateId: string; // To look up the specific logic
  step: number; // Current step 1, 2, 3...
  maxSteps: number; // How many targets we need
  selectedCoords: Coord[]; // Accumulated targets (index 0 is often where the unit was dropped)
  validTargets?: Coord[];    // Cached valid target cells to highlight
};

export type GameState = {
  /** Human's chosen faction; mirrored by `human.faction` after `fresh()` / game start. Default RAMA. */
  playerFaction: Faction;
  boardSize: number;
  board: Board;
  turn: number;
  active: Player;
  phase: TurnPhase;
  settings: Settings;
  human: PlayerState;
  ai: PlayerState;
  territoryMap: TerritoryMap;
  scores: ScoreBreakdown;
  lastCaptures: CaptureEvent[];
  lastMove?: Move;
  selectedCardId?: string;
  targetSelection?: TargetSelectionState;
  cardsPlayedThisTurn: number;
  hoverCell?: Coord;
  message?: { kind: "info" | "warn"; text: string; nonce: number };
  aiAnnounce?: { at: Coord; kind: "unit" | "skill"; nonce: number };
  activeEffect?: ActiveEffectPayload;
  turnEnergyBonus: {
    HUMAN: { captureAwarded: boolean; territoryAwards: number };
    AI: { captureAwarded: boolean; territoryAwards: number };
  };
  /** Cells currently showing synergy glow (recalculated after each move) */
  activeSynergies: SynergyCell[];
  /** Tracks card play sequence within the current human turn for combos */
  comboState: ComboState;
  /** Transient combo feedback shown in UI (cleared after animation) */
  comboFeedback?: ComboFeedback;
  /** Map of board coordinate keys → card info for synergy lookups */
  cardMap: Map<string, CellCardInfo>;
  undoSnapshot?: {
    board: Board;
    human: PlayerState;
    ai: PlayerState;
    territoryMap: TerritoryMap;
    scores: ScoreBreakdown;
    lastCaptures: CaptureEvent[];
    lastMove?: Move;
    cardsPlayedThisTurn: number;
    selectedCardId?: string;
    hoverCell?: Coord;
    activeEffect?: ActiveEffectPayload;
    turnEnergyBonus: {
      HUMAN: { captureAwarded: boolean; territoryAwards: number };
      AI: { captureAwarded: boolean; territoryAwards: number };
    };
    activeSynergies: SynergyCell[];
    comboState: ComboState;
    cardMap: Map<string, CellCardInfo>;
  };
  tutorialStep: number;
  /** How many consecutive passes have occurred without any card play */
  consecutivePasses: number;
  /** Compact board-state fingerprints for repetition detection */
  boardStateHistory: string[];
  /** Human-readable reason the game ended (displayed on result screen) */
  gameOverReason?: string;
  // Online state fields
  onlineMode?: boolean;
  onlineRoomId?: string | null;
  onlinePlayerRole?: "host" | "guest" | "player1" | "player2" | null;
  onlineUserId: string;
  onlineRoomData?: any;
  isInitializing?: boolean;
};

// Re-export synergy types for convenience
export type { SynergyCell, ComboState, ComboFeedback, CellCardInfo } from "./synergy";

