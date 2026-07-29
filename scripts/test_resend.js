import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.VITE_RESEND_API_KEY;

if (!apiKey) {
    console.error("No Resend API KEY found in .env");
    process.exit(1);
}

const resend = new Resend(apiKey);

async function testResend() {
    console.log("Testing Resend API Key...");
    console.log("Key:", apiKey);
    
    // 1. Try sending from onboarding@resend.dev (Sandbox)
    console.log("\n--- Test 1: Sending from onboarding@resend.dev ---");
    try {
        const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'delivered@resend.dev',
            subject: 'Test Sandbox Email',
            html: '<p>If you see this, Resend sandbox works!</p>'
        });
        if (error) {
            console.error("Sandbox Fail:", error);
        } else {
            console.log("Sandbox Success:", data);
        }
    } catch (e) {
        console.error("Sandbox Exception:", e);
    }

    // 2. Try sending from newsletter@nouriva.club
    console.log("\n--- Test 2: Sending from newsletter@nouriva.club ---");
    try {
        const { data, error } = await resend.emails.send({
            from: 'Nouriva <newsletter@nouriva.club>',
            to: 'delivered@resend.dev',
            subject: 'Test Custom Domain Email',
            html: '<p>If you see this, custom domain works!</p>'
        });
        if (error) {
            console.error("Custom Domain Fail:", error);
        } else {
            console.log("Custom Domain Success:", data);
        }
    } catch (e) {
        console.error("Custom Domain Exception:", e);
    }
}

testResend();
