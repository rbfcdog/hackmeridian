import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL as string
const supabaseKey = process.env.SUPABASE_ANON_KEY as string

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  // Insert example
  await supabase.from('users').insert([{ name: 'Rodrigo', age: 25 }])

  // Query example
  const { data, error } = await supabase.from('users').select('*')
  if (error) {
    console.error(error)
  } else {
    console.log(data)
  }
}

main()
