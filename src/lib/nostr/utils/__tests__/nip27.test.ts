
import * as nip27 from '../nip/nip27';
import { nip19 } from 'nostr-tools';

// Mock the dependencies
jest.mock('nostr-tools', () => ({
  nip19: {
    decode: jest.fn(),
    noteEncode: jest.fn(),
    npubEncode: jest.fn(),
  }
}));

// Mock the services
jest.mock('@/lib/nostr', () => ({
  nostrService: {
    getNpubFromHex: jest.fn((hex) => `npub_from_${hex}`),
  }
}));

jest.mock('@/lib/services/UnifiedProfileService', () => ({
  unifiedProfileService: {
    getProfile: jest.fn(),
  }
}));

jest.mock('@/lib/nostr/utils/keys', () => ({
  isValidHexPubkey: jest.fn((key) => key && key.length === 64 && /^[0-9a-f]{64}$/i.test(key)),
}));

describe('NIP-27 Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

    it('should extract hex key mentions from content', () => {
      const hexPubkey = '7f38a7ab2029715989b3e10dba23d4e91d1dbd9c685a368742befc4981b8bc60';
      const content = `Check this pubkey: nostr:${hexPubkey}`;
      const mentions = nip27.extractMentions(content);
      expect(mentions).toContain(`nostr:${hexPubkey}`);
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
      
      // Test hex pubkey format
      const hexPubkey = '7f38a7ab2029715989b3e10dba23d4e91d1dbd9c685a368742befc4981b8bc60';
      expect(nip27.isNostrUrl(`nostr:${hexPubkey}`)).toBe(true);
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
      
      // Test hex pubkey format
      const hexPubkey = '7f38a7ab2029715989b3e10dba23d4e91d1dbd9c685a368742befc4981b8bc60';
      expect(nip27.shortenIdentifier(hexPubkey)).toBe('7f38a7...8bc60');
    });

    it('should handle empty identifiers', () => {
      expect(nip27.shortenIdentifier('')).toBe('');
      expect(nip27.shortenIdentifier(null as any)).toBe('');
      expect(nip27.shortenIdentifier(undefined as any)).toBe('');
    });
  });

  describe('getHexFromNostrUrl', () => {
    it('should extract hex from npub', () => {
      const hex = '7f38a7ab2029715989b3e10dba23d4e91d1dbd9c685a368742befc4981b8bc60';
      (nip19.decode as jest.Mock).mockReturnValueOnce({ type: 'npub', data: hex });
      
      const result = nip27.getHexFromNostrUrl('nostr:npub1xtscya34g58tk0z605fvr788k263gsu6cy9x0mhnm87echrgufzsevkk5s');
      expect(result).toBe(hex);
    });
    
    it('should extract hex from note', () => {
      const hex = '7f38a7ab2029715989b3e10dba23d4e91d1dbd9c685a368742befc4981b8bc60';
      (nip19.decode as jest.Mock).mockReturnValueOnce({ type: 'note', data: hex });
      
      const result = nip27.getHexFromNostrUrl('nostr:note1ezpg29tfc8jwkd68v9qjuqjm7h2ymhkjevpuvajfwy3f98jc39hqbw5tea');
      expect(result).toBe(hex);
    });
    
    it('should extract hex from nevent', () => {
      const hex = '7f38a7ab2029715989b3e10dba23d4e91d1dbd9c685a368742befc4981b8bc60';
      (nip19.decode as jest.Mock).mockReturnValueOnce({ 
        type: 'nevent', 
        data: { id: hex, relays: ['wss://relay.example.com'] } 
      });
      
      const result = nip27.getHexFromNostrUrl('nostr:nevent1qqs95eqk6hd00w5tmj3felaxmwlw8tjcqkgjxz9fallf37xes838gprpmhxue69uhkummn9ekx7mqplamk64');
      expect(result).toBe(hex);
    });
    
    it('should extract hex from nprofile', () => {
      const hex = '7f38a7ab2029715989b3e10dba23d4e91d1dbd9c685a368742befc4981b8bc60';
      (nip19.decode as jest.Mock).mockReturnValueOnce({ 
        type: 'nprofile', 
        data: { pubkey: hex, relays: ['wss://relay.example.com'] } 
      });
      
      const result = nip27.getHexFromNostrUrl('nostr:nprofile1qqsrhuxx8l9ex335q7he0f09aej04zpazpl0ne2cgukyawd24mayt8gpp4mhxue69uhhytnc9e3k7mgpz4mhxue69uhkg6nzv9ejuumpv34kytnrdaksjlyr9p');
      expect(result).toBe(hex);
    });
    
    it('should handle direct hex format', () => {
      const hex = '7f38a7ab2029715989b3e10dba23d4e91d1dbd9c685a368742befc4981b8bc60';
      const result = nip27.getHexFromNostrUrl(`nostr:${hex}`);
      expect(result).toBe(hex);
    });
    
    it('should handle invalid URLs', () => {
      expect(nip27.getHexFromNostrUrl('not-a-nostr-url')).toBeNull();
      expect(nip27.getHexFromNostrUrl('nostr:')).toBeNull();
      expect(nip27.getHexFromNostrUrl('nostr:invalid')).toBeNull();
    });
  });

  describe('normalizeToHexPubkey', () => {
    it('should return the hex pubkey directly if valid', () => {
      const hex = '7f38a7ab2029715989b3e10dba23d4e91d1dbd9c685a368742befc4981b8bc60';
      const result = nip27.normalizeToHexPubkey(hex);
      expect(result).toBe(hex);
    });
    
    it('should extract hex from npub', () => {
      const hex = '7f38a7ab2029715989b3e10dba23d4e91d1dbd9c685a368742befc4981b8bc60';
      (nip19.decode as jest.Mock).mockReturnValueOnce({ type: 'npub', data: hex });
      
      const result = nip27.normalizeToHexPubkey('npub1xtscya34g58tk0z605fvr788k263gsu6cy9x0mhnm87echrgufzsevkk5s');
      expect(result).toBe(hex);
    });
    
    it('should extract hex from nprofile', () => {
      const hex = '7f38a7ab2029715989b3e10dba23d4e91d1dbd9c685a368742befc4981b8bc60';
      (nip19.decode as jest.Mock).mockReturnValueOnce({ 
        type: 'nprofile', 
        data: { pubkey: hex, relays: ['wss://relay.example.com'] } 
      });
      
      const result = nip27.normalizeToHexPubkey('nprofile1qqsrhuxx8l9ex335q7he0f09aej04zpazpl0ne2cgukyawd24mayt8gpp4mhxue69uhhytnc9e3k7mgpz4mhxue69uhkg6nzv9ejuumpv34kytnrdaksjlyr9p');
      expect(result).toBe(hex);
    });
    
    it('should extract hex from nostr: URL', () => {
      const hex = '7f38a7ab2029715989b3e10dba23d4e91d1dbd9c685a368742befc4981b8bc60';
      (nip19.decode as jest.Mock).mockReturnValueOnce({ type: 'npub', data: hex });
      
      const result = nip27.normalizeToHexPubkey('nostr:npub1xtscya34g58tk0z605fvr788k263gsu6cy9x0mhnm87echrgufzsevkk5s');
      expect(result).toBe(hex);
    });
    
    it('should handle invalid inputs', () => {
      expect(nip27.normalizeToHexPubkey('')).toBeNull();
      expect(nip27.normalizeToHexPubkey(null as any)).toBeNull();
      expect(nip27.normalizeToHexPubkey('invalid')).toBeNull();
    });
  });

  describe('getProfileUrl', () => {
    it('should create proper profile URLs for npub', () => {
      const npub = 'npub1xtscya34g58tk0z605fvr788k263gsu6cy9x0mhnm87echrgufzsevkk5s';
      const result = nip27.getProfileUrl(npub);
      expect(result).toBe(`/profile/${npub}`);
    });
    
    it('should create proper profile URLs for hex pubkey', () => {
      const hex = '7f38a7ab2029715989b3e10dba23d4e91d1dbd9c685a368742befc4981b8bc60';
      const npub = `npub_from_${hex}`;
      const result = nip27.getProfileUrl(hex);
      expect(result).toBe(`/profile/${npub}`);
    });
    
    it('should handle invalid inputs', () => {
      expect(nip27.getProfileUrl('')).toBe('/profile/unknown');
      expect(nip27.getProfileUrl(null as any)).toBe('/profile/unknown');
    });
  });

  describe('getEventUrl', () => {
    it('should create proper event URLs for note1', () => {
      const note = 'note1ezpg29tfc8jwkd68v9qjuqjm7h2ymhkjevpuvajfwy3f98jc39hqbw5tea';
      const result = nip27.getEventUrl(note);
      expect(result).toBe(`/post/${note}`);
    });
    
    it('should create proper event URLs for hex event ID', () => {
      const hex = '7f38a7ab2029715989b3e10dba23d4e91d1dbd9c685a368742befc4981b8bc60';
      const note = 'note1encoded';
      (nip19.noteEncode as jest.Mock).mockReturnValueOnce(note);
      
      const result = nip27.getEventUrl(hex);
      expect(result).toBe(`/post/${note}`);
    });
    
    it('should handle invalid inputs', () => {
      expect(nip27.getEventUrl('')).toBe('/post/unknown');
      expect(nip27.getEventUrl(null as any)).toBe('/post/unknown');
    });
  });
});
