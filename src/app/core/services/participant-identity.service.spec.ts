import { TestBed } from '@angular/core/testing';
import { ParticipantIdentityService } from './participant-identity.service';

describe('ParticipantIdentityService', () => {
  let service: ParticipantIdentityService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ParticipantIdentityService);
  });

  afterEach(() => localStorage.clear());

  it('returns null when nothing has been stored for the session', () => {
    expect(service.get('ABC123')).toBeNull();
  });

  it('round-trips a stored identity', () => {
    service.save('ABC123', {
      participantId: 'p-1',
      accessToken: 'tok-1',
      name: 'Danish',
    });

    expect(service.get('ABC123')).toEqual({
      participantId: 'p-1',
      accessToken: 'tok-1',
      name: 'Danish',
    });
  });

  it('keeps identities for different sessions separate', () => {
    service.save('AAA', { participantId: 'p-a', accessToken: 'tok-a', name: null });
    service.save('BBB', { participantId: 'p-b', accessToken: 'tok-b', name: null });

    expect(service.get('AAA')?.participantId).toBe('p-a');
    expect(service.get('BBB')?.participantId).toBe('p-b');
  });

  it('clears only the requested session', () => {
    service.save('AAA', { participantId: 'p-a', accessToken: 'tok-a', name: null });
    service.save('BBB', { participantId: 'p-b', accessToken: 'tok-b', name: null });

    service.clear('AAA');

    expect(service.get('AAA')).toBeNull();
    expect(service.get('BBB')).not.toBeNull();
  });

  it('treats a record missing its token as no identity', () => {
    localStorage.setItem(
      'jumpasini_participant_ABC123',
      JSON.stringify({ participantId: 'p-1' }),
    );

    expect(service.get('ABC123')).toBeNull();
  });

  it('does not throw on corrupted stored JSON', () => {
    localStorage.setItem('jumpasini_participant_ABC123', 'not-json');

    expect(() => service.get('ABC123')).not.toThrow();
    expect(service.get('ABC123')).toBeNull();
  });
});
