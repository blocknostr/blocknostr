
# Nostr Implementation Possibilities (NIPs) Utilities

This directory contains utility functions for implementing various Nostr Implementation Possibilities (NIPs) according to the official Nostr protocol specifications defined at [github.com/nostr-protocol/nips](https://github.com/nostr-protocol/nips).

## Overview

NIPs (Nostr Implementation Possibilities) are standards that define the protocol features and behaviors for Nostr clients and relays. This library implements utilities for working with various NIPs in a modular and maintainable way.

## Implemented NIPs

### NIP-01: Basic Protocol Flow and Event Format
**Specification**: [NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md)

Functions:
- `validateNip01Event(event)`: Validates that an event conforms to the basic Nostr event structure
- `getAccountCreationDate(events)`: Determines account creation date based on earliest metadata event

### NIP-05: Mapping Nostr Keys to DNS-based Internet Identifiers
**Specification**: [NIP-05](https://github.com/nostr-protocol/nips/blob/master/05.md)

Functions:
- `isValidNip05Format(nip05)`: Tests if a string conforms to the NIP-05 identifier format
- `verifyNip05(identifier, expectedPubkey)`: Verifies a NIP-05 identifier against an expected pubkey

### NIP-10: Thread Conversations
**Specification**: [NIP-10](https://github.com/nostr-protocol/nips/blob/master/10.md)

Functions:
- `parseThreadTags(tags)`: Extracts root event, reply event, and mentions from tags array
- `validateNip10Tags(tags)`: Validates e-tags according to NIP-10 specification

### NIP-25: Reactions
**Specification**: [NIP-25](https://github.com/nostr-protocol/nips/blob/master/25.md)

Functions:
- `validateNip25Reaction(event)`: Validates that an event follows the reaction specification

### NIP-39: External Identity Verification
**Specification**: [NIP-39](https://github.com/nostr-protocol/nips/blob/master/39.md)

Functions:
- `checkXVerification(profileData)`: Checks profile data for Twitter/X verification using NIP-39
- `validateNip39Claim(event)`: Validates external identity claims according to NIP-39

### NIP-65: Relay List Metadata
**Specification**: [NIP-65](https://github.com/nostr-protocol/nips/blob/master/65.md)

Functions:
- `parseRelayList(event)`: Parses relay preferences from a kind 10002 event
- `validateNip65RelayList(event)`: Validates a relay list event according to NIP-65

## Usage

Import specific NIP utilities directly:

```typescript
import { verifyNip05 } from '@/lib/nostr/utils/nip/nip05';
import { parseThreadTags } from '@/lib/nostr/utils/nip/nip10';
```

Or import from the main NIP utilities module:

```typescript
import { verifyNip05, parseThreadTags } from '@/lib/nostr/utils/nip';
```

For backward compatibility, you can also import from the legacy path:

```typescript
import { verifyNip05 } from '@/lib/nostr/utils/nip-utilities';
```

## Testing

Each NIP utility has corresponding tests in the `__tests__` directory. Run tests with:

```
npm test
```

## Contributing

When adding support for new NIPs:

1. Create a new file named `nipXX.ts` in the `nip` directory
2. Implement the required functions for that NIP
3. Add exports in `nip/index.ts`
4. Create corresponding tests in `__tests__/nipXX.test.ts`
5. Update this README with documentation on the new NIP

## Future NIPs to Implement

- NIP-04: Encrypted Direct Messages (Deprecated in favor of NIP-44)
- NIP-17: Event Treatment - Private DMs with Metadata Confidentiality
- NIP-36: Sensitive Content
- NIP-44: Versioned Encryption (for DMs)
- NIP-94: File Metadata
- NIP-98: HTTP Auth

## Related Resources

- [Official Nostr NIPs Repository](https://github.com/nostr-protocol/nips)
- [Nostr Implementation Guide](https://github.com/nostr-protocol/nips/blob/master/01.md)
