import { ArrowUp, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';

const USER_QUESTION = "But why are these accounts are at risk and what is the impact? It would be helpful if you're able to share some insights from calls, emails & tickets - highlighting customer quotes and what channel they came from.";

export function ChatView({ onSendPrompt, isEmpty }: { onSendPrompt: (p: string) => void, isEmpty?: boolean }) {
  return (
    <div className="flex-1 h-full flex flex-col bg-white relative">
      <div className="flex-1 overflow-y-auto px-6 py-8 w-full mx-auto pb-[180px] custom-scrollbar selection:bg-indigo-100">

        {!isEmpty && (
          <div className="flex flex-col gap-10 w-full max-w-[860px] mx-auto">

            {/* User Question Bubble */}
            <div className="flex justify-end">
              <div className="max-w-[65%] bg-[#f4effc] border border-[#e1d5f8] rounded-2xl rounded-tr-sm px-4 py-3 text-[13.5px] text-gray-700 font-medium leading-[1.65] shadow-sm">
                {USER_QUESTION}
              </div>
            </div>

            {/* AI Response */}
            <div className="flex flex-col gap-1 border-l-2 border-[#e1daff] pl-7 py-1">

              <h2 className="text-[22px] font-bold text-gray-900 tracking-tight leading-tight mb-1">
                Deep Dive: Why These Accounts Are At Risk
              </h2>
              <p className="text-[13.5px] text-gray-500 font-medium mb-8 leading-relaxed">
                {"Here's a detailed breakdown of the root causes, customer sentiment, and business impact for each at-risk account, with direct quotes from customer interactions."}
              </p>

              {/* Account 1 */}
              <AccountBlock
                emoji="🔴"
                name="Culinary Innovation Lab (HCIL)"
                arr="$60.4K ARR"
                renewal="Apr 23, 2026"
                tag="The Crisis"
                tagSub="Call – Jan 21, 2026"
                adoptionLabel="Severe Adoption Decline:"
                adoptionPoints={[
                  { label: "Only", value: "60 of 220 licenses active", suffix: " (27% utilization)" },
                  { label: "Core R&D teams have", value: "completely stopped using the platform", suffix: "" },
                  { label: "Weekly usage is", value: "nearly nonexistent", suffix: "" },
                  { label: "NPS:", value: "-100", suffix: " (extremely negative)" },
                ]}
                rootCauseTitle="Root Cause:"
                rootCauseQuote={`"The current platform does not support the experimentation workflows required by the R&D teams"`}
                rootCauseBody={"The platform fundamentally misaligns with how their R&D teams work. This isn't a training issue — it's a product-market fit problem for their specific use case."}
                sentimentQuotes={[
                  "The contract renewal is directly tied to immediate recovery of the platform adoption. Leadership expects fast, visible changes, and without successful turnaround, there is no path forward for continuing the relationship. The current state is considered unacceptable by all stakeholders."
                ]}
                impactLabel="Business Impact:"
                impactBody="Customer demanded emergency meeting and expects same-day action plan. "
                impactHighlight="Renewal is explicitly at risk"
                impactBodySuffix=" without immediate, visible recovery."
              />

              {/* Account 2 */}
              <AccountBlock
                emoji="🔴"
                name="Digital Operations"
                arr="$30.9K ARR"
                renewal="Apr 7, 2026"
                tag="The Escalation"
                tagSub="Call – Jan 21, 2026"
                adoptionLabel="Severe Adoption Decline:"
                adoptionPoints={[
                  { label: "Only", value: "170 of 410 licenses active", suffix: " (41% utilization)" },
                  { label: "Weekly logins", value: "below 20%", suffix: "" },
                  { label: "Teams", value: "reverting to manual processes", suffix: "" },
                ]}
                rootCauseTitle="Root Causes:"
                rootCauseListItems={[
                  { n: 1, label: "Workflow Friction:", quote: `"Users perceive the platform as adding overhead rather than saving time"` },
                  { n: 2, label: "Support Issues:", quote: `"Support tickets taking longer than expected to resolve, contributing to user frustration and declining trust"` },
                  { n: 3, label: "Onboarding Gaps:", quote: `"Teams are unclear on how the platform fits into their daily workflow"` },
                ]}
                sentimentQuotes={[
                  `"The system doesn't feel reliable" (trust erosion)`,
                  `"Leadership is questioning the platform's value"`,
                  `"Without rapid progress, this could turn into a larger escalation" (explicit warning)`,
                ]}
                impactLabel="Business Impact:"
                impactBody="Customer explicitly warned of organizational escalation. Leadership is questioning value. "
                impactHighlight="High churn probability"
                impactBodySuffix=" if no immediate improvement."
              />

              {/* Account 3 */}
              <AccountBlock
                emoji="🟡"
                name="EMEA Operations"
                arr="$38.7K ARR"
                renewal="Nov 27, 2026"
                tag="The Abandonment"
                tagSub="Call – Jan 21, 2026"
                adoptionLabel="Declining Engagement:"
                adoptionPoints={[
                  { label: "Only", value: "44 of 180 licenses active", suffix: " (24% utilization)" },
                  { label: "Platform is being", value: "used as a reporting layer only", suffix: " — no active workflows" },
                  { label: "Key stakeholders have", value: "disengaged from onboarding calls", suffix: "" },
                  { label: "NPS:", value: "12", suffix: " (declining from 38)" },
                ]}
                rootCauseTitle="Root Cause:"
                rootCauseQuote={`"We onboarded successfully but the team never really adopted it as their daily tool. It feels like extra work on top of what we already do."`}
                rootCauseBody={"The account completed onboarding but never crossed the activation threshold. Without a clear internal champion, adoption stalled and usage reverted to email and spreadsheets."}
                sentimentQuotes={[
                  `"If we're not seeing meaningful value by mid-year, we'll have a hard conversation about renewal."`,
                  `"The ROI isn't obvious to my team yet — they don't understand why we switched."`,
                ]}
                impactLabel="Business Impact:"
                impactBody="At risk of silent churn — no dramatic escalation but renewal unlikely without clear value demonstration. "
                impactHighlight="Internal champion needed urgently."
                impactBodySuffix=""
              />

              {/* Account 4 */}
              <AccountBlock
                emoji="🟡"
                name="Brightline Retail Group"
                arr="$22.1K ARR"
                renewal="Jun 14, 2026"
                tag="The Drift"
                tagSub="Email thread – Jan 15, 2026"
                adoptionLabel="Stalled Adoption:"
                adoptionPoints={[
                  { label: "Only", value: "28 of 80 licenses active", suffix: " (35% utilization)" },
                  { label: "Last meaningful activity:", value: "31 days ago", suffix: "" },
                  { label: "No tickets raised in", value: "6 weeks", suffix: " — team has gone quiet" },
                ]}
                rootCauseTitle="Root Cause:"
                rootCauseQuote={`"We had a reorg and our platform lead left the company. No one has taken over. The tool works — we just don't have bandwidth."`}
                rootCauseBody={"Organizational change removed the internal champion. Without a designated owner, platform usage drifted to near-zero. This is a coverage risk, not a product issue."}
                sentimentQuotes={[
                  `"We're still fans of the product — we just need help getting restarted."`,
                  `"Can you help us identify who internally should own this going forward?"`,
                ]}
                impactLabel="Business Impact:"
                impactBody="Relationship is warm but fragile. Without a re-engagement play, this account risks "
                impactHighlight="lapsing silently at renewal."
                impactBodySuffix=" No urgency yet — but clock is ticking."
              />

              {/* Portfolio Summary */}
              <div className="mt-6 bg-[#fafafa] border border-gray-200 rounded-xl p-5 flex flex-col gap-3">
                <h4 className="text-[14px] font-extrabold text-gray-800 tracking-tight">Portfolio Summary</h4>
                <div className="grid grid-cols-2 gap-3 text-[13px]">
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                    <div className="font-bold text-red-700 text-[13px] mb-0.5">Critical (Immediate Action)</div>
                    <div className="text-red-600 font-medium">Culinary Innovation Lab · Digital Operations</div>
                    <div className="text-red-500 text-[12px] mt-1 font-semibold">$91.3K ARR at risk · Both renew before May</div>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                    <div className="font-bold text-amber-700 text-[13px] mb-0.5">Monitor (30-day window)</div>
                    <div className="text-amber-600 font-medium">EMEA Operations · Brightline Retail</div>
                    <div className="text-amber-500 text-[12px] mt-1 font-semibold">$60.8K ARR in play · Action before mid-year</div>
                  </div>
                </div>
                <p className="text-[12.5px] text-gray-500 font-medium leading-relaxed pt-1">
                  <span className="font-bold text-gray-700">Common thread:</span>
                  {" Adoption failure is the root cause across all four accounts — not product quality. Re-engagement strategies should prioritise internal champion identification, workflow alignment workshops, and fast-win demonstrations of ROI."}
                </p>
              </div>

              {/* Feedback row */}
              <div className="flex items-center gap-[18px] mt-6 text-gray-400">
                <button className="hover:text-gray-700 hover:bg-gray-100 rounded-md p-1.5 transition-colors -ml-1.5"><Copy className="w-4 h-4 stroke-[2px]" /></button>
                <button className="hover:text-gray-700 hover:bg-gray-100 rounded-md p-1.5 transition-colors"><ThumbsUp className="w-4 h-4 stroke-[2px]" /></button>
                <button className="hover:text-gray-700 hover:bg-gray-100 rounded-md p-1.5 transition-colors"><ThumbsDown className="w-4 h-4 stroke-[2px]" /></button>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Floating input */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-12 pb-10 px-6">
        <div className="w-full max-w-[860px] mx-auto relative pl-4">
          <div className="absolute -inset-[3px] rounded-xl bg-gradient-to-r from-indigo-200/60 to-purple-200/60 blur-sm pointer-events-none"></div>
          <div className="relative bg-white border-2 border-[#d3cef6] rounded-xl flex items-end min-h-[72px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] focus-within:ring-4 focus-within:ring-indigo-500/10 transition-shadow">
            <textarea
              className="w-full h-full min-h-[64px] bg-transparent resize-none outline-none border-none p-4 text-[15px] placeholder:text-gray-300 placeholder:italic text-gray-700 font-medium leading-relaxed"
              placeholder="Type '/' to add variables, like {Account} and {Organization}"
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
  );
}

/* ────────────── Sub-components ────────────── */

interface AdoptionPoint {
  label: string;
  value: string;
  suffix: string;
}

interface RootCauseListItem {
  n: number;
  label: string;
  quote: string;
}

interface AccountBlockProps {
  emoji: string;
  name: string;
  arr: string;
  renewal: string;
  tag: string;
  tagSub: string;
  adoptionLabel: string;
  adoptionPoints: AdoptionPoint[];
  rootCauseTitle: string;
  rootCauseQuote?: string;
  rootCauseBody?: string;
  rootCauseListItems?: RootCauseListItem[];
  sentimentQuotes: string[];
  impactLabel: string;
  impactBody: string;
  impactHighlight: string;
  impactBodySuffix: string;
}

function AccountBlock({
  emoji, name, arr, renewal, tag, tagSub,
  adoptionLabel, adoptionPoints,
  rootCauseTitle, rootCauseQuote, rootCauseBody, rootCauseListItems,
  sentimentQuotes,
  impactLabel, impactBody, impactHighlight, impactBodySuffix,
}: AccountBlockProps) {
  return (
    <div className="flex flex-col gap-4 mb-10 pb-10 border-b border-gray-100 last:border-0 last:pb-0 last:mb-0">

      {/* Header */}
      <div>
        <h3 className="text-[17px] font-bold text-gray-900 tracking-tight leading-tight">
          <span className="mr-1.5">{emoji}</span>
          {name}
          <span className="text-gray-400 font-semibold mx-2">—</span>
          <span className="text-gray-500 font-semibold">{arr}</span>
          <span className="text-gray-400 font-semibold mx-2">|</span>
          <span className="text-gray-500 font-semibold text-[15px]">Renews {renewal}</span>
        </h3>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[13px] font-extrabold text-gray-800">{tag}</span>
          <span className="text-[12px] text-gray-400 font-semibold">({tagSub})</span>
        </div>
      </div>

      {/* Adoption */}
      <div>
        <p className="text-[13.5px] font-bold text-gray-800 mb-2">{adoptionLabel}</p>
        <ul className="flex flex-col gap-1.5">
          {adoptionPoints.map((pt, i) => (
            <li key={i} className="flex items-start gap-2 text-[13.5px] text-gray-600 font-medium">
              <span className="text-gray-300 mt-[3px] shrink-0">•</span>
              <span>{pt.label} <strong className="text-gray-800">{pt.value}</strong>{pt.suffix}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Root Cause */}
      <div>
        <p className="text-[13.5px] font-bold text-gray-800 mb-2">{rootCauseTitle}</p>
        {rootCauseQuote && (
          <blockquote className="border-l-4 border-[#c4b8f8] pl-4 py-1 text-[13.5px] text-gray-600 italic font-medium leading-[1.6] mb-3 bg-[#fdfcff] rounded-r-lg">
            {rootCauseQuote}
          </blockquote>
        )}
        {rootCauseBody && (
          <p className="text-[13.5px] text-gray-600 font-medium leading-[1.65]">{rootCauseBody}</p>
        )}
        {rootCauseListItems && (
          <ol className="flex flex-col gap-2">
            {rootCauseListItems.map(item => (
              <li key={item.n} className="text-[13.5px] text-gray-600 font-medium leading-[1.6]">
                <span className="font-bold text-gray-700">{item.n}. {item.label}</span>{" "}{item.quote}
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Customer Sentiment */}
      <div>
        <p className="text-[13.5px] font-bold text-gray-800 mb-2">Customer Sentiment:</p>
        <div className="flex flex-col gap-2">
          {sentimentQuotes.map((q, i) => (
            <blockquote key={i} className="border-l-4 border-[#c4b8f8] pl-4 py-1 text-[13.5px] text-gray-600 italic font-medium leading-[1.6] bg-[#fdfcff] rounded-r-lg">
              {q}
            </blockquote>
          ))}
        </div>
      </div>

      {/* Business Impact */}
      <p className="text-[13.5px] text-gray-600 font-medium leading-[1.65]">
        <span className="font-bold text-gray-800">{impactLabel}</span>
        {" "}{impactBody}
        <strong className="text-gray-800">{impactHighlight}</strong>
        {impactBodySuffix}
      </p>
    </div>
  );
}
