'use client'

import { FC } from 'react'
import { Loader2 } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Controller, useForm } from 'react-hook-form'
import { Icons } from './icons'

interface UserInputProps {
  onSubmit: (values: z.infer<typeof formSchema>) => void
  loading: boolean
}

export const formSchema = z.object({
  description: z.string().min(1).max(200),
  musicalKey: z.string(),
  musicalScale: z.string(),
})

const MUSICAL_KEYS = ['C', 'Db/C#', 'D', 'Eb', 'E', 'F', 'Gb/F#', 'G', 'Ab', 'A', 'Bb', 'B/Cb']
const MUSICAL_SCALES = ['major', 'minor']

const UserInput: FC<UserInputProps> = (props) => {
  const { onSubmit, loading } = props

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      musicalKey: MUSICAL_KEYS[0],
      musicalScale: MUSICAL_SCALES[0],
    },
  })

  return (
    <div className="flex flex-1 flex-row justify-between gap-3">
      <Button variant="secondary" size="icon">
        <Icons.random className="h-4 w-10" />
      </Button>
      <Form {...form}>
        {/* TODO: add a dropdown to select the Key of the chords: */}
        {/* TODO: add a dropdown to select the style of the chords: */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-row justify-between gap-3">
          <FormField
            control={form.control}
            name="musicalKey"
            render={({ field }) => (
              <Select onValueChange={field.onChange}>
                <SelectTrigger className="w-auto">
                  <SelectValue placeholder={MUSICAL_KEYS[0]} />
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
              <Select onValueChange={field.onChange}>
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
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormControl>
                  <Input placeholder="Chords in the style of Nirvana" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {!loading ? (
            <Button type="submit" size="icon">
              <Icons.generate className="h-4 w-10" />
            </Button>
          ) : (
            <Button size="icon" disabled>
              <Icons.generate className="h-4 w-10 animate-spin ease-in-out" />
            </Button>
          )}
        </form>
      </Form>
    </div>
  )
}

export default UserInput
