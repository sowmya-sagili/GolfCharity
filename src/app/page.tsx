'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Trophy, Heart, Target, ChevronRight } from 'lucide-react'

export default function Home() {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background z-10" />
          <img 
            src="/images/hero.png" 
            alt="Golf Hero" 
            className="w-full h-full object-cover scale-105"
          />
        </div>

        <motion.div 
          className="relative z-20 max-w-4xl space-y-8"
          initial="initial"
          whileInView="animate"
          variants={{
            animate: { transition: { staggerChildren: 0.2 } }
          }}
        >
          <motion.span 
            variants={fadeIn}
            className="inline-block px-4 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-sm font-bold tracking-widest uppercase"
          >
            Play. Win. Give.
          </motion.span>
          
          <motion.h1 
            variants={fadeIn}
            className="text-5xl md:text-7xl lg:text-8xl font-black outfit tracking-tight leading-[1.1]"
          >
            The Ultimate <br />
            <span className="gradient-text tracking-tighter">Golf Charity</span> <br />
            Platform.
          </motion.h1>

          <motion.p 
            variants={fadeIn}
            className="text-lg md:text-xl text-secondary max-w-2xl mx-auto font-medium"
          >
            Elevate your golf experience. Submit your monthly scores for a chance to win exclusive prize pools while making a real impact for your favorite charities.
          </motion.p>

          <motion.div 
            variants={fadeIn}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link href="/signup" className="btn-primary flex items-center gap-2 group">
              Start Your Journey <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/how-it-works" className="btn-secondary">
              Learn More
            </Link>
          </motion.div>
        </motion.div>

        {/* Stats Overlay */}
        <div className="absolute bottom-12 left-0 right-0 z-20 px-4">
          <div className="max-w-6xl mx-auto glass p-8 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center bg-card-bg/40 backdrop-blur-xl">
             <div>
                <div className="text-3xl font-black gradient-text">£1.2M+</div>
                <div className="text-xs font-bold text-secondary uppercase tracking-widest mt-1">Raised for Charity</div>
             </div>
             <div className="border-x border-border/50">
                <div className="text-3xl font-black gradient-text">15,000+</div>
                <div className="text-xs font-bold text-secondary uppercase tracking-widest mt-1">Active Golfers</div>
             </div>
             <div>
                <div className="text-3xl font-black gradient-text">£450K</div>
                <div className="text-xs font-bold text-secondary uppercase tracking-widest mt-1">Monthly Prize Pool</div>
             </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="w-full py-32 px-4 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <motion.div 
            whileHover={{ y: -10 }}
            className="glass p-10 space-y-6 flex flex-col items-center text-center"
          >
            <div className="p-4 rounded-2xl bg-accent/10 border border-accent/20">
              <Target className="w-10 h-10 text-accent" />
            </div>
            <h3 className="text-2xl font-black outfit">Rolling 5 Scores</h3>
            <p className="text-secondary font-medium">
              Submit your latest rounds. We keep your last 5 golf scores active, automatically rolling over the oldest entries to keep your impact fresh.
            </p>
          </motion.div>

          <motion.div 
            whileHover={{ y: -10 }}
            className="glass p-10 space-y-6 flex flex-col items-center text-center border-accent/20 border-2"
          >
            <div className="p-4 rounded-2xl bg-golf-green/10 border border-golf-green/20">
              <Trophy className="w-10 h-10 text-golf-green" />
            </div>
            <h3 className="text-2xl font-black outfit">Monthly Draws</h3>
            <p className="text-secondary font-medium">
              Participate in our monthly weighted draws. The better your consistency, the higher your chances of winning the jackpot prize pool.
            </p>
          </motion.div>

          <motion.div 
            whileHover={{ y: -10 }}
            className="glass p-10 space-y-6 flex flex-col items-center text-center"
          >
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
              <Heart className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-2xl font-black outfit">Direct Impact</h3>
            <p className="text-secondary font-medium">
              Choose your charity at signup. At least 10% of every subscription goes directly to your cause. Transparency is our core value.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Prize Pool Split */}
      <section className="w-full py-24 px-4 bg-accent/5">
        <div className="max-w-5xl mx-auto space-y-16 text-center">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-black outfit">The Monthly Jackpot</h2>
            <p className="text-secondary font-medium max-w-2xl mx-auto">
              Each month, the total subscription pool is split among winners across three tiers. No winner for the 5-match? The jackpot rolls over!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="glass p-8 bg-black/40">
              <div className="text-5xl font-black gradient-text">40%</div>
              <div className="text-sm font-bold text-secondary uppercase tracking-widest mt-2">5-Match (Jackpot)</div>
            </div>
            <div className="glass p-8 bg-black/40">
              <div className="text-5xl font-black gradient-text">35%</div>
              <div className="text-sm font-bold text-secondary uppercase tracking-widest mt-2">4-Match</div>
            </div>
            <div className="glass p-8 bg-black/40">
              <div className="text-5xl font-black gradient-text">25%</div>
              <div className="text-sm font-bold text-secondary uppercase tracking-widest mt-2">3-Match</div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="w-full py-40 px-4 text-center">
        <motion.div 
          className="max-w-3xl mx-auto glass p-20 space-y-8 bg-gradient-to-br from-accent/10 to-transparent"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
        >
          <h2 className="text-4xl md:text-6xl font-black outfit">Ready to make your game count?</h2>
          <p className="text-lg text-secondary font-medium">
            Join thousands of golfers who are winning big and giving back. Your first draw is waiting.
          </p>
          <div className="pt-4">
            <Link href="/signup" className="btn-primary text-lg px-12 py-4">
              Create Your Account
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
