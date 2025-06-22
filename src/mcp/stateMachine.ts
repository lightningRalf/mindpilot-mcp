import { mcpLogger as logger } from "../shared/logger.js";

export enum State {
  INIT = "INIT",
  CHECKING_SERVER = "CHECKING_SERVER", 
  STARTING_SERVER = "STARTING_SERVER",
  WAITING_FOR_SERVER = "WAITING_FOR_SERVER",
  CONNECTED = "CONNECTED",
  RECONNECTING = "RECONNECTING",
  ERROR = "ERROR",
  SHUTDOWN = "SHUTDOWN"
}

export enum Event {
  START = "START",
  SERVER_CHECK_COMPLETE = "SERVER_CHECK_COMPLETE",
  SERVER_STARTED = "SERVER_STARTED",
  CONNECTION_ESTABLISHED = "CONNECTION_ESTABLISHED",
  CONNECTION_LOST = "CONNECTION_LOST",
  KEEPALIVE_FAILED = "KEEPALIVE_FAILED",
  SHUTDOWN_REQUESTED = "SHUTDOWN_REQUESTED",
  ERROR_OCCURRED = "ERROR_OCCURRED"
}

export interface StateContext {
  httpPort: number;
  retryCount: number;
  maxRetries: number;
  error?: Error;
  serverRunning?: boolean;
}

export type StateHandler = (context: StateContext) => Promise<void>;
export type TransitionHandler = (event: Event, context: StateContext) => State | null;

export class StateMachine {
  private currentState: State = State.INIT;
  private context: StateContext;
  private stateHandlers: Map<State, StateHandler> = new Map();
  private transitions: Map<State, Map<Event, State>> = new Map();
  private onTransition?: (from: State, to: State, event: Event) => void;

  constructor(context: StateContext) {
    this.context = context;
    this.setupTransitions();
  }

  private setupTransitions() {
    // Define state transitions
    this.addTransition(State.INIT, Event.START, State.CHECKING_SERVER);
    
    this.addTransition(State.CHECKING_SERVER, Event.SERVER_CHECK_COMPLETE, State.CONNECTED);
    this.addTransition(State.CHECKING_SERVER, Event.ERROR_OCCURRED, State.STARTING_SERVER);
    
    this.addTransition(State.STARTING_SERVER, Event.SERVER_STARTED, State.WAITING_FOR_SERVER);
    this.addTransition(State.STARTING_SERVER, Event.ERROR_OCCURRED, State.ERROR);
    
    this.addTransition(State.WAITING_FOR_SERVER, Event.CONNECTION_ESTABLISHED, State.CONNECTED);
    this.addTransition(State.WAITING_FOR_SERVER, Event.ERROR_OCCURRED, State.ERROR);
    
    this.addTransition(State.CONNECTED, Event.CONNECTION_LOST, State.RECONNECTING);
    this.addTransition(State.CONNECTED, Event.KEEPALIVE_FAILED, State.RECONNECTING);
    this.addTransition(State.CONNECTED, Event.SHUTDOWN_REQUESTED, State.SHUTDOWN);
    
    this.addTransition(State.RECONNECTING, Event.CONNECTION_ESTABLISHED, State.CONNECTED);
    this.addTransition(State.RECONNECTING, Event.ERROR_OCCURRED, State.ERROR);
    
    this.addTransition(State.ERROR, Event.START, State.CHECKING_SERVER);
    
    // Any state can transition to SHUTDOWN
    for (const state of Object.values(State)) {
      if (state !== State.SHUTDOWN) {
        this.addTransition(state as State, Event.SHUTDOWN_REQUESTED, State.SHUTDOWN);
      }
    }
  }

  private addTransition(from: State, event: Event, to: State) {
    if (!this.transitions.has(from)) {
      this.transitions.set(from, new Map());
    }
    this.transitions.get(from)!.set(event, to);
  }

  setStateHandler(state: State, handler: StateHandler) {
    this.stateHandlers.set(state, handler);
  }

  setOnTransition(callback: (from: State, to: State, event: Event) => void) {
    this.onTransition = callback;
  }

  async transition(event: Event): Promise<State> {
    const fromState = this.currentState;
    const transitions = this.transitions.get(fromState);
    
    if (!transitions) {
      logger.warn(`No transitions defined for state ${fromState}`);
      return this.currentState;
    }

    const toState = transitions.get(event);
    if (!toState) {
      logger.warn(`No transition from ${fromState} for event ${event}`);
      return this.currentState;
    }

    logger.info(`State transition: ${fromState} -> ${toState} (event: ${event})`);
    this.currentState = toState;

    if (this.onTransition) {
      this.onTransition(fromState, toState, event);
    }

    // Execute state handler if defined
    const handler = this.stateHandlers.get(toState);
    if (handler) {
      try {
        await handler(this.context);
      } catch (error) {
        logger.error(`Error in state handler for ${toState}`, { error });
        this.context.error = error as Error;
        await this.transition(Event.ERROR_OCCURRED);
      }
    }

    return this.currentState;
  }

  getState(): State {
    return this.currentState;
  }

  getContext(): StateContext {
    return this.context;
  }

  updateContext(updates: Partial<StateContext>) {
    this.context = { ...this.context, ...updates };
  }
}