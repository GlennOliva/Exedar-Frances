import type { AssistantAnswer } from '../../data/assistantContent'

export interface ConversationMessage {
  id: number
  role: 'assistant' | 'guest'
  text: string
  action?: AssistantAnswer['action']
}

export function AssistantMessages({ messages, typing, onAction }: { messages: ConversationMessage[]; typing: boolean; onAction: (action: NonNullable<AssistantAnswer['action']>) => void }) {
  return <>{messages.map((message) => <div className={`assistant-message assistant-message--${message.role}`} key={message.id}><p>{message.text}</p>{message.action && <button type="button" className="assistant-action" onClick={() => onAction(message.action!)}>{message.action.label}</button>}</div>)}{typing && <div className="assistant-message assistant-message--assistant assistant-typing" aria-label="Preparing an answer"><i /><i /><i /></div>}</>
}
