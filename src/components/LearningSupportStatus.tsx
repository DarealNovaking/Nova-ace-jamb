import { AudioLines, BrainCircuit, BookOpenCheck, ShieldCheck } from 'lucide-react'

export default function LearningSupportStatus() {
  return (
    <section aria-labelledby="learning-support-title" className="mt-8">
      <div className="mb-4"><p className="text-xs uppercase tracking-[.2em] text-purple-300/60">More ways to prepare</p><h2 id="learning-support-title" className="mt-2 text-2xl font-black">Learning support</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">These features will open when approved learning sources and their delivery services are ready.</p></div>
      <div className="grid gap-4 md:grid-cols-2">
        <article className="glass-card rounded-2xl border border-white/5 p-5 sm:p-6">
          <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-purple-500/15 text-purple-200"><BrainCircuit size={20} aria-hidden="true" /></span><div><h3 className="font-bold">Grounded AI tutor</h3><p className="mt-1 text-xs text-white/35">Provider-backed explanations and revision</p></div></div>
          <p className="mt-4 text-sm leading-6 text-white/50">The tutor is not available yet. We’re preparing reviewed learning sources so future explanations can be grounded in reliable material.</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-200/10 bg-amber-200/5 px-3 py-1.5 text-xs text-amber-100/70"><ShieldCheck size={14} aria-hidden="true" /> Not enabled for students</div>
        </article>
        <article className="glass-card rounded-2xl border border-white/5 p-5 sm:p-6">
          <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-purple-500/15 text-purple-200"><AudioLines size={20} aria-hidden="true" /></span><div><h3 className="font-bold">Audio learning</h3><p className="mt-1 text-xs text-white/35">Listen and revise on the go</p></div></div>
          <p className="mt-4 text-sm leading-6 text-white/50">No approved audio lessons are published yet. Lessons and transcripts will appear here when they are ready.</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.03] px-3 py-1.5 text-xs text-white/50"><BookOpenCheck size={14} aria-hidden="true" /> No published audio lessons</div>
        </article>
      </div>
    </section>
  )
}
