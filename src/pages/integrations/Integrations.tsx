import { useState } from 'react';
import { Search, CheckCircle2, SlidersHorizontal, GitBranch, PenTool, Users, MessageCircle, ListTodo, Box, AlignEndHorizontal, Mail, CreditCard, Video, Activity, ShoppingBag, Snowflake, Send } from 'lucide-react';

const GMAIL_SVG = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
    <path d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6ZM20 6L12 11L4 6H20ZM20 18H4V8L12 13L20 8V18Z" fill="#EA4335"/>
  </svg>
);

const SALESFORCE_SVG = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
    <path d="M16.963 8.16C16.897 8.157 16.837 8.163 16.772 8.17C16.591 6.305 14.896 4.869 12.872 4.869C11.332 4.869 9.972 5.753 9.324 7.026C9.079 6.892 8.802 6.819 8.51 6.819C7.456 6.819 6.578 7.568 6.354 8.536C4.846 8.784 3.737 10.046 3.737 11.597C3.737 13.268 5.167 14.629 6.914 14.629H16.845C18.667 14.629 20.145 13.197 20.145 11.439C20.145 9.721 18.73 8.32 16.963 8.16Z" fill="#00A1E0"/>
  </svg>
);

const SLACK_SVG = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.528 2.528 0 0 1 2.521-2.523 2.528 2.528 0 0 1 2.521 2.523v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#E01E5A"/>
    <path d="M8.835 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.835 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.835zM8.835 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.313z" fill="#36C5F0"/>
    <path d="M18.958 8.835a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.835a2.528 2.528 0 0 1-2.52 2.521h-2.522V8.835zM17.687 8.835a2.528 2.528 0 0 1-2.521 2.521 2.528 2.528 0 0 1-2.522-2.521V2.522A2.528 2.528 0 0 1 15.166 0a2.528 2.528 0 0 1 2.521 2.522v6.313z" fill="#2EB67D"/>
    <path d="M15.165 18.958a2.528 2.528 0 0 1 2.522 2.522A2.528 2.528 0 0 1 15.165 24a2.528 2.528 0 0 1-2.522-2.52hv-2.522h2.522zM15.165 17.687a2.528 2.528 0 0 1-2.522-2.522 2.528 2.528 0 0 1 2.522-2.522h6.313A2.528 2.528 0 0 1 24 15.166a2.528 2.528 0 0 1-2.52 2.521h-6.315z" fill="#ECB22E"/>
  </svg>
);

const JIRA_SVG = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
    <path d="M21.75 3C22.9926 3 24 4.00736 24 5.25V18.75C24 19.9926 22.9926 21 21.75 21H2.25C1.00736 21 0 19.9926 0 18.75V5.25C0 4.00736 1.00736 3 2.25 3H21.75Z" fill="#0052CC"/>
    <path d="M11 7H13.5C14.8807 7 16 8.11929 16 9.5V17H13.5C12.1193 17 11 15.8807 11 14.5V7Z" fill="white"/>
    <path d="M6 10.5H8.5C9.88071 10.5 11 11.6193 11 13V17H8.5C7.11929 17 6 15.8807 6 14.5V10.5Z" fill="white"/>
  </svg>
);

const ZENDESK_SVG = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
    <path d="M12.91 16.59L17.5 21H12.91V16.59ZM21 16.59H16.41L11.82 21H21V16.59ZM12.91 3V7.41L17.5 3H12.91ZM21 3H16.41L11.82 7.41H21V3ZM3 16.59V21H7.59L3 16.59ZM11.09 16.59H6.5L11.09 21V16.59ZM3 3V7.41V3ZM11.09 3V7.41H6.5L11.09 3ZM3 7.41H7.59L3 12V7.41ZM11.09 7.41V12H6.5L11.09 7.41Z" fill="#03363D"/>
  </svg>
);

