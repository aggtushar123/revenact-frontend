import { useState } from 'react';
import { X, Info, ChevronDown, Filter, Settings, Trash2 } from 'lucide-react';
import type { ScenarioNodeDetail } from './types';

interface EditNodePaneProps {
  node: ScenarioNodeDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function EditNodePane({ node, isOpen, onClose, onSave }: EditNodePaneProps) {
  const [isEmailDropdownOpen, setIsEmailDropdownOpen] = useState(false);
  const [selectedEmailService, setSelectedEmailService] = useState<string>('');

  if (!isOpen || !node) return null;

  const action = node.data?.action || '';

  let title = `Edit ${action} Node`;
  let subtitle = '';
  
  if (action === 'Filter') {
    title = 'Edit Filter Operator Node';
    subtitle = 'Add conditions below to filter out the flow';
  } else if (action === 'Condition') {
    title = 'Edit Condition Operator Node';
    subtitle = 'Split the flow based on the below conditions';
  } else if (action === 'Assign Playbook') {
    title = 'Edit Playbook Action Node';
    subtitle = 'Choose the playbook to apply on the organization:';
  } else if (action === 'Create Pipeline') {
    title = 'Edit Create Pipeline Action Node';
  } else if (action === 'Slack Message') {
    title = 'Edit Send Slack Message Action Node';
  } else if (action === 'Send Email') {
    title = 'Edit Send Email Action Node';
  }

  const renderFilterContent = () => (
    <>
      <p className="text-[14px] text-gray-600 mb-4">{subtitle}</p>
      
      <div className="flex flex-col gap-4 mb-6">
         <div className="flex items-center gap-2 text-[12px] font-medium text-gray-500 mb-1">
            Select Currency and Timezone <Info className="w-3 h-3" />
         </div>
         
         <div className="flex gap-3">
            <div className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg flex items-center justify-between cursor-pointer hover:border-gray-300">
               <span className="text-[13px] text-gray-700 font-medium">USD</span>
               <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <div className="flex-[2] px-3 py-2 bg-white border border-gray-200 rounded-lg flex items-center justify-between cursor-pointer hover:border-gray-300">
               <span className="text-[13px] text-gray-700 font-medium">(UTC+00:00) Europe/London</span>
               <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </div>
         </div>
      </div>

      <div className="flex flex-col gap-3">
         <div className="flex gap-2">
            <div className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg flex items-center justify-between cursor-pointer hover:border-gray-300">
               <span className="text-[13px] text-gray-700">Organization</span>
               <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <div className="flex gap-1.5">
               <button className="w-9 h-9 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100"><Filter className="w-4 h-4" /></button>
               <button className="w-9 h-9 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100"><Settings className="w-4 h-4" /></button>
            </div>
         </div>

         {/* Condition Logic Builder Mockup */}
         <div className="bg-indigo-50/30 border border-indigo-100/50 rounded-xl p-6 flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-200/50" />
            
            {/* Row 1 */}
            <div className="flex items-center gap-3">
               <div className="flex-1 bg-white border border-gray-100 rounded-lg p-3 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2">
                     <span className="text-[13px] text-indigo-600 font-medium">Lifecycle Stage</span>
                     <span className="text-[13px] text-gray-500 italic">includes</span>
                     <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[12px] font-semibold border border-indigo-100 flex items-center gap-1.5">
                        Live (Enterprise)
                        <X className="w-3 h-3 cursor-pointer hover:text-indigo-900" />
                     </span>
                  </div>
                  <X className="w-4 h-4 text-gray-300 cursor-pointer hover:text-gray-500" />
               </div>
            </div>

            {/* Connector */}
            <div className="flex items-center gap-3">
               <div className="w-[100px] px-3 py-1.5 bg-white border border-gray-100 rounded-lg flex items-center justify-between cursor-pointer shadow-sm">
                  <span className="text-[12px] font-bold text-gray-700 uppercase tracking-wide">And</span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
               </div>
               
               <div className="flex-1 bg-white border border-gray-100 rounded-lg p-3 flex items-center justify-between shadow-sm relative group">
                  <div className="flex items-center gap-2">
                     <span className="text-[13px] text-indigo-600 font-medium font-inter">Product Utilization %</span>
                     <span className="text-[13px] text-gray-500 italic">is less than</span>
                     <span className="px-2 py-0.5 bg-white text-gray-700 rounded text-[13px] font-bold border border-gray-100 flex items-center gap-1.5">
                        60
                        <X className="w-3 h-3 cursor-pointer hover:text-gray-900" />
                     </span>
                  </div>
                  <X className="w-4 h-4 text-gray-300 cursor-pointer hover:text-gray-500" />
               </div>

               <button className="p-2 text-gray-400 hover:text-rose-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
               </button>
            </div>

            <div className="flex gap-2 mt-2">
               <button className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm text-indigo-600 hover:bg-gray-50"><Filter className="w-3.5 h-3.5" /></button>
               <button className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm text-indigo-600 hover:bg-gray-50 font-bold text-xs">{"{ }"}</button>
            </div>
         </div>
      </div>
    </>
  );

  const renderConditionContent = () => (
    <>
      <p className="text-[14px] text-gray-600 mb-6">{subtitle}</p>
      
      <div className="flex flex-col gap-6">
        <div>
          <h3 className="text-[14px] font-bold text-gray-800 mb-3">"Yes" Flow:</h3>
          <p className="text-[13.5px] font-semibold text-gray-700 mb-4">Organizations that match the following condition:</p>

          <div className="flex flex-col gap-4 mb-4">
            <div className="flex items-center gap-2 text-[12px] font-medium text-gray-500 mb-1">
               Select Currency and Timezone <Info className="w-3 h-3" />
            </div>
            <div className="flex gap-3">
               <div className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg flex items-center justify-between cursor-pointer hover:border-gray-300">
                  <span className="text-[13px] text-gray-700 font-medium">USD</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
               </div>
               <div className="flex-[2] px-3 py-2 bg-white border border-gray-200 rounded-lg flex items-center justify-between cursor-pointer hover:border-gray-300">
                  <span className="text-[13px] text-gray-700 font-medium">(UTC+00:00) Europe/London</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
               </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
               <div className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg flex items-center justify-between cursor-pointer hover:border-gray-300">
                  <span className="text-[13px] text-gray-700">Organization</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
               </div>
               <div className="flex gap-1.5">
                  <button className="w-9 h-9 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100"><Filter className="w-4 h-4" /></button>
                  <button className="w-9 h-9 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100"><Settings className="w-4 h-4" /></button>
               </div>
            </div>

            <div className="bg-indigo-50/30 border border-indigo-100/50 rounded-xl p-6 flex flex-col gap-4 relative overflow-hidden">
               <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-200/50" />
               <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white border border-gray-100 rounded-lg p-3 flex items-center justify-between shadow-sm">
                     <div className="flex items-center gap-2">
                        <span className="text-[13px] text-indigo-600 font-medium">Account Tier Segment</span>
                        <span className="text-[13px] text-gray-500 italic">includes</span>
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[12px] font-semibold border border-indigo-100 flex items-center gap-1.5">
                           Enterprise or Strategic / Top Tier
                           <X className="w-3 h-3 cursor-pointer hover:text-indigo-900" />
                        </span>
                     </div>
                     <X className="w-4 h-4 text-gray-300 cursor-pointer hover:text-gray-500" />
                  </div>
                  <button className="p-2 text-gray-400 hover:text-rose-500 transition-colors">
                     <Trash2 className="w-4 h-4" />
                  </button>
               </div>
               <div className="flex gap-2 mt-2">
                  <button className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm text-indigo-600 hover:bg-gray-50"><Filter className="w-3.5 h-3.5" /></button>
                  <button className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm text-indigo-600 hover:bg-gray-50 font-bold text-xs">{"{ }"}</button>
               </div>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <h3 className="text-[14px] font-bold text-gray-800 mb-3">"No" Flow:</h3>
          <p className="text-[13.5px] font-medium text-gray-700">All remaining organizations.</p>
        </div>

        <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-lg p-4 flex gap-3 text-[#0369a1] text-[13px] leading-relaxed mt-2">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <p>
            <strong>Note:</strong> You will need to create two branches. The first follows the "Yes" path, where all conditions above are met. The second follows the "No" path.
          </p>
        </div>
      </div>
    </>
  );

  const renderAssignPlaybookContent = () => (
    <>
      <p className="text-[14px] text-gray-800 font-medium mb-3">{subtitle}</p>
      
      <div className="flex flex-col gap-1.5 mb-6">
        <label className="text-[12.5px] font-bold text-gray-600 flex items-center">
          Select playbook <span className="text-red-400 ml-1">*</span>
        </label>
        <div className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-lg flex items-center justify-between cursor-pointer hover:border-gray-300 transition-colors">
          <span className="text-[13px] text-gray-400 font-medium">Select a Playbook Template</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-4 text-[#4f46e5] text-[13px] leading-[1.6]">
        <strong>Note:</strong> The system will not apply duplicate playbook instances on an entity. If the playbook is currently active on an entity, the entity will proceed to the next node in the flow.
      </div>
    </>
  );

  const renderCreatePipelineContent = () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-bold text-gray-600 flex items-center">
          Pipeline type <span className="text-red-400 ml-1">*</span>
        </label>
        <div className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg flex items-center justify-between cursor-pointer hover:border-gray-300">
          <span className="text-[13px] text-gray-700 font-medium">Opportunity</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-bold text-gray-600 flex items-center">
          Title <span className="text-red-400 ml-1">*</span>
        </label>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Give your pipeline a title" 
            className="w-full pl-3 pr-24 py-2 text-[13px] border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" 
          />
          <div className="absolute right-2 top-1.5 flex items-center gap-1 cursor-pointer text-gray-500 hover:text-gray-700 text-[12px] font-medium px-2 py-0.5 bg-gray-50 rounded border border-gray-200">
            Add attribute <ChevronDown className="w-3 h-3" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 w-1/2">
        <label className="text-[12px] font-bold text-gray-600 flex items-center">
          Status <span className="text-red-400 ml-1">*</span>
        </label>
        <div className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg flex items-center justify-between cursor-pointer hover:border-gray-300">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-[13px] text-amber-600 font-bold">Open</span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </div>
  );

  const renderSlackMessageContent = () => (
    <div className="flex flex-col h-full -mx-6 -mt-6">
      <div className="flex items-center gap-8 border-b border-gray-200 px-6 pt-2 h-[42px] shrink-0 bg-white">
        <button className="text-[13px] font-bold text-indigo-600 border-b-[2.5px] border-indigo-600 h-full">
          Node configuration
        </button>
        <button className="text-[13px] font-bold text-gray-500 hover:text-gray-700 border-b-[2.5px] border-transparent transition-colors h-full">
          Execution controls
        </button>
      </div>

      <div className="p-6 flex flex-col gap-6 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3">
          <label className="text-[12px] font-bold text-gray-600 flex items-center">
            Recipient Type <span className="text-red-400 ml-1">*</span>
          </label>
          <div className="flex flex-col gap-2.5">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="radio" name="recipient" defaultChecked className="w-[15px] h-[15px] text-indigo-600 focus:ring-indigo-500 border-gray-300" />
              <span className="text-[13px] font-bold text-gray-700">Static Channel</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="radio" name="recipient" className="w-[15px] h-[15px] text-indigo-600 focus:ring-indigo-500 border-gray-300" />
              <span className="text-[13px] font-bold text-gray-700">User</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="radio" name="recipient" className="w-[15px] h-[15px] text-indigo-600 focus:ring-indigo-500 border-gray-300" />
              <span className="text-[13px] font-bold text-gray-700">Dynamic Channel</span>
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-bold text-gray-600 flex items-center">
            Channel <span className="text-red-400 ml-1">*</span>
          </label>
          <div className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg flex items-center justify-between cursor-pointer hover:border-gray-300">
            <span className="text-[13px] text-gray-400 font-medium">Select Channel</span>
            <ChevronDown className="w-4 h-4 text-gray-300" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-bold text-gray-600 flex items-center">
            Message <span className="text-red-400 ml-1">*</span>
          </label>
          <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 bg-white">
            <textarea 
              rows={5}
              placeholder="Enter message" 
              className="w-full p-3 text-[13px] resize-none focus:outline-none placeholder-gray-400 text-gray-700"
            />
            <div className="border-t border-gray-100 bg-gray-50/50 p-2 flex items-center justify-between">
              <div className="flex items-center gap-1 text-gray-500">
                <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-200 rounded"><span className="text-lg leading-none font-serif rotate-180 inline-block align-middle transform -scale-y-100">↺</span></button>
                <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-200 rounded"><span className="text-lg leading-none font-serif">↻</span></button>
                <div className="w-px h-4 bg-gray-300 mx-1" />
                <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-200 rounded font-bold font-serif">B</button>
                <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-200 rounded italic font-serif">I</button>
                <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-200 rounded flex gap-0.5">
                  <span className="block w-3 h-0.5 bg-current mt-1 shadow-[0_3px_0_currentColor,0_6px_0_currentColor]"></span>
                  <ChevronDown className="w-2.5 h-2.5 ml-0.5 mt-0.5" />
                </button>
                <div className="w-px h-4 bg-gray-300 mx-1" />
                <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-200 rounded font-mono text-[11px] font-bold">99</button>
                <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-200 rounded font-serif text-[15px]">Aa</button>
                <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-200 rounded text-[15px]">☺</button>
                <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-200 rounded font-serif line-through decoration-gray-500">S</button>
              </div>
            </div>
          </div>
          <button className="mt-2 self-start flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors text-[12px] font-bold">
            <span className="text-[14px] leading-none mb-0.5">+</span> {'{{attribute}}'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderSendEmailContent = () => (
    <div className="flex flex-col h-full -mx-6 -mt-6">
      <div className="flex items-center gap-8 border-b border-gray-200 px-6 pt-2 h-[42px] shrink-0 bg-white">
        <button className="text-[13px] font-bold text-indigo-600 border-b-[2.5px] border-indigo-600 h-full">
          Node configuration
        </button>
        <button className="text-[13px] font-bold text-gray-500 hover:text-gray-700 border-b-[2.5px] border-transparent transition-colors h-full">
          Execution controls
        </button>
      </div>

      <div className="p-6 flex flex-col gap-6 flex-1 overflow-y-auto bg-gray-50/30" onClick={() => isEmailDropdownOpen && setIsEmailDropdownOpen(false)}>
        <div onClick={(e) => e.stopPropagation()}>
          <p className="text-[13.5px] text-gray-700 mb-4">Select the service you want to use to send the email</p>
          
          <div className="flex flex-col gap-1.5 relative group">
            <label className="text-[12px] font-bold text-gray-600 flex items-center">
              Email service type <span className="text-red-400 ml-1">*</span>
            </label>
            <div 
              onClick={() => setIsEmailDropdownOpen(!isEmailDropdownOpen)}
              className={`flex-1 px-3 py-2 bg-white rounded-lg flex items-center justify-between cursor-pointer transition-colors z-10 ${
                isEmailDropdownOpen ? 'border border-indigo-400 ring-1 ring-indigo-400/20' : 'border border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className={`text-[13px] font-medium ${selectedEmailService ? 'text-gray-900' : 'text-gray-400'}`}>
                {selectedEmailService || 'Select service type'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isEmailDropdownOpen ? 'text-indigo-400 rotate-180' : 'text-gray-400'}`} />
            </div>

            {/* Dropdown list */}
            {isEmailDropdownOpen && (
              <div className="absolute top-[60px] left-0 right-0 bg-white border border-gray-100 rounded-lg shadow-xl py-1.5 z-50 flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
                <button 
                  onClick={() => {
                    setSelectedEmailService('Via integrated email client');
                    setIsEmailDropdownOpen(false);
                  }}
                  className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 bg-white transition-colors w-full text-left"
                >
                  <span className="text-[13px] font-medium text-gray-800 flex items-center gap-2">
                    Via integrated email client <Info className="w-3.5 h-3.5 text-black hover:text-gray-900 fill-black/80" />
                  </span>
                </button>
                <button 
                  onClick={() => {
                    setSelectedEmailService('Bulk email service');
                    setIsEmailDropdownOpen(false);
                  }}
                  className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 bg-white transition-colors w-full text-left"
                >
                  <span className="text-[13px] font-medium text-gray-800 flex items-center gap-2">
                    Bulk email service <Info className="w-3.5 h-3.5 text-black hover:text-gray-900 fill-black/80" />
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-y-0 right-0 w-[550px] bg-white shadow-2xl z-[100] flex flex-col border-l border-gray-200 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
        <h2 className="text-[16px] font-bold text-indigo-600">{title}</h2>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col">
        {action === 'Filter' && renderFilterContent()}
        {action === 'Condition' && renderConditionContent()}
        {action === 'Assign Playbook' && renderAssignPlaybookContent()}
        {action === 'Create Pipeline' && renderCreatePipelineContent()}
        {action === 'Slack Message' && renderSlackMessageContent()}
        {action === 'Send Email' && renderSendEmailContent()}
        
        {/* Fallback for unhandled nodes */}
        {!['Filter', 'Condition', 'Assign Playbook', 'Create Pipeline', 'Slack Message', 'Send Email'].includes(action) && (
           <div className="flex flex-col items-center justify-center py-12 text-gray-400">
             <Settings className="w-12 h-12 mb-4 opacity-20" />
             <p className="text-[14px]">Edit pane for {action} coming soon.</p>
           </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-5 border-t border-gray-100 flex items-center justify-end gap-3 bg-white shrink-0">
        <button 
          onClick={onClose}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg text-[13px] font-semibold hover:bg-gray-50 transition-colors h-[42px] min-w-[100px]"
        >
          Cancel
        </button>
        <button 
          onClick={onSave}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-[13px] font-semibold hover:bg-indigo-700 transition-all h-[42px] min-w-[120px] shadow-sm"
        >
          Save & Close
        </button>
      </div>
    </div>
  );
}
