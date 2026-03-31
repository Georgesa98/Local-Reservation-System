import { BottomNav } from "@/components/bottom-nav";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background pb-32">
            {children}
            <BottomNav />
        </div>
    );
}
