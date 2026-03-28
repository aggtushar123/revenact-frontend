import { Sparkles, ArrowUp } from 'lucide-react';

export function HomeView({ onSendPrompt }: { onSendPrompt: (p: string) => void }) {
  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar bg-white flex flex-col relative pb-32 w-full max-w-[900px] mx-auto">
      <div className="flex-1 flex flex-col items-center justify-center w-full px-8 pt-16 pb-12">
        <div className="flex items-center gap-3.5 mb-2.5 relative">
          <div className="absolute -left-12 top-0.5 w-[38px] h-[38px] rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] flex items-center justify-center text-white shadow-[0_4px_12px_rgba(139,92,246,0.3)]">
            <Sparkles className="w-[18px] h-[18px]" />
          </div>
          <h2 className="text-[28px] font-bold text-gray-900 tracking-tight leading-none">
            Hi, I'm <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-600">your Velaris Copilot</span>.
          </h2>
        </div>
        <p className="text-gray-400 font-medium text-[13px] mb-[64px] tracking-wide">
          I help you spot risk, growth, and what needs attention across your accounts fast
        </p>

        {/* Input Box */}
        <div className="w-full max-w-[700px] relative">
          <div className="absolute -inset-[3px] rounded-xl bg-gradient-to-r from-indigo-200/60 to-purple-200/60 blur-sm"></div>
          <div className="relative bg-white border-2 border-[#d3cef6] rounded-xl flex items-end min-h-[104px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] focus-within:ring-4 focus-within:ring-indigo-500/10 transition-shadow">
            <textarea
              className="w-full h-full min-h-[96px] bg-transparent resize-none outline-none border-none p-4 text-[15px] placeholder:text-gray-300 placeholder:italic text-gray-700 font-medium"
              placeholder="Type '{' to add variables, like {Account} and {Organization}"
            />
            <button
              onClick={() => onSendPrompt("test")}
              className="absolute right-3.5 bottom-3.5 w-[26px] h-[26px] bg-[#f1f1f4] hover:bg-[#8b5cf6] hover:text-white rounded-full flex items-center justify-center text-white shadow-sm transition-all cursor-pointer group"
            >
              <ArrowUp className="w-[14px] h-[14px] stroke-[3.5px] text-gray-400 group-hover:text-white" />
            </button>
          </div>
        </div>

        {/* Built-in Skills */}
        <div className="w-full max-w-[740px] mt-16 flex flex-col gap-4">
          <div className="flex items-center gap-2 font-bold text-[14px] text-gray-800 tracking-tight">
            <span className="text-[10px] text-gray-500 mt-0.5">▼</span> Built-in Skills
            <div className="w-3.5 h-3.5 bg-gray-800 rounded-full text-white flex items-center justify-center text-[9px] font-bold ml-0.5 tracking-tighter">i</div>
          </div>

          <div className="flex items-center gap-2 text-[12.5px] font-bold mb-3">
            <span className="bg-[#f4effc] text-[#6b47ed] px-4 py-[7px] rounded-md cursor-pointer border border-[#e1d5f8] shadow-sm">Featured</span>
            <span onClick={() => document.getElementById('section-account')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="text-gray-500 hover:text-gray-800 bg-gray-50/80 px-4 py-[7px] border border-gray-100 rounded-md cursor-pointer transition-colors shadow-sm">All</span>
            <span onClick={() => document.getElementById('section-account')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="text-gray-500 hover:text-gray-800 bg-gray-50/80 px-4 py-[7px] border border-gray-100 rounded-md cursor-pointer transition-colors shadow-sm">Account</span>
            <span onClick={() => document.getElementById('section-csm')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="text-gray-500 hover:text-gray-800 bg-gray-50/80 px-4 py-[7px] border border-gray-100 rounded-md cursor-pointer transition-colors shadow-sm">CSM</span>
            <span onClick={() => document.getElementById('section-portfolio')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="text-gray-500 hover:text-gray-800 bg-gray-50/80 px-4 py-[7px] border border-gray-100 rounded-md cursor-pointer transition-colors shadow-sm">Portfolio</span>
            <span onClick={() => document.getElementById('section-product')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="text-gray-500 hover:text-gray-800 bg-gray-50/80 px-4 py-[7px] border border-gray-100 rounded-md cursor-pointer transition-colors shadow-sm">Product</span>
          </div>

          <div id="section-account" className="text-[14px] font-bold text-gray-500 mb-1.5 mt-2">Account</div>

          <div className="grid grid-cols-4 gap-4">
            <SkillCard title="Internal Business Review" desc="Internal Business Review" />
            <SkillCard title="Quick Start Brief" desc="Pulls together a compact, high-signal account overview to rapidl..." />
            <SkillCard title="Overview of strategy to de-ris..." desc="Provides root cause analysis of the risk on an account and a hig..." />
            <SkillCard title="Prep weekly customer sync" desc="Creates a brief that consolidates open items, clarifies ownership..." />
            <SkillCard title="One liner update" desc="Compact summary of the recent activity on an account" />
            <SkillCard title="Onboarding Status Report" desc="Provides a clear, fast-to-digest view of onboarding progress,..." />
          </div>

          <div id="section-csm" className="text-[14px] font-bold text-gray-500 mb-1.5 mt-6">CSM</div>

          <div className="grid grid-cols-4 gap-4">
            <SkillCard 
              title="CSM performance review"
              desc="Identifies high-impact interactions between CSM and customers..."
              icon={<svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 stroke-current stroke-2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>}
              iconBg="bg-orange-50 text-orange-500"
            />
          </div>

          <div id="section-portfolio" className="text-[14px] font-bold text-gray-500 mb-1.5 mt-6">Portfolio</div>

          <div className="grid grid-cols-4 gap-4">
            <SkillCard 
              title="Onboarding Accounts Status..."
              desc="Reviews the top accounts by MRR that are currently onboarding"
              icon={<svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 stroke-current stroke-2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path></svg>}
              iconBg="bg-[#f0f4ff] text-[#3b82f6]"
            />
          </div>

          <div id="section-product" className="text-[14px] font-bold text-gray-500 mb-1.5 mt-6">Product</div>

          <div className="grid grid-cols-4 gap-4">
            <SkillCard 
              title="Deep dive on product..."
              desc="Retrieve and analyze all feature requests and product feedback..."
              icon={<svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 stroke-current stroke-2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>}
              iconBg="bg-[#ecfdf5] text-[#10b981]"
            />
            <SkillCard 
              title="Features most requested by..."
              desc="Analyze and surface the most frequently requested product..."
              icon={<svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 stroke-current stroke-2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>}
              iconBg="bg-[#ecfdf5] text-[#10b981]"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function SkillCard({ title, desc, icon, iconBg }: { title?: string, desc?: string, icon?: React.ReactNode, iconBg?: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4.5 pt-4 pb-5 shadow-[0px_4px_16px_rgba(0,0,0,0.02)] hover:shadow-[0px_8px_24px_rgba(0,0,0,0.06)] hover:border-indigo-100 transition-all cursor-pointer flex flex-col gap-3 min-h-[145px]">
      <div className={`w-[26px] h-[26px] rounded-[5px] flex items-center justify-center mb-auto shadow-sm ${iconBg || "bg-[#f4effc] text-[#8b5cf6]"}`}>
        {icon || <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 stroke-current stroke-2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>}
      </div>
      {(title || desc) && (
        <div>
          {title && <h4 className="font-bold text-[13px] text-gray-800 leading-tight mb-1.5">{title}</h4>}
          {desc && <p className="text-[12px] text-gray-400 leading-[1.4] line-clamp-3 overflow-hidden font-medium">{desc}</p>}
        </div>
      )}
    </div>
  )
}
