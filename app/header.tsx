import ModeToggle from '../components/modo-changer'
import ThemedLogo from '@/assets/themed-logo'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'

export default function Header() {
  return (
    <header className='bg-transparent'>
      <nav
        className='mx-auto flex max-w-7xl items-center justify-between p-6 px-8'
        aria-label='Global'
      >
        <div className='flex flex-1'>
          <ThemedLogo />
        </div>
        <div className='flex flex-1 italic justify-center text-center'>
          <Tabs
            defaultValue='generate'
            className='w-[400px] flex justify-center'
          >
            <TabsList>
              <TabsTrigger value='generate'>Generate</TabsTrigger>
              <TabsTrigger value='explore'>Explore</TabsTrigger>
            </TabsList>
            <TabsContent value='generate'></TabsContent>
            <TabsContent value='explore'></TabsContent>
          </Tabs>
        </div>
        <div className='flex flex-1 justify-end'>
          <ModeToggle />
        </div>
      </nav>
    </header>
  )
}
