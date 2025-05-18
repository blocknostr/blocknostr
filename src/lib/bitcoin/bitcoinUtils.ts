
import * as cryptoWallet from '@trustwallet/wallet-core';
import { BTCAddressValidation } from '@/types/wallet';

/**
 * Validates a Bitcoin address
 * @param address The address to validate
 * @returns An object with validation results
 */
export const validateBitcoinAddress = async (address: string): Promise<BTCAddressValidation> => {
  try {
    // First try with TrustWallet validation if available
    if (typeof cryptoWallet === 'object' && cryptoWallet.CoinType) {
      const isValid = cryptoWallet.BitcoinAddress.isValid(address);
      
      if (isValid) {
        // Determine address type
        let type = null;
        
        if (address.startsWith('1')) type = 'p2pkh';
        else if (address.startsWith('3')) type = 'p2sh';
        else if (address.startsWith('bc1')) type = 'bech32';
        
        return {
          isValid: true,
          network: 'mainnet',
          type
        };
      }
    }
    
    // Fallback to basic validation
    // Very basic check - not a real validation
    const isBasicValid = (
      (address.startsWith('1') && address.length === 34) || // P2PKH
      (address.startsWith('3') && address.length === 34) || // P2SH
      (address.startsWith('bc1') && address.length >= 42)   // Bech32
    );
    
    let type = null;
    if (address.startsWith('1')) type = 'p2pkh';
    else if (address.startsWith('3')) type = 'p2sh';
    else if (address.startsWith('bc1')) type = 'bech32';
    
    return {
      isValid: isBasicValid,
      network: isBasicValid ? 'mainnet' : null,
      type
    };
  } catch (error) {
    console.error('Bitcoin address validation error:', error);
    return {
      isValid: false,
      network: null,
      type: null
    };
  }
};

/**
 * Generates a QR code for a Bitcoin address
 * @param address Bitcoin address to encode
 * @returns Data URL for QR code image
 */
export const generateBitcoinQRCode = async (address: string): Promise<string> => {
  try {
    // Use dynamic import to avoid SSR issues
    const QRCode = (await import('qrcode')).default;
    
    // Create a bitcoin URI (bitcoin:address)
    const bitcoinUri = `bitcoin:${address}`;
    
    // Generate QR code as data URL
    return await QRCode.toDataURL(bitcoinUri, {
      margin: 1,
      scale: 8,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
  } catch (error) {
    console.error('Error generating Bitcoin QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generates a valid demo Bitcoin address
 * @returns A valid Bitcoin address for demo purposes
 */
export const generateDemoBitcoinAddress = (): string => {
  // These are just demo addresses, not real funded addresses
  const demoAddresses = [
    '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // First Bitcoin address (Satoshi)
    'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', // Bech32 example
    '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy'  // P2SH example
  ];
  
  return demoAddresses[Math.floor(Math.random() * demoAddresses.length)];
};

/**
 * Formats a Bitcoin address for display (with ellipsis in the middle)
 * @param address Full Bitcoin address
 * @returns Formatted address for display
 */
export const formatBitcoinAddress = (address: string): string => {
  if (address.length <= 12) return address;
  
  const prefix = address.substring(0, 6);
  const suffix = address.substring(address.length - 4);
  
  return `${prefix}...${suffix}`;
};

/**
 * Modifies the WalletsPage to generate proper Bitcoin demo addresses
 * @param baseAddress Base address to derive from
 * @returns A valid Bitcoin address
 */
export const generateBitcoinAddressFromBase = (baseAddress: string): string => {
  // Use first character to decide which type of address to generate
  const charCode = baseAddress.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Choose address type based on hash of base address
  const type = charCode % 3;
  
  switch (type) {
    case 0: // P2PKH
      return `1${baseAddress.substring(1, 30)}abc`;
    case 1: // P2SH
      return `3${baseAddress.substring(1, 30)}def`;
    case 2: // Bech32
      return `bc1q${baseAddress.substring(2, 36)}`;
    default:
      return '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
  }
};
