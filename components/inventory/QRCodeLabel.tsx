export function QRCodeLabel({ sku, name }: { sku: string; name: string }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${sku}`

  return (
    <>
      <style suppressHydrationWarning>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .qr-print-wrapper, .qr-print-wrapper * {
            visibility: visible;
          }
          .qr-print-wrapper {
            position: absolute;
            left: 0;
            top: 0;
            width: 68mm !important;
            min-height: 40mm !important;
            margin: 0 !important;
            padding: 8px !important;
            box-shadow: none !important;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
        }
      `}</style>
      
      {/* 
        We render this visually hidden in the normal UI, 
        but it becomes the ONLY thing visible when printing matching .qr-print-wrapper 
      */}
      <div className="hidden print:flex qr-print-wrapper bg-white text-black p-2 font-mono text-center flex-col items-center justify-center border-2 border-black/20" style={{ width: '68mm', minHeight: '40mm' }}>
        <h2 className="text-xl font-bold uppercase tracking-wider mb-2">{sku}</h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrUrl} alt={sku} className="w-24 h-24 filter grayscale" />
        <p className="text-xs font-semibold mt-2 px-2 truncate w-full">{name}</p>
        <p className="text-[10px] mt-1 text-zinc-600 uppercase">ECHO RENTALS</p>
      </div>
    </>
  )
}
