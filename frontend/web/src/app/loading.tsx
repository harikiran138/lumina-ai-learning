import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
            <div className="relative">
                <div className="absolute inset-0 bg-lumina-primary/20 blur-xl rounded-full"></div>
                <Loader2 className="w-12 h-12 text-lumina-primary animate-spin relative z-10" />
            </div>
            <p className="mt-4 text-gray-400 font-mono text-sm animate-pulse">Loading Lumina...</p>
        </div>
    );
}
