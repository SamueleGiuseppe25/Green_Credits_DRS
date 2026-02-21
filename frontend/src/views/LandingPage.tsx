import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import {
  Leaf,
  Package,
  Truck,
  Recycle,
  Wallet,
  Clock,
  CreditCard,
  ArrowRight,
  Check,
  Mail,
  Users,
  MapPin,
} from 'lucide-react'

const JOURNEY_STEPS = [
  {
    title: 'Subscribe to a Plan',
    desc: 'Choose weekly, monthly, or yearly. Your subscription covers unlimited pickups within your plan — no hidden fees.',
    image: '/images/hero-recycling.jpg',
  },
  {
    title: 'Schedule Your Pickup',
    desc: 'Pick a day and time that suits you. Leave your bags out — our driver handles the rest.',
    image: '/images/blog-our-story.jpg',
  },
  {
    title: 'Earn Green Credits',
    desc: 'Once your bottles are processed at a return point, credits land in your wallet. Spend them or donate to a cause.',
    image: '/images/blog-recycling-energy.jpg',
  },
]

export const LandingPage: React.FC = () => {
  const { isAuthenticated, loading, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [journeyStep, setJourneyStep] = useState(0)
  const [stepOpacity, setStepOpacity] = useState(100)
  const journeyIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!loading && isAuthenticated) {
      const dest = user?.is_admin ? '/admin' : user?.is_driver ? '/driver' : '/wallet'
      navigate(dest, { replace: true })
    }
  }, [isAuthenticated, loading, navigate, user])

  const advanceStep = useCallback(() => {
    setStepOpacity(0)
    setTimeout(() => {
      setJourneyStep((s) => (s + 1) % 3)
      setStepOpacity(100)
    }, 200)
  }, [])

  const goToStep = useCallback((idx: number) => {
    if (journeyIntervalRef.current) {
      clearInterval(journeyIntervalRef.current)
      journeyIntervalRef.current = null
    }
    setStepOpacity(0)
    setTimeout(() => {
      setJourneyStep(idx)
      setStepOpacity(100)
      journeyIntervalRef.current = setInterval(advanceStep, 3000)
    }, 200)
  }, [advanceStep])

  useEffect(() => {
    journeyIntervalRef.current = setInterval(advanceStep, 3000)
    return () => {
      if (journeyIntervalRef.current) {
        clearInterval(journeyIntervalRef.current)
      }
    }
  }, [advanceStep])

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      toast.success('Thanks for subscribing!')
      setEmail('')
    }
  }

  return (
    <div>
      {/* ── Hero ── */}
      <section className="py-16 md:py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 mb-6">
                Sustainable bottle collection
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-gray-900 dark:text-white">
                Turn Your Bottles Into{' '}
                <span className="text-emerald-600">Green Credits</span>
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-lg">
                Subscribe to weekly pickups, earn credits for every bottle collected,
                and track your environmental impact — all from one app.
              </p>
              <div className="flex flex-wrap gap-4 mb-4">
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
                >
                  Start Collecting <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-600 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Learn More
                </a>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <img
                src="/images/hero-recycling.jpg"
                alt="Bottles packed for recycling"
                className="w-full aspect-video rounded-2xl object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="bg-gray-100 dark:bg-gray-800/50 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div>
              <div className="flex items-center justify-center gap-2 text-3xl font-bold text-gray-900 dark:text-white mb-1">
                <Recycle className="h-7 w-7 text-emerald-600" /> 1,000+
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Bottles Collected</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 text-3xl font-bold text-gray-900 dark:text-white mb-1">
                <Users className="h-7 w-7 text-emerald-600" /> 500+
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Users</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 text-3xl font-bold text-gray-900 dark:text-white mb-1">
                <MapPin className="h-7 w-7 text-emerald-600" /> 50+
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Return Points</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Your Journey with GreenCredits ── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-10 text-center">
            Your Journey with GreenCredits
          </h2>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex gap-2 mb-6">
                {[0, 1, 2].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => goToStep(i)}
                    className={`w-10 h-10 rounded-full font-semibold transition-colors ${
                      journeyStep === i
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {JOURNEY_STEPS[journeyStep].title}
              </h3>
              <p
                className={`text-gray-600 dark:text-gray-400 transition-opacity duration-500 ${
                  stepOpacity === 100 ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {JOURNEY_STEPS[journeyStep].desc}
              </p>
            </div>
            <div className="flex justify-center">
              <img
                src={JOURNEY_STEPS[journeyStep].image}
                alt={JOURNEY_STEPS[journeyStep].title}
                className={`w-full aspect-video rounded-2xl object-cover transition-opacity duration-500 ${
                  stepOpacity === 100 ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              From pickup to payout in four simple steps
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Package, title: 'Schedule a Pickup', desc: 'Choose a time slot and leave your bags ready for collection.' },
              { icon: Truck, title: 'We Collect', desc: 'Our drivers pick up your bottles and cans right from your door.' },
              { icon: Recycle, title: 'Processing', desc: 'Bags are processed at certified return points near you.' },
              { icon: Wallet, title: 'Earn Credits', desc: 'Credits appear in your wallet within 24 hours of processing.' },
            ].map((step, i) => (
              <div key={i} className="relative text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 mb-4">
                  <step.icon className="h-6 w-6" />
                </div>
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 rounded-full w-6 h-6 flex items-center justify-center">
                  {i + 1}
                </span>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features / Benefits ── */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why GreenCredits?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              The easiest way to recycle and earn at the same time
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Leaf,
                title: 'Eco-Friendly',
                desc: 'Reduce landfill waste. Every bottle you collect is properly recycled, contributing to a cleaner environment.',
              },
              {
                icon: Clock,
                title: 'Convenient',
                desc: 'No more trips to return points. Schedule pickups from your phone and we handle the rest.',
              },
              {
                icon: CreditCard,
                title: 'Earn Rewards',
                desc: 'Your collected bottles are converted to GreenCredits you can redeem or donate to environmental causes.',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-6 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 mb-4">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Choose a plan that works for you. Cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Weekly',
                price: '€2.00',
                period: '/week',
                desc: 'Perfect for occasional recyclers',
                features: ['1 pickup per week', 'Up to 2 bags', 'Wallet credits', 'Email support'],
                popular: false,
              },
              {
                name: 'Monthly',
                price: '€7.00',
                period: '/month',
                desc: 'Most popular choice',
                features: ['Flexible monthly billing', 'Up to 5 bags each', 'Wallet credits', 'Priority support', 'Donation option'],
                popular: true,
              },
              {
                name: 'Yearly',
                price: '€70.00',
                period: '/year',
                desc: 'Best value — lowest per-month cost',
                features: ['Unlimited pickups', 'Up to 10 bags each', 'Wallet credits', 'Priority support', 'Donation option', 'Early access to features'],
                popular: false,
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`relative rounded-xl p-6 border ${
                  plan.popular
                    ? 'border-emerald-500 shadow-lg shadow-emerald-500/10'
                    : 'border-gray-200 dark:border-gray-700'
                } bg-white dark:bg-gray-800`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-600 text-white">
                    Popular
                  </span>
                )}
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{plan.desc}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                  <span className="text-gray-500 dark:text-gray-400">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/signup"
                  className={`block text-center px-4 py-2.5 rounded-lg font-medium transition-colors ${
                    plan.popular
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Choose Plan
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Blog ── */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              From Our Blog
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Tips, stories, and updates from the GreenCredits team
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "How Ireland's DRS Scheme Works",
                excerpt: "Ireland's Deposit Return Scheme (DRS) puts a small deposit on plastic bottles and cans. Return them at certified points and get your money back — or let GreenCredits do it for you.",
                date: 'Feb 10, 2026',
                image: '/images/blog-recycling-energy.jpg',
                linkHref: 'https://www.re-turn.ie',
              },
              {
                title: 'Why Subscription Recycling Makes a Difference',
                excerpt: 'A single missed collection adds up. Regular, scheduled pickups mean fewer bottles going to landfill and more credits in your wallet — consistency is the key to real impact.',
                date: 'Jan 28, 2026',
                image: '/images/blog-our-story.jpg',
                linkHref: '#',
              },
              {
                title: 'GreenCredits and the Circular Economy',
                excerpt: 'The circular economy turns waste into a resource. By connecting households with certified return points, GreenCredits closes the loop on packaging — keeping materials in use and out of the environment.',
                date: 'Jan 15, 2026',
                image: '/images/blog-reduce-waste.jpg',
                linkHref: '#',
              },
            ].map((post, i) => (
              <a
                key={i}
                href={post.linkHref}
                {...(post.linkHref.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="group rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700"
              >
                <img src={post.image} alt={post.title} className="h-48 w-full object-cover" />
                <div className="p-5">
                  <time className="text-xs text-gray-500 dark:text-gray-400">{post.date}</time>
                  <h3 className="font-semibold text-gray-900 dark:text-white mt-1 mb-2 group-hover:text-emerald-600 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{post.excerpt}</p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 mt-3">
                    Read more <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            About GreenCredits
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            GreenCredits was founded with a simple mission: make recycling rewarding. We partner
            with local return points across Ireland to turn your everyday bottles and cans into
            real value. Whether you choose to keep the credits or donate them to environmental
            causes, every collection makes a difference.
          </p>
        </div>
      </section>

      {/* ── Newsletter / CTA ── */}
      <section className="py-20 bg-emerald-700 dark:bg-emerald-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Mail className="h-10 w-10 text-emerald-200 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-3">
            Ready to Start Earning Green Credits?
          </h2>
          <p className="text-emerald-100 mb-8">
            Join thousands of users making a difference, one bottle at a time.
          </p>
          <form
            onSubmit={handleNewsletter}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              required
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
