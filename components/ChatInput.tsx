"use client";

import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import {
  PromptInput,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputController,
} from "@/components/ai-elements/prompt-input";
import { ButtonGroup } from "@/components/ui/button-group";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { SpeechInput } from "@/components/ai-elements/speech-input";
import {
  Transcription,
  TranscriptionSegment,
} from "@/components/ai-elements/transcription";
import {
  MessageSquareIcon,
  SearchIcon,
} from "lucide-react";
import type { Experimental_TranscriptionResult } from "ai";
import { type ComponentType, useCallback, useState } from "react";
import { toast } from "sonner";
import { SparklesText } from "./ui/sparkles-text";
import { useRouter } from "next/navigation";

import { createChatSession, savePendingPrompt } from "@/lib/chat-utils";
import {
  dispatchChatSessionsUpdated,
  isWalletSignatureRequiredError,
  readFriendlyError,
  type ChatMode,
  upsertChatSession,
} from "@/lib/langclaw-api";
import { useWalletSession } from "@/hooks/use-wallet-session";
import {
  FIXED_CHAT_MODEL_LABEL,
  resolveChatModel,
} from "@/lib/chat-model";

const SUBMITTING_TIMEOUT = 200;
const STREAMING_TIMEOUT = 2000;
const CHAT_INPUT_SUGGESTIONS = [
  "Find smart-money accumulation on Mantle",
  "Detect liquidity anomalies on Mantle DEX pairs",
  "Rank Mantle protocols by TVL and yield momentum",
];

type TranscriptionSegments = Experimental_TranscriptionResult["segments"];

const ChatInputSuggestions = () => {
  const { textInput } = usePromptInputController();

  return (
    <Suggestions className="justify-start sm:justify-center">
      {CHAT_INPUT_SUGGESTIONS.map((suggestion) => (
        <Suggestion
          key={suggestion}
          onClick={textInput.setInput}
          suggestion={suggestion}
        />
      ))}
    </Suggestions>
  );
};

function ChatInputSpeechButton({
  onTranscript,
}: {
  onTranscript: (text: string) => void;
}) {
  const { textInput } = usePromptInputController();

  const handleTranscriptionChange = useCallback(
    (text: string) => {
      textInput.setInput(appendSpeechText(textInput.value, text));
      onTranscript(text);
    },
    [onTranscript, textInput],
  );

  return (
    <SpeechInput
      aria-label="Dictate prompt"
      lang="en-US"
      onTranscriptionChange={handleTranscriptionChange}
      size="icon-sm"
      variant="ghost"
    />
  );
}

function SpeechTranscriptionPreview({
  segments,
}: {
  segments: TranscriptionSegments;
}) {
  if (!segments.length) {
    return null;
  }

  return (
    <div className="border-b px-3 py-2">
      <Transcription segments={segments}>
        {(segment, index) => (
          <TranscriptionSegment
            index={index}
            key={`${segment.startSecond}-${segment.text}`}
            segment={segment}
          />
        )}
      </Transcription>
    </div>
  );
}

