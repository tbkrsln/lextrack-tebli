// ==========================================
// SUPABASE BAĞLANTISI 
// ==========================================
const SUPABASE_URL = 'https://nwdmlsjslylagfzzwvzy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53ZG1sc2pzbHlsYWdmenp3dnp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0OTI4NTQsImV4cCI6MjEwNTA2ODg1NH0.DdLiOuu4KPXEQIOJcuxeob0FyFdqhezbJ02eEOFo4J0';
// supabase from CDN exposes window.supabase object.
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
