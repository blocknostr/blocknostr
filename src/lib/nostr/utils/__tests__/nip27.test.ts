
import * as nip27 from '../nip/nip27';

describe('NIP-27 Utilities', () => {
  describe('extractMentions', () => {
    it('should extract npub mentions from content', () => {
      const content = 'Hello nostr:npub1xtscya34g58tk0z605fvr788k263gsu6cy9x0mhnm87echrgufzsevkk5s';
      const mentions = nip27.extractMentions(content);
      expect(mentions).toContain('nostr:npub1xtscya34g58tk0z605fvr788k263gsu6cy9x0mhnm87echrgufzsevkk5s');
    });

    it('should extract note mentions from content', () => {
      const content = 'Check out this note: nostr:note1ezpg29tfc8jwkd68v9qjuqjm7h2ymhkjevpuvajfwy3f98jc39hqbw5tea';
      const mentions = nip27.extractMentions(content);
      expect(mentions).toContain('nostr:note1ezpg29tfc8jwkd68v9qjuqjm7h2ymhkjevpuvajfwy3f98jc39hqbw5tea');
    });

    it('should extract nevent mentions from content', () => {
      const content = 'Check this event: nostr:nevent1qqs95eqk6hd00w5tmj3felaxmwlw8tjcqkgjxz9fallf37xes838gprpmhxue69uhkummn9ekx7mqplamk64';
      const mentions = nip27.extractMentions(content);
      expect(mentions).toContain('nostr:nevent1qqs95eqk6hd00w5tmj3felaxmwlw8tjcqkgjxz9fallf37xes838gprpmhxue69uhkummn9ekx7mqplamk64');
    });

    it('should extract @ mentions from content', () => {
      const content = 'Hello @jack and @sarah';
      const mentions = nip27.extractMentions(content);
      expect(mentions).toContain('@jack');
      expect(mentions).toContain('@sarah');
    });

    it('should extract both nostr: URLs and @ mentions from content', () => {
      const content = 'Hello @jack and nostr:npub1xtscya34g58tk0z605fvr788k263gsu6cy9x0mhnm87echrgufzsevkk5s';
      const mentions = nip27.extractMentions(content);
      expect(mentions).toContain('@jack');
      expect(mentions).toContain('nostr:npub1xtscya34g58tk0z605fvr788k263gsu6cy9x0mhnm87echrgufzsevkk5s');
    });

    it('should return empty array for empty content', () => {
      const content = '';
      const mentions = nip27.extractMentions(content);
      expect(mentions).toEqual([]);
    });

    it('should return empty array for null or undefined content', () => {
      const mentions1 = nip27.extractMentions(null as any);
      const mentions2 = nip27.extractMentions(undefined as any);
      expect(mentions1).toEqual([]);
      expect(mentions2).toEqual([]);
    });
  });

  describe('isNostrUrl', () => {
    it('should recognize valid nostr: URLs', () => {
      expect(nip27.isNostrUrl('nostr:npub1xtscya34g58tk0z605fvr788k263gsu6cy9x0mhnm87echrgufzsevkk5s')).toBe(true);
      expect(nip27.isNostrUrl('nostr:note1ezpg29tfc8jwkd68v9qjuqjm7h2ymhkjevpuvajfwy3f98jc39hqbw5tea')).toBe(true);
      expect(nip27.isNostrUrl('nostr:nevent1qqs95eqk6hd00w5tmj3felaxmwlw8tjcqkgjxz9fallf37xes838gprpmhxue69uhkummn9ekx7mqplamk64')).toBe(true);
    });

    it('should reject invalid nostr: URLs', () => {
      expect(nip27.isNostrUrl('npub1xtscya34g58tk0z605fvr788k263gsu6cy9x0mhnm87echrgufzsevkk5s')).toBe(false);
      expect(nip27.isNostrUrl('https://example.com')).toBe(false);
      expect(nip27.isNostrUrl('nostr:invalid')).toBe(false);
    });
  });

  describe('shortenIdentifier', () => {
    it('should shorten identifiers correctly', () => {
      expect(nip27.shortenIdentifier('npub1xtscya34g58tk0z605fvr788k263gsu6cy9x0mhnm87echrgufzsevkk5s')).toBe('npub1x...kk5s');
      expect(nip27.shortenIdentifier('note1ezpg29tfc8jwkd68v9qjuqjm7h2ymhkjevpuvajfwy3f98jc39hqbw5tea')).toBe('note1e...5tea');
    });

    it('should handle empty identifiers', () => {
      expect(nip27.shortenIdentifier('')).toBe('');
      expect(nip27.shortenIdentifier(null as any)).toBe('');
      expect(nip27.shortenIdentifier(undefined as any)).toBe('');
    });
  });

  describe('getHexFromNostrUrl', () => {
    // Note: These tests would likely need mocking of nip19.decode
    // For now, we'll just test the basic URL parsing logic
    
    it('should handle invalid URLs', () => {
      expect(nip27.getHexFromNostrUrl('not-a-nostr-url')).toBeNull();
      expect(nip27.getHexFromNostrUrl('nostr:')).toBeNull();
    });
  });

  describe('getProfileUrl', () => {
    it('should create proper profile URLs', () => {
      // This assumes nostrService.getNpubFromHex doesn't throw
      const result = nip27.getProfileUrl('npub1xtscya34g58tk0z605fvr788k263gsu6cy9x0mhnm87echrgufzsevkk5s');
      expect(result).toBe('/profile/npub1xtscya34g58tk0z605fvr788k263gsu6cy9x0mhnm87echrgufzsevkk5s');
    });
  });

  describe('getEventUrl', () => {
    it('should create proper event URLs', () => {
      const result = nip27.getEventUrl('note1ezpg29tfc8jwkd68v9qjuqjm7h2ymhkjevpuvajfwy3f98jc39hqbw5tea');
      expect(result).toBe('/post/note1ezpg29tfc8jwkd68v9qjuqjm7h2ymhkjevpuvajfwy3f98jc39hqbw5tea');
    });
  });
});
