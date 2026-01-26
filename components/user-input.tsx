'use client'

import { FC } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import useGenerateSearchParams from '@/hooks/useGenerateSearchParams'

interface UserInputProps {
  onSubmit: (values: z.infer<typeof formSchema>) => void
  isLoading: boolean
}

export const formSchema = z.object({
  description: z.string().min(1).max(200),
  musicalKey: z.string(),
  musicalScale: z.string(),
})

export const DEFAULT_MUSICAL_KEY = 'Key'
export const MUSICAL_KEYS = [
  DEFAULT_MUSICAL_KEY,
  'C',
  'C#',
  'Db/C#',
  'D',
  'Eb',
  'E',
  'F',
  'F#',
  'Gb/F#',
  'G',
  'Ab',
  'A',
  'Bb',
  'B/Cb',
]
export const MUSICAL_SCALES = ['major', 'minor']
export const existsMusicalKey = (musicalKey: string) => MUSICAL_KEYS.some((el) => el === musicalKey)
export const existsMusicalScale = (musicalScale: string) => MUSICAL_SCALES.some((el) => el === musicalScale)

const UserInput: FC<UserInputProps> = ({ onSubmit, isLoading }) => {
  const [params, setParams] = useGenerateSearchParams()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: params.description ? params.description : '',
      musicalKey: params.musicalKey && existsMusicalKey(params.musicalKey) ? params.musicalKey : DEFAULT_MUSICAL_KEY,
      musicalScale:
        params.musicalScale && existsMusicalScale(params.musicalScale) ? params.musicalScale : MUSICAL_SCALES[0],
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <div className="flex gap-2">
          <FormField
            control={form.control}
            name="musicalKey"
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger className="flex-1">
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
          {form.getValues('musicalKey') != DEFAULT_MUSICAL_KEY && (
            <FormField
              control={form.control}
              name="musicalScale"
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger className="flex-1">
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
          )}
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <textarea
                  placeholder="Describe the vibe..."
                  {...field}
                  rows={4}
                  className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Generating...' : 'Generate'}
        </Button>
      </form>
    </Form>
  )
}

export default UserInput
