/**
 * Generates the HTML email content for the Weekly Newsletter.
 * @param {Object} content - { intro, subject }
 * @param {Array} recipes - List of recipe objects { id, name, description, image }
 * @param {string} webBaseUrl - The base URL of the application (e.g. window.location.origin)
 * @returns {string} - The full HTML string
 */
export function getWeeklyNewsletterHtml(content, recipes, webBaseUrl) {
    return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333333;">
        <div style="background-color: #064E3B; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
             <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Nouriva Club</h1>
        </div>
        
        <div style="padding: 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
                ${content.intro.replace(/\n/g, '<br/>')}
            </p>
            
            <hr style="border: 0; border-top: 1px solid #eee; margin: 24px 0;" />
            
            <h2 style="color: #064E3B; font-size: 18px; margin-bottom: 16px;">This Week's Menu</h2>

            ${recipes.map(r => `
                <div style="margin-bottom: 24px; display: flex; gap: 16px; align-items: start;">
                    ${r.image ? `
                        <div style="flex-shrink: 0; width: 80px; height: 80px;">
                            <img src="${r.image}" style="width: 100%; height: 100%; border-radius: 8px; object-fit: cover;" />
                        </div>
                    ` : ''}
                    <div>
                        <h3 style="color: #064E3B; margin: 0 0 4px 0; font-size: 16px;">${r.name}</h3>
                        <p style="color: #666; font-size: 13px; margin: 0 0 8px 0; line-height: 1.4;">${r.description || 'A delicious keto meal.'}</p>
                        <a href="${webBaseUrl}/app/meal/${r.id}" style="color: #D97706; text-decoration: none; font-weight: bold; font-size: 13px;">View Recipe →</a>
                    </div>
                </div>
            `).join('')}
            
            <div style="text-align: center; margin-top: 32px;">
                <a href="${webBaseUrl}/app/home" style="background-color: #D97706; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    Open App for Full Plan
                </a>
            </div>
        </div>

        <div style="text-align: center; padding: 20px; color: #9CA3AF; font-size: 11px;">
            <p>
                You are receiving this because you joined the Nouriva Club. <br/>
                <a href="${webBaseUrl}/app/subscribe" style="color: #9CA3AF; text-decoration: underline;">Unsubscribe</a>
            </p>
            <p>© ${new Date().getFullYear()} Nouriva Inc.</p>
        </div>
    </div>
    `;
}
