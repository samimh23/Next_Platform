/** Shapes returned by the backend owner endpoints. Amounts are millimes. */

export type DeviceRole = 'hub' | 'pos' | 'kds';

export interface Device {
  id: string;
  /** T1, T2… */
  code: string;
  name: string;
  role: DeviceRole;
  disabled: boolean;
  /** Synced in the last 60 seconds. */
  online: boolean;
  lastSeenAt: string | null;
  /** Events received from this POS. */
  lastSeq: number;
  pairedAt: string;
}

export interface PairingCode {
  code: string;
  role: DeviceRole;
  expiresAt: string;
}
