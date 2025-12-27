// Follow this setup guide to integrate the Deno runtime into your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { subject, html } = await req.json()

        if (!RESEND_API_KEY) {
            throw new Error('Missing RESEND_API_KEY variable')
        }

        // Call Resend API
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'Nouriva <newsletter@nouriva.club>',
                to: ['delivered@resend.dev'], // Hardcoded to sandbox for safety until verified
                subject: subject,
                html: html,
            }),
        })

        const data = await res.json()

        if (!res.ok) {
            console.error("Resend Error:", data);
            return new Response(JSON.stringify(data), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
