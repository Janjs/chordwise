'use client'

import React, { useState, useEffect } from 'react'
import { GenerateInput } from './generate-input'
import { GenerateMonitor } from './generate-monitor'
import { Progression, GenerateProgressionsRequest, GenerateProgressionsResponse } from '@/types/types'
import { generateChordProgressions, reGenerate } from '@/app/_actions'
import useGenerateSearchParams from '@/hooks/useGenerateSearchParams'
import { existsMusicalKey, formSchema } from '@/components/user-input'
import * as z from 'zod'

export type Inputs = z.infer<typeof formSchema>

export const GenerateNewContent = () => {
    const [isLoading, setIsLoading] = useState(false)
    const [progressions, setProgressions] = useState<Progression[]>([])
    const [error, setError] = useState<string | null>(null)

    const [params, setParams] = useGenerateSearchParams()

    useEffect(() => {
        if (params.description && params.musicalKey && params.musicalScale && existsMusicalKey(params.musicalKey)) {
            fetchData(params)
        }
    }, [params])

    const fetchData = async (generateProgressionsRequest: GenerateProgressionsRequest) => {
        setIsLoading(true)
        setError(null)
        // setProgressions([]) // Optional: clear previous results or keep them while loading?

        try {
            const response: GenerateProgressionsResponse = await generateChordProgressions(generateProgressionsRequest)

            if (response.progressions) setProgressions(response.progressions)
            else if (response.error) setError(response.error)
            else throw Error('Error while generating chord progressions.')
        } catch (error: any) {
            setError(error.message || 'Something went wrong')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (input: Inputs) => {
        const generateProgressionsRequest: GenerateProgressionsRequest = {
            description: input.description,
            musicalKey: input.musicalKey,
            musicalScale: input.musicalScale,
        }

        // Check if we are just regenerating the same request
        if (
            input.description === params.description &&
            input.musicalKey === params.musicalKey &&
            input.musicalScale === params.musicalScale &&
            params.suggestionIndex === undefined
        ) {
            // logic for regenerate if needed, or just call fetchData
            reGenerate()
        } else {
            setParams(generateProgressionsRequest)
        }
    }

    return (
        <div className="flex bg-background h-[calc(100vh-4rem)] w-full overflow-hidden">
            {/* Left Sidebar */}
            <div className="w-[400px] flex-none border-r bg-card/30 p-6 flex flex-col gap-6">
                <GenerateInput onSubmit={handleSubmit} isLoading={isLoading} defaultValues={{
                    description: params.description || '',
                    musicalKey: params.musicalKey || 'Key',
                    musicalScale: params.musicalScale || 'major'
                }} />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-background/50">
                <GenerateMonitor progressions={progressions} isLoading={isLoading} error={error} />
            </div>
        </div>
    )
}