const ChatInput = () => {
  const router = useRouter();
  const { clearWalletAuth, getWalletAuth, isConnected, isSigning, openWalletModal } =
    useWalletSession();
  const [toolMode, setToolMode] = useState<ChatMode>("chat");
  const [error, setError] = useState("");
  const [speechSegments, setSpeechSegments] = useState<TranscriptionSegments>(
    [],
  );
  const [status, setStatus] = useState<
    "submitted" | "streaming" | "ready" | "error"
  >("ready");

  const handleSpeechTranscript = useCallback((text: string) => {
    setSpeechSegments((segments) => appendTranscriptionSegment(segments, text));
  }, []);

  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      const text = message.text.trim();
      const hasText = Boolean(text);
      const hasAttachments = Boolean(message.files?.length);

      if (!(hasText || hasAttachments)) {
        return;
      }

      if (hasAttachments) {
        showError(
          setError,
          "File attachments are not supported by the current chat backend.",
        );
        setStatus("error");
        return;
      }

      if (!isConnected) {
        openWalletModal();
        showError(
          setError,
          "Choose a wallet to start chatting.",
        );
        setStatus("error");
        return;
      }

      setStatus("submitted");
      setError("");
      setSpeechSegments([]);

      const startSession = async (forceWalletSignature = false) => {
        const wallet = await getWalletAuth({ force: forceWalletSignature });
        const session = createChatSession(text);

        savePendingPrompt(session.id, {
          model: resolveChatModel(),
          researchTrend: toolMode === "research",
          text,
          toolMode,
        });

        await upsertChatSession(wallet, session);
        dispatchChatSessionsUpdated();

        return session;
      };

      try {
        const session = await startSession();
        setStatus("streaming");
        toast.success("Chat session created", {
          description:
            toolMode === "research"
              ? "Research mode is ready."
                : FIXED_CHAT_MODEL_LABEL,
        });

        setTimeout(() => {
          router.push(`/chat/${session.id}`);
        }, SUBMITTING_TIMEOUT);
      } catch (err) {
        if (isWalletSignatureRequiredError(err)) {
          try {
            clearWalletAuth();
            const session = await startSession(true);
            setStatus("streaming");
            toast.success("Wallet signature refreshed", {
              description: "Starting the chat session now.",
            });
            setTimeout(() => {
              router.push(`/chat/${session.id}`);
            }, SUBMITTING_TIMEOUT);
            return;
          } catch (retryErr) {
            showError(
              setError,
              readFriendlyError(retryErr, "Unable to start the chat session."),
            );
            setStatus("error");

            setTimeout(() => {
              setStatus("ready");
            }, STREAMING_TIMEOUT);
            return;
          }
        }

        showError(
          setError,
          readFriendlyError(err, "Unable to start the chat session."),
        );
        setStatus("error");

        setTimeout(() => {
          setStatus("ready");
        }, STREAMING_TIMEOUT);
      }
    },
    [
      getWalletAuth,
      clearWalletAuth,
      isConnected,
      openWalletModal,
      router,
      toolMode,
    ],
  );

  return (
    <div className="mx-auto flex size-full h-full min-w-0 flex-col items-center justify-center gap-8 overflow-hidden px-4">
      <div className="flex w-full max-w-2xl flex-col items-center justify-center gap-1 text-center font-medium text-2xl leading-tight sm:flex-row sm:flex-wrap sm:items-end sm:gap-2 sm:text-3xl md:text-4xl">
        <span className="min-w-0 max-w-full">Welcome to</span>
        <SparklesText className="max-w-full text-4xl md:text-5xl">
          Langclaw,
        </SparklesText>
        <span className="min-w-0 max-w-[18rem] break-words sm:max-w-full">
          how can I help?
        </span>
      </div>
      <PromptInputProvider>
        <PromptInput
          className="w-full max-w-xs overflow-hidden sm:max-w-2xl"
          onSubmit={handleSubmit}
        >
          <SpeechTranscriptionPreview segments={speechSegments} />
          <PromptInputBody>
            <PromptInputTextarea />
          </PromptInputBody>
          <PromptInputFooter className="flex-wrap items-end gap-2">
            <PromptInputTools className="flex-1 flex-wrap gap-1.5">
              <ChatInputSpeechButton onTranscript={handleSpeechTranscript} />
              <ChatModeControl onChange={setToolMode} value={toolMode} />
            </PromptInputTools>
            <PromptInputSubmit
              disabled={isSigning || !isConnected}
              status={status}
            />
          </PromptInputFooter>
        </PromptInput>
        <ChatInputSuggestions />
      </PromptInputProvider>
      {error && (
        <p className="max-w-2xl text-center text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
};

function showError(setError: (message: string) => void, message: string) {
  setError(message);
  toast.error(message);
}

function ChatModeControl({
  onChange,
  value,
}: {
  onChange: (value: ChatMode) => void;
  value: ChatMode;
}) {
  const modes: Array<{
    icon: ComponentType<{ className?: string; size?: number }>;
    label: string;
    tooltip: string;
    value: ChatMode;
  }> = [
      {
        icon: MessageSquareIcon,
        label: "Chat",
        tooltip: "Chat directly with Langclaw.",
        value: "chat",
      },
      {
        icon: SearchIcon,
        label: "Research",
        tooltip:
          "Evidence-backed research that can enrich itself with on-chain checks when needed.",
        value: "research",
      },
    ];

  return (
    <ButtonGroup className="max-w-full shrink-0">
      {modes.map((mode) => {
        const Icon = mode.icon;

        return (
          <PromptInputButton
            aria-pressed={value === mode.value}
            key={mode.value}
            onClick={() => onChange(mode.value)}
            tooltip={mode.tooltip}
            type="button"
            variant={value === mode.value ? "default" : "ghost"}
          >
            <Icon className="size-4" />
            <span>{mode.label}</span>
          </PromptInputButton>
        );
      })}
    </ButtonGroup>
  );
}

function appendSpeechText(currentText: string, transcript: string) {
  const next = transcript.trim();

  if (!next) {
    return currentText;
  }

  return currentText.trim() ? `${currentText.trim()} ${next}` : next;
}

function appendTranscriptionSegment(
  segments: TranscriptionSegments,
  text: string,
): TranscriptionSegments {
  const transcript = text.trim();

  if (!transcript) {
    return segments;
  }

  const startSecond = segments.at(-1)?.endSecond ?? 0;
  const duration = Math.max(1, Math.ceil(transcript.split(/\s+/).length / 2));

  return [
    ...segments,
    {
      endSecond: startSecond + duration,
      startSecond,
      text: transcript,
    },
  ];
}

export default ChatInput;
