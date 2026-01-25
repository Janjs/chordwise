'use client'

import React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formSchema, MUSICAL_KEYS, MUSICAL_SCALES, DEFAULT_MUSICAL_KEY, existsMusicalKey, existsMusicalScale } from '@/components/user-input'
import { Icons } from '@/components/icons' // Assuming this exists or similar

interface GenerateInputProps {
    onSubmit: (values: z.infer<typeof formSchema>) => void
    isLoading: boolean
    defaultValues: {
        description: string
        musicalKey: string
        musicalScale: string
    }
}

export const GenerateInput: React.FC<GenerateInputProps> = ({ onSubmit, isLoading, defaultValues }) => {

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            description: defaultValues.description,
            musicalKey: existsMusicalKey(defaultValues.musicalKey) ? defaultValues.musicalKey : DEFAULT_MUSICAL_KEY,
            musicalScale: existsMusicalScale(defaultValues.musicalScale) ? defaultValues.musicalScale : MUSICAL_SCALES[0],
        },
    })

    return (
        <div className="flex flex-col gap-6 h-full">
            {/* Top Icons - Placeholder for now based on sketch [Av] [Mi] */}
            <div className="flex gap-4">
                <div className="h-10 w-10 border rounded-md flex items-center justify-center bg-muted/50">
                    <span className="text-xs font-mono">Av</span>
                </div>
                <div className="h-10 w-10 border rounded-md flex items-center justify-center bg-muted/50">
                    <span className="text-xs font-mono">Mi</span>
                </div>
            </div>

            {/* The Card from Sketch */}
            <div className="border rounded-xl p-6 shadow-sm bg-card flex flex-col gap-4">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">

                        <div className="flex gap-2">
                            <FormField
                                control={form.control}
                                name="musicalKey"
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger className="w-[100px]">
                                            <SelectValue placeholder={DEFAULT_MUSICAL_KEY} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {MUSICAL_KEYS.map((key) => (
                                                    <SelectItem key={key} value={key}>
                                                        {key}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="musicalScale"
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger className="w-[100px]">
                                            <SelectValue placeholder={MUSICAL_SCALES[0]} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {MUSICAL_SCALES.map((key) => (
                                                    <SelectItem key={key} value={key}>
                                                        {key}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Describe the vibe... e.g. 'A melancholic progression for a rainy day'"
                                            {...field}
                                            className="min-h-[120px] resize-none text-md bg-background/50 border-0 focus-visible:ring-0 px-0"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" disabled={isLoading} className="w-full rounded-full" size="lg">
                            {isLoading ? "Generating..." : "Generate"}
                        </Button>
                    </form>
                </Form>
            </div>

            {/* Placeholder for history or other items below */}
            <div className="flex-1 border-t pt-4">
                <div className="text-sm text-muted-foreground/50">History</div>
            </div>
        </div>
    )
}
