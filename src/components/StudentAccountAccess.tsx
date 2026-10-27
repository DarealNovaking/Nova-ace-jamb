import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Copy, CreditCard, Gift, Loader2, RefreshCw, ShieldCheck } from 'lucide-react'
import { ace, supabase } from '../lib/supabase'

type Product = { id: string; code: string; name: string; price_minor: number; currency: string; duration_days: number | null; active: boolean }
type Entitlement = { id: string; product_id: string | null; source: string; starts_at: string; ends_at: string; status: string }
type Payment = { id: string; product_id: string | null; amount_minor: number; currency: string; status: string; verified_at: string | null; created_at: string }
type ReferralCode = { id: string; code: string; active: boolean; created_at: string }
type Referral = { id: string; status: string; qualified_at: string | null; created_at: string }
type Reward = { id: string; qualified_count: number; rewarded_at: string | null; entitlement_id: string | null }

function formatMoney(amountMinor: number, currency: string) {
  try { return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(amountMinor / 100) }
  catch { return `${currency} ${(amountMinor / 100).toFixed(2)}` }
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

export default function StudentAccountAccess() {
  const [products, setProducts] = useState<Product[]>([])
  const [entitlements, setEntitlements] = useState<Entitlement[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [codes, setCodes] = useState<ReferralCode[]>([])
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copyState, setCopyState] = useState('')
  const loadRun = useRef(0)

  const load = useCallback(async () => {
    const run = ++loadRun.current
    setLoading(true)
    setError('')
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      if (!auth.user) throw new Error('Authentication required')
      const uid = auth.user.id
      const [productResult, entitlementResult, paymentResult, codeResult, referralResult, rewardResult] = await Promise.all([
        ace.from('products').select('id,code,name,price_minor,currency,duration_days,active').eq('active', true),
        ace.from('entitlements').select('id,product_id,source,starts_at,ends_at,status').eq('user_id', uid).order('starts_at', { ascending: false }),
        ace.from('payments').select('id,product_id,amount_minor,currency,status,verified_at,created_at').eq('user_id', uid).order('created_at', { ascending: false }).limit(5),
        ace.from('referral_codes').select('id,code,active,created_at').eq('user_id', uid).eq('active', true).order('created_at', { ascending: false }),
        ace.from('referrals').select('id,status,qualified_at,created_at').eq('referrer_user_id', uid).order('created_at', { ascending: false }).limit(100),
        ace.from('referral_rewards').select('id,qualified_count,rewarded_at,entitlement_id').eq('user_id', uid).order('created_at', { ascending: false }),
      ])
      const failure = productResult.error || entitlementResult.error || paymentResult.error || codeResult.error || referralResult.error || rewardResult.error
      if (failure) throw failure
      if (run !== loadRun.current) return
      setProducts((productResult.data ?? []) as Product[])
      setEntitlements((entitlementResult.data ?? []) as Entitlement[])
      setPayments((paymentResult.data ?? []) as Payment[])
      setCodes((codeResult.data ?? []) as ReferralCode[])
      setReferrals((referralResult.data ?? []) as Referral[])
      setRewards((rewardResult.data ?? []) as Reward[])
    } catch {
      if (run === loadRun.current) setError('We could not load your ACE Pass and referral details. Check your connection and try again.')
    } finally {
      if (run === loadRun.current) setLoading(false)
    }
  }, [])

  useEffect(() => { void load(); return () => { loadRun.current += 1 } }, [load])

  async function copyCode(code: string) {
    setCopyState('')
    try {
      await navigator.clipboard.writeText(code)
      setCopyState(`Referral code ${code} copied.`)
    } catch {
      setCopyState('Copy is not available in this browser. Select the referral code and copy it manually.')
    }
  }

  const activeEntitlement = entitlements.find((item) => item.status === 'active' && new Date(item.starts_at).getTime() <= Date.now() && new Date(item.ends_at).getTime() > Date.now())
  const acePass = products.find((item) => item.code === 'ace_pass')
  const qualifiedCount = referrals.filter((item) => Boolean(item.qualified_at)).length

  return (
    <section aria-labelledby="account-access-title" className="mt-8 grid gap-4 lg:grid-cols-2">
      <article className="glass-card rounded-3xl p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-amber-300/10 text-amber-200"><CreditCard size={21} aria-hidden="true" /></span><div><p className="text-xs uppercase tracking-[.18em] text-amber-100/50">Access & billing</p><h2 id="account-access-title" className="mt-1 text-xl font-black">ACE Pass</h2></div></div>
          <button type="button" onClick={() => void load()} disabled={loading} aria-label="Refresh ACE Pass and referral details" className="rounded-xl border border-white/10 p-2 hover:bg-white/5 disabled:opacity-50"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
        </div>
        {error && <div role="alert" className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-100">{error}<button type="button" className="ml-3 underline" onClick={() => void load()}>Retry access details</button></div>}
        {loading ? <div role="status" aria-live="polite" aria-atomic="true" className="grid min-h-24 place-items-center text-white/45"><Loader2 size={20} className="animate-spin" aria-hidden="true" /><span>Loading ACE Pass…</span></div> : error ? null : <>
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-start justify-between gap-3"><div><h3 className="font-bold">{acePass?.name ?? 'ACE Pass'}</h3><p className="mt-1 text-sm leading-5 text-white/45">Seasonal access to eligible ACE features.</p></div><p className="shrink-0 text-lg font-black">{acePass ? formatMoney(acePass.price_minor, acePass.currency) : 'Price unavailable'}</p></div>
            <p className={`mt-3 text-sm font-semibold ${activeEntitlement ? 'text-emerald-200' : 'text-white/60'}`}>{activeEntitlement ? `Access active until ${formatDate(activeEntitlement.ends_at)}` : 'No active ACE Pass entitlement found.'}</p>
            <button type="button" disabled className="mt-4 min-h-11 w-full cursor-not-allowed rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white/40">Checkout unavailable</button>
            <p className="mt-2 text-xs leading-5 text-white/35">Secure checkout is unavailable while the payment provider is disabled. Payment status and access are never set by this screen.</p>
          </div>
          <div className="mt-5"><h3 className="font-bold">Recent payments</h3>{payments.length ? <ul className="mt-3 space-y-2">{payments.map((payment) => <li key={payment.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 p-3"><span><span className="block text-sm font-semibold">{formatMoney(payment.amount_minor, payment.currency)}</span><span className="mt-1 block text-xs text-white/35">{formatDate(payment.created_at)}</span></span><span className="rounded-full border border-white/10 px-2.5 py-1 text-xs capitalize text-white/60">{payment.status.replaceAll('_', ' ')}</span></li>)}</ul> : <p className="mt-2 text-sm text-white/40">No payment history is available.</p>}</div>
        </>}
      </article>

      <article className="glass-card rounded-3xl p-6 sm:p-8">
        <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-purple-500/15 text-purple-200"><Gift size={21} aria-hidden="true" /></span><div><p className="text-xs uppercase tracking-[.18em] text-purple-200/50">Community growth</p><h2 className="mt-1 text-xl font-black">Referrals</h2></div></div>
        {loading ? <div role="status" aria-live="polite" aria-atomic="true" className="grid min-h-24 place-items-center text-white/45"><Loader2 size={20} className="animate-spin" aria-hidden="true" /><span>Loading referrals…</span></div> : error ? <p className="mt-5 text-sm text-white/55">Referral details are unavailable until the account data loads successfully.</p> : <>
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-sm text-white/45">Your referral code</p>{codes.length ? <ul className="mt-3 space-y-2">{codes.map((code) => <li key={code.id} className="flex items-center justify-between gap-3"><code className="break-all rounded-lg bg-white/5 px-3 py-2 text-sm font-bold tracking-wider">{code.code}</code><button type="button" onClick={() => void copyCode(code.code)} aria-label={`Copy referral code ${code.code}`} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/5"><Copy size={14} /> Copy</button></li>)}</ul> : <p className="mt-2 text-sm leading-6 text-white/50">A referral code has not been issued to your account yet.</p>}{copyState && <p role="status" className="mt-3 text-xs text-purple-100/80">{copyState}</p>}</div>
          <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl border border-white/10 p-4"><p className="text-xs text-white/40">Recorded referrals</p><p className="mt-2 text-2xl font-black">{referrals.length}</p></div><div className="rounded-2xl border border-white/10 p-4"><p className="text-xs text-white/40">Qualified referrals</p><p className="mt-2 text-2xl font-black">{qualifiedCount}</p></div></div>
          <p className="mt-4 text-xs leading-5 text-white/40">Qualification and rewards are determined by the server. No active referral campaign is configured, so this screen does not promise a reward or invent a target.</p>
          {rewards.some((reward) => Boolean(reward.rewarded_at || reward.entitlement_id)) && <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-300/15 bg-emerald-500/5 p-3 text-xs leading-5 text-emerald-100"><ShieldCheck size={16} className="mt-0.5 shrink-0" /> A referral reward record is present on your account.</div>}
        </>}
      </article>
    </section>
  )
}
