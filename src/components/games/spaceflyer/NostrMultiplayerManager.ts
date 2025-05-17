import { nostrService } from '@/lib/nostr/index';

export interface PlayerState {
    pubkey: string;
    x: number;
    y: number;
    isShooting: boolean;
    ts: number;
    score?: number;
    health?: number;
}

export type PlayerStateCallback = (state: PlayerState) => void;
export type EnemySpawn = { x: number; ts: number };
export type EnemySpawnCallback = (spawn: EnemySpawn) => void;

export class NostrMultiplayerManager {
    private static listeners: PlayerStateCallback[] = [];
    private static enemyListeners: EnemySpawnCallback[] = [];
    private static lastSent: number = 0;
    private static lastEnemySent: number = 0;
    private static pubkey: string = nostrService.publicKey || '';

    static subscribe(cb: PlayerStateCallback) {
        this.listeners.push(cb);
    }
    static unsubscribe(cb: PlayerStateCallback) {
        this.listeners = this.listeners.filter(l => l !== cb);
    }
    static subscribeEnemy(cb: EnemySpawnCallback) {
        this.enemyListeners.push(cb);
    }
    static unsubscribeEnemy(cb: EnemySpawnCallback) {
        this.enemyListeners = this.enemyListeners.filter(l => l !== cb);
    }
    static sendState(state: PlayerState) {
        if (!nostrService.publicKey) return; // Only require login once
        const now = Date.now();
        if (now - this.lastSent < 100) return;
        this.lastSent = now;
        nostrService.publishEvent({
            kind: 30001,
            content: JSON.stringify(state),
            tags: [['d', 'spaceflyer'], ['pubkey', nostrService.publicKey]],
        });
    }
    static sendEnemySpawn(spawn: EnemySpawn) {
        if (!nostrService.publicKey) return; // Only require login once
        const now = Date.now();
        if (now - this.lastEnemySent < 200) return;
        this.lastEnemySent = now;
        nostrService.publishEvent({
            kind: 30002,
            content: JSON.stringify(spawn),
            tags: [['d', 'spaceflyer'], ['pubkey', nostrService.publicKey]],
        });
    }
    static startListening() {
        if (!nostrService.publicKey) return;
        // Use the subscribe method and only supported filter fields
        nostrService.subscribe([
            { kinds: [30001, 30002], since: Math.floor(Date.now() / 1000) - 60, limit: 0 }
        ], (event: { kind: number; content?: string; pubkey?: string }) => {
            if (!event.content) return;
            try {
                if (event.kind === 30001) {
                    const state: PlayerState = JSON.parse(event.content);
                    if (state.pubkey !== nostrService.publicKey) {
                        this.listeners.forEach(cb => cb(state));
                    }
                } else if (event.kind === 30002) {
                    const spawn: EnemySpawn = JSON.parse(event.content);
                    this.enemyListeners.forEach(cb => cb(spawn));
                }
            } catch (e) {
                // Ignore JSON parse errors
            }
        });
    }
    static onEnemySpawn(cb: EnemySpawnCallback) {
        this.subscribeEnemy(cb);
    }
}
