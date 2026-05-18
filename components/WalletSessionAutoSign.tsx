"use client";

import { useEffect, useRef } from "react";

import { useWalletSession } from "@/hooks/use-wallet-session";

export function WalletSessionAutoSign() {
  const { address, getWalletAuth, hasCachedWalletAuth, isConnected, isSigning } =
    useWalletSession();
  const promptedAddressRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isConnected || !address) {
      promptedAddressRef.current = null;
      return;
    }

    if (hasCachedWalletAuth || isSigning) {
      return;
    }

    const normalizedAddress = address.toLowerCase();

    if (promptedAddressRef.current === normalizedAddress) {
      return;
    }

    promptedAddressRef.current = normalizedAddress;

    const timeoutId = window.setTimeout(() => {
      void getWalletAuth().catch(() => undefined);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [address, getWalletAuth, hasCachedWalletAuth, isConnected, isSigning]);

  return null;
}
