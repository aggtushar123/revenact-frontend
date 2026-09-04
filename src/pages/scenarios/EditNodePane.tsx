import { useEffect, useState } from 'react';
import { X, Info, ChevronDown, Settings } from 'lucide-react';
import { LIFECYCLE_LABELS } from '../../features/customers/formatters';
import type { LifecycleCategory } from '../../components/organizations/tableData';
import type { ScenarioNodeData, ScenarioNodeDetail } from './types';

// The fixed, real attribute allowlist services/scenarios/engine.py's
// CONDITION_ATTRIBUTES accepts — see that module's own docstring on why
// it's a small allowlist rather than "any Customer field".
const CONDITION_ATTRIBUTES: { value: NonNullable<ScenarioNodeData['conditionAttribute']>; label: string }[] = [
  { value: 'lifecycle_stage', label: 'Lifecycle Stage' },
  { value: 'health_score', label: 'Health Score' },
  { value: 'nps_score', label: 'NPS Score' },
];

const CONDITION_OPERATORS: { value: NonNullable<ScenarioNodeData['conditionOperator']>; label: string }[] = [
  { value: 'equals', label: 'is equal to' },
  { value: 'not_equals', label: 'is not equal to' },
  { value: 'greater_than', label: 'is greater than' },
  { value: 'less_than', label: 'is less than' },
];

const LIFECYCLE_OPTIONS = Object.entries(LIFECYCLE_LABELS) as [LifecycleCategory, string][];

interface EditNodePaneProps {
  node: ScenarioNodeDetail | null;
  isOpen: boolean;
  onClose: () => void;
  /** Only the fields this pane actually collects real values for
   * (label, and Send Email/On Event's own selects — see this
   * component's own docstring) are included; the caller merges them
   * onto the node's existing data rather than replacing it wholesale. */
  onSave: (updates: Partial<ScenarioNodeData>) => void;
}

