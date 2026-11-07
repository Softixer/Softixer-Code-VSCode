import { useCallback, useEffect, useState } from "react"
import { VSCodeTextField } from "@vscode/webview-ui-toolkit/react"

import type { ProviderSettings } from "@roo-code/types"
import { softixerModels, softixerDefaultModelId } from "@roo-code/types"

import { useAppTranslation } from "@src/i18n/TranslationContext"
import { VSCodeButtonLink } from "@src/components/common/VSCodeButtonLink"
import { vscode } from "@src/utils/vscode"

import { inputEventTransform } from "../transforms"

const STATIC_MODEL_IDS = Object.keys(softixerModels)

type SoftixerProps = {
	apiConfiguration: ProviderSettings
	setApiConfigurationField: (field: keyof ProviderSettings, value: ProviderSettings[keyof ProviderSettings]) => void
}

export const Softixer = ({ apiConfiguration, setApiConfigurationField }: SoftixerProps) => {
	const { t } = useAppTranslation()
	const [dynamicModelList, setDynamicModelList] = useState<string[]>([])
	const [isFetchingModels, setIsFetchingModels] = useState(false)

	const softixerApiKey = (apiConfiguration as any)?.softixerApiKey as string | undefined
	const softixerModelId = (apiConfiguration as any)?.softixerModelId as string | undefined

	// Use dynamic list if available, otherwise fall back to static list
	const modelList = dynamicModelList.length > 0 ? dynamicModelList : STATIC_MODEL_IDS

	const handleInputChange = useCallback(
		<K extends keyof ProviderSettings, E>(
			field: K,
			transform: (event: E) => ProviderSettings[K] = inputEventTransform,
		) =>
			(event: E | Event) => {
				setApiConfigurationField(field, transform(event as E))
			},
		[setApiConfigurationField],
	)

	// Fetch model list from api.softixer.com/v1/models whenever API key changes
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const msg = event.data
			if (msg?.type === "softixerModels") {
				const models = msg.softixerModels ? Object.keys(msg.softixerModels) : []
				if (models.length > 0) {
					setDynamicModelList(models)
				}
				setIsFetchingModels(false)
			}
		}

		window.addEventListener("message", handleMessage)
		return () => window.removeEventListener("message", handleMessage)
	}, [])

	useEffect(() => {
		if (softixerApiKey) {
			setIsFetchingModels(true)
			vscode.postMessage({ type: "requestSoftixerModels" })
		} else {
			setDynamicModelList([])
		}
	}, [softixerApiKey])

	return (
		<>
			<VSCodeTextField
				value={softixerApiKey || ""}
				type="password"
				onInput={handleInputChange("softixerApiKey" as keyof ProviderSettings)}
				placeholder={t("settings:placeholders.apiKey")}
				className="w-full">
				<label className="block font-medium mb-1">Softixer API Key</label>
			</VSCodeTextField>
			<div className="text-sm text-vscode-descriptionForeground -mt-2">
				{t("settings:providers.apiKeyStorageNotice")}
			</div>
			{!softixerApiKey && (
				<VSCodeButtonLink href="https://softixer.com/pricing" appearance="secondary">
					Get Softixer API Key
				</VSCodeButtonLink>
			)}

			{/* Model seçimi */}
			<div className="flex flex-col gap-1">
				<label className="block font-medium">
					Model{isFetchingModels ? " (fetching…)" : ""}
				</label>
				<select
					value={softixerModelId || softixerDefaultModelId}
					onChange={(e) =>
						setApiConfigurationField(
							"softixerModelId" as keyof ProviderSettings,
							e.target.value as any,
						)
					}
					className="w-full h-7 px-2 border border-vscode-dropdown-border bg-vscode-dropdown-background text-vscode-dropdown-foreground text-sm rounded">
					{modelList.map((id) => (
						<option key={id} value={id}>
							{id}
						</option>
					))}
				</select>
			</div>
		</>
	)
}
