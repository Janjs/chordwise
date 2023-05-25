"use client";

import { FC } from "react";
import { Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";

interface UserInputProps {
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  loading: boolean;
}

export const formSchema = z.object({
  description: z.string().min(1).max(200),
});

const UserInput: FC<UserInputProps> = (props) => {
  const { onSubmit, loading } = props;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
    },
  });

  return (
    <Form {...form}>
      {/* TODO: add a dropdown to select the Key of the chords: */}
      {/* TODO: add a dropdown to select the style of the chords: */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-row justify-between space-x-5">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input placeholder="Chords in the style of Nirvana" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!loading ? (
          <Button type="submit">Generate</Button>
        ) : (
          <Button disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating
          </Button>
        )}
      </form>
    </Form>
  );
};

export default UserInput;
