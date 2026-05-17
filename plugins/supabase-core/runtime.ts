export const runtime = {
    onInstall: async (context: any) => {
        console.log("Supabase: Configuring env variables...");
    },
    onExecute: async (prompt: string, context: any) => {
        if (prompt.includes("auth")) {
            return "---FILE: src/lib/supabase.ts---\nimport { createClient } from '@supabase/supabase-js';\nexport const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);";
        }
    }
};
