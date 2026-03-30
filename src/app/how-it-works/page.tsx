'use client'

import { motion } from 'framer-motion'
import { 
  UserPlus, 
  Trophy, 
  Heart, 
  CreditCard, 
  Target,
  ArrowRight
} from 'lucide-react'

const STEPS = [
  {
    title: "Join the Club",
    description: "Sign up and choose a plan that fits your game. Select a charity you want to support with every swing.",
    icon: UserPlus,
    color: "text-blue-400",
    bg: "bg-blue-400/10"
  },
  {
    title: "Subscribe & Save",
    description: "Active your subscription via Stripe. 10% of your fee goes directly to your chosen charity immediately.",
    icon: CreditCard,
    color: "text-accent",
    bg: "bg-accent/10"
  },
  {
    title: "Enter Your Scores",
    description: "Submit exactly 5 golf scores (Stableford). We manage your rolling 5 entries automatically.",
    icon: Target,
    color: "text-golf-green",
    bg: "bg-golf-green/10"
  },
  {
    title: "Monthly Draws",
    description: "Participate in automated monthly draws. The better your consistency, the higher your match chances.",
    icon: Trophy,
    color: "text-orange-400",
    bg: "bg-orange-400/10"
  },
  {
    title: "Make an Impact",
    description: "Win exclusive prize pools and watch your charity contributions grow as you play.",
    icon: Heart,
    color: "text-red-500",
    bg: "bg-red-500/10"
  }
]

export default function HowItWorks() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-20 space-y-24">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-black outfit"
        >
          How <span className="gradient-text">GolfCharity</span> Works
        </motion.h1>
        <p className="text-secondary text-lg font-medium">
          A seamless blend of competitive golf and meaningful social impact. From scorecard to support, here is how you make a difference.
        </p>
      </div>

      {/* Steps List */}
      <div className="relative space-y-12">
        {STEPS.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className={`flex flex-col md:flex-row items-center gap-12 ${
              index % 2 === 1 ? 'md:flex-row-reverse' : ''
            }`}
          >
            {/* Icon Block */}
            <div className={`w-32 h-32 flex-shrink-0 rounded-3xl ${step.bg} flex items-center justify-center border border-white/5 shadow-2xl`}>
              <step.icon className={`w-12 h-12 ${step.color}`} />
            </div>

            {/* Content Block */}
            <div className="flex-grow space-y-4 text-center md:text-left">
              <div className="flex items-center gap-4 justify-center md:justify-start">
                 <span className="text-4xl font-black outfit opacity-20">{index + 1}</span>
                 <h2 className="text-3xl font-black outfit">{step.title}</h2>
              </div>
              <p className="text-secondary text-lg font-medium max-w-xl">
                {step.description}
              </p>
            </div>
          </motion.div>
        ))}

        {/* Connecting Lines (Desktop only) */}
        <div className="hidden md:block absolute left-16 top-32 bottom-32 w-0.5 bg-gradient-to-b from-transparent via-border to-transparent -z-10" />
      </div>

      {/* Prize Logic Summary */}
      <section className="glass p-12 space-y-12 text-center bg-accent/5 border-accent/20">
         <h2 className="text-3xl font-black outfit">The Prize Pool Split</h2>
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="space-y-2">
               <div className="text-5xl font-black outfit gradient-text">40%</div>
               <div className="text-xs font-bold text-secondary uppercase tracking-widest">5-Match Jackpot</div>
            </div>
            <div className="space-y-2">
               <div className="text-5xl font-black outfit gradient-text">35%</div>
               <div className="text-xs font-bold text-secondary uppercase tracking-widest">4-Match Tier</div>
            </div>
            <div className="space-y-2">
               <div className="text-5xl font-black outfit gradient-text">25%</div>
               <div className="text-xs font-bold text-secondary uppercase tracking-widest">3-Match Tier</div>
            </div>
         </div>
         <p className="text-sm text-secondary font-medium">
            * If no 5-match winner exists, the 40% jackpot rolls over to the next month!
         </p>
      </section>

      {/* CTA */}
      <div className="flex flex-col items-center gap-6 pt-12">
        <h2 className="text-3xl font-black outfit">Ready to start?</h2>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <a href="/signup" className="btn-primary flex items-center gap-3">
             Join Now <ArrowRight className="w-5 h-5" />
          </a>
        </motion.div>
      </div>
    </div>
  )
}
