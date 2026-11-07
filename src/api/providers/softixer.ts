/**
 * Softixer API provider.
 *
 * Uses an Anthropic-compatible API hosted at api.softixer.com/v1
 *   Messages endpoint : https://api.softixer.com/v1/messages
 *   Models endpoint   : https://api.softixer.com/v1/models
 *
 * We reuse AnthropicHandler by injecting the Softixer base-URL and
 * API key into the shared options before construction, so all
 * streaming, caching, and tool-call logic is inherited for free.
 */

import { Anthropic } from "@anthropic-ai/sdk"

import {
	type ModelInfo,
	softixerDefaultModelId,
	softixerDefaultModelInfo,
	softixerModels,
	type SoftixerModelId,
} from "@roo-code/types"

import type { ApiHandlerOptions } from "../../shared/api"
import type { ApiHandlerCreateMessageMetadata, SingleCompletionHandler } from "../index"
import { ApiStream } from "../transform/stream"
import { BaseProvider } from "./base-provider"
import { AnthropicHandler } from "./anthropic"

export const SOFTIXER_DEFAULT_API_URL = "https://api.softixer.com"

/**
 * SoftixerHandler wraps AnthropicHandler, pointing it at the
 * Softixer API endpoint and surfacing Softixer-specific model info.
 */
export class SoftixerHandler extends BaseProvider implements SingleCompletionHandler {
	private inner: AnthropicHandler

	private readonly softixerModelId: string
	private readonly softixerModelInfo: ModelInfo

	constructor(options: ApiHandlerOptions) {
		super()

		// Resolve Softixer-specific options, falling back to Anthropic keys
		const modelId: string =
			(options as ApiHandlerOptions & { softixerModelId?: string }).softixerModelId ??
			options.apiModelId ??
			softixerDefaultModelId

		const apiKey: string =
			(options as ApiHandlerOptions & { softixerApiKey?: string }).softixerApiKey ?? options.apiKey ?? ""

		const baseUrl: string =
			(options as ApiHandlerOptions & { softixerBaseUrl?: string }).softixerBaseUrl ?? SOFTIXER_DEFAULT_API_URL

		this.softixerModelId = modelId
		this.softixerModelInfo =
			softixerModels[modelId as SoftixerModelId] ?? softixerDefaultModelInfo

		// Build a patched options object so AnthropicHandler uses the right
		// key and base-URL without us having to duplicate all its logic.
		const patchedOptions: ApiHandlerOptions = {
			...options,
			apiKey,
			anthropicBaseUrl: baseUrl,
			apiModelId: modelId,
		}

		this.inner = new AnthropicHandler(patchedOptions)
	}

	override getModel(): { id: string; info: ModelInfo } {
		return { id: this.softixerModelId, info: this.softixerModelInfo }
	}

	override async *createMessage(
		systemPrompt: string,
		messages: Anthropic.Messages.MessageParam[],
		metadata?: ApiHandlerCreateMessageMetadata,
	): ApiStream {
		yield* this.inner.createMessage(systemPrompt, messages, metadata)
	}

	async completePrompt(prompt: string): Promise<string> {
		return this.inner.completePrompt(prompt)
	}
}


