interface Props {
  keys: string[];
  style?: React.CSSProperties;
}

export function KeyboardHint({ keys, style }: Props) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', ...style }}>
      {keys.map((k) => (
        <kbd
          key={k}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '20px',
            height: '20px',
            padding: '0 5px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: '3px',
            fontFamily: "'DM Mono', monospace",
            fontSize: '10px',
            color: '#9A9690',
            letterSpacing: '0.02em',
            lineHeight: 1,
          }}
          aria-label={`Key ${k}`}
        >
          {k}
        </kbd>
      ))}
    </span>
  );
}
