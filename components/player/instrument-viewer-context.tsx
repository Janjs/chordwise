'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { InstrumentContainerProps } from './instrument-container'

interface InstrumentViewerContextType {
  props: InstrumentContainerProps | null
  setProps: (props: InstrumentContainerProps | null) => void
}

const InstrumentViewerContext = createContext<InstrumentViewerContextType | undefined>(undefined)

export function InstrumentViewerProvider({ children }: { children: ReactNode }) {
  const [props, setProps] = useState<InstrumentContainerProps | null>(null)
  
  return (
    <InstrumentViewerContext.Provider value={{ props, setProps }}>
      {children}
    </InstrumentViewerContext.Provider>
  )
}

export function useInstrumentViewer() {
  const context = useContext(InstrumentViewerContext)
  if (context === undefined) {
    return { props: null, setProps: () => {} }
  }
  return context
}
