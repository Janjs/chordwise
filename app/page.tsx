'use server'

const Page = ({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { [key: string]: string | string[] | undefined }
}) => {
  console.log(searchParams)
  return <div>Hey</div>
}

export default Page
