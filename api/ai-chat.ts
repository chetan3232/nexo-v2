
// @ts-nocheck
export default async function(request: Request): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const payload = await request.json();
    const { messages, model, temperature, top_p, stream } = payload;

    const NVIDIA_API_KEY = Deno.env.get('NVIDIA_API_KEY');

    if (!NVIDIA_API_KEY) {
        throw new Error("NVIDIA_API_KEY is not configured in environment variables.");
    }

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${NVIDIA_API_KEY}`
      },
      body: JSON.stringify({
        model: model || "moonshotai/kimi-k2.5",
        messages: messages || [],
        temperature: temperature || 1.0,
        top_p: top_p || 1.0,
        stream: stream !== false
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(JSON.stringify({ error: err }), { status: response.status, headers: corsHeaders });
    }

    return new Response(response.body, {
      headers: { 
        ...corsHeaders,
        "Content-Type": stream !== false ? "text/event-stream" : "application/json"
      }
    });

  } catch (err) {
    console.error("Error in ai-chat handler:", err);
    const message = err instanceof Error && err.message.includes("NVIDIA_API_KEY") 
      ? err.message 
      : "An unexpected error occurred.";
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: corsHeaders });
  }
};
