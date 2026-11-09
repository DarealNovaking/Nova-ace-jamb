import { useEffect, useMemo, useState } from 'react'
import type { RichDocument } from '../lib/richContent'
import { fetchQuestionMediaPreviewObjectUrl } from '../lib/questionMediaClient'
import RichContentView from './RichContentView'

type Props = {
  questionId: string
  questionVersion: number
  value: RichDocument
  localImageSources?: Record<string,string>
}
export default function AdminRichContentPreview({questionId,questionVersion,value,localImageSources={}}:Props) {
  const imageIds=useMemo(()=>value.blocks.filter((block):block is Extract<typeof block,{type:'image'}>=>block.type==='image').map(block=>block.asset_id),[value])
  const imageKey=imageIds.join(',')
  const localKey=Object.keys(localImageSources).sort().join(',')
  const [sources,setSources]=useState<Record<string,string>>({})
  const [failed,setFailed]=useState(false)
  useEffect(()=>{
    let active=true
    const created:string[]=[]
    setSources({})
    setFailed(false)
    const missing=imageIds.filter(id=>!localImageSources[id])
    if(!missing.length)return()=>{}
    void Promise.all(missing.map(async assetId=>{
      try{return [assetId,await fetchQuestionMediaPreviewObjectUrl(questionId,questionVersion,assetId)] as const}
      catch{return [assetId,null] as const}
    })).then(results=>{
      if(!active){for(const result of results)if(result[1])URL.revokeObjectURL(result[1]);return}
      const next:Record<string,string>={}
      for(const [id,source] of results){if(source){next[id]=source;created.push(source)}else setFailed(true)}
      setSources(next)
    })
    return()=>{active=false;for(const source of created)URL.revokeObjectURL(source)}
  },[questionId,questionVersion,imageKey,localKey])
  return <div>
    <RichContentView value={value} imageSources={{...sources,...localImageSources}}/>
    {failed&&<p role="status" className="mt-2 text-xs leading-5 text-amber-100/80">One or more private diagram previews are unavailable. The alt text is shown instead; publication must not proceed until the asset can be inspected.</p>}
  </div>
}
