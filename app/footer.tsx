import { Separator } from '@/components/ui/separator'

export default function Footer() {
  return (
    <div className="bg-background/80">
      {/*Make this a hover-card https://ui.shadcn.com/docs/components/hover-card*/}
      <p className="px-4 pb-4 text-right text-xs text-muted-foreground">
        💻 by{' '}
        <a href="https://x.com/Janjijs" target="_blank" className="mb-10 underline underline-offset-4">
          @Janjs.
        </a>{' '}
      </p>
    </div>
  )
}
