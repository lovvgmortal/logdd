
import React, { useState } from 'react';
import { CheckIcon, FacebookIcon, MailIcon } from '../Icons';

export const PricingView: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: "Startup",
      description: "Perfect for solo founders getting started",
      price: 49,
      features: [
        "Single User Seat",
        "50 AI Script Generations/mo",
        "Basic DNA Extraction",
        "Standard Speed"
      ],
      isPopular: false
    },
    {
      name: "Growth",
      description: "For growing teams that need collaboration",
      price: 149,
      features: [
        "5 User Seats",
        "Unlimited AI Generations",
        "Advanced DNA Analysis",
        "Priority Support",
        "Team Folders"
      ],
      isPopular: true
    },
    {
      name: "Pro",
      description: "Custom solution for large organizations",
      price: 299,
      features: [
        "Unlimited Seats",
        "Custom Model Fine-tuning",
        "API Access",
        "Dedicated Account Manager",
        "SSO & Security Audit"
      ],
      isPopular: false
    }
  ];

  const getPrice = (basePrice: number) => {
    return billingCycle === 'yearly' ? Math.floor(basePrice * 0.8) : basePrice;
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 animate-in fade-in duration-700">
      
      {/* Header & Toggle */}
      <div className="text-center mb-16 space-y-8">
        <div className="flex justify-center items-center gap-4">
            <span className={`text-sm font-bold ${billingCycle === 'monthly' ? 'text-white' : 'text-zinc-500'}`}>MONTHLY</span>
            <button 
                onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                className="w-14 h-7 bg-zinc-800 rounded-full relative border border-zinc-700 transition-colors"
            >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 ${billingCycle === 'monthly' ? 'left-1' : 'left-8'}`}></div>
            </button>
            <span className={`text-sm font-bold flex items-center gap-2 ${billingCycle === 'yearly' ? 'text-white' : 'text-zinc-500'}`}>
                YEARLY <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded-full border border-green-500/20">Save 20%</span>
            </span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        {plans.map((plan) => (
            <div 
                key={plan.name} 
                className={`relative flex flex-col p-8 rounded-3xl border transition-all hover:scale-105 duration-300 ${plan.isPopular ? 'bg-zinc-900 border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.15)]' : 'bg-black border-zinc-800'}`}
            >
                {plan.isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
                        Most Popular
                    </div>
                )}
                
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-xs text-zinc-500 h-8">{plan.description}</p>
                </div>

                <div className="mb-8">
                    <div className="flex items-end gap-1">
                        <span className="text-5xl font-black text-white tracking-tighter">${getPrice(plan.price)}</span>
                        <span className="text-sm text-zinc-500 font-medium mb-1">/seat/mo</span>
                    </div>
                    {billingCycle === 'yearly' && <p className="text-[10px] text-green-400 mt-1">Billed ${getPrice(plan.price) * 12} yearly</p>}
                    <p className="text-[10px] text-zinc-600 mt-1 uppercase tracking-widest">{billingCycle === 'monthly' ? 'Billed Monthly' : ''}</p>
                </div>

                <button className={`w-full py-4 rounded-xl font-bold text-sm mb-8 transition-colors ${plan.isPopular ? 'bg-white text-black hover:bg-zinc-200' : 'bg-zinc-900 text-white border border-zinc-800 hover:bg-zinc-800'}`}>
                    START FREE TRIAL
                </button>

                <div className="space-y-4 flex-1">
                    {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-3">
                             <div className={`mt-0.5 p-0.5 rounded-full ${plan.isPopular ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-800 text-zinc-400'}`}>
                                <CheckIcon className="w-3 h-3" />
                             </div>
                             <span className="text-sm text-zinc-300">{feature}</span>
                        </div>
                    ))}
                </div>
            </div>
        ))}
      </div>

      {/* Contact Section */}
      <div className="border-t border-white/10 pt-16 text-center">
         <h3 className="text-xl font-bold text-white mb-8">Need help deciding?</h3>
         <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
             <a href="mailto:longdd.pitre@gmail.com" className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors group">
                 <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 group-hover:border-zinc-600">
                    <MailIcon className="w-5 h-5" />
                 </div>
                 <div className="text-left">
                     <div className="text-[10px] font-bold uppercase text-zinc-600">Email Us</div>
                     <div className="text-sm">longdd.pitre@gmail.com</div>
                 </div>
             </a>
             
             <a href="https://www.facebook.com/logdd.pitre" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-zinc-400 hover:text-blue-400 transition-colors group">
                 <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 group-hover:border-blue-500/50">
                    <FacebookIcon className="w-5 h-5" />
                 </div>
                 <div className="text-left">
                     <div className="text-[10px] font-bold uppercase text-zinc-600">Connect on Facebook</div>
                     <div className="text-sm">Duong Dinh Long</div>
                 </div>
             </a>
         </div>
      </div>

    </div>
  );
};
