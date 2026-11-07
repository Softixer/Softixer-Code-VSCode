/**
 * Softixer model fetcher.
 * Fetches the available model list from https://api.softixer.com/v1/models
 */

import type { ModelRecord } from "@roo-code/types"
import { SOFTIXER_DEFAULT_API_URL } from "../softixer"

export async function getSoftixerModels(apiKey?: string, baseUrl?: string): Promise<ModelRecord> {
	const base = (baseUrl ?? SOFTIXER_DEFAULT_API_URL).replace(/\/+$/, "")
	const url = `${base}/v1/models`

	const response = await fetch(url, {
		headers: {
			"x-api-key": apiKey ?? "",
			"Content-Type": "application/json",
		},
	})

	if (!response.ok) {
		throw new Error(`Softixer models fetch failed: ${response.status} ${response.statusText}`)
	}

	const json = await response.json()
	const models: ModelRecord = {}

	// Expect either { data: [...] } (OpenAI-style) or { models: [...] }
	const list: any[] = json.data ?? json.models ?? []

	for (const m of list) {
		if (!m.id) continue

		models[m.id] = {
			maxTokens: m.max_tokens ?? 8192,
			contextWindow: m.context_window ?? 200_000,
			supportsImages: m.supports_images ?? true,
			supportsPromptCache: m.supports_prompt_cache ?? false,
			inputPrice: m.input_price ?? 0,
			outputPrice: m.output_price ?? 0,
			description: m.description ?? m.id,
		}
	}

	return models
}