// Every per-action content block below (Filter/Condition/Assign
// Playbook/Create Pipeline/Slack Message) is still an illustrative
// mockup — none of them read from or write to real data, since there's
// no real Playbook/Slack/email-integration/attribute-picker concept
// backing any of this yet (see CreateScenario.tsx's own docstring on
// why: no backend at all). Only `label` (every node type) and Send
// Email/On Event's own selects are real, persisted state — this pane
// re-syncs them from `node.data` whenever a different node is opened,
// rather than leaking the previous node's own selections into it.
export function EditNodePane({ node, isOpen, onClose, onSave }: EditNodePaneProps) {
  const [label, setLabel] = useState('');
  const [isEmailDropdownOpen, setIsEmailDropdownOpen] = useState(false);
  const [selectedEmailService, setSelectedEmailService] = useState<string>('');
  const [selectedEventTrigger, setSelectedEventTrigger] = useState<string>('');
  const [selectedOrgEnters, setSelectedOrgEnters] = useState<string>('');
  const [isToDropdownOpen, setIsToDropdownOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [attributeValue, setAttributeValue] = useState('');
  const [conditionAttribute, setConditionAttribute] = useState<ScenarioNodeData['conditionAttribute']>('lifecycle_stage');
  const [conditionOperator, setConditionOperator] = useState<ScenarioNodeData['conditionOperator']>('equals');
  const [conditionValue, setConditionValue] = useState('');

  useEffect(() => {
    if (!node) return;
    setLabel(node.data.label ?? '');
    setSelectedEmailService(node.data.emailService ?? '');
    setSelectedEventTrigger(node.data.eventTrigger ?? '');
    setSelectedOrgEnters(node.data.orgEnters ?? '');
    setEmailSubject(node.data.emailSubject ?? '');
    setEmailBody(node.data.emailBody ?? '');
    setTaskTitle(node.data.taskTitle ?? '');
    setAttributeValue(node.data.attributeValue ?? '');
    setConditionAttribute(node.data.conditionAttribute ?? 'lifecycle_stage');
    setConditionOperator(node.data.conditionOperator ?? 'equals');
    setConditionValue(node.data.conditionValue ?? '');
    setIsEmailDropdownOpen(false);
    setIsToDropdownOpen(false);
    // Re-sync whenever a *different* node is opened for editing — not
    // on every keystroke, which would fight the fields above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node?.id]);

  if (!isOpen || !node) return null;

  const action = node.data?.action || '';

  function handleSave() {
    const updates: Partial<ScenarioNodeData> = { label: label.trim() || node!.data.label };
    if (action === 'Send Email') {
      updates.emailService = selectedEmailService;
      updates.emailSubject = emailSubject;
      updates.emailBody = emailBody;
    }
    if (action === 'On Event') {
      updates.eventTrigger = selectedEventTrigger;
      updates.orgEnters = selectedOrgEnters;
    }
    if (action === 'Condition' || action === 'Filter') {
      updates.conditionAttribute = conditionAttribute;
      updates.conditionOperator = conditionOperator;
      updates.conditionValue = conditionValue;
    }
    if (action === 'Create Task') updates.taskTitle = taskTitle;
    if (action === 'Set Attribute') updates.attributeValue = attributeValue;
    onSave(updates);
  }

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
  } else if (action === 'On Event') {
    title = 'Edit On Event Trigger Node';
  } else if (action === 'Create Task') {
    title = 'Edit Create Task Action Node';
  } else if (action === 'Set Attribute') {
    title = 'Edit Set Attribute Action Node';
  } else if (action === 'Churn Entity') {
    title = 'Edit Churn Entity Action Node';
  }

  const renderFilterContent = () => (
    <>
      <p className="text-[14px] text-ink-muted mb-4">{subtitle}</p>
      {renderConditionClause('Stops the flow here for any organization that does not match:')}
    </>
  );

  const renderConditionContent = () => (
    <>
      <p className="text-[14px] text-ink-muted mb-6">{subtitle}</p>

      <div className="flex flex-col gap-6">
        <div>
          <h3 className="text-[14px] font-bold text-ink mb-3">"Yes" Flow:</h3>
          <p className="text-[13.5px] font-semibold text-ink-muted mb-4">Organizations that match the following condition:</p>
          {renderConditionClause()}
        </div>

        <div className="pt-2">
          <h3 className="text-[14px] font-bold text-ink mb-3">"No" Flow:</h3>
          <p className="text-[13.5px] font-medium text-ink-muted">All remaining organizations.</p>
        </div>

        <div className="bg-info-dim border border-info/30 rounded-lg p-4 flex gap-3 text-info text-[13px] leading-relaxed mt-2">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <p>
            <strong>Note:</strong> Wire up the "Yes"/"No" edges out of this node by opening each one and setting its
            label — see the canvas's own edge "Set Label" pill. This clause is checked for real when the scenario runs.
          </p>
        </div>
      </div>
    </>
  );

  // Condition/Filter's real, single-clause config — deliberately
  // narrower than the fancier multi-clause canvas mockup this replaces:
  // one attribute (from a fixed allowlist) + operator + value, exactly
  // what services/scenarios/engine.py's own CONDITION_ATTRIBUTES/
  // _evaluate_condition actually reads at run time.
  function renderConditionClause(introText?: string) {
    return (
      <div className="bg-accent-dim/30 border border-accent/30 rounded-xl p-4 flex flex-col gap-3">
        {introText && <p className="text-[12.5px] text-ink-muted">{introText}</p>}
        <div className="flex items-center gap-2">
          <select
            value={conditionAttribute}
            onChange={(e) => setConditionAttribute(e.target.value as ScenarioNodeData['conditionAttribute'])}
            className="flex-1 px-3 py-2 bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-accent"
          >
            {CONDITION_ATTRIBUTES.map((attr) => (
              <option key={attr.value} value={attr.value}>{attr.label}</option>
            ))}
          </select>
          <select
            value={conditionOperator}
            onChange={(e) => setConditionOperator(e.target.value as ScenarioNodeData['conditionOperator'])}
            className="flex-1 px-3 py-2 bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-accent"
          >
            {CONDITION_OPERATORS.map((op) => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </select>
        </div>
        {conditionAttribute === 'lifecycle_stage' ? (
          <select
            value={conditionValue}
            onChange={(e) => setConditionValue(e.target.value)}
            className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-accent"
          >
            <option value="" disabled>Select a value</option>
            {LIFECYCLE_OPTIONS.map(([value, lbl]) => (
              <option key={value} value={value}>{lbl}</option>
            ))}
          </select>
        ) : (
          <input
            type="number"
            value={conditionValue}
            onChange={(e) => setConditionValue(e.target.value)}
            placeholder="Value"
            className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-accent"
          />
        )}
      </div>
    );
  }

  const renderAssignPlaybookContent = () => (
    <>
      <p className="text-[14px] text-ink font-medium mb-3">{subtitle}</p>
      
      <div className="flex flex-col gap-1.5 mb-6">
        <label className="text-[12.5px] font-bold text-ink-muted flex items-center">
          Select playbook <span className="text-danger ml-1">*</span>
        </label>
        <div className="flex-1 px-3 py-2.5 bg-surface border border-line rounded-lg flex items-center justify-between cursor-pointer hover:border-line-strong transition-colors">
          <span className="text-[13px] text-ink-faint font-medium">Select a Playbook Template</span>
          <ChevronDown className="w-4 h-4 text-ink-faint" />
        </div>
      </div>

      <div className="bg-accent-dim border border-accent/30 rounded-lg p-4 text-accent text-[13px] leading-[1.6]">
        <strong>Note:</strong> The system will not apply duplicate playbook instances on an entity. If the playbook is currently active on an entity, the entity will proceed to the next node in the flow.
      </div>
    </>
  );

  const renderCreatePipelineContent = () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-bold text-ink-muted flex items-center">
          Pipeline type <span className="text-danger ml-1">*</span>
        </label>
        <div className="flex-1 px-3 py-2 bg-surface border border-line rounded-lg flex items-center justify-between cursor-pointer hover:border-line-strong">
          <span className="text-[13px] text-ink-muted font-medium">Opportunity</span>
          <ChevronDown className="w-4 h-4 text-ink-faint" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-bold text-ink-muted flex items-center">
          Title <span className="text-danger ml-1">*</span>
        </label>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Give your pipeline a title" 
            className="w-full pl-3 pr-24 py-2 text-[13px] border border-line rounded-lg placeholder-ink-faint focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent" 
          />
          <div className="absolute right-2 top-1.5 flex items-center gap-1 cursor-pointer text-ink-muted hover:text-ink-muted text-[12px] font-medium px-2 py-0.5 bg-subtle rounded border border-line">
            Add attribute <ChevronDown className="w-3 h-3" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 w-1/2">
        <label className="text-[12px] font-bold text-ink-muted flex items-center">
          Status <span className="text-danger ml-1">*</span>
        </label>
        <div className="flex-1 px-3 py-2 bg-surface border border-line rounded-lg flex items-center justify-between cursor-pointer hover:border-line-strong">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-warning" />
            <span className="text-[13px] text-warning font-bold">Open</span>
          </div>
          <ChevronDown className="w-4 h-4 text-ink-faint" />
        </div>
      </div>
    </div>
  );

  const renderSlackMessageContent = () => (
    <div className="flex flex-col h-full -mx-6 -mt-6">
      <div className="flex items-center gap-8 border-b border-line px-6 pt-2 h-[42px] shrink-0 bg-surface">
        <button className="text-[13px] font-bold text-accent border-b-[2.5px] border-accent h-full">
          Node configuration
        </button>
        <button className="text-[13px] font-bold text-ink-muted hover:text-ink-muted border-b-[2.5px] border-transparent transition-colors h-full">
          Execution controls
        </button>
      </div>

      <div className="p-6 flex flex-col gap-6 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3">
          <label className="text-[12px] font-bold text-ink-muted flex items-center">
            Recipient Type <span className="text-danger ml-1">*</span>
          </label>
          <div className="flex flex-col gap-2.5">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="radio" name="recipient" defaultChecked className="w-[15px] h-[15px] text-accent focus:ring-accent border-line-strong" />
              <span className="text-[13px] font-bold text-ink-muted">Static Channel</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="radio" name="recipient" className="w-[15px] h-[15px] text-accent focus:ring-accent border-line-strong" />
              <span className="text-[13px] font-bold text-ink-muted">User</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="radio" name="recipient" className="w-[15px] h-[15px] text-accent focus:ring-accent border-line-strong" />
              <span className="text-[13px] font-bold text-ink-muted">Dynamic Channel</span>
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-bold text-ink-muted flex items-center">
            Channel <span className="text-danger ml-1">*</span>
          </label>
          <div className="flex-1 px-3 py-2 bg-surface border border-line rounded-lg flex items-center justify-between cursor-pointer hover:border-line-strong">
            <span className="text-[13px] text-ink-faint font-medium">Select Channel</span>
            <ChevronDown className="w-4 h-4 text-ink-faint" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-bold text-ink-muted flex items-center">
            Message <span className="text-danger ml-1">*</span>
          </label>
          <div className="flex flex-col border border-line rounded-lg overflow-hidden focus-within:border-accent focus-within:ring-1 focus-within:ring-accent bg-surface">
            <textarea 
              rows={5}
              placeholder="Enter message" 
              className="w-full p-3 text-[13px] resize-none focus:outline-none placeholder-ink-faint text-ink-muted"
            />
            <div className="border-t border-line-subtle bg-subtle/50 p-2 flex items-center justify-between">
              <div className="flex items-center gap-1 text-ink-muted">
                <button className="w-7 h-7 flex items-center justify-center hover:bg-subtle rounded"><span className="text-lg leading-none font-serif rotate-180 inline-block align-middle transform -scale-y-100">↺</span></button>
                <button className="w-7 h-7 flex items-center justify-center hover:bg-subtle rounded"><span className="text-lg leading-none font-serif">↻</span></button>
                <div className="w-px h-4 bg-line-strong mx-1" />
                <button className="w-7 h-7 flex items-center justify-center hover:bg-subtle rounded font-bold font-serif">B</button>
                <button className="w-7 h-7 flex items-center justify-center hover:bg-subtle rounded italic font-serif">I</button>
                <button className="w-7 h-7 flex items-center justify-center hover:bg-subtle rounded flex gap-0.5">
                  <span className="block w-3 h-0.5 bg-current mt-1 shadow-[0_3px_0_currentColor,0_6px_0_currentColor]"></span>
                  <ChevronDown className="w-2.5 h-2.5 ml-0.5 mt-0.5" />
                </button>
                <div className="w-px h-4 bg-line-strong mx-1" />
                <button className="w-7 h-7 flex items-center justify-center hover:bg-subtle rounded font-mono text-[11px] font-bold">99</button>
                <button className="w-7 h-7 flex items-center justify-center hover:bg-subtle rounded font-serif text-[15px]">Aa</button>
                <button className="w-7 h-7 flex items-center justify-center hover:bg-subtle rounded text-[15px]">☺</button>
                <button className="w-7 h-7 flex items-center justify-center hover:bg-subtle rounded font-serif line-through decoration-ink-faint">S</button>
              </div>
            </div>
          </div>
          <button className="mt-2 self-start flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-accent/40 text-accent hover:bg-accent-dim transition-colors text-[12px] font-bold">
            <span className="text-[14px] leading-none mb-0.5">+</span> {'{{attribute}}'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderSendEmailContent = () => (
    <div className="flex flex-col h-full -mx-6 -mt-6">
      <div className="flex items-center gap-8 border-b border-line px-6 pt-2 h-[42px] shrink-0 bg-surface">
        <button className="text-[13px] font-bold text-accent border-b-[2.5px] border-accent h-full">
          Node configuration
        </button>
        <button className="text-[13px] font-bold text-ink-muted hover:text-ink-muted border-b-[2.5px] border-transparent transition-colors h-full">
          Execution controls
        </button>
      </div>

      <div className="p-6 flex flex-col gap-6 flex-1 overflow-y-auto bg-subtle/30" onClick={() => isEmailDropdownOpen && setIsEmailDropdownOpen(false)}>
        <div onClick={(e) => e.stopPropagation()} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="scenario-email-subject" className="text-[12px] font-bold text-ink-muted flex items-center">
              Subject <span className="text-danger ml-1">*</span>
            </label>
            <input
              id="scenario-email-subject"
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="e.g. Checking in on your onboarding"
              className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="scenario-email-body" className="text-[12px] font-bold text-ink-muted flex items-center">
              Body <span className="text-danger ml-1">*</span>
            </label>
            <textarea
              id="scenario-email-body"
              rows={5}
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              placeholder="Enter message"
              className="w-full p-3 bg-surface border border-line rounded-lg text-[13px] text-ink resize-none focus:outline-none focus:border-accent"
            />
          </div>

          <p className="text-[13.5px] text-ink-muted">Select the service you want to use to send the email</p>

          <div className="flex flex-col gap-1.5 relative group">
            <label className="text-[12px] font-bold text-ink-muted flex items-center">
              Email service type <span className="text-danger ml-1">*</span>
            </label>
            <div 
              onClick={() => setIsEmailDropdownOpen(!isEmailDropdownOpen)}
              className={`flex-1 px-3 py-2 bg-surface rounded-lg flex items-center justify-between cursor-pointer transition-colors z-10 ${
                isEmailDropdownOpen ? 'border border-accent ring-1 ring-accent/20' : 'border border-line hover:border-line-strong'
              }`}
            >
              <span className={`text-[13px] font-medium ${selectedEmailService ? 'text-ink' : 'text-ink-faint'}`}>
                {selectedEmailService || 'Select service type'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isEmailDropdownOpen ? 'text-accent rotate-180' : 'text-ink-faint'}`} />
            </div>

            {/* Dropdown list */}
            {isEmailDropdownOpen && (
              <div className="absolute top-[60px] left-0 right-0 bg-surface border border-line-subtle rounded-lg shadow-xl py-1.5 z-50 flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
                <button 
                  onClick={() => {
                    setSelectedEmailService('Via integrated email client');
                    setIsEmailDropdownOpen(false);
                  }}
                  className="flex items-center justify-between px-3 py-2 hover:bg-subtle bg-surface transition-colors w-full text-left"
                >
                  <span className="text-[13px] font-medium text-ink flex items-center gap-2">
                    Via integrated email client <Info className="w-3.5 h-3.5 text-ink-faint hover:text-ink fill-ink-faint/80" />
                  </span>
                </button>
                <button 
                  onClick={() => {
                    setSelectedEmailService('Bulk email service');
                    setIsEmailDropdownOpen(false);
                  }}
                  className="flex items-center justify-between px-3 py-2 hover:bg-subtle bg-surface transition-colors w-full text-left"
                >
                  <span className="text-[13px] font-medium text-ink flex items-center gap-2">
                    Bulk email service <Info className="w-3.5 h-3.5 text-ink-faint hover:text-ink fill-ink-faint/80" />
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderOnEventContent = () => (
    <div className="flex flex-col h-full -mx-6 -mt-6">
      <div className="flex items-center justify-around border-b border-line px-6 pt-2 h-[42px] shrink-0 bg-surface">
        <button className="flex-1 text-[13px] font-bold text-accent border-b-[2.5px] border-accent h-full px-4">
          Trigger setup
        </button>
        <button className="flex-1 text-[13px] font-bold text-ink-muted hover:text-ink-muted border-b-[2.5px] border-transparent transition-colors h-full px-4">
          Re-entry criteria
        </button>
      </div>

      <div className="p-6 flex flex-col gap-6 flex-1 overflow-y-auto bg-surface">
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-ink-muted font-medium tracking-tight mt-1 mb-1">Choose the event that prompts entities to enter the scenario.</p>
          <div className="flex flex-col gap-2.5">
            <label className="flex items-center gap-2.5 cursor-pointer">
               <input type="radio" name="event_trigger" checked={selectedEventTrigger === 'new_entity'} onChange={() => setSelectedEventTrigger('new_entity')} className="w-[14px] h-[14px] text-accent focus:ring-accent border-line-strong" />
               <span className="text-[13px] font-medium text-ink-muted">Creation of new entity</span>
            </label>
            
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                 <input type="radio" name="event_trigger" checked={selectedEventTrigger === 'attribute'} onChange={() => setSelectedEventTrigger('attribute')} className="w-[14px] h-[14px] text-accent focus:ring-accent border-line-strong" />
                 <span className="text-[13px] font-medium text-ink-muted">Change of attribute value</span>
              </label>
              
              {selectedEventTrigger === 'attribute' && (
                 <div className="pl-[27px] flex flex-col gap-3.5 mt-1 pb-2">
                   <p className="text-[12px] text-ink-muted leading-relaxed max-w-[95%]">
                     The organization will be streamed into the flow, based on a change in the selected attribute.
                   </p>
                   
                   <div className="flex flex-col gap-1.5 w-full">
                     <label className="text-[12px] font-bold text-ink-muted flex items-center">
                       Attribute name
                     </label>
                     <div className="w-full px-3 py-[7px] bg-surface border border-line-strong rounded flex items-center justify-between cursor-pointer hover:border-line-strong">
                       <span className="text-[12.5px] text-ink-faint">Select attribute to track</span>
                       <ChevronDown className="w-3.5 h-3.5 text-ink-faint" />
                     </div>
                   </div>

                   <div className="flex flex-col gap-2.5 mt-1.5">
                     <label className="text-[12px] font-bold text-ink-muted flex items-center mb-0.5">
                       Organization Enters
                     </label>
                     <div className="flex flex-col gap-2">
                       <label className="flex items-center gap-2.5 cursor-pointer">
                         <input type="radio" name="org_enters" checked={selectedOrgEnters === 'value_change'} onChange={() => setSelectedOrgEnters('value_change')} className="w-[13px] h-[13px] text-ink-faint focus:ring-accent border-line-strong" />
                         <span className={`text-[12.5px] font-medium transition-colors ${selectedOrgEnters === 'value_change' ? 'text-ink' : 'text-ink-faint'}`}>On Value Change</span>
                       </label>
                       
                       <label className="flex items-center gap-2.5 cursor-pointer">
                         <input type="radio" name="org_enters" checked={selectedOrgEnters === 'specified_change'} onChange={() => setSelectedOrgEnters('specified_change')} className="w-[13px] h-[13px] text-ink-faint focus:ring-accent border-line-strong" />
                         <span className={`text-[12.5px] font-medium transition-colors ${selectedOrgEnters === 'specified_change' ? 'text-ink' : 'text-ink-faint'}`}>Based on specified value change</span>
                       </label>
                       
                       {selectedOrgEnters === 'specified_change' && (
                         <div className="pl-[25px] flex flex-col gap-4 mt-1.5 pb-2">
                           <div className="flex flex-col gap-1.5">
                             <label className="text-[12px] font-medium text-ink-muted">If value changes from</label>
                             <div className="w-[320px] px-3 py-2 bg-surface border border-line rounded flex gap-1.5 items-center cursor-pointer hover:border-line-strong relative">
                                <div className="flex items-center gap-1.5 bg-subtle border border-line rounded px-1.5 py-0.5">
                                   <div className="w-[7px] h-[7px] bg-success rounded-sm" />
                                   <span className="text-[12px] font-medium text-ink-muted">Good</span>
                                   <X className="w-3 h-3 text-ink-faint hover:text-ink-muted ml-0.5" />
                                </div>
                                <ChevronDown className="w-4 h-4 text-ink-faint absolute right-3" />
                             </div>
                           </div>
                           
                           <div className="flex flex-col gap-1.5 relative z-10">
                             <label className="text-[12px] font-medium text-ink-muted">to</label>
                             <div 
                               onClick={() => setIsToDropdownOpen(!isToDropdownOpen)}
                               className={`w-[320px] px-3 py-2 bg-surface rounded flex gap-1.5 items-center cursor-pointer relative transition-all ${
                                 isToDropdownOpen ? 'border border-accent ring-1 ring-accent/20 shadow-sm' : 'border border-line hover:border-line-strong'
                               }`}
                             >
                                <div className="flex items-center gap-1.5 bg-warning-dim border border-warning/30 rounded px-1.5 py-0.5">
                                   <div className="w-[7px] h-[7px] bg-warning rounded-sm" />
                                   <span className="text-[12px] font-medium text-ink-muted">Average</span>
                                   <X className="w-3 h-3 text-ink-faint hover:text-ink-muted ml-0.5" />
                                </div>
                                <div className="flex items-center gap-1.5 bg-danger-dim border border-danger/30 rounded px-1.5 py-0.5">
                                   <div className="w-[7px] h-[7px] bg-danger rounded-sm" />
                                   <span className="text-[12px] font-medium text-ink-muted">Poor</span>
                                   <X className="w-3 h-3 text-ink-faint hover:text-ink-muted ml-0.5" />
                                </div>
                                <ChevronDown className={`w-4 h-4 absolute right-3 transition-transform ${isToDropdownOpen ? 'text-accent rotate-180' : 'text-ink-faint'}`} />

                                {/* Mock Open Dropdown Menu */}
                                {isToDropdownOpen && (
                                  <div 
                                    className="absolute top-[110%] left-0 right-0 bg-surface border border-line-subtle rounded-lg shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] py-1.5 flex flex-col z-[100] animate-in fade-in slide-in-from-top-2 duration-200"
                                    onClick={e => e.stopPropagation()}
                                  >
                                     <div className="flex items-center justify-between px-3 py-2 hover:bg-subtle/80 group cursor-pointer transition-colors">
                                        <div className="flex items-center gap-2.5">
                                           <div className="w-2 h-2 bg-danger rounded-sm" />
                                           <span className="text-[12.5px] font-semibold text-ink-muted">Poor</span>
                                        </div>
                                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-[var(--accent)] stroke-[3px] opacity-80"><path d="M5 13l4 4L19 7" /></svg>
                                     </div>
                                     <div className="flex items-center justify-between px-3 py-2 hover:bg-subtle/80 group cursor-pointer transition-colors">
                                        <div className="flex items-center gap-2.5">
                                           <div className="w-2 h-2 bg-warning rounded-sm" />
                                           <span className="text-[12.5px] font-semibold text-ink-muted">Average</span>
                                        </div>
                                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-[var(--accent)] stroke-[3px] opacity-80"><path d="M5 13l4 4L19 7" /></svg>
                                     </div>
                                     <div className="flex items-center justify-between px-3 py-2 hover:bg-subtle/80 group cursor-pointer transition-colors mb-1">
                                        <div className="flex items-center gap-2.5">
                                           <div className="w-2 h-2 bg-success rounded-sm" />
                                           <span className="text-[12.5px] font-semibold text-ink-muted">Good</span>
                                        </div>
                                     </div>
                                     <div className="px-3 pb-1 border-t border-line-subtle pt-2.5">
                                        <button 
                                          onClick={() => setIsToDropdownOpen(false)}
                                          className="w-[85px] bg-accent hover:bg-accent-hover text-[#0D0F0E] text-[12.5px] font-bold py-[7px] rounded-lg shadow-sm transition-colors"
                                        >
                                           Done
                                        </button>
                                     </div>
                                  </div>
                                )}
                             </div>
                           </div>
                         </div>
                       )}

                       <label className="flex items-center gap-2.5 cursor-pointer">
                         <input type="radio" name="org_enters" checked={selectedOrgEnters === 'percent_change'} onChange={() => setSelectedOrgEnters('percent_change')} className="w-[13px] h-[13px] text-ink-faint focus:ring-accent border-line-strong" />
                         <span className={`text-[12.5px] font-medium transition-colors ${selectedOrgEnters === 'percent_change' ? 'text-ink' : 'text-ink-faint'}`}>% change of value</span>
                       </label>
                     </div>
                   </div>
                 </div>
              )}
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer">
               <input type="radio" name="event_trigger" checked={selectedEventTrigger === 'status'} onChange={() => setSelectedEventTrigger('status')} className="w-[14px] h-[14px] text-accent focus:ring-accent border-line-strong" />
               <span className="text-[13px] font-medium text-ink-muted">Change of Entity Status</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCreateTaskContent = () => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="scenario-task-title" className="text-[12px] font-bold text-ink-muted flex items-center">
        Task title <span className="text-danger ml-1">*</span>
      </label>
      <input
        id="scenario-task-title"
        type="text"
        value={taskTitle}
        onChange={(e) => setTaskTitle(e.target.value)}
        placeholder="e.g. Follow up on onboarding"
        className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-accent"
      />
      <p className="text-[12px] text-ink-faint mt-1">
        Created with a due date of today, medium priority, assigned to "Scenario Automation".
      </p>
    </div>
  );

  const renderSetAttributeContent = () => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="scenario-attribute-value" className="text-[12px] font-bold text-ink-muted flex items-center">
        Set Lifecycle Stage to <span className="text-danger ml-1">*</span>
      </label>
      <select
        id="scenario-attribute-value"
        value={attributeValue}
        onChange={(e) => setAttributeValue(e.target.value)}
        className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-accent"
      >
        <option value="" disabled>Select a value</option>
        {LIFECYCLE_OPTIONS.map(([value, lbl]) => (
          <option key={value} value={value}>{lbl}</option>
        ))}
      </select>
      <p className="text-[12px] text-ink-faint mt-1">
        Only Lifecycle Stage is settable from a scenario today.
      </p>
    </div>
  );

  const renderChurnEntityContent = () => (
    <div className="bg-danger-dim border border-danger/30 rounded-lg p-4 text-danger text-[13px] leading-relaxed">
      <strong>No further configuration needed.</strong> When this node runs, the organization's
      lifecycle stage is set to Churned.
    </div>
  );

  return (
    <div
      role="dialog"
      aria-label={title}
      className="fixed inset-y-0 right-0 w-[550px] bg-surface shadow-2xl z-[100] flex flex-col border-l border-line animate-in slide-in-from-right duration-300"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-line-subtle flex items-center justify-between bg-surface shrink-0">
        <h2 className="text-[16px] font-bold text-accent">{title}</h2>
        <button onClick={onClose} className="p-1 hover:bg-subtle rounded-full transition-colors text-ink-faint">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col">
        {/* Label — the one field every node type actually has and
            saves, shown on the canvas node itself (see CustomNodes.tsx). */}
        <div className="flex flex-col gap-1.5 mb-5">
          <label htmlFor="scenario-node-label" className="text-[12px] font-bold text-ink-muted">
            Node Label
          </label>
          <input
            id="scenario-node-label"
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={`New ${action}`}
            className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:ring-1 focus:ring-accent/20 focus:border-accent transition-all"
          />
        </div>

        {action === 'Filter' && renderFilterContent()}
        {action === 'Condition' && renderConditionContent()}
        {action === 'Assign Playbook' && renderAssignPlaybookContent()}
        {action === 'Create Pipeline' && renderCreatePipelineContent()}
        {action === 'Slack Message' && renderSlackMessageContent()}
        {action === 'Send Email' && renderSendEmailContent()}
        {action === 'On Event' && renderOnEventContent()}
        {action === 'Create Task' && renderCreateTaskContent()}
        {action === 'Set Attribute' && renderSetAttributeContent()}
        {action === 'Churn Entity' && renderChurnEntityContent()}

        {/* Fallback for unhandled nodes */}
        {!['Filter', 'Condition', 'Assign Playbook', 'Create Pipeline', 'Slack Message', 'Send Email', 'On Event', 'Create Task', 'Set Attribute', 'Churn Entity'].includes(action) && (
           <div className="flex flex-col items-center justify-center py-12 text-ink-faint">
             <Settings className="w-12 h-12 mb-4 opacity-20" />
             <p className="text-[14px]">Edit pane for {action} coming soon.</p>
           </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-5 border-t border-line-subtle flex items-center justify-end gap-3 bg-surface shrink-0">
        <button 
          onClick={onClose}
          className="px-6 py-2 border border-line-strong text-ink-muted rounded-lg text-[13px] font-semibold hover:bg-subtle transition-colors h-[42px] min-w-[100px]"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-accent text-ink rounded-lg text-[13px] font-semibold hover:bg-accent-hover transition-all h-[42px] min-w-[120px] shadow-sm"
        >
          Save & Close
        </button>
      </div>
    </div>
  );
}