const HUBSPOT_SVG = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
    <path d="M24 10.457v3.085c0 .416-.339.755-.755.755h-2.186a9.074 9.074 0 0 1-1.391 3.327l1.527 1.527a.754.754 0 0 1 0 1.066l-2.181 2.181a.754.754 0 0 1-1.066 0l-1.527-1.527a9.074 9.074 0 0 1-3.327 1.391v2.186c0 .416-.339.755-.755.755h-3.085c-.416 0-.755-.339-.755-.755v-2.186a9.071 9.071 0 0 1-3.328-1.392l-1.526 1.528a.755.755 0 0 1-1.066 0L.498 19.617a.754.754 0 0 1 0-1.066l1.527-1.527A9.072 9.072 0 0 1 .634 13.7H-1.55a.755.755 0 0 1-.755-.755v-3.085c0-.416.339-.755.755-.755h2.186A9.074 9.074 0 0 1 2.027 5.78L.5 4.253a.754.754 0 0 1 0-1.066L2.681 1.006a.754.754 0 0 1 1.066 0l1.527 1.527A9.074 9.074 0 0 1 8.598 1.144V-1.04c0-.416.339-.755.755-.755h3.085c.416 0 .755.339.755.755v2.186a9.072 9.072 0 0 1 3.327 1.391l1.527-1.527a.754.754 0 0 1 1.066 0l2.181 2.181a.754.754 0 0 1 0 1.066L19.767 5.78a9.074 9.074 0 0 1 1.391 3.328h2.186c.417 0 .755.338.755.755zm-11.954 6.74c2.817 0 5.1-2.283 5.1-5.1 0-2.817-2.283-5.1-5.1-5.1-2.817 0-5.1 2.283-5.1 5.1 0 2.817 2.283 5.1 5.1 5.1z" fill="#FF7A59"/>
  </svg>
);


const INTEGRATIONS = [
  { id: 'salesforce', name: 'Salesforce', category: 'CRM', desc: 'Sync your accounts, contacts and opportunities seamlessly.', connected: true, icon: SALESFORCE_SVG },
  { id: 'jira', name: 'Jira Software', category: 'Productivity', desc: 'Link issues and epics to customer feedback and accounts.', connected: false, icon: JIRA_SVG },
  { id: 'gmail', name: 'Gmail', category: 'Communication', desc: 'Log emails as activities and create contacts from threads.', connected: true, icon: GMAIL_SVG },
  { id: 'slack', name: 'Slack', category: 'Communication', desc: 'Receive alerts, health changes, and actionable notifications.', connected: false, icon: SLACK_SVG },
  { id: 'hubspot', name: 'HubSpot', category: 'CRM', desc: 'Two-way sync for marketing leads and sales pipeline.', connected: false, icon: HUBSPOT_SVG },
  { id: 'zendesk', name: 'Zendesk', category: 'Support', desc: 'View support tickets alongside customer health scores.', connected: false, icon: ZENDESK_SVG },
  { id: 'github', name: 'GitHub', category: 'Productivity', desc: 'Link commits, pull requests, and issues to project work.', connected: false, icon: <GitBranch className="w-10 h-10 text-gray-900" /> },
  { id: 'figma', name: 'Figma', category: 'Productivity', desc: 'Embed live designs directly into your documentation.', connected: false, icon: <PenTool className="w-10 h-10 text-pink-500" /> },
  { id: 'teams', name: 'Microsoft Teams', category: 'Communication', desc: 'Receive rich notifications and actionable alerts in channels.', connected: false, icon: <Users className="w-10 h-10 text-indigo-600" /> },
  { id: 'intercom', name: 'Intercom', category: 'Support', desc: 'Sync customer chats and support interactions live.', connected: true, icon: <MessageCircle className="w-10 h-10 text-blue-500" /> },
  { id: 'asana', name: 'Asana', category: 'Productivity', desc: 'Create and track tasks directly from customer feedback.', connected: false, icon: <ListTodo className="w-10 h-10 text-rose-500" /> },
  { id: 'notion', name: 'Notion', category: 'Productivity', desc: 'Sync databases and embed Revenact records into pages.', connected: false, icon: <Box className="w-10 h-10 text-gray-800" /> },
  { id: 'pipedrive', name: 'Pipedrive', category: 'CRM', desc: 'Two-way sync for sales pipelines and deal stages.', connected: false, icon: <AlignEndHorizontal className="w-10 h-10 text-green-500" /> },
  { id: 'mailchimp', name: 'Mailchimp', category: 'Communication', desc: 'Sync messaging lists and view campaign performance.', connected: false, icon: <Mail className="w-10 h-10 text-yellow-500 drop-shadow-sm" /> },
  { id: 'stripe', name: 'Stripe', category: 'CRM', desc: 'View billing history, subscriptions, and MRR metrics.', connected: true, icon: <CreditCard className="w-10 h-10 text-indigo-500" /> },
  { id: 'zoom', name: 'Zoom', category: 'Communication', desc: 'Automatically log meetings and recordings to contacts.', connected: false, icon: <Video className="w-10 h-10 text-blue-500" /> },
  { id: 'datadog', name: 'Datadog', category: 'Support', desc: 'Monitor engineering alerts affecting key customers.', connected: false, icon: <Activity className="w-10 h-10 text-purple-600" /> },
  { id: 'shopify', name: 'Shopify', category: 'CRM', desc: 'Sync storefront orders and customer purchase history.', connected: false, icon: <ShoppingBag className="w-10 h-10 text-emerald-500" /> },
  { id: 'snowflake', name: 'Snowflake', category: 'Productivity', desc: 'Query data warehouse natively for custom dashboards.', connected: false, icon: <Snowflake className="w-10 h-10 text-sky-400" /> },
  { id: 'sendgrid', name: 'SendGrid', category: 'Communication', desc: 'Manage transactional emails and template sync.', connected: false, icon: <Send className="w-10 h-10 text-blue-400" /> },
];

