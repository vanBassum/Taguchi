import { useState } from "react"
import { SaveIcon, Trash2Icon } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type PresetSwitchCardProps = {
  presetName: string
  onPresetNameChanged: (value: string) => void
  presetNames: string[]
  selectedPresetName: string
  hasPendingChanges: boolean
  onPresetSelected: (value: string) => void
  onSavePreset: () => void
  onSaveSelectedPreset: () => void
  onDeletePreset: (name: string) => void
}

export function PresetSwitchCard({
  presetName,
  onPresetNameChanged,
  presetNames,
  selectedPresetName,
  hasPendingChanges,
  onPresetSelected,
  onSavePreset,
  onSaveSelectedPreset,
  onDeletePreset,
}: PresetSwitchCardProps) {
  const [copyButtonLabel, setCopyButtonLabel] = useState("Copy share URL")
  const [isOverwriteDialogOpen, setIsOverwriteDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [pendingDeleteName, setPendingDeleteName] = useState("")

  const trimmedPresetName = presetName.trim()
  const shouldConfirmOverwrite =
    trimmedPresetName.length > 0 && presetNames.includes(trimmedPresetName)

  const handleSaveClicked = () => {
    if (!trimmedPresetName) {
      return
    }

    if (shouldConfirmOverwrite) {
      setIsOverwriteDialogOpen(true)
      return
    }

    onSavePreset()
  }

  const handleOverwriteConfirmed = () => {
    onSavePreset()
    setIsOverwriteDialogOpen(false)
  }

  const handleDeleteConfirmed = () => {
    if (!pendingDeleteName) {
      return
    }

    onDeletePreset(pendingDeleteName)
    setPendingDeleteName("")
    setIsDeleteDialogOpen(false)
  }

  const handleCopyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopyButtonLabel("Copied")
      window.setTimeout(() => setCopyButtonLabel("Copy share URL"), 1500)
    } catch {
      setCopyButtonLabel("Copy failed")
      window.setTimeout(() => setCopyButtonLabel("Copy share URL"), 1500)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm">Presets</CardTitle>
        <CardDescription className="text-xs">
          Save the current table and scores with a name, then click a preset to switch.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        <div className="flex gap-2">
          <Input
            value={presetName}
            onChange={(event) => onPresetNameChanged(event.target.value)}
            placeholder="Preset name"
            aria-label="Preset name"
          />
          <Button type="button" size="sm" onClick={handleSaveClicked}>
            Save
          </Button>
        </div>
        <div className="overflow-hidden rounded-md border">
          <div role="listbox" aria-label="Saved presets" className="max-h-32 overflow-y-auto">
            {presetNames.length === 0 ? (
              <div className="px-2 py-2 text-xs text-muted-foreground">No presets saved yet.</div>
            ) : (
              presetNames.map((name) => (
                <div
                  key={name}
                  role="option"
                  aria-selected={selectedPresetName === name}
                  className="flex items-center border-b px-2 py-1.5 text-sm last:border-b-0 data-[selected=true]:bg-muted"
                  data-selected={selectedPresetName === name}
                >
                  <button
                    type="button"
                    onClick={() => onPresetSelected(name)}
                    className="min-w-0 flex-1 text-left"
                  >
                    {name}
                    {selectedPresetName === name && hasPendingChanges ? " (pending)" : ""}
                  </button>
                  {selectedPresetName === name && hasPendingChanges ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      aria-label={`Save changes to preset ${name}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        onSaveSelectedPreset()
                      }}
                    >
                      <SaveIcon className="size-4" />
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    aria-label={`Delete preset ${name}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      setPendingDeleteName(name)
                      setIsDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
        <div>
          <Button type="button" size="sm" onClick={handleCopyShareUrl}>
            {copyButtonLabel}
          </Button>
        </div>
      </CardContent>

      <AlertDialog open={isOverwriteDialogOpen} onOpenChange={setIsOverwriteDialogOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Overwrite preset?</AlertDialogTitle>
            <AlertDialogDescription>
              A preset named "{trimmedPresetName}" already exists. Save will replace it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleOverwriteConfirmed}>Overwrite</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete preset?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete "{pendingDeleteName}" from saved presets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeleteConfirmed}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
