'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

type AudioRecordingStatusContextValue = {
  processingCount: number
  beginProcessing: () => void
  endProcessing: () => void
  uploadingIds: ReadonlySet<string>
  setFileUploading: (fileId: string, uploading: boolean) => void
}

const AudioRecordingStatusContext = createContext<AudioRecordingStatusContextValue | null>(null)

export function AudioRecordingStatusProvider({ children }: { children: React.ReactNode }) {
  const [processingCount, setProcessingCount] = useState(0)
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set())

  const beginProcessing = useCallback(() => {
    setProcessingCount((count) => count + 1)
  }, [])

  const endProcessing = useCallback(() => {
    setProcessingCount((count) => Math.max(0, count - 1))
  }, [])

  const setFileUploading = useCallback((fileId: string, uploading: boolean) => {
    setUploadingIds((current) => {
      const next = new Set(current)
      if (uploading) next.add(fileId)
      else next.delete(fileId)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      processingCount,
      beginProcessing,
      endProcessing,
      uploadingIds,
      setFileUploading,
    }),
    [processingCount, beginProcessing, endProcessing, uploadingIds, setFileUploading],
  )

  return (
    <AudioRecordingStatusContext.Provider value={value}>
      {children}
    </AudioRecordingStatusContext.Provider>
  )
}

export function useAudioRecordingStatus() {
  const context = useContext(AudioRecordingStatusContext)
  if (!context) {
    return {
      processingCount: 0,
      beginProcessing: () => undefined,
      endProcessing: () => undefined,
      uploadingIds: new Set<string>() as ReadonlySet<string>,
      setFileUploading: () => undefined,
    }
  }
  return context
}
