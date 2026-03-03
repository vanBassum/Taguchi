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
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useTaguchiAppStateContext } from "@/lib/taguchi-app-state-context"

export function PresetSwitchCard() {
  const {
    selectedPresetName,
    presetNames,
    importedPresetNames,
    hasPendingChanges,
    handlePresetSelected,
    handlePresetRenamed,
    handleCreatePreset,
    handleSaveSelectedPreset,
    handleDeletePreset,
  } = useTaguchiAppStateContext()
  const [copyButtonLabel, setCopyButtonLabel] = useState("Copy share URL")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [pendingDeleteName, setPendingDeleteName] = useState("")
  const [editingPresetName, setEditingPresetName] = useState("")
  const [editingDraft, setEditingDraft] = useState("")

  const startEditingPreset = (name: string) => {
    handlePresetSelected(name)
    setEditingPresetName(name)
    setEditingDraft(name)
  }

  const commitEditingPreset = () => {
    if (!editingPresetName) {
      return
    }

    handlePresetRenamed(editingPresetName, editingDraft)
    setEditingPresetName("")
    setEditingDraft("")
  }

  const cancelEditingPreset = () => {
    setEditingPresetName("")
    setEditingDraft("")
  }

  const handleDeleteConfirmed = () => {
    if (!pendingDeleteName) {
      return
    }

    handleDeletePreset(pendingDeleteName)
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
          Click to open a preset, double-click its name to rename, and create new presets quickly.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        <div className="overflow-hidden rounded-md border">
          <div role="listbox" aria-label="Saved presets" className="max-h-64 overflow-y-auto">
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
                  {editingPresetName === name ? (
                    <Input
                      value={editingDraft}
                      onChange={(event) => setEditingDraft(event.target.value)}
                      onBlur={commitEditingPreset}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          commitEditingPreset()
                        }

                        if (event.key === "Escape") {
                          cancelEditingPreset()
                        }
                      }}
                      className="h-7"
                      aria-label={`Preset name ${name}`}
                      autoFocus
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => handlePresetSelected(name)}
                      onDoubleClick={() => startEditingPreset(name)}
                      className="min-w-0 flex-1 text-left"
                    >
                      {name}
                    </button>
                  )}
                  {selectedPresetName === name && hasPendingChanges ? (
                    <Badge variant="outline" className="ml-2">
                      Pending
                    </Badge>
                  ) : null}
                  {importedPresetNames.includes(name) ? (
                    <Badge variant="secondary" className="ml-2">
                      Imported URL
                    </Badge>
                  ) : null}
                  {selectedPresetName === name && hasPendingChanges ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-7 px-2"
                      aria-label={`Save changes to preset ${name}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        handleSaveSelectedPreset()
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
                      if (editingPresetName === name) {
                        cancelEditingPreset()
                      }
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
      </CardContent>
      <CardFooter className="gap-2">
        <Button type="button" size="sm" onClick={handleCreatePreset}>
          New project
        </Button>
        <Button type="button" size="sm" onClick={handleCopyShareUrl}>
          {copyButtonLabel}
        </Button>
      </CardFooter>

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
