import { parseRichContent, type RichBlock } from '../lib/richContent'

type Props = {
  /** Untrusted versioned document. Invalid data is never partially rendered. */
  value: unknown
  className?: string
  /** Only short-lived blob URLs returned by the authenticated media client are accepted. */
  imageSources?: Record<string, string>
}

/**
 * Text-only, accessible renderer for verified structured question content.
 * Image references render only from short-lived blob URLs provided by the
 * authenticated, attempt-scoped media client. No Storage URL is accepted.
 * Never add dangerouslySetInnerHTML, raw MathML/HTML, or arbitrary image src here.
 */
export default function RichContentView({ value, className = '', imageSources = {} }: Props) {
  let blocks: RichBlock[]
  try {
    blocks = parseRichContent(value).blocks
  } catch {
    return <p role="status" className="text-sm text-amber-100">
      This question content is unavailable. Please report it to the academic team.
    </p>
  }

  return <div className={'space-y-4 break-words text-sm leading-7 ' + className}>
    {blocks.map((block, index) => {
      switch (block.type) {
        case 'paragraph':
          return <p key={index} className="whitespace-pre-wrap">{block.text}</p>
        case 'equation':
          return <div key={index} className="max-w-full overflow-x-auto rounded-lg border border-white/10 p-3">
            <span role="math" aria-label={block.spoken} className="block whitespace-pre-wrap font-mono text-base" >
              {block.expression}
            </span>
          </div>
        case 'table':
          return <div key={index} className="max-w-full overflow-x-auto">
            <table className="w-full min-w-max border-collapse text-left">
              <caption className="mb-2 text-left font-semibold">{block.caption}</caption>
              <thead><tr>{block.headers.map((header, column) =>
                <th key={column} scope="col" className="border border-white/20 bg-white/5 px-3 py-2">{header}</th>
              )}</tr></thead>
              <tbody>{block.rows.map((row, rowIndex) =>
                <tr key={rowIndex}>{row.map((cell, column) =>
                  <td key={column} className="border border-white/20 px-3 py-2">{cell}</td>
                )}</tr>
              )}</tbody>
            </table>
          </div>
        case 'image': {
          const source = imageSources[block.asset_id]
          return <figure key={index} className="space-y-2 rounded-lg border border-white/10 p-3">
            {typeof source === 'string' && source.startsWith('blob:')
              ? <img src={source} alt={block.alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="max-h-[26rem] w-full rounded-lg object-contain" />
              : <p role="note" className="text-amber-100">Diagram unavailable: {block.alt}</p>}
            {block.caption && <figcaption className="text-sm text-white/70">{block.caption}</figcaption>}
          </figure>
        }
      }
    })}
  </div>
}
