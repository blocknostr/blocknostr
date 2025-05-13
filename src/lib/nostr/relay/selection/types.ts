
export interface RelaySelectionOptions {
  /**
   * Type of operation: 'read', 'write', or 'both'
   */
  operation: 'read' | 'write' | 'both';
  
  /**
   * Number of relays to select
   */
  count: number;
  
  /**
   * Minimum score required (0-100)
   */
  minScore?: number;
  
  /**
   * Require relay to support write operations
   */
  requireWriteSupport?: boolean;
  
  /**
   * Specific NIPs that must be supported
   */
  requiredNips?: number[];
}
