'use client'
import Form from './components/Form'
import ListView from './components/ListView'
const page = () => {
  return (
    <div  className='flex p-5 flex-col md:flex-row gap-5'>
      <Form/>
      <ListView/>
    </div>
  )
}

export default page
