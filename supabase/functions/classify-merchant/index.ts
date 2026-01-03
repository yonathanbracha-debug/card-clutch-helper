import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MERCHANT_CATEGORIES = [
  'groceries', 'dining', 'travel', 'gas', 'transit', 'entertainment',
  'streaming', 'drugstores', 'online_retail', 'department_store',
  'warehouse_club', 'utilities', 'telecom', 'apparel', 'home_improvement',
  'electronics', 'beauty', 'sports', 'pet', 'office', 'other',
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, domain, title } = await req.json();
    
    if (!domain) {
      return new Response(
        JSON.stringify({ error: "Domain is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ 
          category: "other", 
          confidence: "low", 
          rationale: "AI service unavailable",
          merchantName: domain.split('.')[0]
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are a merchant classification expert. Your job is to categorize merchants/websites into one of these categories:
${MERCHANT_CATEGORIES.join(', ')}

Rules:
1. Only return a valid JSON object with exactly these fields: category, confidence, rationale, merchantName
2. "category" must be exactly one of the categories listed above
3. "confidence" must be "high", "medium", or "low"
4. "rationale" should be a brief explanation (1-2 sentences)
5. "merchantName" should be the proper display name of the merchant
6. Focus ONLY on merchant classification - do not mention credit cards
7. If unsure, use "other" with "low" confidence`;

    const userPrompt = `Classify this merchant:
Domain: ${domain}
${url ? `URL: ${url}` : ''}
${title ? `Page Title: ${title}` : ''}

Respond with JSON only.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited, please try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          category: "other", 
          confidence: "low", 
          rationale: "AI classification failed",
          merchantName: domain.split('.')[0]
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response
    let result;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({ 
          category: "other", 
          confidence: "low", 
          rationale: "Could not parse AI response",
          merchantName: domain.split('.')[0]
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate category
    if (!MERCHANT_CATEGORIES.includes(result.category)) {
      result.category = "other";
      result.confidence = "low";
    }

    // Validate confidence
    if (!["high", "medium", "low"].includes(result.confidence)) {
      result.confidence = "low";
    }

    return new Response(
      JSON.stringify({
        category: result.category,
        confidence: result.confidence,
        rationale: result.rationale || "AI classification",
        merchantName: result.merchantName || domain.split('.')[0],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("classify-merchant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
