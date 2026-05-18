"use client";

import { useCallback } from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useConnection, useSignMessage } from "wagmi";

import {
  createWalletSession,
  requestWalletChallenge,
  type WalletAuth,
  type WalletAuthPurpose,
} from "@/lib/langclaw-api";

export const WALLET_AUTH_UPDATED_EVENT = "langclaw-wallet-auth-updated";

const WALLET_AUTH_STORAGE_PREFIX = "langclaw.walletSession.v2";
const SESSION_REFRESH_MARGIN_MS = 60 * 1000;
const MANTLE_CHAIN_ID = 5000;
const inFlightSessionAuth = new Map<string, Promise<WalletAuth>>();

type WalletAuthOptions = {
  force?: boolean;
  purpose?: WalletAuthPurpose;
};

export function useWalletSession() {
  const { address, isConnected } = useConnection();
  const { openConnectModal } = useConnectModal();
  const { isPending, signMessageAsync } = useSignMessage();

  const openWalletModal = useCallback(() => {
    openConnectModal?.();
  }, [openConnectModal]);

  const getWalletAuth = useCallback(
    async (options: WalletAuthOptions = {}) => {
      if (!isConnected || !address) {
        throw new Error("Connect your wallet first.");
      }

      const purpose = options.purpose ?? "session";

      if (purpose === "session" && !options.force) {
        const cached = readCachedWalletAuth(address);

        if (cached) {
          return cached;
        }
      }

      const createAuth = async () => {
        const challenge = await requestWalletChallenge({
          address,
          chainId: MANTLE_CHAIN_ID,
          purpose,
        });
        const signature = await signMessageAsync({
          message: challenge.message,
        });
        const walletAuth = {
          address: challenge.address,
          message: challenge.message,
          signature,
        };

        if (purpose !== "session") {
          return walletAuth;
        }

        const session = await createWalletSession(walletAuth);

        writeCachedWalletAuth(session);
        dispatchWalletAuthUpdated();

        return session;
      };

      if (purpose !== "session") {
        return createAuth();
      }

      const requestKey = `${address.toLowerCase()}:${options.force ? "force" : "session"}`;
      const existingRequest = inFlightSessionAuth.get(requestKey);

      if (existingRequest) {
        return existingRequest;
      }

      const request = createAuth();
      inFlightSessionAuth.set(requestKey, request);

      try {
        return await request;
      } finally {
        inFlightSessionAuth.delete(requestKey);
      }
    },
    [address, isConnected, signMessageAsync]
  );

  const clearWalletAuth = useCallback(() => {
    if (address) {
      window.localStorage.removeItem(getWalletAuthStorageKey(address));
    }

    dispatchWalletAuthUpdated();
  }, [address]);

  return {
    address,
    clearWalletAuth,
    getWalletAuth,
    hasCachedWalletAuth: Boolean(address && readCachedWalletAuth(address)),
    isConnected,
    isSigning: isPending,
    openWalletModal,
  };
}

export function readCachedWalletAuth(address?: string | null) {
  if (!address || typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(getWalletAuthStorageKey(address));

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<WalletAuth>;

    if (
      typeof parsed.address !== "string" ||
      typeof parsed.sessionExpiresAt !== "string" ||
      typeof parsed.sessionToken !== "string"
    ) {
      return null;
    }

    if (parsed.address.toLowerCase() !== address.toLowerCase()) {
      return null;
    }

    const expiresAt = new Date(parsed.sessionExpiresAt).getTime();

    if (
      Number.isNaN(expiresAt) ||
      expiresAt - Date.now() <= SESSION_REFRESH_MARGIN_MS
    ) {
      return null;
    }

    return parsed as WalletAuth;
  } catch {
    return null;
  }
}

function writeCachedWalletAuth(walletAuth: WalletAuth) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    getWalletAuthStorageKey(walletAuth.address),
    JSON.stringify(walletAuth)
  );
}

function getWalletAuthStorageKey(address: string) {
  return `${WALLET_AUTH_STORAGE_PREFIX}:${address.toLowerCase()}`;
}

function dispatchWalletAuthUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(WALLET_AUTH_UPDATED_EVENT));
}
