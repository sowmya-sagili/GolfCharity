'use client'

import { motion } from 'framer-motion'
import { Check, Zap, Star, ShieldCheck } from 'lucide-react'
import { useState } from 'react'

const PLANS = [
  {
    id: 'monthly',
    name: 'Monthly Master',
    price: '9.99',
    interval: 'month',
    description: 'Perfect for regular players looking to make a consistent impact.',
    features: [
      'Submit up to 5 scores monthly',
      'Entry into all Monthly Draws',
      '10% direct charity contribution',
      'Digital membership badge',
      'Access to Winnings Dashboard'
    ]
  },
  {
    id: 'yearly',
    name: 'Yearly Legend',
    price: '99.99',
    interval: 'year',
    popular: true,
    description: 'The ultimate commitment to your game and your cause. Save 20%.',
    features: [
      'All Monthly Master features',
      '2 months free (Yearly discount)',
      'Priority score verification',
      'Exclusive Year-End Mega Draw',
      'Physical Membership Card',
      'Increased 15% charity impact'
    ]
  }
]

export default function Subscribe() {
  const [loading, setLoading] = useState<string | null>(null)

  const handleSubscribe = async (planId: string) => {
    setLoading(planId)
    // In a real app, this would call a server action to create a Stripe session
    console.log(`Subscribing to ${planId}`)
    
    // Simulate API call
    setTimeout(() => {
      setLoading(null)
      alert("This is a demo. In production, this would redirect to Stripe Checkout.")
    }, 1500)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-20 space-y-20">
      <div className="text-center space-y-4">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-black outfit"
        >
          Choose Your <span className="gradient-text">Impact</span>
        </motion.h1>
        <p className="text-secondary max-w-2xl mx-auto font-medium">
          Select a subscription plan that fits your game. Every plan contributes directly to the charity you selected during signup.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {PLANS.map((plan) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -10 }}
            className={`glass p-10 flex flex-col justify-between relative overflow-hidden ${
              plan.popular ? 'border-accent/40 bg-accent/5' : ''
            }`}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0 bg-accent text-background text-[10px] font-black uppercase tracking-widest px-6 py-2 rotate-45 translate-x-6 -translate-y-2 translate-y-4">
                Best Value
              </div>
            )}

            <div className="space-y-8">
              <div className="space-y-2">
                <h3 className="text-2xl font-black outfit">{plan.name}</h3>
                <p className="text-sm text-secondary font-medium">{plan.description}</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black outfit">£{plan.price}</span>
                <span className="text-secondary font-bold uppercase tracking-widest text-xs">/ {plan.interval}</span>
              </div>

              <ul className="space-y-4">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm font-medium">
                    <div className="mt-1 p-0.5 rounded-full bg-accent/20">
                      <Check className="w-3 h-3 text-accent" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={loading !== null}
              className={`mt-12 py-4 rounded-xl font-black outfit text-lg transition-all ${
                plan.popular 
                  ? 'bg-accent text-background hover:shadow-lg hover:shadow-accent/20' 
                  : 'border border-border hover:bg-border/40'
              } disabled:opacity-50`}
            >
              {loading === plan.id ? 'Connecting...' : `Get Started with ${plan.id}`}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Trust Badges */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 pt-12 border-t border-border">
          <div className="flex items-center gap-4 text-secondary">
             <ShieldCheck className="w-6 h-6 text-accent" />
             <span className="text-[10px] font-black uppercase tracking-widest">Secure Payments via Stripe</span>
          </div>
          <div className="flex items-center gap-4 text-secondary">
             <Zap className="w-6 h-6 text-accent" />
             <span className="text-[10px] font-black uppercase tracking-widest">Instant Membership Access</span>
          </div>
          <div className="flex items-center gap-4 text-secondary">
             <Star className="w-6 h-6 text-accent" />
             <span className="text-[10px] font-black uppercase tracking-widest">Cancel Anytime Policy</span>
          </div>
      </div>
    </div>
  )
}
