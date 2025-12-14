import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

function ImageBackupButton({ recipe, onBackupComplete }) {
    const [loading, setLoading] = useState(false);

    // Only show if it's a Pollinations/External URL and NOT already Supabase
    const isExternal = recipe.image && recipe.image.includes('pollinations.ai');

    if (!isExternal) return null;

    const handleBackup = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setLoading(true);

        try {
            // 1. Fetch the external image
            const response = await fetch(recipe.image);
            const blob = await response.blob();

            // 2. Optimize (Resize & Compress)
            const optimizedBlob = await optimizeImage(blob);

            // 3. Upload to Supabase
            const fileName = `recipe_${recipe.id}_${Date.now()}.jpg`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('images')
                .upload(fileName, optimizedBlob, {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            // 4. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(fileName);

            // 5. Update Recipe Record
            const { error: dbError } = await supabase
                .from('recipes')
                .update({
                    image: publicUrl,
                    // Optional: create a backup field if you want to keep the old link, but usually not needed if we replace
                })
                .eq('id', recipe.id);

            if (dbError) throw dbError;

            // Success
            if (onBackupComplete) onBackupComplete(recipe.id, publicUrl);
            alert("Image backed up and optimized successfully!");

        } catch (err) {
            console.error("Backup failed:", err);
            alert("Backup failed. Check console.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleBackup}
            disabled={loading}
            className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200 flex items-center gap-1 transition-colors"
            title="Download, optimize, and save to Supabase"
        >
            {loading ? (
                <span className="animate-spin">⏳</span>
            ) : (
                <>💾 Save</>
            )}
        </button>
    );
}

// Logic to resize/compress
async function optimizeImage(originalBlob) {
    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(originalBlob);

        img.onload = () => {
            // Define Max Dimensions
            const MAX_WIDTH = 1024;
            const MAX_HEIGHT = 1024;
            let width = img.width;
            let height = img.height;

            // Calculate new dimensions
            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }

            // Draw to Canvas
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Export as JPEG with compression
            canvas.toBlob((blob) => {
                URL.revokeObjectURL(url);
                resolve(blob);
            }, 'image/jpeg', 0.8); // 0.8 Quality (Good balance)
        };

        img.src = url;
    });
}

export default ImageBackupButton;
