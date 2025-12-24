import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { optimizeImage } from '../lib/imageUtils';
import { useToast } from '../lib/ToastContext';

function ImageBackupButton({ recipe, onBackupComplete }) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

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
            toast.success("Image backed up and optimized successfully!");

        } catch (err) {
            console.error("Backup failed:", err);
            toast.error("Backup failed. Check console.");
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

export default ImageBackupButton;
