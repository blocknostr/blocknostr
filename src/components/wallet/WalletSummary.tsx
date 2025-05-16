
import React, { useEffect, useState, useCallback } from "react"
import { useWallet } from "@alephium/web3-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ExternalLink } from "lucide-react"
import { nostrService } from "@/lib/nostr"
import { toast } from "sonner"

// —— token‐list interfaces —————————————————————————————————————————————
interface AlephiumTokenMeta {
  id: string
  name: string
  nameOnChain?: string
  symbol: string
  symbolOnChain?: string
  decimals: number
  description?: string
  logoURI?: string
}

interface NetworkSpecificTokenList {
  networkId: number
  tokens: AlephiumTokenMeta[]
}

interface CombinedTokenListFormat {
  lists: NetworkSpecificTokenList[]
}

// —— balance interfaces —————————————————————————————————————————————
interface TokenBalanceRaw {
  tokenId: string
  balance: string
  lockedBalance: string
}

interface TokenBalance {
  id: string
  balance: string        // raw base‐unit string
  decimals: number
  symbol: string
  name: string
  description?: string
  logoURI?: string
}

interface WalletSummaryPayload {
  address: string
  balances: {
    id: string
    amount: string       // human‐readable
    symbol: string
    name: string
    logoURI?: string
  }[]
}

