import assert from "node:assert/strict";
import test from "node:test";

import {
  FIXED_CHAT_MODEL_ID,
  FIXED_CHAT_MODEL_LABEL,
  resolveChatModel,
} from "./chat-model.ts";

test("chat requests are hard locked to GPT-5.4 nano", () => {
  assert.equal(FIXED_CHAT_MODEL_ID, "gpt-5.4-nano");
  assert.equal(FIXED_CHAT_MODEL_LABEL, "GPT-5.4 nano");
});

test("legacy or custom requested models are ignored", () => {
  assert.equal(resolveChatModel(), FIXED_CHAT_MODEL_ID);
  assert.equal(resolveChatModel("gpt-5.2"), FIXED_CHAT_MODEL_ID);
  assert.equal(resolveChatModel("custom-model"), FIXED_CHAT_MODEL_ID);
});
