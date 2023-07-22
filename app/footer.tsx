import { Separator } from '@/components/ui/separator'

export default function Footer() {
  return (
    <div className='bg-background/80'>
      <Separator />
      {/*Make this a hover-card https://ui.shadcn.com/docs/components/hover-card*/}
      <p className='p-4 text-right text-xs text-muted-foreground'>
        Made by{' '}
        <a
          href='https://github.com/Janjs/chordwise'
          target='_blank'
          className='mb-10 underline underline-offset-4'
        >
          @Janjs.
        </a>{' '}
        Powered by ChatGPT
      </p>
    </div>
  )
}