// —— component ————————————————————————————————————————————————————————
export const WalletSummary: React.FC = () => {
  const { account } = useWallet()
  const [balances, setBalances] = useState<TokenBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Helper function to safely format token balances based on decimals
  const formatTokenBalance = (rawBalance: string, decimals: number): string => {
    try {
      // For very large numbers, use BigInt to avoid precision issues
      if (decimals > 0) {
        const rawBigInt = BigInt(rawBalance);
        const divisor = BigInt(10 ** decimals);
        
        if (rawBigInt === 0n) return "0";
        
        const integerPart = rawBigInt / divisor;
        const fractionalBigInt = rawBigInt % divisor;
        
        if (fractionalBigInt === 0n) {
          return integerPart.toString();
        }
        
        // Convert to string and pad with leading zeros
        let fractionalStr = fractionalBigInt.toString();
        fractionalStr = fractionalStr.padStart(decimals, '0');
        
        // Remove trailing zeros
        fractionalStr = fractionalStr.replace(/0+$/, '');
        
        if (fractionalStr.length > 0) {
          return `${integerPart.toString()}.${fractionalStr}`;
        }
        
        return integerPart.toString();
      }
      
      // For tokens with 0 decimals (integer tokens)
      return rawBalance;
    } catch (e) {
      console.error("Error formatting token balance:", e);
      return "Error";
    }
  };

  // publish summary to Nostr (optional)
  const publishWalletSummary = useCallback(
    async (summary: WalletSummaryPayload) => {
      try {
        const pubkey = nostrService.publicKey
        if (!pubkey) return
        
        console.log("[WalletSummary] would publish:", summary)
        // implement sign & publish if you like...
        // For now, just log the summary data
      } catch (error) {
        console.error("Failed to publish wallet summary to Nostr:", error);
      }
    },
    []
  )

  const fetchBalances = useCallback(
    async (address: string) => {
      setLoading(true)
      setError(null)
      try {
        // 1) raw balances
        const res = await fetch(
          `https://backend.mainnet.alephium.org/addresses/${address}/tokens-balance?page=1&limit=100`
        )
        if (!res.ok) throw new Error(`Failed to fetch token balances: ${res.status} ${res.statusText}`)
        const rawData = (await res.json()) as TokenBalanceRaw[]

        // 2) official token list
        const offRes = await fetch(
          "https://raw.githubusercontent.com/alephium/token-list/master/tokens/mainnet.json"
        )
        const offJson: CombinedTokenListFormat = offRes.ok
          ? await offRes.json()
          : { lists: [] }
        const offList = offJson.lists.find((l) => l.networkId === 0)?.tokens || []

        // 3) your custom token list on GitHub "cyxe"
        const customRes = await fetch(
          "https://raw.githubusercontent.com/cyxe/token-list/main/alephium/mainnet.json"
        )
        const customJson = customRes.ok ? await customRes.json() : { tokens: [] }
        const customList: AlephiumTokenMeta[] = customJson.tokens || []

        // build merged map (custom overrides official)
        const tokenMap = new Map<string, AlephiumTokenMeta>()
        
        // Add ALPH token if not in list
        const alphToken: AlephiumTokenMeta = {
          id: "0000000000000000000000000000000000000000000000000000000000000000",
          name: "Alephium",
          symbol: "ALPH",
          decimals: 18,
          description: "Alephium is a scalable, decentralized, and secure blockchain platform that enables the creation of fast and secure applications.",
          logoURI: "https://raw.githubusercontent.com/alephium/token-list/master/logos/ALPH.png"
        }
        tokenMap.set(alphToken.id, alphToken)
        
        // Add official tokens
        offList.forEach((t) => tokenMap.set(t.id, t))
        
        // Add custom tokens (overriding any conflicts)
        customList.forEach((t) => tokenMap.set(t.id, t))

        // 4) enrich & format
        const enriched: TokenBalance[] = rawData
          .filter((b) => b.balance !== "0")
          .map(({ tokenId, balance }) => {
            const meta = tokenMap.get(tokenId)
            const decimals = meta?.decimals ?? 0
            return {
              id: tokenId,
              balance,
              decimals,
              symbol: meta?.symbol ?? tokenId.slice(0, 6),
              name: meta?.name ?? "Unknown Token",
              description: meta?.description,
              logoURI: meta?.logoURI,
            }
          })

        setBalances(enriched)

        // 5) optionally publish
        if (nostrService.publicKey) {
          const summaryPayload: WalletSummaryPayload = {
            address,
            balances: enriched.map((tok) => ({
              id: tok.id,
              amount: formatTokenBalance(tok.balance, tok.decimals),
              symbol: tok.symbol,
              name: tok.name,
              logoURI: tok.logoURI,
            }))
          }
          await publishWalletSummary(summaryPayload)
        }
      } catch (err: any) {
        console.error("Failed to fetch balances", err)
        setError(err.message || "Unable to load balances.")
        toast.error("Failed to load token balances", {
          description: err.message || "Please try again later"
        })
      } finally {
        setLoading(false)
      }
    },
    [publishWalletSummary, formatTokenBalance]
  )

  useEffect(() => {
    if (account?.address) {
      fetchBalances(account.address)
    } else {
      setBalances([])
      setError(null)
      setLoading(false)
    }
  }, [account?.address, fetchBalances])

  if (!account?.address) {
    return (
      <Card className="mt-6">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            Connect your Alephium wallet to view balances.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mt-6">
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Token Balances</h2>
          <a
            href={`https://explorer.alephium.org/addresses/${account.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline flex items-center"
          >
            View on Explorer <ExternalLink className="ml-1 h-4 w-4" />
          </a>
        </div>

        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded" />
            ))}
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        {!loading && !error && balances.length === 0 && (
          <p className="text-sm text-muted-foreground">No token balances found.</p>
        )}

        {!loading && !error && balances.length > 0 && (
          <div className="space-y-2">
            {balances.map((tok) => (
              <div
                key={tok.id}
                className="flex items-center justify-between border p-3 rounded hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {tok.logoURI ? (
                    <img
                      src={tok.logoURI}
                      alt={tok.symbol}
                      className="w-8 h-8 rounded-full"
                      onError={(e) => {
                        // Replace with fallback on image load error
                        (e.target as HTMLImageElement).src = 'https://placehold.co/32x32/ddd/aaa?text=' + tok.symbol.charAt(0);
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-xs">
                      {tok.symbol.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{tok.symbol}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                      {tok.name}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="font-semibold">{formatTokenBalance(tok.balance, tok.decimals)}</div>
                  <div className="text-xs text-muted-foreground">
                    {tok.id.substring(0, 8)}...{tok.id.substring(tok.id.length - 8)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
