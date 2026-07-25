
// @ts-nocheck
import { createClient } from 'npm:@insforge/sdk';

export default async function(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return new Response("<div style='font-family:sans-serif; padding:40px; text-align:center;'><h1>Invalid Project</h1><p>Project ID is missing from the URL.</p></div>", { 
        status: 400,
        headers: { "Content-Type": "text/html" }
    });
  }

  const anonKey = Deno.env.get('INSFORGE_ANON_KEY') || Deno.env.get('ANON_KEY');
  if (!anonKey) {
    return new Response("<div style='font-family:sans-serif; padding:40px; text-align:center;'><h1>Configuration Error</h1><p>Database credentials are missing.</p></div>", { 
        status: 500,
        headers: { "Content-Type": "text/html" }
    });
  }

  const client = createClient({ 
    baseUrl: Deno.env.get('INSFORGE_BASE_URL') || 'https://g7nugnui.ap-southeast.insforge.app', 
    anonKey: anonKey
  });

  const { data, error } = await client.database.from("user_deployments").select("html").eq("id", id).maybeSingle();

  if (error || !data) {
    return new Response("<div style='font-family:sans-serif; padding:40px; text-align:center;'><h1>Site Not Found</h1><p>The project with this ID does not exist or has expired.</p></div>", { 
        status: 404,
        headers: { "Content-Type": "text/html" }
    });
  }

  return new Response(data.html as string, {
    headers: { 
        "Content-Type": "text/html; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
    },
  });
};
