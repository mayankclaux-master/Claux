'use client'

import { useState } from 'react'

export default function SavingsCalculator() {
  const [currentSpend, setCurrentSpend] = useState(50000)

  const STARTER_PLAN_PRICE = 7499
  const monthlySavings = currentSpend - STARTER_PLAN_PRICE
  const annualSavings = monthlySavings * 12
  const monthsFree = Math.floor(annualSavings / STARTER_PLAN_PRICE)

  return (
    <section className="py-16 px-4 bg-[#050508]">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 gradient-text">
            How Much Are You Wasting Right Now?
          </h2>
          <p className="text-slate-400 text-lg">
            See your exact savings with Claux
          </p>
        </div>

        <div className="glass-card p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Side - Input */}
            <div>
              <label className="block text-slate-400 text-sm font-medium mb-4">
                Your current monthly SEO spend
              </label>
              
              <div className="mb-6">
                <div className="text-3xl font-bold text-white mb-4">
                  ₹{currentSpend.toLocaleString('en-IN')}
                </div>
                
                <input
                  type="range"
                  min="5000"
                  max="200000"
                  step="1000"
                  value={currentSpend}
                  onChange={(e) => setCurrentSpend(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                
                <div className="flex justify-between mt-2">
                  <span className="text-slate-600 text-xs">₹5,000</span>
                  <span className="text-slate-600 text-xs">₹2,00,000</span>
                </div>
              </div>
            </div>

            {/* Right Side - Output */}
            <div className="flex flex-col justify-center space-y-4">
              <div>
                <div className="text-slate-500 text-sm mb-1">Claux Starter Plan</div>
                <div className="text-2xl font-bold text-teal-400">
                  ₹{STARTER_PLAN_PRICE.toLocaleString('en-IN')}/month
                </div>
              </div>

              {currentSpend >= STARTER_PLAN_PRICE ? (
                <>
                  <div>
                    <div className="text-slate-500 text-sm mb-1">Monthly Savings</div>
                    <div className="text-3xl font-bold text-emerald-400">
                      ₹{monthlySavings.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-500 text-sm mb-1">Annual Savings</div>
                    <div className="text-4xl font-bold text-emerald-400">
                      ₹{annualSavings.toLocaleString('en-IN')}
                    </div>
                  </div>

                  {monthsFree > 0 && (
                    <div className="bg-emerald-400/10 border border-emerald-400/20 rounded-lg p-3 mt-2">
                      <p className="text-emerald-400 text-sm font-semibold">
                        That's {monthsFree} {monthsFree === 1 ? 'month' : 'months'} of Claux FREE every year! 🎉
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-amber-400/10 border border-amber-400/20 rounded-lg p-4">
                  <p className="text-amber-400 text-sm font-semibold">
                    You're already below our price! 🎯
                  </p>
                  <p className="text-slate-400 text-xs mt-2">
                    But are you getting 9 AI agents working 24/7? Probably not.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* CTA Button */}
          <div className="mt-8 pt-6 border-t border-white/5">
            <button className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white py-3 rounded-xl font-semibold shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition">
              Start Saving Today →
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
