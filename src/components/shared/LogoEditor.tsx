'use client'
import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function LogoEditor({file,onCancel,onSave,saving}:{file:File|null;onCancel:()=>void;onSave:(file:File)=>Promise<void>;saving:boolean}) {
 const canvas=useRef<HTMLCanvasElement>(null)
 const [source,setSource]=useState<HTMLImageElement|null>(null)
 const [zoom,setZoom]=useState(1),[rotation,setRotation]=useState(0),[x,setX]=useState(0),[y,setY]=useState(0)
 const [error,setError]=useState('')
 useEffect(()=>{
  if(!file)return
  const url=URL.createObjectURL(file),img=new Image()

  img.onload=()=>setSource(img);img.onerror=()=>setError('This image could not be opened. Choose PNG, JPEG, or WebP.')
  img.src=url
  return()=>{img.onload=null;img.onerror=null;URL.revokeObjectURL(url)}
 },[file])
 useEffect(()=>{
  const ctx=canvas.current?.getContext('2d');if(!ctx||!source)return
  ctx.clearRect(0,0,512,512);ctx.save();ctx.translate(256+x,256+y);ctx.rotate(rotation*Math.PI/180)
  const scale=512/Math.max(source.width,source.height)*zoom
  ctx.drawImage(source,-source.width*scale/2,-source.height*scale/2,source.width*scale,source.height*scale);ctx.restore()
 },[source,zoom,rotation,x,y])
 async function save(){try{const blob=await new Promise<Blob>((resolve,reject)=>canvas.current?.toBlob(b=>b?resolve(b):reject(new Error('Could not prepare the logo')),'image/png'));await onSave(new File([blob],'company-logo.png',{type:'image/png'}))}catch(e){setError(e instanceof Error?e.message:'Could not save logo')}}
 return <Dialog open={!!file} onOpenChange={open=>{if(!open&&!saving)onCancel()}}><DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>Edit company logo</DialogTitle></DialogHeader>
 <p className="text-sm text-muted-foreground">Preview your logo. Zoom to crop, or keep the full image. Transparent areas stay transparent.</p>
 <canvas ref={canvas} width={512} height={512} className="mx-auto aspect-square w-full max-w-72 rounded-xl border bg-slate-100" aria-label="Logo preview"/>
 <label className="grid gap-2 text-sm">Zoom<input type="range" min="0.5" max="3" step="0.01" value={zoom} onChange={e=>setZoom(Number(e.target.value))}/></label>
 <label className="grid gap-2 text-sm">Horizontal position<input type="range" min="-256" max="256" value={x} onChange={e=>setX(Number(e.target.value))}/></label>
 <label className="grid gap-2 text-sm">Vertical position<input type="range" min="-256" max="256" value={y} onChange={e=>setY(Number(e.target.value))}/></label>
 <div className="flex gap-2"><Button variant="outline" onClick={()=>setRotation(r=>(r+90)%360)}>Rotate 90°</Button><Button variant="ghost" onClick={()=>{setZoom(1);setX(0);setY(0);setRotation(0)}}>Fit full logo</Button></div>
 {error&&<p role="alert" className="text-sm text-red-600">{error}</p>}
 <DialogFooter><Button variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button><Button onClick={save} disabled={saving||!source}>{saving?'Saving…':'Save logo'}</Button></DialogFooter>
 </DialogContent></Dialog>
}
