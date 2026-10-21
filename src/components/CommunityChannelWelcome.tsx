import { ArrowUpRight, MessageCircle, ShieldCheck } from 'lucide-react'

function getOfficialChannelUrl() {
  const configured = import.meta.env.VITE_NOVA_WHATSAPP_CHANNEL_URL
  if (!configured) return null

  try {
    const url = new URL(configured)
    const allowedHosts = new Set(['whatsapp.com', 'www.whatsapp.com', 'chat.whatsapp.com'])
    if (url.protocol !== 'https:' || !allowedHosts.has(url.hostname.toLowerCase())) return null
    return url.toString()
  } catch {
    return null
  }
}

export default function CommunityChannelWelcome({ onContinue }: { onContinue: () => void }) {
  const channelUrl = getOfficialChannelUrl()

  return (
    <main className="min-h-screen bg-[#07050d] px-5 py-8 text-white sm:py-12">
      <div className="mx-auto flex min-h-[75vh] max-w-3xl items-center">
        <section aria-labelledby="community-welcome-title" className="glass-card w-full rounded-3xl border border-purple-300/15 p-6 sm:p-10">
          <div className="grid size-14 place-items-center rounded-2xl border border-purple-300/20 bg-purple-300/10 text-purple-100">
            <MessageCircle size={27} aria-hidden="true" />
          </div>
          <p className="mt-6 text-xs uppercase tracking-[.22em] text-purple-200/70">ÑØVÃ · ACE JAMB COMMUNITY</p>
          <h1 id="community-welcome-title" className="mt-3 text-3xl font-black sm:text-4xl">You’re not preparing alone.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60">
            Connect with the official ÑØVÃ community for preparation updates and announcements. Your learning dashboard is ready whenever you are.
          </p>
          {channelUrl ? (
            <a href={channelUrl} target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-purple-300 px-5 py-3 text-sm font-bold text-[#120b1c] transition hover:bg-purple-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-200">
              Open official WhatsApp channel <ArrowUpRight size={17} aria-hidden="true" />
            </a>
          ) : (
            <div role="status" className="mt-7 rounded-2xl border border-white/10 bg-white/[.035] p-4">
              <p className="font-semibold">Community link coming soon</p>
              <p className="mt-1 text-sm leading-6 text-white/50">The official channel link has not been configured yet. We won’t send you to an unverified destination.</p>
            </div>
          )}
          <div className="mt-6 flex gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
            <ShieldCheck className="mt-0.5 shrink-0 text-purple-200" size={20} aria-hidden="true" />
            <p className="text-xs leading-5 text-white/45">Joining is optional. ACE does not verify WhatsApp membership here, and you can continue to your dashboard without joining.</p>
          </div>
          <button type="button" onClick={onContinue} className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/[.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-200 sm:w-auto">
            Continue to your dashboard
          </button>
        </section>
      </div>
    </main>
  )
}
