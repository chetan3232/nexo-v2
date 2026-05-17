
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

  const client = createClient({ 
    baseUrl: Deno.env.get('INSFORGE_BASE_URL') || 'https://g7nugnui.ap-southeast.insforge.app', 
    anonKey: Deno.env.get('ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMjI4OTh9.M-ENCUD91CkhHdFKT03HoalGjfqRkI9uhiOLO1FC1o8'
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
