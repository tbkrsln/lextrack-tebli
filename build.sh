#!/bin/bash
echo "window.SUPABASE_URL = '${SUPABASE_URL}';" > supabase-config.js
echo "window.SUPABASE_KEY = '${SUPABASE_ANON_KEY}';" >> supabase-config.js
echo "try { window.sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY); } catch (e) { console.error('Supabase Client Error:', e); }" >> supabase-config.js
