
# NIP Protocol Test Suite

This directory contains unit tests for our Nostr Implementation Possibilities (NIPs) implementations.

## Running Tests

To run all tests:
```
npm test
```

To run tests with coverage:
```
npm run test:coverage
```

To run a specific test file:
```
npm test -- media-extraction
```

## Test Structure

- `nip-validator.test.ts`: Tests for the validator functions used to validate NIP compliance
- `nip-utilities.test.ts`: Tests for utility functions used to implement NIPs
- `media-extraction.test.ts`: Tests for media extraction and validation functions

## NIP Coverage

These tests validate the following NIPs:

- NIP-01: Basic protocol flow and event format
- NIP-05: Mapping Nostr keys to DNS-based internet identifiers
- NIP-10: Thread conversations
- NIP-25: Reactions
- NIP-39: External identity claims
- NIP-65: Relay list metadata
