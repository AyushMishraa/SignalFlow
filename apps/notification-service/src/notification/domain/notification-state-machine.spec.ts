import {
  NotificationStateMachine,
  InvalidStateTransitionException,
} from './notification-state-machine';
import { NotificationStatus, AuditEvent } from '@app/contracts';

describe('NotificationStateMachine', () => {
  describe('canTransition & validateTransition', () => {
    it('should allow valid transitions from PENDING', () => {
      expect(
        NotificationStateMachine.canTransition(
          NotificationStatus.PENDING,
          NotificationStatus.QUEUED,
        ),
      ).toBe(true);
      expect(
        NotificationStateMachine.canTransition(
          NotificationStatus.PENDING,
          NotificationStatus.CANCELLED,
        ),
      ).toBe(true);
    });

    it('should allow valid transitions from QUEUED to PROCESSING and CANCELLED', () => {
      expect(
        NotificationStateMachine.canTransition(
          NotificationStatus.QUEUED,
          NotificationStatus.PROCESSING,
        ),
      ).toBe(true);
      expect(
        NotificationStateMachine.canTransition(
          NotificationStatus.QUEUED,
          NotificationStatus.CANCELLED,
        ),
      ).toBe(true);
    });

    it('should allow valid transitions from PROCESSING to SENT and FAILED', () => {
      expect(
        NotificationStateMachine.canTransition(
          NotificationStatus.PROCESSING,
          NotificationStatus.SENT,
        ),
      ).toBe(true);
      expect(
        NotificationStateMachine.canTransition(
          NotificationStatus.PROCESSING,
          NotificationStatus.FAILED,
        ),
      ).toBe(true);
    });

    it('should allow retry transitions from FAILED to RETRYING and DEAD_LETTERED', () => {
      expect(
        NotificationStateMachine.canTransition(
          NotificationStatus.FAILED,
          NotificationStatus.RETRYING,
        ),
      ).toBe(true);
      expect(
        NotificationStateMachine.canTransition(
          NotificationStatus.FAILED,
          NotificationStatus.DEAD_LETTERED,
        ),
      ).toBe(true);
    });

    it('should allow transition from RETRYING back to PROCESSING', () => {
      expect(
        NotificationStateMachine.canTransition(
          NotificationStatus.RETRYING,
          NotificationStatus.PROCESSING,
        ),
      ).toBe(true);
    });

    it('should reject invalid transitions and throw InvalidStateTransitionException', () => {
      // SENT is terminal
      expect(
        NotificationStateMachine.canTransition(
          NotificationStatus.SENT,
          NotificationStatus.PROCESSING,
        ),
      ).toBe(false);
      expect(() =>
        NotificationStateMachine.validateTransition(
          NotificationStatus.SENT,
          NotificationStatus.PROCESSING,
        ),
      ).toThrow(InvalidStateTransitionException);

      // CANCELLED is terminal
      expect(
        NotificationStateMachine.canTransition(
          NotificationStatus.CANCELLED,
          NotificationStatus.SENT,
        ),
      ).toBe(false);
      expect(() =>
        NotificationStateMachine.validateTransition(
          NotificationStatus.CANCELLED,
          NotificationStatus.SENT,
        ),
      ).toThrow(InvalidStateTransitionException);

      // DEAD_LETTERED is terminal
      expect(
        NotificationStateMachine.canTransition(
          NotificationStatus.DEAD_LETTERED,
          NotificationStatus.PROCESSING,
        ),
      ).toBe(false);
    });
  });

  describe('getAuditEventForStatus', () => {
    it('should return correct AuditEvent for given NotificationStatus', () => {
      expect(
        NotificationStateMachine.getAuditEventForStatus(
          NotificationStatus.PENDING,
        ),
      ).toBe(AuditEvent.NOTIFICATION_CREATED);
      expect(
        NotificationStateMachine.getAuditEventForStatus(
          NotificationStatus.SENT,
        ),
      ).toBe(AuditEvent.NOTIFICATION_SENT);
      expect(
        NotificationStateMachine.getAuditEventForStatus(
          NotificationStatus.CANCELLED,
        ),
      ).toBe(AuditEvent.NOTIFICATION_CANCELLED);
    });
  });
});

