import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { generateNewsletterContent } from "../../lib/gemini";
import { useToast } from "../../lib/ToastContext";
import { getWeeklyNewsletterHtml } from "../../lib/emailTemplates";

function NewsletterTool() {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState(null);
    const [emailCount, setEmailCount] = useState(0);
    const [subscribers, setSubscribers] = useState([]);
    const toast = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        // 1. Fetch Recipes (Last 5)
        const { data: recipeData } = await supabase
            .from("recipes")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5);

        setRecipes(recipeData || []);

        // 2. Count & Fetch Subscribers
        const { data: profiles, count } = await supabase
            .from("profiles")
            .select("email", { count: "exact" })
            .eq("subscription_status", "premium");

        setSubscribers(profiles || []);
        setEmailCount(count || 0);
        setLoading(false);
    }

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const content = await generateNewsletterContent(recipes);
            setGeneratedContent(content);
            toast.success("Newsletter Draft Generated! 📧");
        } catch (error) {
            console.error("AI Error:", error);
            setGeneratedContent({
                subject: "Weekly Vibe: Energy & Focus 🥑",
                intro: "Here are some delicious recipes to keep you energized this week! (AI Generation Failed, using fallback)"
            });
            toast.error("AI Generation Failed - Checking Fallback");
        }
        setGenerating(false);
    };

    const handleSend = async () => {
        if (!generatedContent) return;

        if (!confirm(`Ready to blast this to ${emailCount} subscribers?`)) return;

        try {
            const appUrl = import.meta.env.VITE_APP_URL || 'https://nouriva.club';

            // Call Supabase Edge Function
            const { error: fnError } = await supabase.functions.invoke('smooth-api', {
                body: {
                    subject: generatedContent.subject,
                    html: getWeeklyNewsletterHtml(
                        generatedContent,
                        recipes,
                        appUrl
                    ),
                    recipients: subscribers.map(s => s.email)
                }
            });

            if (fnError) throw fnError;

            toast.success(`Blast Executed! Sent to ${emailCount} subscribers.`);

            // Save to History
            try {
                const { error: dbError } = await supabase.from('newsletters').insert({
                    subject: generatedContent.subject,
                    intro: generatedContent.intro,
                    recipes: recipes.map(r => ({ id: r.id, name: r.name })),
                    status: 'sent',
                    sent_at: new Date(),
                    recipient_count: emailCount
                });
                if (dbError) throw dbError;
                setGeneratedContent({ ...generatedContent, sent: true });
            } catch (dbErr) {
                console.error("DB Save Failed:", dbErr);
                toast.error("Email sent, but failed to save history.");
            }

        } catch (e) {
            console.error(e);
            toast.error("System Error: " + (e.message || "Unknown error"));
            // Try to show more info if avaliable
            if (e.context) console.log("Error Context:", e.context);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-emerald-800">Newsletter Engine 📧</h1>
                    <p className="text-gray-600">Automate your weekly subscriber updates.</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg shadow text-center">
                    <div className="text-xs text-uppercase text-gray-500 font-bold">Audience</div>
                    <div className="text-2xl font-bold text-emerald-600">{emailCount}</div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
                {/* LEFT: Context */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <h2 className="font-bold text-lg mb-4 text-emerald-800">Selected Recipes (Auto)</h2>
                        {loading ? <div className="animate-pulse">Loading...</div> : (
                            <ul className="space-y-3">
                                {recipes.map(r => (
                                    <li key={r.id} className="flex gap-3 items-center">
                                        <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden">
                                            {r.image && <img src={r.image} className="w-full h-full object-cover" />}
                                        </div>
                                        <div className="text-sm font-medium">{r.name}</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={generating || loading || recipes.length === 0}
                        className="w-full py-4 bg-emerald-700 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-800 transition flex justify-center items-center gap-2"
                    >
                        {generating ? (
                            <><span>⚙️</span> Writing Draft...</>
                        ) : (
                            <><span>✨</span> Generate with Gemini AI</>
                        )}
                    </button>
                </div>

                {/* RIGHT: Preview & Action */}
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 min-h-[500px] flex flex-col">
                    <h2 className="font-bold text-lg mb-4 text-gray-700">Email Draft Preview</h2>

                    {generatedContent ? (
                        <div className="flex-grow flex flex-col bg-white rounded shadow-sm overflow-hidden">
                            <div className="bg-gray-100 p-3 border-b border-gray-200 text-sm">
                                <span className="text-gray-500 font-bold">Subject:</span> {generatedContent.subject}
                            </div>
                            <div className="p-6 flex-grow overflow-y-auto prose prose-sm max-w-none">
                                <p className="text-gray-800 whitespace-pre-line">{generatedContent.intro}</p>
                                <hr className="my-4" />
                                <div className="space-y-4 opacity-75 grayscale hover:grayscale-0 transition">
                                    {recipes.map(r => (
                                        <div key={r.id} className="flex gap-4">
                                            <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0">
                                                {r.image && <img src={r.image} className="w-full h-full object-cover rounded" />}
                                            </div>
                                            <div>
                                                <div className="font-bold text-emerald-800">{r.name}</div>
                                                <div className="text-xs text-gray-500">Link included</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 border-t border-gray-200">
                                <button
                                    onClick={handleSend}
                                    className="w-full py-3 bg-nouriva-gold text-emerald-900 font-bold rounded-lg shadow hover:bg-yellow-500 transition"
                                >
                                    🚀 Blast to {emailCount} Subscribers
                                </button>
                                <div className="text-[10px] text-center text-gray-400 mt-2">
                                    Uses Resend API (Edge Function).
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-grow flex items-center justify-center text-gray-400 italic">
                            Click "Generate" to draft your newsletter...
                        </div>
                    )}
                </div>
            </div>

            <PastCampaigns refreshTrigger={generatedContent} />
        </div>
    );
}

function PastCampaigns({ refreshTrigger }) {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCampaigns();
    }, [refreshTrigger]); // Reload when a new one is sent

    async function fetchCampaigns() {
        const { data } = await supabase
            .from('newsletters')
            .select('*')
            .order('sent_at', { ascending: false });
        setCampaigns(data || []);
        setLoading(false);
    }

    if (loading) return <div className="p-4 text-center text-gray-400">Loading History...</div>;

    return (
        <div className="border-t pt-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Past Campaigns</h2>
            {campaigns.length === 0 ? (
                <div className="text-gray-400 italic text-center p-8 bg-gray-50 rounded">No campaigns sent yet.</div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipients</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipes</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {campaigns.map((camp) => (
                                <tr key={camp.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(camp.sent_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {camp.subject}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {camp.recipient_count}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {camp.recipes?.length || 0} items
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default NewsletterTool;
