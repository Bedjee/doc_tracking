import { QRCodeSVG } from 'qrcode.react';

export default function DocumentQr({ value, size = 200, className = '' }) {
    return (
        <div className={`inline-flex flex-col items-center gap-2 rounded-lg border border-slate-200 bg-white p-4 ${className}`}>
            <QRCodeSVG value={value} size={size} level="M" includeMargin={false} />
            <p className="font-mono text-xs font-semibold tracking-wide text-slate-700">{value}</p>
        </div>
    );
}