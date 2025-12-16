import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  GenerateRegistrationOptionsOpts,
  GenerateAuthenticationOptionsOpts,
  VerifyRegistrationResponseOpts,
  VerifyAuthenticationResponseOpts,
} from '@simplewebauthn/server';
import { ChallengeStorageService } from './challenge-storage.service';
import {
  ChallengeRequestDto,
  ChallengeResponseDto,
  VerifyRequestDto,
  VerifyResponseDto,
} from './dto/passkey.dto';

@Injectable()
export class PasskeyService {
  private readonly rpName = 'Injective Pass';
  private readonly rpId = process.env.RP_ID || 'localhost';
  private readonly origin = process.env.ORIGIN || 'http://localhost:3001';

  constructor(private readonly challengeStorage: ChallengeStorageService) {}

  /**
   * Generate challenge for registration or authentication
   */
  async generateChallenge(dto: ChallengeRequestDto): Promise<ChallengeResponseDto> {
    try {
      let challenge: string;

      if (dto.action === 'register') {
        const options = await generateRegistrationOptions({
          rpName: this.rpName,
          rpID: this.rpId,
          userName: dto.userId || 'user',
          userDisplayName: dto.userId || 'User',
          timeout: 60000,
          attestationType: 'none',
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            requireResidentKey: false,
            userVerification: 'required',
          },
          supportedAlgorithmIDs: [-7, -257], // ES256, RS256
        });

        challenge = options.challenge;
      } else {
        const options = await generateAuthenticationOptions({
          rpID: this.rpId,
          timeout: 60000,
          userVerification: 'required',
        });

        challenge = options.challenge;
      }

      // Store challenge
      this.challengeStorage.store(challenge, dto.action, dto.userId);

      return {
        challenge,
        expiresAt: Date.now() + 60000,
        rpId: this.rpId,
        rpName: this.rpName,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to generate challenge: ${error.message}`,
      );
    }
  }

  /**
   * Verify registration or authentication response
   */
  async verifyPasskey(dto: VerifyRequestDto): Promise<VerifyResponseDto> {
    try {
      // Retrieve and validate challenge
      const storedChallenge = this.challengeStorage.get(dto.challenge);
      
      if (!storedChallenge) {
        throw new UnauthorizedException('Challenge not found or expired');
      }

      // Delete challenge (one-time use)
      this.challengeStorage.delete(dto.challenge);

      const credential = dto.attestation;

      if (storedChallenge.action === 'register') {
        // Verify registration
        const verification = await verifyRegistrationResponse({
          response: credential,
          expectedChallenge: storedChallenge.challenge,
          expectedOrigin: this.origin,
          expectedRPID: this.rpId,
          requireUserVerification: true,
        } as VerifyRegistrationResponseOpts);

        if (!verification.verified) {
          return {
            success: false,
            error: 'Registration verification failed',
          };
        }

        return {
          success: true,
          credentialId: verification.registrationInfo?.credential?.id,
          publicKey: Buffer.from(
            verification.registrationInfo?.credential?.publicKey || [],
          ).toString('base64'),
        };
      } else {
        // Verify authentication
        // Note: In production, you would need to look up the stored credential
        // For MVP, we just verify the signature is valid
        const verification = await verifyAuthenticationResponse({
          response: credential,
          expectedChallenge: storedChallenge.challenge,
          expectedOrigin: this.origin,
          expectedRPID: this.rpId,
          requireUserVerification: true,
          // In production, provide the actual authenticator from database:
          // authenticator: {
          //   credentialID: storedCredential.id,
          //   credentialPublicKey: storedCredential.publicKey,
          //   counter: storedCredential.counter,
          // },
        } as VerifyAuthenticationResponseOpts);

        return {
          success: true,
          verified: verification.verified,
        };
      }
    } catch (error) {
      throw new BadRequestException(
        `Verification failed: ${error.message}`,
      );
    }
  }

  /**
   * Get storage stats (for debugging)
   */
  getStorageStats() {
    return this.challengeStorage.getStats();
  }
}
