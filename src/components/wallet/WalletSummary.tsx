import React, { useEffect, useState, useCallback } from "react"
import { useWallet } from "@alephium/web3-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ExternalLink } from "lucide-react"
import { nostrService } from "@/lib/nostr";
import { Event } from "nostr-tools" // Ensure Event is imported

interface TokenBalance {
    id: string
    balance: string       // raw base-unit string
    decimals: number      // always defined after enrichment
    symbol: string        // always defined after enrichment
    name: string          // always defined after enrichment
    logoURI?: string
}

interface AlephiumTokenMeta {
    id: string
    name: string
    symbol: string
    decimals: number
    logoURI?: string
}

interface WalletSummaryPayload {
    address: string
    balances: {
        id: string
        amount: string       // human-readable string
        symbol: string
        name: string
        logoURI?: string
    }[]
}

export const WalletSummary: React.FC = () => {
    const { account } = useWallet()
    const [balances, setBalances] = useState<TokenBalance[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Format token amount from raw balance and decimals
    const formatTokenAmount = (balance: string, decimals: number): string => {
        try {
            // Use BigInt for precise calculations with large numbers
            const rawValue = BigInt(balance);
            if (rawValue === BigInt(0)) return "0.00";
            
            const divisor = BigInt(10 ** decimals);
            
            // Calculate whole and fractional parts
            const wholePart = rawValue / divisor;
            const fractionalPart = rawValue % divisor;
            
            // Format the fractional part with proper precision
            let fractionalStr = fractionalPart.toString().padStart(decimals, '0');
            
            // Trim trailing zeros but keep reasonable precision
            const significantDecimals = Math.min(8, decimals); // Limit to 8 decimals max for display
            fractionalStr = fractionalStr.slice(0, significantDecimals);
            
            // Format the whole part with thousands separators
            const formattedWhole = wholePart.toLocaleString();
            
            return fractionalPart > 0 
                ? `${formattedWhole}.${fractionalStr}` 
                : `${formattedWhole}.00`;
        } catch (error) {
            console.error(`[formatTokenAmount] Error formatting amount with ${decimals} decimals:`, error);
            return "Error";
        }
    };

    const publishWalletSummary = useCallback(
        async (summary: WalletSummaryPayload) => {
            try {
                const pubkey = nostrService.publicKey;
                if (!pubkey) {
                    console.log("[WalletSummary] No Nostr public key available, skipping summary publication");
                    return;
                }
                
                // Use Partial<Event> for the event object before signing
                const nostrEvent: Partial<Event> = {
                    kind: 30000,
                    created_at: Math.floor(Date.now() / 1000),
                    pubkey,
                    tags: [["d", "wallet-summary"]],
                    content: JSON.stringify(summary),
                };

                console.log("[WalletSummary] Creating Nostr event:", nostrEvent);
                
                await nostrService.publishEvent(nostrEvent as Event);
                console.log("[WalletSummary] Wallet summary published to Nostr");
            } catch (e) {
                console.error("[WalletSummary] Failed to publish Nostr event:", e);
            }
        },
        []
    )

    const fetchBalances = useCallback(
        async (address: string) => {
            setLoading(true)
            setError(null)
            try {
                console.log(`[WalletSummary] Fetching balances for address: ${address}`)
                
                // 1) Fetch raw balances array
                const res = await fetch(
                    `https://backend.mainnet.alephium.org/addresses/${address}/tokens-balance?page=1&limit=100`
                )
                if (!res.ok) throw new Error(`API Error (${res.status}): ${res.statusText}`)
                const data = await res.json() as Array<{ tokenId: string; balance: string; lockedBalance: string }>
                console.log("[WalletSummary] Raw balances API data:", data)

                // 2) Fetch the token list file
                const listRes = await fetch(
                    "https://raw.githubusercontent.com/alephium/token-list/master/tokens/mainnet.json"
                )
                
                if (!listRes.ok) {
                    throw new Error(`Token list API Error (${listRes.status}): ${listRes.statusText}`);
                }
                
                const listJson = await listRes.json();
                console.log("[WalletSummary] Raw token list data:", listJson);

                // Extract tokens from the response 
                const tokens: AlephiumTokenMeta[] = listJson.tokens || [];
                
                if (!tokens || !Array.isArray(tokens)) {
                    console.warn("[WalletSummary] Unexpected token list format:", listJson);
                    throw new Error("Unexpected token list format");
                }
                
                console.log(`[WalletSummary] Found ${tokens.length} tokens in the list`);

                // 3) Build a lookup map from tokens
                const tokenMap = new Map<string, AlephiumTokenMeta>();
                
                // Add all tokens to the map
                for (const token of tokens) {
                    if (token && token.id) {
                        tokenMap.set(token.id, token);
                    }
                }
                
                // Always ensure ALPH token is in the map (defensive coding)
                const alphTokenId = "0000000000000000000000000000000000000000000000000000000000000000";
                if (!tokenMap.has(alphTokenId)) {
                    tokenMap.set(alphTokenId, {
                        id: alphTokenId,
                        name: "Alephium",
                        symbol: "ALPH",
                        decimals: 18,
                        logoURI: "https://raw.githubusercontent.com/alephium/token-list/master/logos/ALPH.png"
                    });
                }

                // 4) Enrich + filter out zero balances
                const enriched: TokenBalance[] = data
                    .filter((item) => item.balance !== "0") // Skip zero balances
                    .map((item) => {
                        const meta = tokenMap.get(item.tokenId);
                        let decimals, symbol, name, logoURI;

                        if (meta) {
                            decimals = meta.decimals;
                            symbol = meta.symbol;
                            name = meta.name;
                            logoURI = meta.logoURI;
                        } else {
                            console.warn(`[WalletSummary] Metadata not found for token ID: ${item.tokenId}`);
                            decimals = 18; // Default to 18 decimals
                            symbol = item.tokenId.slice(0, 6);
                            name = "Unknown Token";
                            logoURI = undefined;
                        }

                        return {
                            id: item.tokenId,
                            balance: item.balance,
                            decimals,
                            symbol,
                            name,
                            logoURI,
                        };
                    });
                
                // Add native ALPH balance as a token for consistent display
                if (address) {
                    try {
                        const addressInfoRes = await fetch(`https://backend.mainnet.alephium.org/addresses/${address}`);
                        if (addressInfoRes.ok) {
                            const addressInfo = await addressInfoRes.json();
                            if (addressInfo.balance && addressInfo.balance !== "0") {
                                enriched.unshift({
                                    id: alphTokenId,
                                    balance: addressInfo.balance,
                                    decimals: 18,
                                    symbol: "ALPH",
                                    name: "Alephium",
                                    logoURI: "https://raw.githubusercontent.com/alephium/token-list/master/logos/ALPH.png"
                                });
                            }
                        } else {
                            throw new Error(`Address info API Error (${addressInfoRes.status}): ${addressInfoRes.statusText}`)
                        }
                    } catch (err) {
                        console.error("[WalletSummary] Failed to fetch ALPH balance", err);
                        // Don't throw here - we can continue with other tokens
                    }
                }

                console.log("[WalletSummary] Enriched balances:", enriched);
                setBalances(enriched);

                // 5) Publish the human-readable summary on Nostr
                if (nostrService.publicKey) {
                    const summaryPayload: WalletSummaryPayload = {
                        address,
                        balances: enriched.map(tok => {
                            // Format the balance using the correct decimal precision
                            const formattedAmount = formatTokenAmount(tok.balance, tok.decimals);
                            
                            return {
                                id: tok.id,
                                amount: formattedAmount,
                                symbol: tok.symbol,
                                name: tok.name,
                                logoURI: tok.logoURI,
                            };
                        })
                    }
                    await publishWalletSummary(summaryPayload);
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Unable to load balances.";
                console.error("[WalletSummary] Failed to fetch balances", err);
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        },
        [publishWalletSummary]
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

    // Render when wallet not connected
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
                    <h2 className="text-lg font-semibold">Alephium Wallet Summary</h2>
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

                {error && (
                    <p className="text-sm text-red-500">{error}</p>
                )}

                {!loading && !error && balances.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        No token balances found.
                    </p>
                )}

                {!loading && !error && balances.length > 0 && (
                    <div className="space-y-2">
                        {balances.map(tok => {
                            // Format the token amount using the correct decimal precision
                            const formatted = formatTokenAmount(tok.balance, tok.decimals);
                            
                            return (
                                <div
                                    key={tok.id}
                                    className="flex items-center justify-between border p-2 rounded"
                                >
                                    <div className="flex items-center gap-3">
                                        {tok.logoURI ? (
                                            <img
                                                src={tok.logoURI}
                                                alt={tok.symbol}
                                                className="w-6 h-6 rounded"
                                                onError={(e) => {
                                                    // Type assertion to HTMLImageElement which has display property
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                    // Using optional chaining and type assertion for nextElementSibling
                                                    const nextElement = target.nextElementSibling as HTMLElement | null;
                                                    if (nextElement) {
                                                        nextElement.style.display = 'flex';
                                                    }
                                                }}
                                            />
                                        ) : null}
                                        <div 
                                            className={`w-6 h-6 bg-gray-300 rounded flex items-center justify-center text-xs text-gray-600 ${tok.logoURI ? 'hidden' : ''}`}
                                        >
                                            {tok.symbol.charAt(0)}
                                        </div>
                                        <div className="text-sm">
                                            <div className="font-medium">
                                                {tok.symbol}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {tok.name}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-sm font-mono">{formatted}</div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
