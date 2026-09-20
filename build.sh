#!/bin/bash
echo "const SUPABASE_URL = '${SUPABASE_URL}';" > supabase-config.js
echo "const SUPABASE_KEY = '${SUPABASE_ANON_KEY}';" >> supabase-config.js
echo "const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);" >> supabase-config.js