const CATEGORIES = ['All', 'CRM', 'Communication', 'Productivity', 'Support'];

export function Integrations() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  const filteredIntegrations = INTEGRATIONS.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(search.toLowerCase()) || 
                          integration.desc.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeTab === 'All' || integration.category === activeTab;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="flex flex-col h-full w-full bg-[#FAFAFA] text-[#1f2937] overflow-y-auto">
      {/* Controls Area */}
      <div className="px-8 pt-10 pb-6 w-full max-w-7xl mx-auto shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar fade-edges">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all whitespace-nowrap border ${
                activeTab === cat 
                  ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-sm' 
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-[280px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all sm:text-sm font-medium shadow-sm"
            placeholder="Search integrations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Grid Area */}
      <div className="px-8 pb-12 w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIntegrations.map((integration) => (
            <div 
              key={integration.id} 
              className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer overflow-hidden relative"
            >
              {/* Top Row: Icon + Status */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-gray-50/50 rounded-2xl flex items-center justify-center shadow-inner border border-gray-100/60 p-2 group-hover:scale-105 transition-transform">
                  {integration.icon}
                </div>
                
                {integration.connected ? (
                  <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-2.5 py-1 rounded-full border border-green-200/60 shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold uppercase tracking-wider">Connected</span>
                  </div>
                ) : (
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                     Not Setup
                  </div>
                )}
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-gray-900 tracking-tight mb-1 group-hover:text-rose-600 transition-colors">
                {integration.name}
              </h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6 flex-1">
                {integration.desc}
              </p>

              {/* Action Button */}
              <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
                 <span className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">{integration.category}</span>
                 <button className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors shadow-sm ${
                   integration.connected 
                     ? 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50' 
                     : 'bg-gray-900 text-white hover:bg-rose-500 hover:shadow-rose-500/25'
                 }`}>
                   {integration.connected ? 'Configure' : 'Connect'}
                 </button>
              </div>
            </div>
          ))}
          
          {filteredIntegrations.length === 0 && (
             <div className="col-span-full py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-200 rounded-3xl bg-white/50">
               <SlidersHorizontal className="w-12 h-12 text-gray-300 mb-3" />
               <h3 className="text-lg font-bold text-gray-900">No integrations found</h3>
               <p className="text-gray-500 font-medium">Try adjusting your search or filters.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
