import React, { useEffect, useState, useCallback } from "react"
import { useWallet } from "@alephium/web3-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ExternalLink } from "lucide-react"
import { nostrService } from "@/lib/nostr"
// nip04 is still used for its interface, but encryption will prefer window.nostr
import { nip04 } from "nostr-tools";
import type { NostrEvent } from "@/lib/nostr/types"; // Import NostrEvent type

interface TokenBalance {
    id: string
    amount: string
    decimals?: number
    symbol?: string
    name?: string
    logoURI?: string
}

// Define a type for Alephium token metadata from the token list
interface AlephiumTokenMeta {
    id: string;
    name: string;
    symbol: string;
    decimals: number;
    logoURI?: string;
    // Add other relevant fields if they exist in tokenlist.json
}

interface AlephiumTokenData {
    id: string;
    amount: string;
    // Add other properties if known, otherwise keep it minimal or use `any` if structure is very dynamic
}

interface WalletSummaryPayload {
    address: string
    balances: {
        id: string
        symbol?: string
        name?: string
        amount: string
        decimals?: number
    }[]
}

export const WalletSummary: React.FC = () => {
    const { account } = useWallet()
    const [balances, setBalances] = useState<TokenBalance[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [privateMode, setPrivateMode] = useState(false)

    const publishWalletSummary = useCallback(async (
        summary: WalletSummaryPayload,
        recipientPubkey: string,
        isPrivate: boolean
    ) => {
        const currentUserPubkey = nostrService.publicKey;
        if (!currentUserPubkey) {
            console.error("PUBLISH_ERROR: User public key not available for publishing.");
            setError("Cannot publish summary: User not logged in or public key missing.");
            return;
        }

        let contentToPublish = JSON.stringify(summary);
        let eventKind = 30000; // Custom kind for public wallet summary
        let eventTags: string[][] = [["d", "wallet-summary"]];

        if (isPrivate) {
            console.log("PUBLISH_INFO: Attempting private mode.");
            if (!window.nostr?.nip04?.encrypt) {
                console.error("PUBLISH_ERROR: NIP-04 encryption (window.nostr.nip04.encrypt) not available.");
                setError("Cannot send privately: NIP-07 extension with NIP-04 support is required.");
                return;
            }
            try {
                console.log("PUBLISH_INFO: About to call window.nostr.nip04.encrypt.");
                contentToPublish = await window.nostr.nip04.encrypt(recipientPubkey, contentToPublish);
                console.log("PUBLISH_INFO: NIP-04 encryption successful.");
                eventKind = 4; // NIP-04 Encrypted Direct Message
                eventTags = [["p", recipientPubkey]];
            } catch (e) {
                console.error("PUBLISH_ERROR: Error encrypting message for NIP-04:", e);
                setError("Failed to encrypt private message. Ensure your NIP-07 extension is active and supports NIP-04. Check console for details.");
                return;
            }
        }

        const eventToPublish: Partial<NostrEvent> = {
            kind: eventKind,
            tags: eventTags,
            content: contentToPublish,
            // pubkey, created_at, id, and sig will be handled by nostrService.publishEvent
            // which uses window.nostr.signEvent internally.
        };
        console.log("PUBLISH_INFO: Event to publish:", JSON.parse(JSON.stringify(eventToPublish)));

        try {
            console.log("PUBLISH_INFO: About to call nostrService.publishEvent.");
            const eventId = await nostrService.publishEvent(eventToPublish);
            if (eventId) {
                console.log(`PUBLISH_SUCCESS: Wallet summary published. Event ID: ${eventId}`);
                // Optionally: toast.success("Wallet summary published!");
            } else {
                console.error("PUBLISH_ERROR: Failed to publish wallet summary. nostrService.publishEvent returned null or undefined.");
                setError("Failed to publish wallet summary. Check console and NIP-07 extension.");
            }
        } catch (e) {
            console.error("PUBLISH_ERROR: Error during nostrService.publishEvent call:", e);
            setError("Error publishing wallet summary. Check console and NIP-07 extension for specific errors.");
        }
    }, []); // nostrService is a class instance, generally stable, and its methods are stable.

    const fetchBalances = useCallback(async (address: string) => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(
                `https://backend.mainnet.alephium.org/addresses/${address}/tokens-balance?page=1&limit=100`
            )
            if (!res.ok) {
                throw new Error(`Failed to fetch balances: ${res.statusText}`)
            }
            const data = await res.json()

            let tokenMap = new Map<string, AlephiumTokenMeta>();
            try {
                const tokenListRes = await fetch(
                    "https://raw.githubusercontent.com/alephium/token-list/master/tokens/mainnet.json"
                )
                if (!tokenListRes.ok) {
                    console.warn(`Failed to fetch token list: ${tokenListRes.statusText} (Status: ${tokenListRes.status})`);
                } else {
                    const tokenList = await tokenListRes.json();
                    // Ensure tokenList.tokens is an array before mapping
                    if (Array.isArray(tokenList?.tokens)) {
                        tokenMap = new Map<string, AlephiumTokenMeta>(
                            tokenList.tokens.map((t: AlephiumTokenMeta) => [t.id, t])
                        );
                    }
                }
            } catch (tokenListError) {
                console.warn("Error processing token list:", tokenListError);
            }

            const resultsArray = Array.isArray(data?.results) ? data.results : [];
            const enriched: TokenBalance[] = resultsArray
                .filter((item: AlephiumTokenData) => item.amount !== "0")
                .map((item: AlephiumTokenData) => ({
                    id: item.id,
                    amount: item.amount,
                    // Safely spread from tokenMap, providing defaults or handling missing data
                    ...(tokenMap.get(item.id) || {
                        // Provide default/fallback values if token not in map
                        // This prevents 'undefined' properties if a token is not in the list
                        symbol: item.id.substring(0, 6) + "...",
                        name: "Unknown Token",
                        decimals: 0
                    })
                }));

            setBalances(enriched)

            if (nostrService.publicKey) {
                const summaryPayload: WalletSummaryPayload = {
                    address,
                    balances: enriched.map(({ id, amount, decimals, symbol, name }) => ({
                        id,
                        amount,
                        decimals,
                        symbol,
                        name
                    }))
                }
                const recipient = nostrService.publicKey; // Send to self for now
                await publishWalletSummary(summaryPayload, recipient, privateMode);
            }
        } catch (err) {
            console.error("Failed to fetch balances", err)
            setError(err instanceof Error ? err.message : "Unable to load balances.")
        } finally {
            setLoading(false)
        }
    }, [privateMode, publishWalletSummary]); // nostrService removed, publishWalletSummary is memoized

    useEffect(() => {
        if (account?.address) {
            fetchBalances(account.address)
        } else {
            setLoading(false)
            setBalances([])
            setError(null)
        }
    }, [account?.address, fetchBalances]); // fetchBalances is now memoized

    if (!account?.address) {
        return (
            <Card className="mt-6">
                <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">
                        Please connect your Alephium wallet to view your token balances.
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
                    {account?.address && (
                        <a
                            href={`https://explorer.alephium.org/addresses/${account.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline flex items-center"
                        >
                            View on Explorer <ExternalLink className="ml-1 h-4 w-4" />
                        </a>
                    )}
                </div>

                <div className="flex justify-end">
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={privateMode}
                            onChange={() => setPrivateMode(!privateMode)}
                        />
                        Send privately (NIP-04 DM to self)
                    </label>
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
                    <p className="text-sm text-muted-foreground">No token balances found for {account.address}.</p>
                )}

                {!loading && !error && balances.length > 0 && (
                    <div className="space-y-2">
                        {balances.map((token) => {
                            const displayAmount =
                                Number(token.amount) / (10 ** (token.decimals ?? 0))
                            const formatted = displayAmount.toLocaleString(undefined, {
                                maximumFractionDigits: token.decimals ?? 6
                            })
                            return (
                                <div
                                    key={token.id}
                                    className="flex items-center justify-between border p-2 rounded"
                                >
                                    <div className="flex items-center gap-3">
                                        {token.logoURI ? (
                                            <img
                                                src={token.logoURI}
                                                alt={token.symbol}
                                                className="w-6 h-6 rounded"
                                            />
                                        ) : (
                                            <div className="w-6 h-6 bg-gray-300 rounded flex items-center justify-center text-xs text-gray-600">
                                                {token.symbol ? token.symbol.charAt(0) : "?"}
                                            </div>
                                        )}
                                        <div className="text-sm">
                                            <div className="font-medium">
                                                {token.symbol || token.id.slice(0, 6)}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {token.name || token.id.slice(0, 10)}...
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
