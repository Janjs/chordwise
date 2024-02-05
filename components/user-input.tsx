'use client'

import { FC } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import { Icons } from './icons'
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
  'Db/C#',
  'D',
  'Eb',
  'E',
  'F',
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
    <div className="md:p-3 text-md flex flex-row justify-between gap-3">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col md:flex-row justify-between gap-3">
          <div className="flex flex-row gap-3 flex-1">
            <FormField
              control={form.control}
              name="musicalKey"
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger className="w-auto">
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
                    <SelectTrigger className="w-auto">
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
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl>
                    <Input placeholder="Describe the vibe of the chord progression..." {...field} className="text-md" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex-1 md:flex-none">
            {!isLoading ? (
              <Button type="submit" className="w-full">
                <p className="font-semibold">Generate</p>
                <Icons.generate className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button disabled className="w-full">
                <p className="font-semibold">Generate</p>
                <Icons.generate className="ml-2 h-4 w-4 animate-spin ease-in-out" />
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}

export default UserInput
