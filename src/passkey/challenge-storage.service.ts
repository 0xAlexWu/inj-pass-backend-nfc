import { Injectable } from '@nestjs/common';

interface StoredChallenge {
  challenge: string;
  action: 'register' | 'authenticate';
  userId?: string;
  createdAt: number;
  expiresAt: number;
}

@Injectable()
export class ChallengeStorageService {
  private challenges = new Map<string, StoredChallenge>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired challenges every 30 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 30000);
  }

  /**
   * Store a challenge with TTL
   */
  store(challenge: string, action: 'register' | 'authenticate', userId?: string): void {
    const now = Date.now();
    const expiresAt = now + 60000; // 60 seconds TTL

    this.challenges.set(challenge, {
      challenge,
      action,
      userId,
      createdAt: now,
      expiresAt,
    });
  }

  /**
   * Get and validate a challenge
   */
  get(challenge: string): StoredChallenge | null {
    const stored = this.challenges.get(challenge);
    
    if (!stored) {
      return null;
    }

    // Check if expired
    if (Date.now() > stored.expiresAt) {
      this.challenges.delete(challenge);
      return null;
    }

    return stored;
  }

  /**
   * Delete a challenge (after use)
   */
  delete(challenge: string): void {
    this.challenges.delete(challenge);
  }

  /**
   * Cleanup expired challenges
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.challenges.entries()) {
      if (now > value.expiresAt) {
        this.challenges.delete(key);
      }
    }
  }

  /**
   * Get storage stats (for debugging)
   */
  getStats(): { total: number; expired: number } {
    const now = Date.now();
    let expired = 0;

    for (const value of this.challenges.values()) {
      if (now > value.expiresAt) {
        expired++;
      }
    }

    return {
      total: this.challenges.size,
      expired,
    };
  }

  /**
   * Cleanup on module destroy
   */
  onModuleDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}
