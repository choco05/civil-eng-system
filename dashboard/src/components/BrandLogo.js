import { useState } from "react";

// Renders the USP logo from public/usp-logo.png at its natural aspect ratio.
// The source logo uses dark navy/gray text, so on dark surfaces (the sidebar)
// it's placed on a small white chip to stay legible. Until the file exists,
// it falls back to a plain "USP" mark so the UI never shows a broken image.
function BrandLogo({ height = 40, onDark = false, showAppName = false, stacked = false }) {

    const [imgFailed, setImgFailed] = useState(false);

    const image = !imgFailed && (
        <img
            src="/usp-logo.png"
            alt="USP logo"
            onError={() => setImgFailed(true)}
            style={{
                height,
                width: "auto",
                display: "block"
            }}
        />
    );

    const fallbackMark = (
        <div
            style={{
                height,
                width: height,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #0E6E80, #0B4A57)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: height * 0.36,
                letterSpacing: "0.5px",
                flexShrink: 0
            }}
        >
            USP
        </div>
    );

    const mark = imgFailed ? fallbackMark : image;

    const badge = onDark ? (
        <div
            style={{
                background: "white",
                borderRadius: "8px",
                padding: imgFailed ? 0 : "6px 10px",
                display: "inline-flex",
                alignItems: "center"
            }}
        >
            {mark}
        </div>
    ) : (
        mark
    );

    const appName = showAppName && (
        <div style={{ lineHeight: 1.2 }}>
            <div
                style={{
                    fontWeight: 700,
                    fontSize: "15px",
                    color: onDark ? "white" : "#0B4A57"
                }}
            >
                Attendance System
            </div>
            <div
                style={{
                    fontSize: "10.5px",
                    letterSpacing: "0.3px",
                    color: onDark ? "rgba(255,255,255,0.65)" : "#6B7A85"
                }}
            >
                CIVIL ENGINEERING DEPT.
            </div>
        </div>
    );

    return (
        <div
            style={{
                display: "flex",
                flexDirection: stacked ? "column" : "row",
                alignItems: stacked ? "flex-start" : "center",
                gap: stacked ? "10px" : "12px"
            }}
        >
            {badge}
            {appName}
        </div>
    );
}

export default BrandLogo;
