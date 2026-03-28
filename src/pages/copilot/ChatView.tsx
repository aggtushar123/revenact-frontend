import { ArrowUp, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';

export function ChatView({ onSendPrompt, isEmpty }: { onSendPrompt: (p: string) => void, isEmpty?: boolean }) {
  return (
    <div className="flex-1 h-full flex flex-col bg-white relative">
      <div className="flex-1 overflow-y-auto px-6 py-10 w-full mx-auto pb-[180px] custom-scrollbar selection:bg-indigo-100">

        {/* Mock Conversation Output wrapper */}
        {!isEmpty && (
          <div className="flex flex-col gap-8 w-full max-w-[840px] mx-auto pl-6">

            <div className="flex flex-col gap-5 border-l-2 border-[#e1daff] pl-[26px] py-1">

            <div className="flex flex-col">
              <h3 className="text-[17px] font-bold text-gray-800 tracking-tight leading-tight">Medium-Term <span className="text-gray-600">(90 Days)</span></h3>
              <ol className="text-[14px] text-gray-600 space-y-3 font-medium flex flex-col ml-[18px] mt-4 list-decimal marker:font-bold marker:text-gray-400">
                <li className="pl-1.5"><strong className="text-gray-700">Industry Templates:</strong> Develop R&D, operations, and procurement workflows</li>
                <li className="pl-1.5"><strong className="text-gray-700">Advanced Analytics:</strong> Department-level reporting and benchmarking</li>
                <li className="pl-1.5"><strong className="text-gray-700">Integration SLAs:</strong> Guarantee 99.9% uptime for core integrations</li>
              </ol>
            </div>

            <div className="flex flex-col mt-4">
              <h3 className="text-[17px] font-bold text-gray-800 tracking-tight leading-tight">Long-Term <span className="text-gray-600">(180+ Days)</span></h3>
              <ol className="text-[14px] text-gray-600 space-y-3 font-medium flex flex-col ml-[18px] mt-4 list-decimal marker:font-bold marker:text-gray-400">
                <li className="pl-1.5"><strong className="text-gray-700">Configurable Workflows:</strong> Allow customers to design custom processes</li>
                <li className="pl-1.5"><strong className="text-gray-700">Mobile-First Platform:</strong> Complete mobile experience redesign</li>
                <li className="pl-1.5"><strong className="text-gray-700">AI-Powered Insights:</strong> Predictive analytics and recommendations</li>
              </ol>
            </div>

            <div className="mt-3 text-[14.5px] text-gray-600 font-medium leading-[1.65]">
              <strong className="text-gray-800">Bottom Line:</strong> Product conversations reveal a <strong className="text-gray-800">tale of two experiences</strong>. Healthy accounts want advanced features and expansion, while struggling accounts need <strong className="text-gray-800">fundamental workflow and integration fixes</strong>. The product roadmap must address both <strong className="text-gray-800">crisis resolution</strong> and <strong className="text-gray-800">growth acceleration</strong> simultaneously.
            </div>

            {/* Feedback Actions */}
            <div className="flex items-center gap-[18px] mt-5 text-gray-400">
              <button className="hover:text-gray-700 hover:bg-gray-100 rounded-md p-1.5 transition-colors -ml-1.5 tooltip relative"><Copy className="w-4 h-4 stroke-[2px]" /></button>
              <button className="hover:text-gray-700 hover:bg-gray-100 rounded-md p-1.5 transition-colors tooltip relative"><ThumbsUp className="w-4 h-4 stroke-[2px]" /></button>
              <button className="hover:text-gray-700 hover:bg-gray-100 rounded-md p-1.5 transition-colors tooltip relative"><ThumbsDown className="w-4 h-4 stroke-[2px]" /></button>
            </div>
          </div>

        </div>
        )}
      </div>

      {/* Absolute Bottom Input */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-12 pb-10 px-6">
        <div className="w-full max-w-[840px] mx-auto relative pl-4">
          <div className="absolute -inset-[3px] rounded-xl bg-gradient-to-r from-indigo-200/60 to-purple-200/60 blur-sm pointer-events-none"></div>
          <div className="relative bg-white border-2 border-[#d3cef6] rounded-xl flex items-end min-h-[104px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] focus-within:ring-4 focus-within:ring-indigo-500/10 transition-shadow">
            <textarea
              className="w-full h-full min-h-[96px] bg-transparent resize-none outline-none border-none p-4.5 text-[15px] placeholder:text-gray-300 placeholder:italic text-gray-700 font-medium leading-relaxed"
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
      </div>
    </div>
  )
}
