import { Plus_Jakarta_Sans, Work_Sans } from "next/font/google";

import "@workspace/ui/globals.css";
import "@/styles/theme.css";
import { Providers } from "@/components/providers";

const plusJakartaSans = Plus_Jakarta_Sans({
    subsets: ["latin"],
    variable: "--font-plus-jakarta-sans",
    display: "swap",
});

const workSans = Work_Sans({
    subsets: ["latin"],
    variable: "--font-work-sans",
    display: "swap",
});

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            className={`${plusJakartaSans.variable} ${workSans.variable} `}
            lang="en"
            suppressHydrationWarning
        >
            <body>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
