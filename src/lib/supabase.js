// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dbtjwuxyafkzxhshprxt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRidGp3dXh5YWZrenhoc2hwcnh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NzY2NjQsImV4cCI6MjA2NDE1MjY2NH0.78KHyfV6FAVFJJshv-ufX3ppIco7AknqqFd6gsN69tY'

export const supabase = createClient(supabaseUrl, supabaseKey)