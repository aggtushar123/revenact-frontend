import { useEffect, useState, type FormEvent } from 'react';
import { MessageCircleQuestion } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { answerQuestion, askQuestion, fetchQuestions } from '../../features/knowledge/knowledgeSlice';
import type { Question } from '../../features/knowledge/knowledgeSlice';
import { FUNCTION_LABELS } from '../../features/auth/authSlice';
import type { User } from '../../features/auth/authSlice';
import { formatDate } from '../../features/customers/formatters';
import { MentionTextarea } from '../shared/MentionTextarea';

/**
 * Questions on this customer, routed to people. Ask one by picking who
 * should answer (or @mentioning them in the text); the person is
 * notified, answers here, and the answer is stored as a contribution
 * from their function — so the Copilot has it from then on and the next
 * person does not have to ask again.
 */
export function QuestionsPanel({ customerId, customerName, members }: { customerId: number; customerName: string; members: User[] }) {
  const dispatch = useAppDispatch();
  const me = useAppSelector((s) => s.auth.user);
  const rows = useAppSelector((s) => s.knowledge.questions[customerId]);
  const [text, setText] = useState('');
  const [assignee, setAssignee] = useState('');

  useEffect(() => {
    dispatch(fetchQuestions(customerId));
  }, [dispatch, customerId]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const result = await dispatch(askQuestion({ customerId, text: text.trim(), ...(assignee ? { assignee_id: Number(assignee) } : {}) }));
    if (askQuestion.fulfilled.match(result)) {
      setText('');
      setAssignee('');
    }
  }

  const open = (rows ?? []).filter((q) => q.status === 'open');
  const answered = (rows ?? []).filter((q) => q.status === 'answered');

  return (
    <section className="bg-surface rounded-xl border border-line-subtle shadow-sm px-5 py-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <MessageCircleQuestion className="w-4 h-4 text-accent" />
        <h2 className="text-[14px] font-bold text-ink">Questions about {customerName}</h2>
        {open.length > 0 && <span className="text-[11px] font-bold text-warning">{open.length} open</span>}
      </div>

      <form onSubmit={submit} className="flex flex-col gap-2">
        <label htmlFor={`ask-${customerId}`} className="sr-only">
          Ask a question about {customerName}
        </label>
        <MentionTextarea
          id={`ask-${customerId}`}
          value={text}
          onChange={setText}
          rows={2}
          placeholder="Ask someone — pick a person below, or @mention them."
          className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-accent"
        />
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-[12px] text-ink-muted flex items-center gap-1.5">
            Who should answer
            <select aria-label="Who should answer" value={assignee} onChange={(e) => setAssignee(e.target.value)} className="px-2 py-1 bg-surface border border-line rounded-lg text-[12px] text-ink focus:outline-none focus:border-accent">
              <option value="">Whoever I @mention</option>
              {members.filter((m) => m.id !== me?.id).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}{m.function ? ` · ${FUNCTION_LABELS[m.function]}` : ''}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={!text.trim()} className="ml-auto px-3 py-1.5 bg-accent hover:bg-accent-hover text-[#0D0F0E] rounded-lg text-[12px] font-bold disabled:opacity-50">
            Ask
          </button>
        </div>
      </form>

      {rows && rows.length === 0 && <p className="text-[12.5px] text-ink-faint">No questions yet.</p>}
      <ul className="flex flex-col gap-2">
        {[...open, ...answered].map((q) => (
          <QuestionCard key={q.id} q={q} canAnswer={me?.id === q.assignee.id} />
        ))}
      </ul>
    </section>
  );
}

function QuestionCard({ q, canAnswer }: { q: Question; canAnswer: boolean }) {
  const dispatch = useAppDispatch();
  const [body, setBody] = useState('');
  const isOpen = q.status === 'open';
  return (
    <li className={`border rounded-lg px-3.5 py-2.5 ${isOpen ? 'border-warning/40 bg-warning-dim/40' : 'border-line-subtle'}`} aria-label={`Question for ${q.assignee.name}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap text-[11px]">
        <span className="text-ink-faint">
          <span className="text-ink font-semibold">{q.asked_by.name}</span> asked{' '}
          <span className="text-ink font-semibold">{q.assignee.name}</span>
          <span> ({FUNCTION_LABELS[q.assignee.function]}) · {formatDate(q.created_at.slice(0, 10))}</span>
        </span>
        <span className={`font-bold uppercase tracking-wider ${isOpen ? 'text-warning' : 'text-success'}`}>{q.status_display}</span>
      </div>
      <p className="text-[13px] text-ink mt-1">{q.text}</p>
      {q.answer && (
        <p className="text-[12.5px] text-ink-muted mt-1.5 border-l-2 border-success/40 pl-2.5 whitespace-pre-wrap">
          {q.answer.body.replace(/^In answer to .*?": /, '')}
        </p>
      )}
      {isOpen && canAnswer && (
        <form
          className="mt-2 flex flex-col gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (body.trim()) dispatch(answerQuestion({ id: q.id, body: body.trim() }));
          }}
        >
          <label htmlFor={`answer-${q.id}`} className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">
            Your answer — stored as knowledge under {FUNCTION_LABELS[q.assignee.function]}
          </label>
          <textarea id={`answer-${q.id}`} value={body} onChange={(e) => setBody(e.target.value)} rows={2} className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-accent" />
          <button type="submit" disabled={!body.trim()} className="self-end px-3 py-1.5 bg-accent text-[#0D0F0E] rounded-lg text-[12px] font-bold disabled:opacity-50">
            Answer
          </button>
        </form>
      )}
      {isOpen && !canAnswer && <p className="text-[11px] text-ink-faint mt-1">Waiting on {q.assignee.name}.</p>}
    </li>
  );
}
